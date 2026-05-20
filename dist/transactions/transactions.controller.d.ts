import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { GetTransactionsQueryDto } from './dto/get-transactions-query.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionsService } from './transactions.service';
export declare class TransactionsController {
    private readonly transactionsService;
    constructor(transactionsService: TransactionsService);
    getTransactions(user: AuthenticatedUser, query: GetTransactionsQueryDto): Promise<{
        amount: number;
        category: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            type: import("@prisma/client").$Enums.TransactionType | null;
            color: string | null;
            icon: string | null;
        } | null;
        account: {
            currentBalance: number;
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            type: import("@prisma/client").$Enums.AccountType;
            color: string | null;
            icon: string | null;
        } | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        type: import("@prisma/client").$Enums.TransactionType;
        accountId: string | null;
        title: string;
        frequency: import("@prisma/client").$Enums.Frequency;
        recurrenceIntervalDays: number | null;
        date: Date;
        endDate: Date | null;
        categoryId: string | null;
        note: string | null;
    }[]>;
    createTransaction(user: AuthenticatedUser, dto: CreateTransactionDto): Promise<{
        amount: number;
        category: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            type: import("@prisma/client").$Enums.TransactionType | null;
            color: string | null;
            icon: string | null;
        } | null;
        account: {
            currentBalance: number;
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            type: import("@prisma/client").$Enums.AccountType;
            color: string | null;
            icon: string | null;
        } | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        type: import("@prisma/client").$Enums.TransactionType;
        accountId: string | null;
        title: string;
        frequency: import("@prisma/client").$Enums.Frequency;
        recurrenceIntervalDays: number | null;
        date: Date;
        endDate: Date | null;
        categoryId: string | null;
        note: string | null;
    }>;
    updateTransaction(user: AuthenticatedUser, id: string, dto: UpdateTransactionDto): Promise<{
        amount: number;
        category: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            type: import("@prisma/client").$Enums.TransactionType | null;
            color: string | null;
            icon: string | null;
        } | null;
        account: {
            currentBalance: number;
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            type: import("@prisma/client").$Enums.AccountType;
            color: string | null;
            icon: string | null;
        } | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        type: import("@prisma/client").$Enums.TransactionType;
        accountId: string | null;
        title: string;
        frequency: import("@prisma/client").$Enums.Frequency;
        recurrenceIntervalDays: number | null;
        date: Date;
        endDate: Date | null;
        categoryId: string | null;
        note: string | null;
    }>;
    deleteTransaction(user: AuthenticatedUser, id: string): Promise<{
        success: boolean;
    }>;
}
