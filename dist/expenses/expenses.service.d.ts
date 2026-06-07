type SuggestionType = 'expense' | 'income';
export type LabelSuggestion = {
    id: string;
    label: string;
    type: SuggestionType;
    category?: string;
    categoryName?: string;
    categoryColor?: string;
    categoryIcon?: string;
    score: number;
};
export declare class ExpensesService {
    private readonly expenseSources;
    private readonly incomeSources;
    getLabelSuggestions(query: string | undefined, type: string | undefined): LabelSuggestion[];
    private normalizeType;
    private normalizeText;
    private computeScore;
}
export {};
