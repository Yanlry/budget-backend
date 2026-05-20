export type OptimizableLevel = 'high' | 'medium' | 'low' | 'none';
export type SavingMode = 'compare' | 'renegotiate' | 'cancel_if_unused' | 'audit' | 'not_recommended';
export type RecurringExpenseRule = {
    id: string;
    category: string;
    label: string;
    keywords: string[];
    optimizable: OptimizableLevel;
    savingMode: SavingMode;
    monthlyWarningFrom?: number;
    targetMonthlyMax?: number;
    advice: string;
};
export declare const recurringExpenseCatalog: RecurringExpenseRule[];
