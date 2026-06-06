import { ConfigService } from '@nestjs/config';
import { AccountsService } from '../accounts/accounts.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLinkTokenDto } from './dto/create-link-token.dto';
import { ExchangePublicTokenDto } from './dto/exchange-public-token.dto';
import { FinalizeLinkTokenDto } from './dto/finalize-link-token.dto';
export declare class BankingService {
    private readonly prisma;
    private readonly configService;
    private readonly accountsService;
    constructor(prisma: PrismaService, configService: ConfigService, accountsService: AccountsService);
    getConnectionsForUser(userId: string): Promise<{
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
    createLinkTokenForUser(userId: string, dto: CreateLinkTokenDto): Promise<{
        linkToken: string;
        hostedLinkUrl: string | null;
        expiration: string;
        requestId: string;
        daysRequested: number;
        countryCodes: string[];
        hostedLink: boolean;
    }>;
    exchangePublicTokenForUser(userId: string, dto: ExchangePublicTokenDto): Promise<{
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
    finalizeLinkTokenForUser(userId: string, dto: FinalizeLinkTokenDto): Promise<{
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
    syncConnectionForUser(userId: string, connectionId: string): Promise<{
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
    getRecurringAnalysisForUser(userId: string): Promise<{
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
    disconnectConnectionForUser(userId: string, connectionId: string): Promise<{
        success: boolean;
    }>;
    private connectPublicTokenForUser;
    private extractPublicTokenFromLinkTokenGet;
    private detectRecurringCandidates;
    private persistRecurringCandidates;
    private estimateMonthlyAmount;
    private classifyCadence;
    private cadenceReferenceDays;
    private computeNextDate;
    private buildIntervalsInDays;
    private median;
    private relativeVariation;
    private toIsoDate;
    private normalizeTransactionName;
    private shouldIgnoreNormalizedName;
    private fetchInstitutionName;
    private findConnectionForUser;
    private findActiveConnectionForUser;
    private isPlaidConfigured;
    private ensurePlaidConfigured;
    private getPlaidEnv;
    private getPlaidBaseUrl;
    private getCountryCodes;
    private getDefaultDaysRequested;
    private plaidPost;
    private serializeConnection;
    private roundMoney;
}
