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
exports.ProjectionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const accounts_service_1 = require("../accounts/accounts.service");
const serializers_1 = require("../common/types/serializers");
const prisma_service_1 = require("../prisma/prisma.service");
const DAY_MS = 24 * 60 * 60 * 1000;
let ProjectionsService = class ProjectionsService {
    prisma;
    accountsService;
    constructor(prisma, accountsService) {
        this.prisma = prisma;
        this.accountsService = accountsService;
    }
    async getYearProjection(userId, year, accountId) {
        await this.accountsService.ensureDefaultAccountAndBackfill(userId);
        const accountFilterId = accountId && accountId !== 'all' ? accountId : null;
        const selectedAccount = accountFilterId
            ? await this.accountsService.findOneForUser(userId, accountFilterId)
            : null;
        if (accountFilterId && !selectedAccount) {
            throw new common_1.BadRequestException('Compte invalide pour cet utilisateur.');
        }
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
        });
        const now = new Date();
        const startMonthIndex = year === now.getFullYear() ? now.getMonth() : 0;
        const rangeStart = new Date(year, startMonthIndex, 1, 0, 0, 0, 0);
        const rangeEnd = new Date(year, 11, 31, 23, 59, 59, 999);
        const transactions = await this.prisma.transaction.findMany({
            where: {
                userId,
                ...(selectedAccount ? { accountId: selectedAccount.id } : {}),
                date: { lte: rangeEnd },
                OR: [{ endDate: null }, { endDate: { gte: rangeStart } }],
            },
        });
        let runningBalance = selectedAccount
            ? (0, serializers_1.toMoney)(selectedAccount.currentBalance)
            : (0, serializers_1.toMoney)(user.currentBalance);
        const baseCurrentBalance = runningBalance;
        const months = [];
        for (let monthIndex = startMonthIndex; monthIndex <= 11; monthIndex += 1) {
            const monthStart = new Date(year, monthIndex, 1, 0, 0, 0, 0);
            const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
            const effectiveStart = year === now.getFullYear() && monthIndex === now.getMonth()
                ? now
                : monthStart;
            const { income, expenses } = this.calculateForRange(transactions, effectiveStart, monthEnd, monthStart);
            const endingBalance = runningBalance + income - expenses;
            months.push({
                year,
                month: monthIndex + 1,
                label: this.getMonthLabel(monthIndex),
                startingBalance: this.roundMoney(runningBalance),
                expectedIncome: this.roundMoney(income),
                expectedExpenses: this.roundMoney(expenses),
                endingBalance: this.roundMoney(endingBalance),
            });
            runningBalance = endingBalance;
        }
        const estimatedYearEndBalance = months.length
            ? months[months.length - 1].endingBalance
            : this.roundMoney(runningBalance);
        const recurringExpenses = transactions.filter((transaction) => transaction.type === client_1.TransactionType.EXPENSE &&
            transaction.frequency !== client_1.Frequency.ONCE);
        const recurringIncome = transactions.filter((transaction) => transaction.type === client_1.TransactionType.INCOME &&
            transaction.frequency !== client_1.Frequency.ONCE);
        const monthlyRecurringExpenses = this.estimateRecurringMonthlyAmount(recurringExpenses, now);
        const monthlyRecurringIncome = this.estimateRecurringMonthlyAmount(recurringIncome, now);
        const fixedExpenseRatio = monthlyRecurringIncome > 0
            ? (monthlyRecurringExpenses / monthlyRecurringIncome) * 100
            : null;
        return {
            year,
            currentBalance: this.roundMoney(baseCurrentBalance),
            estimatedYearEndBalance,
            months,
            summary: this.buildSummaryMessage(estimatedYearEndBalance),
            fixedExpenseRatio: fixedExpenseRatio == null ? null : this.roundMoney(fixedExpenseRatio),
            yearlyPotentialSavings: this.roundMoney(Math.max(0, estimatedYearEndBalance - baseCurrentBalance)),
        };
    }
    async getMonthProjection(userId, year, month, accountId) {
        await this.accountsService.ensureDefaultAccountAndBackfill(userId);
        const accountFilterId = accountId && accountId !== 'all' ? accountId : null;
        const selectedAccount = accountFilterId
            ? await this.accountsService.findOneForUser(userId, accountFilterId)
            : null;
        if (accountFilterId && !selectedAccount) {
            throw new common_1.BadRequestException('Compte invalide pour cet utilisateur.');
        }
        const monthIndex = month - 1;
        const yearProjection = await this.getYearProjection(userId, year, accountId);
        const monthProjection = yearProjection.months.find((item) => item.month === month);
        if (monthProjection) {
            return {
                ...monthProjection,
                summary: monthProjection.endingBalance >= 0
                    ? `Il vous restera environ ${monthProjection.endingBalance.toFixed(2)} € a la fin du mois.`
                    : `Ce mois se termine autour de ${monthProjection.endingBalance.toFixed(2)} €.`,
            };
        }
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
        });
        const monthStart = new Date(year, monthIndex, 1, 0, 0, 0, 0);
        const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
        const transactions = await this.prisma.transaction.findMany({
            where: {
                userId,
                ...(selectedAccount ? { accountId: selectedAccount.id } : {}),
                date: { lte: monthEnd },
                OR: [{ endDate: null }, { endDate: { gte: monthStart } }],
            },
        });
        const { income, expenses } = this.calculateForRange(transactions, monthStart, monthEnd, monthStart);
        const startingBalance = selectedAccount
            ? (0, serializers_1.toMoney)(selectedAccount.currentBalance)
            : (0, serializers_1.toMoney)(user.currentBalance);
        const endingBalance = startingBalance + income - expenses;
        return {
            year,
            month,
            label: this.getMonthLabel(monthIndex),
            startingBalance: this.roundMoney(startingBalance),
            expectedIncome: this.roundMoney(income),
            expectedExpenses: this.roundMoney(expenses),
            endingBalance: this.roundMoney(endingBalance),
            summary: endingBalance >= 0
                ? `Il vous restera environ ${endingBalance.toFixed(2)} € a la fin du mois.`
                : `Ce mois se termine autour de ${endingBalance.toFixed(2)} €.`,
        };
    }
    calculateForRange(transactions, effectiveStart, effectiveEnd, monthStart) {
        let income = 0;
        let expenses = 0;
        for (const transaction of transactions) {
            const occurrences = this.countOccurrencesInRange(transaction, effectiveStart, effectiveEnd, monthStart);
            if (occurrences <= 0) {
                continue;
            }
            const value = (0, serializers_1.toMoney)(transaction.amount) * occurrences;
            if (transaction.type === client_1.TransactionType.INCOME) {
                income += value;
            }
            else {
                expenses += value;
            }
        }
        return {
            income,
            expenses,
        };
    }
    countOccurrencesInRange(transaction, effectiveStart, effectiveEnd, monthStart) {
        const txStart = transaction.date;
        const txEnd = transaction.endDate ?? effectiveEnd;
        const rangeStart = this.maxDate(this.startOfDay(effectiveStart), this.startOfDay(txStart));
        const rangeEnd = this.minDate(this.endOfDay(effectiveEnd), this.endOfDay(txEnd));
        if (rangeStart > rangeEnd) {
            return 0;
        }
        switch (transaction.frequency) {
            case client_1.Frequency.ONCE:
                return txStart >= effectiveStart && txStart <= effectiveEnd ? 1 : 0;
            case client_1.Frequency.DAILY:
                return this.countEveryNDaysOccurrences(txStart, rangeStart, rangeEnd, this.getDailyIntervalDays(transaction));
            case client_1.Frequency.WEEKLY:
                return this.countWeeklyOccurrences(txStart, rangeStart, rangeEnd);
            case client_1.Frequency.MONTHLY:
                return this.countMonthlyOccurrence(txStart, rangeStart, rangeEnd, monthStart);
            case client_1.Frequency.YEARLY:
                return this.countYearlyOccurrence(txStart, rangeStart, rangeEnd, monthStart);
            default:
                return 0;
        }
    }
    getDailyIntervalDays(transaction) {
        if (transaction.recurrenceIntervalDays == null ||
            transaction.recurrenceIntervalDays < 1) {
            return 1;
        }
        return transaction.recurrenceIntervalDays;
    }
    countEveryNDaysOccurrences(txDate, rangeStart, rangeEnd, intervalDays) {
        if (txDate > rangeEnd) {
            return 0;
        }
        let firstOccurrence = this.startOfDay(txDate);
        if (firstOccurrence < rangeStart) {
            const daysDiff = Math.floor((this.startOfDay(rangeStart).getTime() - firstOccurrence.getTime()) /
                DAY_MS);
            const jump = Math.ceil(daysDiff / intervalDays);
            firstOccurrence = new Date(firstOccurrence.getTime() + jump * intervalDays * DAY_MS);
        }
        if (firstOccurrence > rangeEnd) {
            return 0;
        }
        return (Math.floor((rangeEnd.getTime() - firstOccurrence.getTime()) / (intervalDays * DAY_MS)) + 1);
    }
    countWeeklyOccurrences(txDate, rangeStart, rangeEnd) {
        if (txDate > rangeEnd) {
            return 0;
        }
        let firstOccurrence = this.startOfDay(txDate);
        if (firstOccurrence < rangeStart) {
            const daysDiff = Math.floor((this.startOfDay(rangeStart).getTime() - firstOccurrence.getTime()) /
                DAY_MS);
            const jump = Math.ceil(daysDiff / 7);
            firstOccurrence = new Date(firstOccurrence.getTime() + jump * 7 * DAY_MS);
        }
        if (firstOccurrence > rangeEnd) {
            return 0;
        }
        return (Math.floor((rangeEnd.getTime() - firstOccurrence.getTime()) / (7 * DAY_MS)) + 1);
    }
    countMonthlyOccurrence(txDate, rangeStart, rangeEnd, monthStart) {
        const year = monthStart.getFullYear();
        const month = monthStart.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const day = Math.min(txDate.getDate(), daysInMonth);
        const occurrence = new Date(year, month, day, txDate.getHours(), txDate.getMinutes());
        if (occurrence < txDate) {
            return 0;
        }
        return occurrence >= rangeStart && occurrence <= rangeEnd ? 1 : 0;
    }
    countYearlyOccurrence(txDate, rangeStart, rangeEnd, monthStart) {
        if (txDate.getMonth() !== monthStart.getMonth()) {
            return 0;
        }
        const year = monthStart.getFullYear();
        const month = monthStart.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const day = Math.min(txDate.getDate(), daysInMonth);
        const occurrence = new Date(year, month, day, txDate.getHours(), txDate.getMinutes());
        if (occurrence < txDate) {
            return 0;
        }
        return occurrence >= rangeStart && occurrence <= rangeEnd ? 1 : 0;
    }
    estimateRecurringMonthlyAmount(transactions, referenceDate) {
        const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1, 0, 0, 0, 0);
        const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0, 23, 59, 59, 999);
        return transactions.reduce((total, transaction) => {
            const occurrences = this.countOccurrencesInRange(transaction, monthStart, monthEnd, monthStart);
            return total + (0, serializers_1.toMoney)(transaction.amount) * occurrences;
        }, 0);
    }
    buildSummaryMessage(estimatedYearEndBalance) {
        if (estimatedYearEndBalance >= 0) {
            return `A ce rythme, vous terminerez l'année avec environ ${estimatedYearEndBalance.toFixed(2)} €.`;
        }
        return `Votre projection annuelle est negative autour de ${estimatedYearEndBalance.toFixed(2)} €.`;
    }
    getMonthLabel(monthIndex) {
        const labels = [
            'Janvier',
            'Fevrier',
            'Mars',
            'Avril',
            'Mai',
            'Juin',
            'Juillet',
            'Aout',
            'Septembre',
            'Octobre',
            'Novembre',
            'Decembre',
        ];
        return labels[monthIndex] ?? 'Mois';
    }
    roundMoney(value) {
        return Math.round(value * 100) / 100;
    }
    startOfDay(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    }
    endOfDay(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    }
    maxDate(a, b) {
        return a > b ? a : b;
    }
    minDate(a, b) {
        return a < b ? a : b;
    }
};
exports.ProjectionsService = ProjectionsService;
exports.ProjectionsService = ProjectionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        accounts_service_1.AccountsService])
], ProjectionsService);
//# sourceMappingURL=projections.service.js.map