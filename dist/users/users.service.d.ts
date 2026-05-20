import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByEmail(email: string): Prisma.Prisma__UserClient<{
        name: string | null;
        id: string;
        email: string;
        passwordHash: string;
        currentBalance: Prisma.Decimal;
        goalAmount: Prisma.Decimal | null;
        createdAt: Date;
        updatedAt: Date;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    findById(id: string): Prisma.Prisma__UserClient<{
        name: string | null;
        id: string;
        email: string;
        passwordHash: string;
        currentBalance: Prisma.Decimal;
        goalAmount: Prisma.Decimal | null;
        createdAt: Date;
        updatedAt: Date;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    create(data: {
        email: string;
        passwordHash: string;
        name?: string;
        currentBalance?: number;
        goalAmount?: number;
    }): Prisma.Prisma__UserClient<{
        name: string | null;
        id: string;
        email: string;
        passwordHash: string;
        currentBalance: Prisma.Decimal;
        goalAmount: Prisma.Decimal | null;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    updateById(id: string, data: {
        name?: string;
        currentBalance?: number;
        goalAmount?: number | null;
    }): Prisma.Prisma__UserClient<{
        name: string | null;
        id: string;
        email: string;
        passwordHash: string;
        currentBalance: Prisma.Decimal;
        goalAmount: Prisma.Decimal | null;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    updatePasswordHashById(id: string, passwordHash: string): Prisma.Prisma__UserClient<{
        name: string | null;
        id: string;
        email: string;
        passwordHash: string;
        currentBalance: Prisma.Decimal;
        goalAmount: Prisma.Decimal | null;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
}
