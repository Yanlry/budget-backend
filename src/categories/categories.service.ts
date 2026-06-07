import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_CATEGORIES } from '../common/types/default-categories';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForUser(userId: string) {
    await this.createDefaultCategoriesForUser(userId);

    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async createForUser(userId: string, dto: CreateCategoryDto) {
    const normalizedName = dto.name.trim();
    const normalizedIcon = dto.icon?.trim();

    const existing = await this.prisma.category.findFirst({
      where: {
        userId,
        name: { equals: normalizedName, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new ConflictException('Cette categorie existe deja.');
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

  async createDefaultCategoriesForUser(userId: string) {
    for (const category of DEFAULT_CATEGORIES) {
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
      } else if (!exists.icon || !exists.color) {
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

  findOneForUser(userId: string, id: string) {
    return this.prisma.category.findFirst({
      where: {
        id,
        userId,
      },
    });
  }
}
