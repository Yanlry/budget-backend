import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { serializeCategory } from '../common/types/serializers';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getCategories(@CurrentUser() user: AuthenticatedUser) {
    const categories = await this.categoriesService.findAllForUser(user.userId);
    return categories.map(serializeCategory);
  }

  @Post()
  async createCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCategoryDto,
  ) {
    const category = await this.categoriesService.createForUser(
      user.userId,
      dto,
    );
    return serializeCategory(category);
  }
}
