import { ExpensesService } from './expenses.service';
export declare class ExpensesController {
    private readonly expensesService;
    constructor(expensesService: ExpensesService);
    getLabelSuggestions(query?: string, type?: string): import("./expenses.service").LabelSuggestion[];
}
