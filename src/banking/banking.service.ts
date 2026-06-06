import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BankConnection,
  BankConnectionStatus,
  BankProvider,
  Frequency,
  TransactionType,
} from '@prisma/client';
import { AccountsService } from '../accounts/accounts.service';
import { toMoney } from '../common/types/serializers';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLinkTokenDto } from './dto/create-link-token.dto';
import { ExchangePublicTokenDto } from './dto/exchange-public-token.dto';
import { FinalizeLinkTokenDto } from './dto/finalize-link-token.dto';

const DAY_MS = 24 * 60 * 60 * 1000;

const PLAID_BASE_URL_BY_ENV = {
  sandbox: 'https://sandbox.plaid.com',
  development: 'https://development.plaid.com',
  production: 'https://production.plaid.com',
} as const;

type PlaidEnv = keyof typeof PLAID_BASE_URL_BY_ENV;

interface PlaidLinkTokenCreateResponse {
  link_token: string;
  expiration: string;
  request_id: string;
  hosted_link_url?: string;
}

interface PlaidTokenExchangeResponse {
  access_token: string;
  item_id: string;
  request_id: string;
}

interface PlaidItemGetResponse {
  item: {
    institution_id?: string | null;
  };
  request_id: string;
}

interface PlaidInstitutionGetByIdResponse {
  institution?: {
    name?: string;
  };
  request_id: string;
}

interface PlaidTransaction {
  transaction_id: string;
  amount: number;
  name?: string | null;
  merchant_name?: string | null;
  date?: string | null;
  authorized_date?: string | null;
  pending?: boolean;
}

interface PlaidTransactionsSyncResponse {
  added: PlaidTransaction[];
  modified: PlaidTransaction[];
  removed: Array<{ transaction_id: string }>;
  has_more: boolean;
  next_cursor: string;
  request_id: string;
}

interface PlaidLinkTokenGetResponse {
  status?: string;
  public_token?: string;
  on_success?: {
    public_token?: string;
  } | null;
  results?: {
    item_add_results?: Array<{
      public_token?: string;
    }>;
  } | null;
}

interface RecurringCadence {
  frequency: Frequency;
  recurrenceIntervalDays: number | null;
  toleranceDays: number;
}

interface RecurringCandidate {
  signature: string;
  title: string;
  normalizedName: string;
  amount: number;
  type: TransactionType;
  frequency: Frequency;
  recurrenceIntervalDays: number | null;
  nextDate: Date;
  occurrences: number;
}

