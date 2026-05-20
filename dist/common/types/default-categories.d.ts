import { TransactionType } from '@prisma/client';
export declare const DEFAULT_CATEGORIES: Array<{
    name: string;
    type: TransactionType | null;
    color: string;
    icon: string;
}>;
