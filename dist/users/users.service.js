"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
    }
    findByAppleUserId(appleUserId) {
        return this.prisma.user.findUnique({
            where: { appleUserId },
        });
    }
    findById(id) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }
    create(data) {
        const createInput = {
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
    updateById(id, data) {
        const updateInput = {
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
    setPushTokenById(id, pushToken) {
        return this.prisma.user.update({
            where: { id },
            data: {
                pushToken,
            },
        });
    }
    updatePasswordHashById(id, passwordHash) {
        return this.prisma.user.update({
            where: { id },
            data: {
                passwordHash,
            },
        });
    }
    deleteById(id) {
        return this.prisma.user.delete({
            where: { id },
        });
    }
    exportDataById(id) {
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
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map