import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AccountsService } from '../accounts/accounts.service';
import { CategoriesService } from '../categories/categories.service';
import { UsersService } from '../users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginAppleDto } from './dto/login-apple.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateMeDto } from './dto/update-me.dto';
export declare class AuthService {
    private readonly usersService;
    private readonly categoriesService;
    private readonly accountsService;
    private readonly jwtService;
    private readonly configService;
    constructor(usersService: UsersService, categoriesService: CategoriesService, accountsService: AccountsService, jwtService: JwtService, configService: ConfigService);
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
    me(userId: string): Promise<import("../common/types/public-user.type").PublicUser>;
    exportData(userId: string): Promise<{
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
    updateMe(userId: string, dto: UpdateMeDto): Promise<import("../common/types/public-user.type").PublicUser>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        success: boolean;
    }>;
    registerPushToken(userId: string, dto: RegisterPushTokenDto): Promise<{
        success: boolean;
    }>;
    deleteAccount(userId: string): Promise<{
        success: boolean;
    }>;
    private verifyAppleIdentityToken;
    private signToken;
}
