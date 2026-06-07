import { TransactionType } from '@prisma/client';
export type DefaultCategoryDefinition = {
    name: string;
    type: TransactionType | null;
    color: string;
    icon: string;
};
export declare const SUGGESTION_CATEGORY_BY_KEY: Record<string, DefaultCategoryDefinition>;
export declare const DEFAULT_CATEGORIES: DefaultCategoryDefinition[];
