import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginAppleDto } from './dto/login-apple.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateMeDto } from './dto/update-me.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        user: import("../common/types/public-user.type").PublicUser;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: import("../common/types/public-user.type").PublicUser;
    }>;
    loginWithApple(dto: LoginAppleDto): Promise<{
        accessToken: string;
        user: import("../common/types/public-user.type").PublicUser;
    }>;
    me(user: AuthenticatedUser): Promise<import("../common/types/public-user.type").PublicUser>;
    exportData(user: AuthenticatedUser): Promise<{
        generatedAt: string;
        data: {
            name: string | null;
            id: string;
            email: string;
            appleUserId: string | null;
            currentBalance: import("@prisma/client/runtime/library").Decimal;
            goalAmount: import("@prisma/client/runtime/library").Decimal | null;
            createdAt: Date;
            updatedAt: Date;
            transactions: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                type: import("@prisma/client").$Enums.TransactionType;
                accountId: string | null;
                title: string;
                amount: import("@prisma/client/runtime/library").Decimal;
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
                targetAmount: import("@prisma/client/runtime/library").Decimal;
            }[];
            accounts: {
                name: string;
                id: string;
                currentBalance: import("@prisma/client/runtime/library").Decimal;
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
                amount: import("@prisma/client/runtime/library").Decimal;
                frequency: import("@prisma/client").$Enums.Frequency;
                recurrenceIntervalDays: number | null;
                bankConnectionId: string;
                signature: string;
                nextDate: Date;
                localTransactionId: string | null;
                lastDetectedAt: Date;
                active: boolean;
            }[];
        };
    }>;
    updateMe(user: AuthenticatedUser, dto: UpdateMeDto): Promise<import("../common/types/public-user.type").PublicUser>;
    changePassword(user: AuthenticatedUser, dto: ChangePasswordDto): Promise<{
        success: boolean;
    }>;
    registerPushToken(user: AuthenticatedUser, dto: RegisterPushTokenDto): Promise<{
        success: boolean;
    }>;
    deleteAccount(user: AuthenticatedUser): Promise<{
        success: boolean;
    }>;
}
