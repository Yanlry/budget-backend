-- Create enums for banking integration
CREATE TYPE "BankProvider" AS ENUM ('PLAID');
CREATE TYPE "BankConnectionStatus" AS ENUM ('ACTIVE', 'NEEDS_REAUTH', 'DISCONNECTED');

-- Create table for linked bank connections
CREATE TABLE "BankConnection" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" "BankProvider" NOT NULL DEFAULT 'PLAID',
  "status" "BankConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
  "providerItemId" TEXT NOT NULL,
  "providerAccessToken" TEXT NOT NULL,
  "institutionId" TEXT,
  "institutionName" TEXT,
  "cursor" TEXT,
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BankConnection_pkey" PRIMARY KEY ("id")
);

-- Create table for imported transactions
CREATE TABLE "BankImportedTransaction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bankConnectionId" TEXT NOT NULL,
  "providerTransactionId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "merchantName" TEXT,
  "amount" DECIMAL(12,2) NOT NULL,
  "type" "TransactionType" NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "pending" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BankImportedTransaction_pkey" PRIMARY KEY ("id")
);

-- Create table for detected recurring streams
CREATE TABLE "BankRecurringRule" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bankConnectionId" TEXT NOT NULL,
  "signature" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "type" "TransactionType" NOT NULL,
  "frequency" "Frequency" NOT NULL,
  "recurrenceIntervalDays" INTEGER,
  "nextDate" TIMESTAMP(3) NOT NULL,
  "localTransactionId" TEXT,
  "lastDetectedAt" TIMESTAMP(3) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BankRecurringRule_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "BankConnection_provider_providerItemId_key"
  ON "BankConnection"("provider", "providerItemId");

CREATE INDEX "BankConnection_userId_status_idx"
  ON "BankConnection"("userId", "status");

CREATE UNIQUE INDEX "BankImportedTransaction_bankConnectionId_providerTransactionId_key"
  ON "BankImportedTransaction"("bankConnectionId", "providerTransactionId");

CREATE INDEX "BankImportedTransaction_userId_date_idx"
  ON "BankImportedTransaction"("userId", "date");

CREATE INDEX "BankImportedTransaction_bankConnectionId_normalizedName_idx"
  ON "BankImportedTransaction"("bankConnectionId", "normalizedName");

CREATE UNIQUE INDEX "BankRecurringRule_bankConnectionId_signature_key"
  ON "BankRecurringRule"("bankConnectionId", "signature");

CREATE INDEX "BankRecurringRule_userId_active_idx"
  ON "BankRecurringRule"("userId", "active");

-- Foreign keys
ALTER TABLE "BankConnection"
  ADD CONSTRAINT "BankConnection_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BankImportedTransaction"
  ADD CONSTRAINT "BankImportedTransaction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BankImportedTransaction"
  ADD CONSTRAINT "BankImportedTransaction_bankConnectionId_fkey"
  FOREIGN KEY ("bankConnectionId") REFERENCES "BankConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BankRecurringRule"
  ADD CONSTRAINT "BankRecurringRule_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BankRecurringRule"
  ADD CONSTRAINT "BankRecurringRule_bankConnectionId_fkey"
  FOREIGN KEY ("bankConnectionId") REFERENCES "BankConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
