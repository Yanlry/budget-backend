import { TransactionType } from '@prisma/client';

export const DEFAULT_CATEGORIES: Array<{
  name: string;
  type: TransactionType | null;
  color: string;
  icon: string;
}> = [
  {
    name: 'Logement',
    type: TransactionType.EXPENSE,
    color: '#4B5563',
    icon: 'home',
  },
  {
    name: 'Alimentation',
    type: TransactionType.EXPENSE,
    color: '#059669',
    icon: 'shopping-cart',
  },
  {
    name: 'Transport',
    type: TransactionType.EXPENSE,
    color: '#0EA5E9',
    icon: 'truck',
  },
  {
    name: 'Abonnements',
    type: TransactionType.EXPENSE,
    color: '#8B5CF6',
    icon: 'repeat',
  },
  {
    name: 'Loisirs',
    type: TransactionType.EXPENSE,
    color: '#F59E0B',
    icon: 'smile',
  },
  {
    name: 'Sante',
    type: TransactionType.EXPENSE,
    color: '#EC4899',
    icon: 'activity',
  },
  {
    name: 'Impots',
    type: TransactionType.EXPENSE,
    color: '#EF4444',
    icon: 'percent',
  },
  {
    name: 'Credit',
    type: TransactionType.EXPENSE,
    color: '#7C3AED',
    icon: 'credit-card',
  },
  {
    name: 'Epargne',
    type: TransactionType.EXPENSE,
    color: '#14B8A6',
    icon: 'target',
  },
  { name: 'Autre', type: null, color: '#6B7280', icon: 'tag' },
  {
    name: 'Salaire',
    type: TransactionType.INCOME,
    color: '#16A34A',
    icon: 'dollar-sign',
  },
  {
    name: 'Prime',
    type: TransactionType.INCOME,
    color: '#10B981',
    icon: 'gift',
  },
];
