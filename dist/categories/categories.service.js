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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const default_categories_1 = require("../common/types/default-categories");
let CategoriesService = class CategoriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAllForUser(userId) {
        await this.createDefaultCategoriesForUser(userId);
        return this.prisma.category.findMany({
            where: { userId },
            orderBy: { name: 'asc' },
        });
    }
    async createForUser(userId, dto) {
        const normalizedName = dto.name.trim();
        const normalizedIcon = dto.icon?.trim();
        const existing = await this.prisma.category.findFirst({
            where: {
                userId,
                name: { equals: normalizedName, mode: 'insensitive' },
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Cette categorie existe deja.');
        }
        return this.prisma.category.create({
            data: {
                userId,
                name: normalizedName,
                type: dto.type,
                color: dto.color,
                icon: normalizedIcon || undefined,
            },
        });
    }
    async createDefaultCategoriesForUser(userId) {
        for (const category of default_categories_1.DEFAULT_CATEGORIES) {
            const exists = await this.prisma.category.findFirst({
                where: {
                    userId,
                    name: { equals: category.name, mode: 'insensitive' },
                },
            });
            if (!exists) {
                await this.prisma.category.create({
                    data: {
                        userId,
                        name: category.name,
                        type: category.type,
                        color: category.color,
                        icon: category.icon,
                    },
                });
            }
            else if (!exists.icon || !exists.color) {
                await this.prisma.category.update({
                    where: { id: exists.id },
                    data: {
                        icon: exists.icon || category.icon,
                        color: exists.color || category.color,
                    },
                });
            }
        }
    }
    findOneForUser(userId, id) {
        return this.prisma.category.findFirst({
            where: {
                id,
                userId,
            },
        });
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map