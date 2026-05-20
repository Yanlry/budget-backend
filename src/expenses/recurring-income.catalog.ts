export type RecurringIncomeRule = {
  id: string;
  label: string;
  keywords: string[];
  category: string;
};

export const recurringIncomeCatalog: RecurringIncomeRule[] = [
  {
    id: 'income_salary',
    label: 'Salaire',
    keywords: ['salaire', 'paie', 'paye', 'payroll', 'remuneration'],
    category: 'salary',
  },
  {
    id: 'income_bonus',
    label: 'Prime',
    keywords: ['prime', 'bonus', 'prime exceptionnelle'],
    category: 'bonus',
  },
  {
    id: 'income_bank_transfer',
    label: 'Virement reçu',
    keywords: ['virement', 'virement recu', 'transfer', 'versement'],
    category: 'bank_transfer',
  },
  {
    id: 'income_refund',
    label: 'Remboursement',
    keywords: ['remboursement', 'rembourse', 'refund', 'secu', 'mutuelle'],
    category: 'refund',
  },
  {
    id: 'income_caf',
    label: 'Allocations / CAF',
    keywords: ['caf', 'allocations', 'allocation', 'apl', 'rsa', 'prime activite'],
    category: 'allowance',
  },
  {
    id: 'income_rent',
    label: 'Revenus locatifs',
    keywords: ['revenu locatif', 'loyer recu', 'location', 'airbnb'],
    category: 'rental_income',
  },
  {
    id: 'income_sale',
    label: "Vente d'objet",
    keywords: ['vente', 'leboncoin', 'vinted', 'objet'],
    category: 'sale',
  },
  {
    id: 'income_dividends',
    label: 'Dividendes',
    keywords: ['dividende', 'dividendes', 'actions'],
    category: 'dividends',
  },
  {
    id: 'income_bank_interest',
    label: 'Intérêts bancaires',
    keywords: ['interets', 'interet', 'livret', 'epargne', 'interets bancaires'],
    category: 'bank_interest',
  },
  {
    id: 'income_pension',
    label: 'Pension',
    keywords: ['pension', 'retraite', 'pension alimentaire'],
    category: 'pension',
  },
  {
    id: 'income_compensation',
    label: 'Indemnités',
    keywords: ['indemnites', 'indemnite', 'chomage', 'cpam', 'ij'],
    category: 'compensation',
  },
  {
    id: 'income_self_employed',
    label: 'Auto-entreprise',
    keywords: ['auto entrepreneur', 'micro entreprise', 'micro-entreprise', 'urssaf'],
    category: 'self_employed',
  },
  {
    id: 'income_freelance',
    label: 'Freelance',
    keywords: ['freelance', 'mission', 'prestation', 'facture'],
    category: 'freelance',
  },
  {
    id: 'income_family_help',
    label: 'Aide familiale',
    keywords: ['aide familiale', 'famille', 'aide parent', 'don familial'],
    category: 'family_help',
  },
  {
    id: 'income_other',
    label: 'Autre revenu',
    keywords: ['autre revenu', 'autres revenus', 'divers'],
    category: 'other_income',
  },
];
