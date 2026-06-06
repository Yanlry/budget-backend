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
var TransactionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const accounts_service_1 = require("../accounts/accounts.service");
const serializers_1 = require("../common/types/serializers");
const categories_service_1 = require("../categories/categories.service");
const prisma_service_1 = require("../prisma/prisma.service");
const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';
const RECURRING_APPLY_SOURCE = 'RECURRING_APPLY';
const EURO_FORMATTER = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
});
let TransactionsService = TransactionsService_1 = class TransactionsService {
    prisma;
    categoriesService;
    accountsService;
    logger = new common_1.Logger(TransactionsService_1.name);
    constructor(prisma, categoriesService, accountsService) {
        this.prisma = prisma;
        this.categoriesService = categoriesService;
        this.accountsService = accountsService;
    }
    async findAllForUser(userId, query) {
        await this.accountsService.ensureDefaultAccountAndBackfill(userId);
        const where = {
            userId,
        };
        const dateFilter = {};
        if (query.type) {
            where.type = query.type;
        }
        if (query.accountId && query.accountId !== 'all') {
            const account = await this.accountsService.findOneForUser(userId, query.accountId);
            if (!account) {
                throw new common_1.BadRequestException('Compte invalide pour cet utilisateur.');
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
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            const futureDateFilter = {
                ...dateFilter,
                gte: dateFilter.gte && dateFilter.gte > startOfToday
                    ? dateFilter.gte
                    : startOfToday,
            };
            const recurringFilters = [
                { frequency: { not: client_1.Frequency.ONCE } },
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
        }
        else if (Object.keys(dateFilter).length > 0) {
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
        return transactions.map(serializers_1.serializeTransaction);
    }
    async createForUser(userId, dto) {
        const defaultAccount = await this.accountsService.ensureDefaultAccountAndBackfill(userId);
        const date = new Date(dto.date);
        const endDate = dto.endDate ? new Date(dto.endDate) : null;
        if (endDate && endDate < date) {
            throw new common_1.BadRequestException('La date de fin doit etre posterieure a la date.');
        }
        if (dto.categoryId) {
            await this.ensureCategoryOwnership(userId, dto.categoryId);
        }
        const account = dto.accountId
            ? await this.ensureAccountOwnership(userId, dto.accountId)
            : defaultAccount;
        const frequency = dto.frequency ?? client_1.Frequency.ONCE;
        const recurrenceIntervalDays = this.normalizeRecurrenceIntervalDays(frequency, dto.recurrenceIntervalDays);
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
        await this.updateCurrentBalanceFromTransactionDelta(userId, transaction.accountId, this.computeCurrentBalanceImpact(transaction.type, transaction.frequency, transaction.date, (0, serializers_1.toMoney)(transaction.amount)));
        if (dto.source === RECURRING_APPLY_SOURCE &&
            transaction.frequency === client_1.Frequency.ONCE) {
            await this.sendRecurringAppliedNotification(userId, {
                transactionId: transaction.id,
                title: transaction.title,
                type: transaction.type,
                amount: (0, serializers_1.toMoney)(transaction.amount),
            });
        }
        return (0, serializers_1.serializeTransaction)(transaction);
    }
    async updateForUser(userId, transactionId, dto) {
        const defaultAccount = await this.accountsService.ensureDefaultAccountAndBackfill(userId);
        const existing = await this.prisma.transaction.findFirst({
            where: {
                id: transactionId,
                userId,
            },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Transaction introuvable.');
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
        const recurrenceIntervalDays = this.normalizeRecurrenceIntervalDays(nextFrequency, dto.recurrenceIntervalDays ?? existing.recurrenceIntervalDays);
        if (nextEndDate && nextEndDate < nextDate) {
            throw new common_1.BadRequestException('La date de fin doit etre posterieure a la date.');
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
        const previousImpact = this.computeCurrentBalanceImpact(existing.type, existing.frequency, existing.date, (0, serializers_1.toMoney)(existing.amount));
        const nextImpact = this.computeCurrentBalanceImpact(updated.type, updated.frequency, updated.date, (0, serializers_1.toMoney)(updated.amount));
        await this.updateCurrentBalanceFromTransactionDelta(userId, existing.accountId ?? defaultAccount.id, -previousImpact);
        await this.updateCurrentBalanceFromTransactionDelta(userId, updated.accountId ?? nextAccountId, nextImpact);
        return (0, serializers_1.serializeTransaction)(updated);
    }
    async deleteForUser(userId, transactionId) {
        const defaultAccount = await this.accountsService.ensureDefaultAccountAndBackfill(userId);
        const existing = await this.prisma.transaction.findFirst({
            where: {
                id: transactionId,
                userId,
            },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Transaction introuvable.');
        }
        await this.prisma.transaction.delete({
            where: { id: existing.id },
        });
        await this.updateCurrentBalanceFromTransactionDelta(userId, existing.accountId ?? defaultAccount.id, -this.computeCurrentBalanceImpact(existing.type, existing.frequency, existing.date, (0, serializers_1.toMoney)(existing.amount)));
        return { success: true };
    }
    async ensureCategoryOwnership(userId, categoryId) {
        const category = await this.categoriesService.findOneForUser(userId, categoryId);
        if (!category) {
            throw new common_1.BadRequestException('Categorie invalide pour cet utilisateur.');
        }
    }
    async ensureAccountOwnership(userId, accountId) {
        const account = await this.accountsService.findOneForUser(userId, accountId);
        if (!account) {
            throw new common_1.BadRequestException('Compte invalide pour cet utilisateur.');
        }
        return account;
    }
    computeCurrentBalanceImpact(type, frequency, date, amount) {
        if (!this.shouldAffectCurrentBalance(frequency, date)) {
            return 0;
        }
        return type === 'INCOME' ? amount : -amount;
    }
    shouldAffectCurrentBalance(frequency, date) {
        if (frequency !== client_1.Frequency.ONCE) {
            return false;
        }
        return date.getTime() <= Date.now();
    }
    normalizeRecurrenceIntervalDays(frequency, recurrenceIntervalDays) {
        if (frequency !== client_1.Frequency.DAILY) {
            return null;
        }
        const normalized = Math.trunc(recurrenceIntervalDays ?? 1);
        if (!Number.isFinite(normalized) || normalized < 1 || normalized > 365) {
            throw new common_1.BadRequestException('L intervalle en jours doit etre compris entre 1 et 365.');
        }
        return normalized;
    }
    async updateCurrentBalanceFromTransactionDelta(userId, accountId, delta) {
        if (Math.abs(delta) < 0.0001) {
            return;
        }
        const operations = [
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
            operations.push(this.prisma.account.update({
                where: { id: accountId },
                data: {
                    currentBalance: {
                        increment: delta,
                    },
                },
            }));
        }
        await this.prisma.$transaction(operations);
    }
    async sendRecurringAppliedNotification(userId, input) {
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
            if (!user.pushToken.startsWith('ExponentPushToken[') &&
                !user.pushToken.startsWith('ExpoPushToken[')) {
                return;
            }
            const amountLabel = EURO_FORMATTER.format(input.amount);
            const balanceLabel = EURO_FORMATTER.format((0, serializers_1.toMoney)(user.currentBalance));
            const body = input.type === 'EXPENSE'
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
                    title: input.type === 'EXPENSE' ? 'Depense recurrente ajoutee' : 'Revenu recurrent ajoute',
                    body,
                    data: {
                        transactionId: input.transactionId,
                        type: input.type,
                        amount: input.amount,
                        currentBalance: (0, serializers_1.toMoney)(user.currentBalance),
                    },
                }),
            });
            if (!response.ok) {
                this.logger.warn(`Push Expo refusee (${response.status}) pour l'utilisateur ${userId}.`);
                return;
            }
            const payload = (await response.json());
            if (payload.data?.status === 'error') {
                if (payload.data?.details?.error === 'DeviceNotRegistered') {
                    await this.prisma.user.update({
                        where: { id: userId },
                        data: {
                            pushToken: null,
                        },
                    });
                }
                this.logger.warn(`Push Expo en erreur pour l'utilisateur ${userId}: ${payload.data?.message ?? 'inconnue'}.`);
            }
        }
        catch (error) {
            this.logger.warn(`Echec envoi notification push pour l'utilisateur ${userId}: ${error.message}`);
        }
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = TransactionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        categories_service_1.CategoriesService,
        accounts_service_1.AccountsService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map