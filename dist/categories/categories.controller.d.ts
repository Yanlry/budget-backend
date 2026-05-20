import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoriesService } from './categories.service';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    getCategories(user: AuthenticatedUser): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        type: import("@prisma/client").$Enums.TransactionType | null;
        color: string | null;
        icon: string | null;
    }[]>;
    createCategory(user: AuthenticatedUser, dto: CreateCategoryDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        type: import("@prisma/client").$Enums.TransactionType | null;
        color: string | null;
        icon: string | null;
    }>;
}
