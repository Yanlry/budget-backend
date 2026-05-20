import { Frequency, TransactionType } from '@prisma/client';
export declare class CreateTransactionDto {
    title: string;
    amount: number;
    type: TransactionType;
    frequency?: Frequency;
    recurrenceIntervalDays?: number;
    date: string;
    endDate?: string;
    categoryId?: string;
    accountId?: string;
    note?: string;
}
