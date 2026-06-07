import { TransactionType } from '@prisma/client';

export type DefaultCategoryDefinition = {
  name: string;
  type: TransactionType | null;
  color: string;
  icon: string;
};

const CORE_DEFAULT_CATEGORIES: DefaultCategoryDefinition[] = [
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

export const SUGGESTION_CATEGORY_BY_KEY: Record<string, DefaultCategoryDefinition> = {
  mobile_plan: {
    name: 'Telephonie',
    type: TransactionType.EXPENSE,
    color: '#0EA5E9',
    icon: 'smartphone',
  },
  mobile_insurance: {
    name: 'Assurances',
    type: TransactionType.EXPENSE,
    color: '#2563EB',
    icon: 'shield',
  },
  internet_box: {
    name: 'Internet',
    type: TransactionType.EXPENSE,
    color: '#0284C7',
    icon: 'wifi',
  },
  streaming_video: {
    name: 'Streaming',
    type: TransactionType.EXPENSE,
    color: '#7C3AED',
    icon: 'play-circle',
  },
  music_streaming: {
    name: 'Musique',
    type: TransactionType.EXPENSE,
    color: '#DB2777',
    icon: 'music',
  },
  audio_subscription: {
    name: 'Musique',
    type: TransactionType.EXPENSE,
    color: '#DB2777',
    icon: 'headphones',
  },
  bank_fees: {
    name: 'Banque',
    type: TransactionType.EXPENSE,
    color: '#334155',
    icon: 'briefcase',
  },
  payment_insurance: {
    name: 'Assurances',
    type: TransactionType.EXPENSE,
    color: '#2563EB',
    icon: 'shield',
  },
  insurance: {
    name: 'Assurances',
    type: TransactionType.EXPENSE,
    color: '#2563EB',
    icon: 'shield',
  },
  energy: {
    name: 'Energie',
    type: TransactionType.EXPENSE,
    color: '#F97316',
    icon: 'zap',
  },
  housing_utilities: {
    name: 'Charges logement',
    type: TransactionType.EXPENSE,
    color: '#64748B',
    icon: 'tool',
  },
  housing: {
    name: 'Logement',
    type: TransactionType.EXPENSE,
    color: '#4B5563',
    icon: 'home',
  },
  taxes: {
    name: 'Impots',
    type: TransactionType.EXPENSE,
    color: '#EF4444',
    icon: 'percent',
  },
  transport: {
    name: 'Transport',
    type: TransactionType.EXPENSE,
    color: '#0EA5E9',
    icon: 'truck',
  },
  vehicle: {
    name: 'Vehicule',
    type: TransactionType.EXPENSE,
    color: '#475569',
    icon: 'navigation',
  },
  sport: {
    name: 'Sport',
    type: TransactionType.EXPENSE,
    color: '#10B981',
    icon: 'activity',
  },
  software: {
    name: 'Logiciels',
    type: TransactionType.EXPENSE,
    color: '#6366F1',
    icon: 'monitor',
  },
  delivery_subscription: {
    name: 'Livraison',
    type: TransactionType.EXPENSE,
    color: '#F59E0B',
    icon: 'package',
  },
  ecommerce_subscription: {
    name: 'Shopping',
    type: TransactionType.EXPENSE,
    color: '#EC4899',
    icon: 'shopping-bag',
  },
  press: {
    name: 'Presse',
    type: TransactionType.EXPENSE,
    color: '#0F766E',
    icon: 'book-open',
  },
  education: {
    name: 'Education',
    type: TransactionType.EXPENSE,
    color: '#3B82F6',
    icon: 'book',
  },
  family: {
    name: 'Famille',
    type: TransactionType.EXPENSE,
    color: '#F43F5E',
    icon: 'users',
  },
  health: {
    name: 'Sante',
    type: TransactionType.EXPENSE,
    color: '#EC4899',
    icon: 'activity',
  },
  pets: {
    name: 'Animaux',
    type: TransactionType.EXPENSE,
    color: '#A16207',
    icon: 'heart',
  },
  credit: {
    name: 'Credit',
    type: TransactionType.EXPENSE,
    color: '#7C3AED',
    icon: 'credit-card',
  },
  unknown_subscription: {
    name: 'Abonnements',
    type: TransactionType.EXPENSE,
    color: '#8B5CF6',
    icon: 'repeat',
  },
  donation: {
    name: 'Dons',
    type: TransactionType.EXPENSE,
    color: '#E11D48',
    icon: 'heart',
  },
  salary: {
    name: 'Salaire',
    type: TransactionType.INCOME,
    color: '#16A34A',
    icon: 'dollar-sign',
  },
  bonus: {
    name: 'Prime',
    type: TransactionType.INCOME,
    color: '#10B981',
    icon: 'gift',
  },
  bank_transfer: {
    name: 'Banque',
    type: TransactionType.INCOME,
    color: '#334155',
    icon: 'briefcase',
  },
  refund: {
    name: 'Remboursements',
    type: TransactionType.INCOME,
    color: '#059669',
    icon: 'rotate-ccw',
  },
  allowance: {
    name: 'Aides sociales',
    type: TransactionType.INCOME,
    color: '#0D9488',
    icon: 'umbrella',
  },
  rental_income: {
    name: 'Revenus locatifs',
    type: TransactionType.INCOME,
    color: '#4B5563',
    icon: 'home',
  },
  sale: {
    name: 'Vente',
    type: TransactionType.INCOME,
    color: '#F59E0B',
    icon: 'tag',
  },
  dividends: {
    name: 'Investissements',
    type: TransactionType.INCOME,
    color: '#14B8A6',
    icon: 'trending-up',
  },
  bank_interest: {
    name: 'Epargne',
    type: TransactionType.INCOME,
    color: '#14B8A6',
    icon: 'target',
  },
  pension: {
    name: 'Pension',
    type: TransactionType.INCOME,
    color: '#64748B',
    icon: 'user',
  },
  compensation: {
    name: 'Indemnites',
    type: TransactionType.INCOME,
    color: '#0EA5E9',
    icon: 'briefcase',
  },
  self_employed: {
    name: 'Auto-entreprise',
    type: TransactionType.INCOME,
    color: '#2563EB',
    icon: 'tool',
  },
  freelance: {
    name: 'Freelance',
    type: TransactionType.INCOME,
    color: '#6366F1',
    icon: 'monitor',
  },
  family_help: {
    name: 'Famille',
    type: TransactionType.INCOME,
    color: '#F43F5E',
    icon: 'users',
  },
  other_income: {
    name: 'Autre revenu',
    type: TransactionType.INCOME,
    color: '#6B7280',
    icon: 'plus-circle',
  },
};

function uniqueCategories(categories: DefaultCategoryDefinition[]) {
  const seen = new Set<string>();

  return categories.filter((category) => {
    const key = `${category.type ?? 'ALL'}:${category.name.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export const DEFAULT_CATEGORIES: DefaultCategoryDefinition[] = uniqueCategories([
  ...CORE_DEFAULT_CATEGORIES,
  ...Object.values(SUGGESTION_CATEGORY_BY_KEY),
]);
