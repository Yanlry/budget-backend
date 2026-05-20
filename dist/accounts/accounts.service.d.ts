import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
export declare class AccountsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAllForUser(userId: string): Promise<{
        currentBalance: number;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        type: import("@prisma/client").$Enums.AccountType;
        color: string | null;
        icon: string | null;
    }[]>;
    findOneForUser(userId: string, accountId: string): Promise<{
        name: string;
        id: string;
        currentBalance: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        type: import("@prisma/client").$Enums.AccountType;
        color: string | null;
        icon: string | null;
    } | null>;
    createForUser(userId: string, dto: CreateAccountDto): Promise<{
        currentBalance: number;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        type: import("@prisma/client").$Enums.AccountType;
        color: string | null;
        icon: string | null;
    }>;
    updateForUser(userId: string, accountId: string, dto: UpdateAccountDto): Promise<{
        currentBalance: number;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        type: import("@prisma/client").$Enums.AccountType;
        color: string | null;
        icon: string | null;
    }>;
    deleteForUser(userId: string, accountId: string): Promise<{
        success: boolean;
        movedToAccountId: string;
    }>;
    ensureDefaultAccount(userId: string, preferredBalance?: number): Promise<{
        name: string;
        id: string;
        currentBalance: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        type: import("@prisma/client").$Enums.AccountType;
        color: string | null;
        icon: string | null;
    }>;
    ensureDefaultAccountAndBackfill(userId: string): Promise<{
        name: string;
        id: string;
        currentBalance: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        type: import("@prisma/client").$Enums.AccountType;
        color: string | null;
        icon: string | null;
    }>;
    setDefaultAccountBalance(userId: string, currentBalance: number): Promise<void>;
    backfillNullTransactionAccounts(userId: string, accountId: string): Promise<void>;
    private syncUserBalanceFromAccounts;
    private getDefaultAccountVisual;
    private normalizeIcon;
    private normalizeColor;
}
