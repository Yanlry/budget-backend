import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { BankingService } from './banking.service';
import { CreateLinkTokenDto } from './dto/create-link-token.dto';
import { ExchangePublicTokenDto } from './dto/exchange-public-token.dto';
import { FinalizeLinkTokenDto } from './dto/finalize-link-token.dto';
export declare class BankingController {
    private readonly bankingService;
    constructor(bankingService: BankingService);
    getConnections(user: AuthenticatedUser): Promise<{
        providerConfigured: boolean;
        items: {
            id: string;
            provider: "PLAID";
            status: import("@prisma/client").$Enums.BankConnectionStatus;
            institutionId: string | null;
            institutionName: string | null;
            lastSyncedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
    createLinkToken(user: AuthenticatedUser, dto: CreateLinkTokenDto): Promise<{
        linkToken: string;
        hostedLinkUrl: string | null;
        expiration: string;
        requestId: string;
        daysRequested: number;
        countryCodes: string[];
        hostedLink: boolean;
    }>;
    exchangePublicToken(user: AuthenticatedUser, dto: ExchangePublicTokenDto): Promise<{
        connection: {
            id: string;
            provider: "PLAID";
            status: import("@prisma/client").$Enums.BankConnectionStatus;
            institutionId: string | null;
            institutionName: string | null;
            lastSyncedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        sync: {
            connectionId: string;
            added: number;
            modified: number;
            removed: number;
            recurringDetected: number;
            recurringUpdated: number;
            recurringCreated: number;
            recurringDisabled: number;
            lastCursor: string | null;
        } | null;
    }>;
    finalizeLinkToken(user: AuthenticatedUser, dto: FinalizeLinkTokenDto): Promise<{
        status: string;
        completed: boolean;
    } | {
        connection: {
            id: string;
            provider: "PLAID";
            status: import("@prisma/client").$Enums.BankConnectionStatus;
            institutionId: string | null;
            institutionName: string | null;
            lastSyncedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        sync: {
            connectionId: string;
            added: number;
            modified: number;
            removed: number;
            recurringDetected: number;
            recurringUpdated: number;
            recurringCreated: number;
            recurringDisabled: number;
            lastCursor: string | null;
        } | null;
        status: string;
        completed: boolean;
    }>;
    syncConnection(user: AuthenticatedUser, id: string): Promise<{
        connectionId: string;
        added: number;
        modified: number;
        removed: number;
        recurringDetected: number;
        recurringUpdated: number;
        recurringCreated: number;
        recurringDisabled: number;
        lastCursor: string | null;
    }>;
    getRecurringAnalysis(user: AuthenticatedUser): Promise<{
        streamCount: number;
        streams: {
            id: string;
            connectionId: string;
            institutionName: string | null;
            title: string;
            amount: number;
            type: import("@prisma/client").$Enums.TransactionType;
            frequency: import("@prisma/client").$Enums.Frequency;
            recurrenceIntervalDays: number | null;
            nextDate: Date;
            lastDetectedAt: Date;
            monthlyEstimate: number;
        }[];
        totalMonthlyIncome: number;
        totalMonthlyExpenses: number;
        monthlyNet: number;
    }>;
    disconnectConnection(user: AuthenticatedUser, id: string): Promise<{
        success: boolean;
    }>;
}
