import { Account, Category, Transaction, User } from '@prisma/client';
import { PublicUser } from './public-user.type';

export function toMoney(value: unknown): number {
  return Number(value ?? 0);
}

export function serializeUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    currentBalance: toMoney(user.currentBalance),
    goalAmount: user.goalAmount == null ? null : toMoney(user.goalAmount),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function serializeCategory(category: Category) {
  return {
    ...category,
  };
}

export function serializeAccount(account: Account) {
  return {
    ...account,
    currentBalance: toMoney(account.currentBalance),
  };
}

export function serializeTransaction(
  transaction: Transaction & {
    category?: Category | null;
    account?: Account | null;
  },
) {
  return {
    ...transaction,
    amount: toMoney(transaction.amount),
    category: transaction.category ?? null,
    account: transaction.account
      ? serializeAccount(transaction.account)
      : null,
  };
}
