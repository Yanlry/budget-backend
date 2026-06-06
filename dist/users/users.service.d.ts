import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByEmail(email: string): Prisma.Prisma__UserClient<{
        name: string | null;
        id: string;
        email: string;
        passwordHash: string;
        appleUserId: string | null;
        pushToken: string | null;
        currentBalance: Prisma.Decimal;
        goalAmount: Prisma.Decimal | null;
        createdAt: Date;
        updatedAt: Date;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    findByAppleUserId(appleUserId: string): Prisma.Prisma__UserClient<{
        name: string | null;
        id: string;
        email: string;
        passwordHash: string;
        appleUserId: string | null;
        pushToken: string | null;
        currentBalance: Prisma.Decimal;
        goalAmount: Prisma.Decimal | null;
        createdAt: Date;
        updatedAt: Date;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    findById(id: string): Prisma.Prisma__UserClient<{
        name: string | null;
        id: string;
        email: string;
        passwordHash: string;
        appleUserId: string | null;
        pushToken: string | null;
        currentBalance: Prisma.Decimal;
        goalAmount: Prisma.Decimal | null;
        createdAt: Date;
        updatedAt: Date;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    create(data: {
        email: string;
        passwordHash: string;
        name?: string;
        appleUserId?: string;
        currentBalance?: number;
        goalAmount?: number;
    }): Prisma.Prisma__UserClient<{
        name: string | null;
        id: string;
        email: string;
        passwordHash: string;
        appleUserId: string | null;
        pushToken: string | null;
        currentBalance: Prisma.Decimal;
        goalAmount: Prisma.Decimal | null;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    updateById(id: string, data: {
        name?: string;
        appleUserId?: string;
        currentBalance?: number;
        goalAmount?: number | null;
    }): Prisma.Prisma__UserClient<{
        name: string | null;
        id: string;
        email: string;
        passwordHash: string;
        appleUserId: string | null;
        pushToken: string | null;
        currentBalance: Prisma.Decimal;
        goalAmount: Prisma.Decimal | null;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    setPushTokenById(id: string, pushToken: string): Prisma.Prisma__UserClient<{
        name: string | null;
        id: string;
        email: string;
        passwordHash: string;
        appleUserId: string | null;
        pushToken: string | null;
        currentBalance: Prisma.Decimal;
        goalAmount: Prisma.Decimal | null;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    updatePasswordHashById(id: string, passwordHash: string): Prisma.Prisma__UserClient<{
        name: string | null;
        id: string;
        email: string;
        passwordHash: string;
        appleUserId: string | null;
        pushToken: string | null;
        currentBalance: Prisma.Decimal;
        goalAmount: Prisma.Decimal | null;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    deleteById(id: string): Prisma.Prisma__UserClient<{
        name: string | null;
        id: string;
        email: string;
        passwordHash: string;
        appleUserId: string | null;
        pushToken: string | null;
        currentBalance: Prisma.Decimal;
        goalAmount: Prisma.Decimal | null;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    exportDataById(id: string): Prisma.Prisma__UserClient<{
        name: string | null;
        id: string;
        email: string;
        appleUserId: string | null;
        currentBalance: Prisma.Decimal;
        goalAmount: Prisma.Decimal | null;
        createdAt: Date;
        updatedAt: Date;
        transactions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.TransactionType;
            accountId: string | null;
            title: string;
            amount: Prisma.Decimal;
            frequency: import("@prisma/client").$Enums.Frequency;
            recurrenceIntervalDays: number | null;
            date: Date;
            endDate: Date | null;
            categoryId: string | null;
            note: string | null;
        }[];
        categories: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.TransactionType | null;
            color: string | null;
            icon: string | null;
        }[];
        budgetGoals: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            year: number;
            targetAmount: Prisma.Decimal;
        }[];
        accounts: {
            name: string;
            id: string;
            currentBalance: Prisma.Decimal;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.AccountType;
            color: string | null;
            icon: string | null;
        }[];
        bankConnections: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            provider: "PLAID";
            status: import("@prisma/client").$Enums.BankConnectionStatus;
            institutionId: string | null;
            institutionName: string | null;
            lastSyncedAt: Date | null;
        }[];
        bankRecurringRules: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.TransactionType;
            title: string;
            amount: Prisma.Decimal;
            frequency: import("@prisma/client").$Enums.Frequency;
            recurrenceIntervalDays: number | null;
            bankConnectionId: string;
            signature: string;
            nextDate: Date;
            localTransactionId: string | null;
            lastDetectedAt: Date;
            active: boolean;
        }[];
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
}
