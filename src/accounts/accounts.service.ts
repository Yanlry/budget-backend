import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccountType, Prisma } from '@prisma/client';
import { serializeAccount, toMoney } from '../common/types/serializers';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

const DEFAULT_ACCOUNT_NAME = 'Compte principal';
const ACCOUNT_VISUAL_BY_TYPE: Record<
  AccountType,
  { icon: string; color: string }
> = {
  [AccountType.BANK]: { icon: 'credit-card', color: '#2F7BE5' },
  [AccountType.PRECIOUS_METALS]: { icon: 'shield', color: '#D6A63D' },
  [AccountType.CRYPTO]: { icon: 'cpu', color: '#7C58D7' },
};

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForUser(userId: string) {
    await this.ensureDefaultAccountAndBackfill(userId);

    const accounts = await this.prisma.account.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'asc' }],
    });

    return accounts.map(serializeAccount);
  }

  async findOneForUser(userId: string, accountId: string) {
    return this.prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
      },
    });
  }

  async createForUser(userId: string, dto: CreateAccountDto) {
    const name = dto.name.trim();
    const type = AccountType.BANK;
    const defaultVisual = this.getDefaultAccountVisual(type);
    const icon = this.normalizeIcon(dto.icon) ?? defaultVisual.icon;
    const color = this.normalizeColor(dto.color) ?? defaultVisual.color;

    if (!name) {
      throw new ConflictException('Le nom du compte est requis.');
    }

    const existing = await this.prisma.account.findFirst({
      where: {
        userId,
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new ConflictException('Un compte avec ce nom existe deja.');
    }

    const created = await this.prisma.account.create({
      data: {
        userId,
        name,
        type,
        icon,
        color,
        currentBalance: dto.currentBalance ?? 0,
      },
    });

    await this.syncUserBalanceFromAccounts(userId);

    return serializeAccount(created);
  }

  async updateForUser(
    userId: string,
    accountId: string,
    dto: UpdateAccountDto,
  ) {
    const existing = await this.findOneForUser(userId, accountId);

    if (!existing) {
      throw new NotFoundException('Compte introuvable.');
    }

    const trimmedName = dto.name?.trim();
    const nextType = existing.type;
    const defaultVisual = this.getDefaultAccountVisual(nextType);
    const nextIcon =
      dto.icon === undefined
        ? undefined
        : (this.normalizeIcon(dto.icon) ?? defaultVisual.icon);
    const nextColor =
      dto.color === undefined
        ? undefined
        : (this.normalizeColor(dto.color) ?? defaultVisual.color);

    if (trimmedName) {
      const duplicate = await this.prisma.account.findFirst({
        where: {
          userId,
          id: { not: accountId },
          name: {
            equals: trimmedName,
            mode: 'insensitive',
          },
        },
      });

      if (duplicate) {
        throw new ConflictException('Un compte avec ce nom existe deja.');
      }
    }

    const data: Prisma.AccountUpdateInput = {
      name: trimmedName,
      icon: nextIcon,
      color: nextColor,
      currentBalance: dto.currentBalance,
    };

    const updated = await this.prisma.account.update({
      where: { id: accountId },
      data,
    });

    await this.syncUserBalanceFromAccounts(userId);

    return serializeAccount(updated);
  }

  async deleteForUser(userId: string, accountId: string) {
    const existing = await this.findOneForUser(userId, accountId);

    if (!existing) {
      throw new NotFoundException('Compte introuvable.');
    }

    const allAccounts = await this.prisma.account.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'asc' }],
    });

    if (allAccounts.length <= 1) {
      throw new ConflictException('Tu dois garder au moins un compte actif.');
    }

    const fallbackAccount =
      allAccounts.find((account) => account.id !== accountId) ?? null;

    if (!fallbackAccount) {
      throw new ConflictException('Aucun compte de remplacement disponible.');
    }

    await this.prisma.$transaction([
      this.prisma.transaction.updateMany({
        where: {
          userId,
          accountId,
        },
        data: {
          accountId: fallbackAccount.id,
        },
      }),
      this.prisma.account.update({
        where: { id: fallbackAccount.id },
        data: {
          currentBalance: {
            increment: existing.currentBalance,
          },
        },
      }),
      this.prisma.account.delete({
        where: { id: accountId },
      }),
    ]);

    await this.syncUserBalanceFromAccounts(userId);

    return { success: true, movedToAccountId: fallbackAccount.id };
  }

  async ensureDefaultAccount(userId: string, preferredBalance?: number) {
    const existing = await this.prisma.account.findFirst({
      where: { userId },
      orderBy: [{ createdAt: 'asc' }],
    });

    if (existing) {
      return existing;
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { currentBalance: true },
    });

    return this.prisma.account.create({
      data: {
        userId,
        name: DEFAULT_ACCOUNT_NAME,
        type: AccountType.BANK,
        icon: ACCOUNT_VISUAL_BY_TYPE[AccountType.BANK].icon,
        color: ACCOUNT_VISUAL_BY_TYPE[AccountType.BANK].color,
        currentBalance: preferredBalance ?? toMoney(user.currentBalance),
      },
    });
  }

  async ensureDefaultAccountAndBackfill(userId: string) {
    const defaultAccount = await this.ensureDefaultAccount(userId);
    await this.backfillNullTransactionAccounts(userId, defaultAccount.id);
    return defaultAccount;
  }

  async setDefaultAccountBalance(userId: string, currentBalance: number) {
    const defaultAccount = await this.ensureDefaultAccountAndBackfill(userId);

    await this.prisma.account.update({
      where: { id: defaultAccount.id },
      data: {
        currentBalance,
      },
    });

    await this.syncUserBalanceFromAccounts(userId);
  }

  async backfillNullTransactionAccounts(userId: string, accountId: string) {
    await this.prisma.transaction.updateMany({
      where: {
        userId,
        accountId: null,
      },
      data: {
        accountId,
      },
    });
  }

  private async syncUserBalanceFromAccounts(userId: string) {
    const aggregate = await this.prisma.account.aggregate({
      where: { userId },
      _sum: { currentBalance: true },
    });

    const total = toMoney(aggregate._sum.currentBalance);

    await this.prisma.user.update({
      where: { id: userId },
      data: { currentBalance: total },
    });
  }

  private getDefaultAccountVisual(type: AccountType) {
    return (
      ACCOUNT_VISUAL_BY_TYPE[type] ?? ACCOUNT_VISUAL_BY_TYPE[AccountType.BANK]
    );
  }

  private normalizeIcon(value?: string | null) {
    if (value == null) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  private normalizeColor(value?: string | null) {
    if (value == null) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length ? trimmed.toUpperCase() : null;
  }
}
