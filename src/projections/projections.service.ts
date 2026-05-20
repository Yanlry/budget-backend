import { BadRequestException, Injectable } from '@nestjs/common';
import { Frequency, Transaction, TransactionType } from '@prisma/client';
import { AccountsService } from '../accounts/accounts.service';
import { toMoney } from '../common/types/serializers';
import { PrismaService } from '../prisma/prisma.service';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface MonthProjection {
  year: number;
  month: number;
  label: string;
  startingBalance: number;
  expectedIncome: number;
  expectedExpenses: number;
  endingBalance: number;
}

@Injectable()
export class ProjectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountsService: AccountsService,
  ) {}

  async getYearProjection(userId: string, year: number, accountId?: string) {
    await this.accountsService.ensureDefaultAccountAndBackfill(userId);
    const accountFilterId = accountId && accountId !== 'all' ? accountId : null;
    const selectedAccount = accountFilterId
      ? await this.accountsService.findOneForUser(userId, accountFilterId)
      : null;

    if (accountFilterId && !selectedAccount) {
      throw new BadRequestException('Compte invalide pour cet utilisateur.');
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
      ? toMoney(selectedAccount.currentBalance)
      : toMoney(user.currentBalance);
    const baseCurrentBalance = runningBalance;
    const months: MonthProjection[] = [];

    for (let monthIndex = startMonthIndex; monthIndex <= 11; monthIndex += 1) {
      const monthStart = new Date(year, monthIndex, 1, 0, 0, 0, 0);
      const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
      const effectiveStart =
        year === now.getFullYear() && monthIndex === now.getMonth()
          ? now
          : monthStart;

      const { income, expenses } = this.calculateForRange(
        transactions,
        effectiveStart,
        monthEnd,
        monthStart,
      );

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

    const recurringExpenses = transactions.filter(
      (transaction) =>
        transaction.type === TransactionType.EXPENSE &&
        transaction.frequency !== Frequency.ONCE,
    );
    const recurringIncome = transactions.filter(
      (transaction) =>
        transaction.type === TransactionType.INCOME &&
        transaction.frequency !== Frequency.ONCE,
    );

    const monthlyRecurringExpenses = this.estimateRecurringMonthlyAmount(
      recurringExpenses,
      now,
    );
    const monthlyRecurringIncome = this.estimateRecurringMonthlyAmount(
      recurringIncome,
      now,
    );

    const fixedExpenseRatio =
      monthlyRecurringIncome > 0
        ? (monthlyRecurringExpenses / monthlyRecurringIncome) * 100
        : null;

    return {
      year,
      currentBalance: this.roundMoney(baseCurrentBalance),
      estimatedYearEndBalance,
      months,
      summary: this.buildSummaryMessage(estimatedYearEndBalance),
      fixedExpenseRatio:
        fixedExpenseRatio == null ? null : this.roundMoney(fixedExpenseRatio),
      yearlyPotentialSavings: this.roundMoney(
        Math.max(0, estimatedYearEndBalance - baseCurrentBalance),
      ),
    };
  }

  async getMonthProjection(
    userId: string,
    year: number,
    month: number,
    accountId?: string,
  ) {
    await this.accountsService.ensureDefaultAccountAndBackfill(userId);
    const accountFilterId = accountId && accountId !== 'all' ? accountId : null;
    const selectedAccount = accountFilterId
      ? await this.accountsService.findOneForUser(userId, accountFilterId)
      : null;

    if (accountFilterId && !selectedAccount) {
      throw new BadRequestException('Compte invalide pour cet utilisateur.');
    }

    const monthIndex = month - 1;
    const yearProjection = await this.getYearProjection(
      userId,
      year,
      accountId,
    );
    const monthProjection = yearProjection.months.find(
      (item) => item.month === month,
    );

    if (monthProjection) {
      return {
        ...monthProjection,
        summary:
          monthProjection.endingBalance >= 0
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

    const { income, expenses } = this.calculateForRange(
      transactions,
      monthStart,
      monthEnd,
      monthStart,
    );

    const startingBalance = selectedAccount
      ? toMoney(selectedAccount.currentBalance)
      : toMoney(user.currentBalance);
    const endingBalance = startingBalance + income - expenses;

    return {
      year,
      month,
      label: this.getMonthLabel(monthIndex),
      startingBalance: this.roundMoney(startingBalance),
      expectedIncome: this.roundMoney(income),
      expectedExpenses: this.roundMoney(expenses),
      endingBalance: this.roundMoney(endingBalance),
      summary:
        endingBalance >= 0
          ? `Il vous restera environ ${endingBalance.toFixed(2)} € a la fin du mois.`
          : `Ce mois se termine autour de ${endingBalance.toFixed(2)} €.`,
    };
  }

  private calculateForRange(
    transactions: Transaction[],
    effectiveStart: Date,
    effectiveEnd: Date,
    monthStart: Date,
  ) {
    let income = 0;
    let expenses = 0;

    for (const transaction of transactions) {
      const occurrences = this.countOccurrencesInRange(
        transaction,
        effectiveStart,
        effectiveEnd,
        monthStart,
      );

      if (occurrences <= 0) {
        continue;
      }

      const value = toMoney(transaction.amount) * occurrences;

      if (transaction.type === TransactionType.INCOME) {
        income += value;
      } else {
        expenses += value;
      }
    }

    return {
      income,
      expenses,
    };
  }

  private countOccurrencesInRange(
    transaction: Transaction,
    effectiveStart: Date,
    effectiveEnd: Date,
    monthStart: Date,
  ) {
    const txStart = transaction.date;
    const txEnd = transaction.endDate ?? effectiveEnd;

    const rangeStart = this.maxDate(
      this.startOfDay(effectiveStart),
      this.startOfDay(txStart),
    );
    const rangeEnd = this.minDate(
      this.endOfDay(effectiveEnd),
      this.endOfDay(txEnd),
    );

    if (rangeStart > rangeEnd) {
      return 0;
    }

    switch (transaction.frequency) {
      case Frequency.ONCE:
        return txStart >= effectiveStart && txStart <= effectiveEnd ? 1 : 0;
      case Frequency.DAILY:
        return this.countEveryNDaysOccurrences(
          txStart,
          rangeStart,
          rangeEnd,
          this.getDailyIntervalDays(transaction),
        );
      case Frequency.WEEKLY:
        return this.countWeeklyOccurrences(txStart, rangeStart, rangeEnd);
      case Frequency.MONTHLY:
        return this.countMonthlyOccurrence(
          txStart,
          rangeStart,
          rangeEnd,
          monthStart,
        );
      case Frequency.YEARLY:
        return this.countYearlyOccurrence(
          txStart,
          rangeStart,
          rangeEnd,
          monthStart,
        );
      default:
        return 0;
    }
  }

  private getDailyIntervalDays(transaction: Transaction) {
    if (
      transaction.recurrenceIntervalDays == null ||
      transaction.recurrenceIntervalDays < 1
    ) {
      return 1;
    }

    return transaction.recurrenceIntervalDays;
  }

  private countEveryNDaysOccurrences(
    txDate: Date,
    rangeStart: Date,
    rangeEnd: Date,
    intervalDays: number,
  ) {
    if (txDate > rangeEnd) {
      return 0;
    }

    let firstOccurrence = this.startOfDay(txDate);

    if (firstOccurrence < rangeStart) {
      const daysDiff = Math.floor(
        (this.startOfDay(rangeStart).getTime() - firstOccurrence.getTime()) /
          DAY_MS,
      );
      const jump = Math.ceil(daysDiff / intervalDays);
      firstOccurrence = new Date(
        firstOccurrence.getTime() + jump * intervalDays * DAY_MS,
      );
    }

    if (firstOccurrence > rangeEnd) {
      return 0;
    }

    return (
      Math.floor(
        (rangeEnd.getTime() - firstOccurrence.getTime()) / (intervalDays * DAY_MS),
      ) + 1
    );
  }

  private countWeeklyOccurrences(
    txDate: Date,
    rangeStart: Date,
    rangeEnd: Date,
  ) {
    if (txDate > rangeEnd) {
      return 0;
    }

    let firstOccurrence = this.startOfDay(txDate);

    if (firstOccurrence < rangeStart) {
      const daysDiff = Math.floor(
        (this.startOfDay(rangeStart).getTime() - firstOccurrence.getTime()) /
          DAY_MS,
      );
      const jump = Math.ceil(daysDiff / 7);
      firstOccurrence = new Date(firstOccurrence.getTime() + jump * 7 * DAY_MS);
    }

    if (firstOccurrence > rangeEnd) {
      return 0;
    }

    return (
      Math.floor(
        (rangeEnd.getTime() - firstOccurrence.getTime()) / (7 * DAY_MS),
      ) + 1
    );
  }

  private countMonthlyOccurrence(
    txDate: Date,
    rangeStart: Date,
    rangeEnd: Date,
    monthStart: Date,
  ) {
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const day = Math.min(txDate.getDate(), daysInMonth);
    const occurrence = new Date(
      year,
      month,
      day,
      txDate.getHours(),
      txDate.getMinutes(),
    );

    if (occurrence < txDate) {
      return 0;
    }

    return occurrence >= rangeStart && occurrence <= rangeEnd ? 1 : 0;
  }

  private countYearlyOccurrence(
    txDate: Date,
    rangeStart: Date,
    rangeEnd: Date,
    monthStart: Date,
  ) {
    if (txDate.getMonth() !== monthStart.getMonth()) {
      return 0;
    }

    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const day = Math.min(txDate.getDate(), daysInMonth);
    const occurrence = new Date(
      year,
      month,
      day,
      txDate.getHours(),
      txDate.getMinutes(),
    );

    if (occurrence < txDate) {
      return 0;
    }

    return occurrence >= rangeStart && occurrence <= rangeEnd ? 1 : 0;
  }

  private estimateRecurringMonthlyAmount(
    transactions: Transaction[],
    referenceDate: Date,
  ) {
    const monthStart = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );
    const monthEnd = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    return transactions.reduce((total, transaction) => {
      const occurrences = this.countOccurrencesInRange(
        transaction,
        monthStart,
        monthEnd,
        monthStart,
      );
      return total + toMoney(transaction.amount) * occurrences;
    }, 0);
  }

  private buildSummaryMessage(estimatedYearEndBalance: number) {
    if (estimatedYearEndBalance >= 0) {
      return `A ce rythme, vous terminerez l'année avec environ ${estimatedYearEndBalance.toFixed(2)} €.`;
    }

    return `Votre projection annuelle est negative autour de ${estimatedYearEndBalance.toFixed(2)} €.`;
  }

  private getMonthLabel(monthIndex: number) {
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

  private roundMoney(value: number) {
    return Math.round(value * 100) / 100;
  }

  private startOfDay(date: Date) {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0,
      0,
    );
  }

  private endOfDay(date: Date) {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23,
      59,
      59,
      999,
    );
  }

  private maxDate(a: Date, b: Date) {
    return a > b ? a : b;
  }

  private minDate(a: Date, b: Date) {
    return a < b ? a : b;
  }
}
