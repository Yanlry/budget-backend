import { TransactionType } from '@prisma/client';
export declare class GetTransactionsQueryDto {
    month?: number;
    year?: number;
    type?: TransactionType;
    from?: string;
    to?: string;
    includeFutureOnly?: boolean;
    accountId?: string;
}