@Injectable()
export class BankingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly accountsService: AccountsService,
  ) {}

  async getConnectionsForUser(userId: string) {
    const connections = await this.prisma.bankConnection.findMany({
      where: {
        userId,
        status: {
          not: BankConnectionStatus.DISCONNECTED,
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return {
      providerConfigured: this.isPlaidConfigured(),
      items: connections.map((connection) => this.serializeConnection(connection)),
    };
  }

  async createLinkTokenForUser(userId: string, dto: CreateLinkTokenDto) {
    this.ensurePlaidConfigured();

    const requestedDays = dto.daysRequested ?? this.getDefaultDaysRequested();
    const countryCodes = this.getCountryCodes();
    const shouldUseHostedLink =
      dto.hostedLink === true ||
      this.configService.get<string>('PLAID_ENABLE_HOSTED_LINK') === 'true';

    const payload: Record<string, unknown> = {
      client_name: 'Nova Budget',
      language: 'fr',
      country_codes: countryCodes,
      products: ['transactions'],
      user: {
        client_user_id: userId,
      },
      transactions: {
        days_requested: requestedDays,
      },
    };

    const webhook = this.configService.get<string>('PLAID_WEBHOOK_URL')?.trim();
    if (webhook) {
      payload.webhook = webhook;
    }

    const redirectUri = this.configService.get<string>('PLAID_REDIRECT_URI')?.trim();
    if (redirectUri && !shouldUseHostedLink) {
      payload.redirect_uri = redirectUri;
    }

    if (shouldUseHostedLink) {
      const hostedLinkPayload: Record<string, unknown> = {};

      if (redirectUri) {
        hostedLinkPayload.completion_redirect_uri = redirectUri;
      }

      payload.hosted_link = hostedLinkPayload;
    }

    const data = await this.plaidPost<PlaidLinkTokenCreateResponse>(
      '/link/token/create',
      payload,
    );

    return {
      linkToken: data.link_token,
      hostedLinkUrl: data.hosted_link_url ?? null,
      expiration: data.expiration,
      requestId: data.request_id,
      daysRequested: requestedDays,
      countryCodes,
      hostedLink: shouldUseHostedLink,
    };
  }

  async exchangePublicTokenForUser(userId: string, dto: ExchangePublicTokenDto) {
    return this.connectPublicTokenForUser(
      userId,
      dto.publicToken,
      dto.syncNow !== false,
    );
  }

  async finalizeLinkTokenForUser(userId: string, dto: FinalizeLinkTokenDto) {
    this.ensurePlaidConfigured();

    const result = await this.plaidPost<PlaidLinkTokenGetResponse>(
      '/link/token/get',
      {
        link_token: dto.linkToken,
      },
    );

    const publicToken = this.extractPublicTokenFromLinkTokenGet(result);
    if (!publicToken) {
      return {
        status: (typeof result.status === 'string' ? result.status : null) ?? 'PENDING',
        completed: false,
      };
    }

    const connection = await this.connectPublicTokenForUser(
      userId,
      publicToken,
      dto.syncNow !== false,
    );

    return {
      status: (typeof result.status === 'string' ? result.status : null) ?? 'COMPLETED',
      completed: true,
      ...connection,
    };
  }

  async syncConnectionForUser(userId: string, connectionId: string) {
    this.ensurePlaidConfigured();

    const connection = await this.findActiveConnectionForUser(userId, connectionId);

    let cursor = connection.cursor ?? null;
    let hasMore = true;
    const added: PlaidTransaction[] = [];
    const modified: PlaidTransaction[] = [];
    const removedIds: string[] = [];

    while (hasMore) {
      const payload: Record<string, unknown> = {
        access_token: connection.providerAccessToken,
        count: 500,
        options: {
          include_original_description: true,
        },
      };

      if (cursor) {
        payload.cursor = cursor;
      }

      const page = await this.plaidPost<PlaidTransactionsSyncResponse>(
        '/transactions/sync',
        payload,
      );

      added.push(...(page.added ?? []));
      modified.push(...(page.modified ?? []));
      removedIds.push(...(page.removed ?? []).map((item) => item.transaction_id));

      hasMore = Boolean(page.has_more);
      cursor = page.next_cursor;
    }

    const upsertCandidates = [...added, ...modified];
    const importedIds = new Set<string>();

    for (const transaction of upsertCandidates) {
      if (!transaction.transaction_id || importedIds.has(transaction.transaction_id)) {
        continue;
      }
      importedIds.add(transaction.transaction_id);

      const date = this.toIsoDate(transaction.date ?? transaction.authorized_date);
      if (!date) {
        continue;
      }

      const amount = Number(transaction.amount ?? 0);
      if (!Number.isFinite(amount) || Math.abs(amount) < 0.01) {
        continue;
      }

      const type = amount >= 0 ? TransactionType.EXPENSE : TransactionType.INCOME;
      const absoluteAmount = Math.abs(amount);
      const rawName = (transaction.merchant_name ?? transaction.name ?? '').trim();
      if (!rawName) {
        continue;
      }

      const normalizedName = this.normalizeTransactionName(rawName);
      if (!normalizedName) {
        continue;
      }

      await this.prisma.bankImportedTransaction.upsert({
        where: {
          bankConnectionId_providerTransactionId: {
            bankConnectionId: connection.id,
            providerTransactionId: transaction.transaction_id,
          },
        },
        create: {
          userId,
          bankConnectionId: connection.id,
          providerTransactionId: transaction.transaction_id,
          name: rawName,
          normalizedName,
          merchantName: transaction.merchant_name ?? null,
          amount: absoluteAmount,
          type,
          date,
          pending: Boolean(transaction.pending),
        },
        update: {
          name: rawName,
          normalizedName,
          merchantName: transaction.merchant_name ?? null,
          amount: absoluteAmount,
          type,
          date,
          pending: Boolean(transaction.pending),
        },
      });
    }

    if (removedIds.length > 0) {
      await this.prisma.bankImportedTransaction.deleteMany({
        where: {
          bankConnectionId: connection.id,
          providerTransactionId: {
            in: removedIds,
          },
        },
      });
    }

    await this.prisma.bankConnection.update({
      where: { id: connection.id },
      data: {
        status: BankConnectionStatus.ACTIVE,
        cursor,
        lastSyncedAt: new Date(),
      },
    });

    const candidates = await this.detectRecurringCandidates(userId, connection.id);
    const recurringSync = await this.persistRecurringCandidates(
      userId,
      connection.id,
      candidates,
    );

    return {
      connectionId: connection.id,
      added: added.length,
      modified: modified.length,
      removed: removedIds.length,
      recurringDetected: candidates.length,
      recurringUpdated: recurringSync.updated,
      recurringCreated: recurringSync.created,
      recurringDisabled: recurringSync.disabled,
      lastCursor: cursor,
    };
  }

  async getRecurringAnalysisForUser(userId: string) {
    const rules = await this.prisma.bankRecurringRule.findMany({
      where: {
        userId,
        active: true,
        connection: {
          status: BankConnectionStatus.ACTIVE,
        },
      },
      include: {
        connection: true,
      },
      orderBy: [{ amount: 'desc' }],
    });

    let totalMonthlyIncome = 0;
    let totalMonthlyExpenses = 0;

    const streams = rules.map((rule) => {
      const monthlyEstimate = this.estimateMonthlyAmount(
        toMoney(rule.amount),
        rule.frequency,
        rule.recurrenceIntervalDays,
      );

      if (rule.type === TransactionType.INCOME) {
        totalMonthlyIncome += monthlyEstimate;
      } else {
        totalMonthlyExpenses += monthlyEstimate;
      }

      return {
        id: rule.id,
        connectionId: rule.bankConnectionId,
        institutionName: rule.connection.institutionName,
        title: rule.title,
        amount: toMoney(rule.amount),
        type: rule.type,
        frequency: rule.frequency,
        recurrenceIntervalDays: rule.recurrenceIntervalDays,
        nextDate: rule.nextDate,
        lastDetectedAt: rule.lastDetectedAt,
        monthlyEstimate: this.roundMoney(monthlyEstimate),
      };
    });

    return {
      streamCount: streams.length,
      streams,
      totalMonthlyIncome: this.roundMoney(totalMonthlyIncome),
      totalMonthlyExpenses: this.roundMoney(totalMonthlyExpenses),
      monthlyNet: this.roundMoney(totalMonthlyIncome - totalMonthlyExpenses),
    };
  }

  async disconnectConnectionForUser(userId: string, connectionId: string) {
    const connection = await this.findConnectionForUser(userId, connectionId);

    if (
      this.isPlaidConfigured() &&
      connection.providerAccessToken &&
      connection.status !== BankConnectionStatus.DISCONNECTED
    ) {
      try {
        await this.plaidPost('/item/remove', {
          access_token: connection.providerAccessToken,
          reason_code: 'OTHER',
        });
      } catch {
        // Disconnect locally even if provider-side remove fails.
      }
    }

    const rules = await this.prisma.bankRecurringRule.findMany({
      where: {
        bankConnectionId: connection.id,
        active: true,
      },
      select: {
        id: true,
        localTransactionId: true,
      },
    });

    for (const rule of rules) {
      if (rule.localTransactionId) {
        await this.prisma.transaction.deleteMany({
          where: {
            id: rule.localTransactionId,
            userId,
          },
        });
      }
    }

    await this.prisma.$transaction([
      this.prisma.bankRecurringRule.updateMany({
        where: {
          bankConnectionId: connection.id,
        },
        data: {
          active: false,
          localTransactionId: null,
        },
      }),
      this.prisma.bankConnection.update({
        where: { id: connection.id },
        data: {
          status: BankConnectionStatus.DISCONNECTED,
          providerAccessToken: '',
          cursor: null,
        },
      }),
    ]);

    return { success: true };
  }

  private async connectPublicTokenForUser(
    userId: string,
    publicToken: string,
    syncNow: boolean,
  ) {
    this.ensurePlaidConfigured();

    const exchange = await this.plaidPost<PlaidTokenExchangeResponse>(
      '/item/public_token/exchange',
      {
        public_token: publicToken,
      },
    );

    const item = await this.plaidPost<PlaidItemGetResponse>('/item/get', {
      access_token: exchange.access_token,
    });

    const institutionId = item.item.institution_id ?? null;
    const institutionName = institutionId
      ? await this.fetchInstitutionName(institutionId)
      : null;

    const existing = await this.prisma.bankConnection.findUnique({
      where: {
        provider_providerItemId: {
          provider: BankProvider.PLAID,
          providerItemId: exchange.item_id,
        },
      },
    });

    if (existing && existing.userId !== userId) {
      throw new BadRequestException(
        'Cette connexion bancaire est deja associee a un autre compte.',
      );
    }

    const connection = existing
      ? await this.prisma.bankConnection.update({
          where: { id: existing.id },
          data: {
            providerAccessToken: exchange.access_token,
            institutionId,
            institutionName,
            status: BankConnectionStatus.ACTIVE,
          },
        })
      : await this.prisma.bankConnection.create({
          data: {
            userId,
            provider: BankProvider.PLAID,
            providerItemId: exchange.item_id,
            providerAccessToken: exchange.access_token,
            institutionId,
            institutionName,
            status: BankConnectionStatus.ACTIVE,
          },
        });

    const sync = syncNow ? await this.syncConnectionForUser(userId, connection.id) : null;

    return {
      connection: this.serializeConnection(connection),
      sync,
    };
  }

  private extractPublicTokenFromLinkTokenGet(payload: PlaidLinkTokenGetResponse) {
    if (typeof payload.public_token === 'string' && payload.public_token.length > 0) {
      return payload.public_token;
    }

    const onSuccessToken = payload.on_success?.public_token;
    if (typeof onSuccessToken === 'string' && onSuccessToken.length > 0) {
      return onSuccessToken;
    }

    const itemAddResults = payload.results?.item_add_results;
    if (Array.isArray(itemAddResults)) {
      for (const result of itemAddResults) {
        if (typeof result?.public_token === 'string' && result.public_token.length > 0) {
          return result.public_token;
        }
      }
    }

    return null;
  }

  private async detectRecurringCandidates(userId: string, bankConnectionId: string) {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 400);

    const imported = await this.prisma.bankImportedTransaction.findMany({
      where: {
        userId,
        bankConnectionId,
        pending: false,
        date: {
          gte: since,
        },
      },
      orderBy: [{ date: 'asc' }],
    });

    const groups = new Map<string, typeof imported>();

    for (const transaction of imported) {
      if (this.shouldIgnoreNormalizedName(transaction.normalizedName)) {
        continue;
      }

      const key = `${transaction.type}|${transaction.normalizedName}`;
      const bucket = groups.get(key);
      if (bucket) {
        bucket.push(transaction);
      } else {
        groups.set(key, [transaction]);
      }
    }

    const candidates: RecurringCandidate[] = [];

    for (const [key, transactions] of groups.entries()) {
      if (transactions.length < 3) {
        continue;
      }

      const ordered = [...transactions].sort(
        (a, b) => a.date.getTime() - b.date.getTime(),
      );
      const intervals = this.buildIntervalsInDays(ordered.map((item) => item.date));
      if (intervals.length < 2) {
        continue;
      }

      const medianInterval = this.median(intervals);
      const cadence = this.classifyCadence(medianInterval);
      if (!cadence) {
        continue;
      }

      const consistentIntervals = intervals.filter(
        (value) =>
          Math.abs(value - this.cadenceReferenceDays(cadence)) <= cadence.toleranceDays,
      ).length;

      const consistencyRatio = consistentIntervals / intervals.length;
      if (consistencyRatio < 0.65) {
        continue;
      }

      const amounts = ordered.map((item) => toMoney(item.amount));
      const medianAmount = this.median(amounts);
      const variation = this.relativeVariation(amounts, medianAmount);
      if (variation > 0.35) {
        continue;
      }

      const latest = ordered[ordered.length - 1];
      const nextDate = this.computeNextDate(
        latest.date,
        cadence.frequency,
        cadence.recurrenceIntervalDays,
      );

      const displayTitle = latest.merchantName?.trim() || latest.name.trim();
      const signature = `${key}|${cadence.frequency}|${cadence.recurrenceIntervalDays ?? 'n'}`;

      candidates.push({
        signature,
        title: displayTitle,
        normalizedName: latest.normalizedName,
        amount: this.roundMoney(medianAmount),
        type: latest.type,
        frequency: cadence.frequency,
        recurrenceIntervalDays: cadence.recurrenceIntervalDays,
        nextDate,
        occurrences: ordered.length,
      });
    }

    return candidates.sort((a, b) => b.amount - a.amount);
  }

  private async persistRecurringCandidates(
    userId: string,
    bankConnectionId: string,
    candidates: RecurringCandidate[],
  ) {
    const defaultAccount =
      await this.accountsService.ensureDefaultAccountAndBackfill(userId);

    const existingRules = await this.prisma.bankRecurringRule.findMany({
      where: {
        userId,
        bankConnectionId,
      },
    });

    const existingBySignature = new Map(
      existingRules.map((rule) => [rule.signature, rule]),
    );
    const seenSignatures = new Set<string>();

    let created = 0;
    let updated = 0;
    let disabled = 0;

    for (const candidate of candidates) {
      seenSignatures.add(candidate.signature);
      const existingRule = existingBySignature.get(candidate.signature);

      let localTransactionId = existingRule?.localTransactionId ?? null;

      if (localTransactionId) {
        const exists = await this.prisma.transaction.findFirst({
          where: {
            id: localTransactionId,
            userId,
          },
          select: { id: true },
        });

        if (!exists) {
          localTransactionId = null;
        }
      }

      if (!localTransactionId) {
        const createdTransaction = await this.prisma.transaction.create({
          data: {
            userId,
            accountId: defaultAccount.id,
            title: candidate.title,
            amount: candidate.amount,
            type: candidate.type,
            frequency: candidate.frequency,
            recurrenceIntervalDays: candidate.recurrenceIntervalDays,
            date: candidate.nextDate,
            note: 'Transaction recurrente detectee automatiquement depuis la banque.',
          },
          select: { id: true },
        });

        localTransactionId = createdTransaction.id;
      } else {
        await this.prisma.transaction.update({
          where: { id: localTransactionId },
          data: {
            title: candidate.title,
            amount: candidate.amount,
            type: candidate.type,
            frequency: candidate.frequency,
            recurrenceIntervalDays: candidate.recurrenceIntervalDays,
            date: candidate.nextDate,
            note: 'Transaction recurrente detectee automatiquement depuis la banque.',
          },
        });
      }

      if (existingRule) {
        await this.prisma.bankRecurringRule.update({
          where: { id: existingRule.id },
          data: {
            title: candidate.title,
            amount: candidate.amount,
            type: candidate.type,
            frequency: candidate.frequency,
            recurrenceIntervalDays: candidate.recurrenceIntervalDays,
            nextDate: candidate.nextDate,
            lastDetectedAt: new Date(),
            active: true,
            localTransactionId,
          },
        });
        updated += 1;
      } else {
        await this.prisma.bankRecurringRule.create({
          data: {
            userId,
            bankConnectionId,
            signature: candidate.signature,
            title: candidate.title,
            amount: candidate.amount,
            type: candidate.type,
            frequency: candidate.frequency,
            recurrenceIntervalDays: candidate.recurrenceIntervalDays,
            nextDate: candidate.nextDate,
            localTransactionId,
            lastDetectedAt: new Date(),
            active: true,
          },
        });
        created += 1;
      }
    }

    for (const existingRule of existingRules) {
      if (seenSignatures.has(existingRule.signature) || !existingRule.active) {
        continue;
      }

      if (existingRule.localTransactionId) {
        await this.prisma.transaction.deleteMany({
          where: {
            id: existingRule.localTransactionId,
            userId,
          },
        });
      }

      await this.prisma.bankRecurringRule.update({
        where: { id: existingRule.id },
        data: {
          active: false,
          localTransactionId: null,
        },
      });
      disabled += 1;
    }

    return { created, updated, disabled };
  }

  private estimateMonthlyAmount(
    amount: number,
    frequency: Frequency,
    recurrenceIntervalDays: number | null,
  ) {
    switch (frequency) {
      case Frequency.DAILY: {
        const interval = recurrenceIntervalDays && recurrenceIntervalDays > 0
          ? recurrenceIntervalDays
          : 1;
        return amount * (30 / interval);
      }
      case Frequency.WEEKLY:
        return (amount * 52) / 12;
      case Frequency.MONTHLY:
        return amount;
      case Frequency.YEARLY:
        return amount / 12;
      default:
        return 0;
    }
  }

  private classifyCadence(medianIntervalDays: number): RecurringCadence | null {
    if (medianIntervalDays <= 2) {
      const interval = Math.max(1, Math.round(medianIntervalDays));
      return {
        frequency: Frequency.DAILY,
        recurrenceIntervalDays: interval,
        toleranceDays: 1,
      };
    }

    if (medianIntervalDays >= 6 && medianIntervalDays <= 8) {
      return {
        frequency: Frequency.WEEKLY,
        recurrenceIntervalDays: null,
        toleranceDays: 2,
      };
    }

    if (medianIntervalDays >= 13 && medianIntervalDays <= 17) {
      return {
        frequency: Frequency.DAILY,
        recurrenceIntervalDays: 14,
        toleranceDays: 3,
      };
    }

    if (medianIntervalDays >= 26 && medianIntervalDays <= 33) {
      return {
        frequency: Frequency.MONTHLY,
        recurrenceIntervalDays: null,
        toleranceDays: 4,
      };
    }

    if (medianIntervalDays >= 350 && medianIntervalDays <= 380) {
      return {
        frequency: Frequency.YEARLY,
        recurrenceIntervalDays: null,
        toleranceDays: 12,
      };
    }

    return null;
  }

  private cadenceReferenceDays(cadence: RecurringCadence) {
    if (cadence.frequency === Frequency.DAILY) {
      return cadence.recurrenceIntervalDays ?? 1;
    }

    if (cadence.frequency === Frequency.WEEKLY) {
      return 7;
    }

    if (cadence.frequency === Frequency.MONTHLY) {
      return 30;
    }

    if (cadence.frequency === Frequency.YEARLY) {
      return 365;
    }

    return 0;
  }

  private computeNextDate(
    lastDate: Date,
    frequency: Frequency,
    recurrenceIntervalDays: number | null,
  ) {
    const candidate = new Date(lastDate);

    if (frequency === Frequency.DAILY) {
      const intervalDays = recurrenceIntervalDays && recurrenceIntervalDays > 0
        ? recurrenceIntervalDays
        : 1;
      candidate.setUTCDate(candidate.getUTCDate() + intervalDays);
    } else if (frequency === Frequency.WEEKLY) {
      candidate.setUTCDate(candidate.getUTCDate() + 7);
    } else if (frequency === Frequency.MONTHLY) {
      candidate.setUTCMonth(candidate.getUTCMonth() + 1);
    } else if (frequency === Frequency.YEARLY) {
      candidate.setUTCFullYear(candidate.getUTCFullYear() + 1);
    }

    const now = new Date();
    while (candidate.getTime() < now.getTime()) {
      if (frequency === Frequency.DAILY) {
        const intervalDays = recurrenceIntervalDays && recurrenceIntervalDays > 0
          ? recurrenceIntervalDays
          : 1;
        candidate.setUTCDate(candidate.getUTCDate() + intervalDays);
      } else if (frequency === Frequency.WEEKLY) {
        candidate.setUTCDate(candidate.getUTCDate() + 7);
      } else if (frequency === Frequency.MONTHLY) {
        candidate.setUTCMonth(candidate.getUTCMonth() + 1);
      } else if (frequency === Frequency.YEARLY) {
        candidate.setUTCFullYear(candidate.getUTCFullYear() + 1);
      } else {
        break;
      }
    }

    return candidate;
  }

  private buildIntervalsInDays(dates: Date[]) {
    const intervals: number[] = [];

    for (let index = 1; index < dates.length; index += 1) {
      const diff = dates[index].getTime() - dates[index - 1].getTime();
      const days = Math.round(diff / DAY_MS);
      if (days > 0) {
        intervals.push(days);
      }
    }

    return intervals;
  }

  private median(values: number[]) {
    if (values.length === 0) {
      return 0;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }

    return sorted[middle];
  }

  private relativeVariation(values: number[], median: number) {
    if (values.length === 0 || median <= 0) {
      return 0;
    }

    const maxDeviation = values.reduce((maximum, value) => {
      const deviation = Math.abs(value - median) / median;
      return Math.max(maximum, deviation);
    }, 0);

    return maxDeviation;
  }

  private toIsoDate(value: string | null | undefined) {
    if (!value) {
      return null;
    }

    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed;
  }

  private normalizeTransactionName(name: string) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\d{2,}/g, ' ')
      .replace(/[^a-z\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 90);
  }

  private shouldIgnoreNormalizedName(normalizedName: string) {
    if (normalizedName.length < 3) {
      return true;
    }

    const blocked = [
      'cb',
      'carte',
      'debit',
      'credit',
      'payment',
      'transfer',
      'virement interne',
      'withdrawal',
    ];

    return blocked.some((item) => normalizedName === item);
  }

  private async fetchInstitutionName(institutionId: string) {
    try {
      const response = await this.plaidPost<PlaidInstitutionGetByIdResponse>(
        '/institutions/get_by_id',
        {
          institution_id: institutionId,
          country_codes: this.getCountryCodes(),
        },
      );

      return response.institution?.name?.trim() || null;
    } catch {
      return null;
    }
  }

  private async findConnectionForUser(userId: string, connectionId: string) {
    const connection = await this.prisma.bankConnection.findFirst({
      where: {
        id: connectionId,
        userId,
      },
    });

    if (!connection) {
      throw new NotFoundException('Connexion bancaire introuvable.');
    }

    return connection;
  }

  private async findActiveConnectionForUser(userId: string, connectionId: string) {
    const connection = await this.findConnectionForUser(userId, connectionId);

    if (connection.status === BankConnectionStatus.DISCONNECTED) {
      throw new BadRequestException('Cette connexion bancaire est deconnectee.');
    }

    if (!connection.providerAccessToken) {
      throw new BadRequestException(
        'Aucun access token disponible pour cette connexion bancaire.',
      );
    }

    return connection;
  }

  private isPlaidConfigured() {
    const clientId = this.configService.get<string>('PLAID_CLIENT_ID')?.trim();
    const secret = this.configService.get<string>('PLAID_SECRET')?.trim();

    return Boolean(clientId && secret);
  }

  private ensurePlaidConfigured() {
    if (!this.isPlaidConfigured()) {
      throw new ServiceUnavailableException(
        'Plaid n est pas configure. Renseigne PLAID_CLIENT_ID et PLAID_SECRET dans le backend.',
      );
    }
  }

  private getPlaidEnv(): PlaidEnv {
    const raw = this.configService
      .get<string>('PLAID_ENV', 'sandbox')
      ?.toLowerCase()
      .trim();

    if (raw === 'development' || raw === 'production' || raw === 'sandbox') {
      return raw;
    }

    return 'sandbox';
  }

  private getPlaidBaseUrl() {
    return PLAID_BASE_URL_BY_ENV[this.getPlaidEnv()];
  }

  private getCountryCodes() {
    const raw = this.configService
      .get<string>('PLAID_COUNTRY_CODES', 'FR')
      ?.split(',')
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean);

    return raw && raw.length > 0 ? raw : ['FR'];
  }

  private getDefaultDaysRequested() {
    const value = Number(this.configService.get<string>('PLAID_DAYS_REQUESTED', '365'));
    if (!Number.isFinite(value)) {
      return 365;
    }

    return Math.min(730, Math.max(30, Math.trunc(value)));
  }

  private async plaidPost<T>(path: string, payload: Record<string, unknown>) {
    this.ensurePlaidConfigured();

    const clientId = this.configService.get<string>('PLAID_CLIENT_ID')?.trim();
    const secret = this.configService.get<string>('PLAID_SECRET')?.trim();

    const response = await fetch(`${this.getPlaidBaseUrl()}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': clientId ?? '',
        'PLAID-SECRET': secret ?? '',
      },
      body: JSON.stringify(payload),
    });

    const raw = await response.text();
    const parsed = raw.length ? (JSON.parse(raw) as Record<string, unknown>) : {};

    if (!response.ok || parsed.error_code) {
      const errorCode = typeof parsed.error_code === 'string' ? parsed.error_code : null;
      const errorMessage =
        (typeof parsed.error_message === 'string' && parsed.error_message) ||
        response.statusText ||
        'Erreur Plaid';

      if (errorCode === 'ITEM_LOGIN_REQUIRED') {
        throw new BadRequestException(
          'Re-authentification bancaire requise (ITEM_LOGIN_REQUIRED).',
        );
      }

      throw new BadRequestException(
        `Erreur Plaid (${errorCode ?? response.status}): ${errorMessage}`,
      );
    }

    return parsed as T;
  }

  private serializeConnection(connection: BankConnection) {
    return {
      id: connection.id,
      provider: connection.provider,
      status: connection.status,
      institutionId: connection.institutionId,
      institutionName: connection.institutionName,
      lastSyncedAt: connection.lastSyncedAt,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
    };
  }

  private roundMoney(value: number) {
    return Math.round(value * 100) / 100;
  }
}
