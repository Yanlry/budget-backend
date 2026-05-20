"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const serializers_1 = require("../common/types/serializers");
const prisma_service_1 = require("../prisma/prisma.service");
const DEFAULT_ACCOUNT_NAME = 'Compte principal';
const ACCOUNT_VISUAL_BY_TYPE = {
    [client_1.AccountType.BANK]: { icon: 'credit-card', color: '#2F7BE5' },
    [client_1.AccountType.PRECIOUS_METALS]: { icon: 'shield', color: '#D6A63D' },
    [client_1.AccountType.CRYPTO]: { icon: 'cpu', color: '#7C58D7' },
};
let AccountsService = class AccountsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAllForUser(userId) {
        await this.ensureDefaultAccountAndBackfill(userId);
        const accounts = await this.prisma.account.findMany({
            where: { userId },
            orderBy: [{ createdAt: 'asc' }],
        });
        return accounts.map(serializers_1.serializeAccount);
    }
    async findOneForUser(userId, accountId) {
        return this.prisma.account.findFirst({
            where: {
                id: accountId,
                userId,
            },
        });
    }
    async createForUser(userId, dto) {
        const name = dto.name.trim();
        const type = client_1.AccountType.BANK;
        const defaultVisual = this.getDefaultAccountVisual(type);
        const icon = this.normalizeIcon(dto.icon) ?? defaultVisual.icon;
        const color = this.normalizeColor(dto.color) ?? defaultVisual.color;
        if (!name) {
            throw new common_1.ConflictException('Le nom du compte est requis.');
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
            throw new common_1.ConflictException('Un compte avec ce nom existe deja.');
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
        return (0, serializers_1.serializeAccount)(created);
    }
    async updateForUser(userId, accountId, dto) {
        const existing = await this.findOneForUser(userId, accountId);
        if (!existing) {
            throw new common_1.NotFoundException('Compte introuvable.');
        }
        const trimmedName = dto.name?.trim();
        const nextType = existing.type;
        const defaultVisual = this.getDefaultAccountVisual(nextType);
        const nextIcon = dto.icon === undefined
            ? undefined
            : (this.normalizeIcon(dto.icon) ?? defaultVisual.icon);
        const nextColor = dto.color === undefined
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
                throw new common_1.ConflictException('Un compte avec ce nom existe deja.');
            }
        }
        const data = {
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
        return (0, serializers_1.serializeAccount)(updated);
    }
    async deleteForUser(userId, accountId) {
        const existing = await this.findOneForUser(userId, accountId);
        if (!existing) {
            throw new common_1.NotFoundException('Compte introuvable.');
        }
        const allAccounts = await this.prisma.account.findMany({
            where: { userId },
            orderBy: [{ createdAt: 'asc' }],
        });
        if (allAccounts.length <= 1) {
            throw new common_1.ConflictException('Tu dois garder au moins un compte actif.');
        }
        const fallbackAccount = allAccounts.find((account) => account.id !== accountId) ?? null;
        if (!fallbackAccount) {
            throw new common_1.ConflictException('Aucun compte de remplacement disponible.');
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
    async ensureDefaultAccount(userId, preferredBalance) {
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
                type: client_1.AccountType.BANK,
                icon: ACCOUNT_VISUAL_BY_TYPE[client_1.AccountType.BANK].icon,
                color: ACCOUNT_VISUAL_BY_TYPE[client_1.AccountType.BANK].color,
                currentBalance: preferredBalance ?? (0, serializers_1.toMoney)(user.currentBalance),
            },
        });
    }
    async ensureDefaultAccountAndBackfill(userId) {
        const defaultAccount = await this.ensureDefaultAccount(userId);
        await this.backfillNullTransactionAccounts(userId, defaultAccount.id);
        return defaultAccount;
    }
    async setDefaultAccountBalance(userId, currentBalance) {
        const defaultAccount = await this.ensureDefaultAccountAndBackfill(userId);
        await this.prisma.account.update({
            where: { id: defaultAccount.id },
            data: {
                currentBalance,
            },
        });
        await this.syncUserBalanceFromAccounts(userId);
    }
    async backfillNullTransactionAccounts(userId, accountId) {
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
    async syncUserBalanceFromAccounts(userId) {
        const aggregate = await this.prisma.account.aggregate({
            where: { userId },
            _sum: { currentBalance: true },
        });
        const total = (0, serializers_1.toMoney)(aggregate._sum.currentBalance);
        await this.prisma.user.update({
            where: { id: userId },
            data: { currentBalance: total },
        });
    }
    getDefaultAccountVisual(type) {
        return (ACCOUNT_VISUAL_BY_TYPE[type] ?? ACCOUNT_VISUAL_BY_TYPE[client_1.AccountType.BANK]);
    }
    normalizeIcon(value) {
        if (value == null) {
            return null;
        }
        const trimmed = value.trim();
        return trimmed.length ? trimmed : null;
    }
    normalizeColor(value) {
        if (value == null) {
            return null;
        }
        const trimmed = value.trim();
        return trimmed.length ? trimmed.toUpperCase() : null;
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map