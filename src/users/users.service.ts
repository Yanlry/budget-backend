import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  findByAppleUserId(appleUserId: string) {
    return this.prisma.user.findUnique({
      where: { appleUserId },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  create(data: {
    email: string;
    passwordHash: string;
    name?: string;
    appleUserId?: string;
    currentBalance?: number;
    goalAmount?: number;
  }) {
    const createInput: Prisma.UserCreateInput = {
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      name: data.name,
      appleUserId: data.appleUserId,
      currentBalance: data.currentBalance ?? 0,
      goalAmount: data.goalAmount,
    };

    return this.prisma.user.create({
      data: createInput,
    });
  }

  updateById(
    id: string,
    data: {
      name?: string;
      appleUserId?: string;
      currentBalance?: number;
      goalAmount?: number | null;
    },
  ) {
    const updateInput: Prisma.UserUpdateInput = {
      name: data.name,
      appleUserId: data.appleUserId,
      currentBalance: data.currentBalance,
      goalAmount: data.goalAmount,
    };

    return this.prisma.user.update({
      where: { id },
      data: updateInput,
    });
  }

  setPushTokenById(id: string, pushToken: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        pushToken,
      },
    });
  }

  updatePasswordHashById(id: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
      },
    });
  }

  deleteById(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  exportDataById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        appleUserId: true,
        currentBalance: true,
        goalAmount: true,
        createdAt: true,
        updatedAt: true,
        accounts: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            name: true,
            type: true,
            icon: true,
            color: true,
            currentBalance: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        categories: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            name: true,
            type: true,
            color: true,
            icon: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        transactions: {
          orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
          select: {
            id: true,
            accountId: true,
            title: true,
            amount: true,
            type: true,
            frequency: true,
            recurrenceIntervalDays: true,
            date: true,
            endDate: true,
            categoryId: true,
            note: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        budgetGoals: {
          orderBy: { year: 'asc' },
          select: {
            id: true,
            year: true,
            targetAmount: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        bankConnections: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            provider: true,
            status: true,
            institutionId: true,
            institutionName: true,
            lastSyncedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        bankRecurringRules: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            bankConnectionId: true,
            signature: true,
            title: true,
            amount: true,
            type: true,
            frequency: true,
            recurrenceIntervalDays: true,
            nextDate: true,
            lastDetectedAt: true,
            active: true,
            localTransactionId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }
}
