import { Account, Category, Transaction, User } from '@prisma/client';
import { PublicUser } from './public-user.type';
export declare function toMoney(value: unknown): number;
export declare function serializeUser(user: User): PublicUser;
export declare function serializeCategory(category: Category): {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    type: import("@prisma/client").$Enums.TransactionType | null;
    color: string | null;
    icon: string | null;
};
export declare function serializeAccount(account: Account): {
    currentBalance: number;
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    type: import("@prisma/client").$Enums.AccountType;
    color: string | null;
    icon: string | null;
};
export declare function serializeTransaction(transaction: Transaction & {
    category?: Category | null;
    account?: Account | null;
}): {
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
};
