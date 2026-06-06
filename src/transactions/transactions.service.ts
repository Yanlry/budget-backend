import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Frequency, Prisma } from '@prisma/client';
import { AccountsService } from '../accounts/accounts.service';
import { serializeTransaction, toMoney } from '../common/types/serializers';
import { CategoriesService } from '../categories/categories.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { GetTransactionsQueryDto } from './dto/get-transactions-query.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';
const RECURRING_APPLY_SOURCE = 'RECURRING_APPLY';
const EURO_FORMATTER = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
});

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly categoriesService: CategoriesService,
    private readonly accountsService: AccountsService,
  ) {}

  async findAllForUser(userId: string, query: GetTransactionsQueryDto) {
    await this.accountsService.ensureDefaultAccountAndBackfill(userId);

    const where: Prisma.TransactionWhereInput = {
      userId,
    };
    const dateFilter: Prisma.DateTimeFilter = {};

    if (query.type) {
      where.type = query.type;
    }

    if (query.accountId && query.accountId !== 'all') {
      const account = await this.accountsService.findOneForUser(
        userId,
        query.accountId,
      );

      if (!account) {
        throw new BadRequestException('Compte invalide pour cet utilisateur.');
      }

      where.accountId = account.id;
    }

    if (query.month) {
      const year = query.year ?? new Date().getFullYear();
      const start = new Date(Date.UTC(year, query.month - 1, 1, 0, 0, 0));
      const end = new Date(Date.UTC(year, query.month, 0, 23, 59, 59, 999));
      dateFilter.gte = start;
      dateFilter.lte = end;
    }

    if (query.from || query.to) {
      if (query.from) {
        dateFilter.gte = new Date(query.from);
      }
      if (query.to) {
        dateFilter.lte = new Date(query.to);
      }
    }

    if (query.includeFutureOnly) {
      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0,
      );
      const futureDateFilter: Prisma.DateTimeFilter = {
        ...dateFilter,
        gte:
          dateFilter.gte && dateFilter.gte > startOfToday
            ? dateFilter.gte
            : startOfToday,
      };

      const recurringFilters: Prisma.TransactionWhereInput[] = [
        { frequency: { not: Frequency.ONCE } },
        {
          OR: [{ endDate: null }, { endDate: { gte: startOfToday } }],
        },
      ];

      if (futureDateFilter.lte) {
        recurringFilters.push({
          date: { lte: futureDateFilter.lte },
        });
      }

      where.OR = [
        { date: futureDateFilter },
        {
          AND: recurringFilters,
        },
      ];
    } else if (Object.keys(dateFilter).length > 0) {
      where.date = dateFilter;
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        category: true,
        account: true,
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'desc' }],
    });

    return transactions.map(serializeTransaction);
  }

  async createForUser(userId: string, dto: CreateTransactionDto) {
    const defaultAccount =
      await this.accountsService.ensureDefaultAccountAndBackfill(userId);
    const date = new Date(dto.date);
    const endDate = dto.endDate ? new Date(dto.endDate) : null;

    if (endDate && endDate < date) {
      throw new BadRequestException(
        'La date de fin doit etre posterieure a la date.',
      );
    }

    if (dto.categoryId) {
      await this.ensureCategoryOwnership(userId, dto.categoryId);
    }

    const account = dto.accountId
      ? await this.ensureAccountOwnership(userId, dto.accountId)
      : defaultAccount;

    const frequency = dto.frequency ?? Frequency.ONCE;
    const recurrenceIntervalDays = this.normalizeRecurrenceIntervalDays(
      frequency,
      dto.recurrenceIntervalDays,
    );

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        accountId: account.id,
        title: dto.title.trim(),
        amount: dto.amount,
        type: dto.type,
        frequency,
        recurrenceIntervalDays,
        date,
        endDate,
        categoryId: dto.categoryId,
        note: dto.note,
      },
      include: {
        category: true,
        account: true,
      },
    });

    await this.updateCurrentBalanceFromTransactionDelta(
      userId,
      transaction.accountId,
      this.computeCurrentBalanceImpact(
        transaction.type,
        transaction.frequency,
        transaction.date,
        toMoney(transaction.amount),
      ),
    );

    if (
      dto.source === RECURRING_APPLY_SOURCE &&
      transaction.frequency === Frequency.ONCE
    ) {
      await this.sendRecurringAppliedNotification(userId, {
        transactionId: transaction.id,
        title: transaction.title,
        type: transaction.type,
        amount: toMoney(transaction.amount),
      });
    }

    return serializeTransaction(transaction);
  }

  async updateForUser(
    userId: string,
    transactionId: string,
    dto: UpdateTransactionDto,
  ) {
    const defaultAccount =
      await this.accountsService.ensureDefaultAccountAndBackfill(userId);

    const existing = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Transaction introuvable.');
    }

    if (dto.categoryId) {
      await this.ensureCategoryOwnership(userId, dto.categoryId);
    }

    let nextAccountId = existing.accountId ?? defaultAccount.id;
    if (dto.accountId) {
      const account = await this.ensureAccountOwnership(userId, dto.accountId);
      nextAccountId = account.id;
    }

    const nextDate = dto.date ? new Date(dto.date) : existing.date;
    const nextEndDate = dto.endDate
      ? new Date(dto.endDate)
      : dto.endDate === undefined
        ? existing.endDate
        : null;
    const nextFrequency = dto.frequency ?? existing.frequency;
    const recurrenceIntervalDays = this.normalizeRecurrenceIntervalDays(
      nextFrequency,
      dto.recurrenceIntervalDays ?? existing.recurrenceIntervalDays,
    );

    if (nextEndDate && nextEndDate < nextDate) {
      throw new BadRequestException(
        'La date de fin doit etre posterieure a la date.',
      );
    }

    const updated = await this.prisma.transaction.update({
      where: { id: existing.id },
      data: {
        accountId: nextAccountId,
        title: dto.title?.trim(),
        amount: dto.amount,
        type: dto.type,
        frequency: dto.frequency,
        recurrenceIntervalDays,
        date: dto.date ? new Date(dto.date) : undefined,
        endDate: dto.endDate
          ? new Date(dto.endDate)
          : dto.endDate === null
            ? null
            : undefined,
        categoryId: dto.categoryId,
        note: dto.note,
      },
      include: {
        category: true,
        account: true,
      },
    });

    const previousImpact = this.computeCurrentBalanceImpact(
      existing.type,
      existing.frequency,
      existing.date,
      toMoney(existing.amount),
    );
    const nextImpact = this.computeCurrentBalanceImpact(
      updated.type,
      updated.frequency,
      updated.date,
      toMoney(updated.amount),
    );

    await this.updateCurrentBalanceFromTransactionDelta(
      userId,
      existing.accountId ?? defaultAccount.id,
      -previousImpact,
    );
    await this.updateCurrentBalanceFromTransactionDelta(
      userId,
      updated.accountId ?? nextAccountId,
      nextImpact,
    );

    return serializeTransaction(updated);
  }

  async deleteForUser(userId: string, transactionId: string) {
    const defaultAccount =
      await this.accountsService.ensureDefaultAccountAndBackfill(userId);
    const existing = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Transaction introuvable.');
    }

    await this.prisma.transaction.delete({
      where: { id: existing.id },
    });

    await this.updateCurrentBalanceFromTransactionDelta(
      userId,
      existing.accountId ?? defaultAccount.id,
      -this.computeCurrentBalanceImpact(
        existing.type,
        existing.frequency,
        existing.date,
        toMoney(existing.amount),
      ),
    );

    return { success: true };
  }

  private async ensureCategoryOwnership(userId: string, categoryId: string) {
    const category = await this.categoriesService.findOneForUser(
      userId,
      categoryId,
    );

    if (!category) {
      throw new BadRequestException('Categorie invalide pour cet utilisateur.');
    }
  }

  private async ensureAccountOwnership(userId: string, accountId: string) {
    const account = await this.accountsService.findOneForUser(userId, accountId);

    if (!account) {
      throw new BadRequestException('Compte invalide pour cet utilisateur.');
    }

    return account;
  }

  private computeCurrentBalanceImpact(
    type: 'INCOME' | 'EXPENSE',
    frequency: Frequency,
    date: Date,
    amount: number,
  ) {
    if (!this.shouldAffectCurrentBalance(frequency, date)) {
      return 0;
    }

    return type === 'INCOME' ? amount : -amount;
  }

  private shouldAffectCurrentBalance(frequency: Frequency, date: Date) {
    if (frequency !== Frequency.ONCE) {
      return false;
    }

    return date.getTime() <= Date.now();
  }

  private normalizeRecurrenceIntervalDays(
    frequency: Frequency,
    recurrenceIntervalDays: number | null | undefined,
  ) {
    if (frequency !== Frequency.DAILY) {
      return null;
    }

    const normalized = Math.trunc(recurrenceIntervalDays ?? 1);
    if (!Number.isFinite(normalized) || normalized < 1 || normalized > 365) {
      throw new BadRequestException(
        'L intervalle en jours doit etre compris entre 1 et 365.',
      );
    }

    return normalized;
  }

  private async updateCurrentBalanceFromTransactionDelta(
    userId: string,
    accountId: string | null | undefined,
    delta: number,
  ) {
    if (Math.abs(delta) < 0.0001) {
      return;
    }

    const operations: Array<Prisma.PrismaPromise<unknown>> = [
      this.prisma.user.update({
        where: { id: userId },
        data: {
          currentBalance: {
            increment: delta,
          },
        },
      }),
    ];

    if (accountId) {
      operations.push(
        this.prisma.account.update({
          where: { id: accountId },
          data: {
            currentBalance: {
              increment: delta,
            },
          },
        }),
      );
    }

    await this.prisma.$transaction(operations);
  }

  private async sendRecurringAppliedNotification(
    userId: string,
    input: {
      transactionId: string;
      title: string;
      type: 'INCOME' | 'EXPENSE';
      amount: number;
    },
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          pushToken: true,
          currentBalance: true,
        },
      });

      if (!user?.pushToken) {
        return;
      }

      if (
        !user.pushToken.startsWith('ExponentPushToken[') &&
        !user.pushToken.startsWith('ExpoPushToken[')
      ) {
        return;
      }

      const amountLabel = EURO_FORMATTER.format(input.amount);
      const balanceLabel = EURO_FORMATTER.format(toMoney(user.currentBalance));
      const body =
        input.type === 'EXPENSE'
          ? `${input.title} vient d'etre debite (${amountLabel}). Ton solde est maintenant de ${balanceLabel}.`
          : `${input.title} vient d'etre credite (${amountLabel}). Ton solde est maintenant de ${balanceLabel}.`;

      const response = await fetch(EXPO_PUSH_API_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: user.pushToken,
          sound: 'default',
          title:
            input.type === 'EXPENSE' ? 'Depense recurrente ajoutee' : 'Revenu recurrent ajoute',
          body,
          data: {
            transactionId: input.transactionId,
            type: input.type,
            amount: input.amount,
            currentBalance: toMoney(user.currentBalance),
          },
        }),
      });

      if (!response.ok) {
        this.logger.warn(
          `Push Expo refusee (${response.status}) pour l'utilisateur ${userId}.`,
        );
        return;
      }

      const payload = (await response.json()) as {
        data?: {
          status?: 'ok' | 'error';
          details?: {
            error?: string;
          };
          message?: string;
        };
      };

      if (payload.data?.status === 'error') {
        if (payload.data?.details?.error === 'DeviceNotRegistered') {
          await this.prisma.user.update({
            where: { id: userId },
            data: {
              pushToken: null,
            },
          });
        }

        this.logger.warn(
          `Push Expo en erreur pour l'utilisateur ${userId}: ${payload.data?.message ?? 'inconnue'}.`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Echec envoi notification push pour l'utilisateur ${userId}: ${(error as Error).message}`,
      );
    }
  }
}
