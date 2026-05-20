import { AccountsService } from '../accounts/accounts.service';
import { PrismaService } from '../prisma/prisma.service';
export interface MonthProjection {
    year: number;
    month: number;
    label: string;
    startingBalance: number;
    expectedIncome: number;
    expectedExpenses: number;
    endingBalance: number;
}
export declare class ProjectionsService {
    private readonly prisma;
    private readonly accountsService;
    constructor(prisma: PrismaService, accountsService: AccountsService);
    getYearProjection(userId: string, year: number, accountId?: string): Promise<{
        year: number;
        currentBalance: number;
        estimatedYearEndBalance: number;
        months: MonthProjection[];
        summary: string;
        fixedExpenseRatio: number | null;
        yearlyPotentialSavings: number;
    }>;
    getMonthProjection(userId: string, year: number, month: number, accountId?: string): Promise<{
        summary: string;
        year: number;
        month: number;
        label: string;
        startingBalance: number;
        expectedIncome: number;
        expectedExpenses: number;
        endingBalance: number;
    }>;
    private calculateForRange;
    private countOccurrencesInRange;
    private getDailyIntervalDays;
    private countEveryNDaysOccurrences;
    private countWeeklyOccurrences;
    private countMonthlyOccurrence;
    private countYearlyOccurrence;
    private estimateRecurringMonthlyAmount;
    private buildSummaryMessage;
    private getMonthLabel;
    private roundMoney;
    private startOfDay;
    private endOfDay;
    private maxDate;
    private minDate;
}
