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

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  create(data: {
    email: string;
    passwordHash: string;
    name?: string;
    currentBalance?: number;
    goalAmount?: number;
  }) {
    const createInput: Prisma.UserCreateInput = {
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      name: data.name,
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
      currentBalance?: number;
      goalAmount?: number | null;
    },
  ) {
    const updateInput: Prisma.UserUpdateInput = {
      name: data.name,
      currentBalance: data.currentBalance,
      goalAmount: data.goalAmount,
    };

    return this.prisma.user.update({
      where: { id },
      data: updateInput,
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
}
