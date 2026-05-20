import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
export declare class AccountsController {
    private readonly accountsService;
    constructor(accountsService: AccountsService);
    getAccounts(user: AuthenticatedUser): Promise<{
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
    createAccount(user: AuthenticatedUser, dto: CreateAccountDto): Promise<{
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
    updateAccount(user: AuthenticatedUser, id: string, dto: UpdateAccountDto): Promise<{
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
    deleteAccount(user: AuthenticatedUser, id: string): Promise<{
        success: boolean;
        movedToAccountId: string;
    }>;
}
