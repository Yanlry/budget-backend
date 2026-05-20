"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpensesService = void 0;
const common_1 = require("@nestjs/common");
const recurring_expense_catalog_1 = require("./recurring-expense.catalog");
const recurring_income_catalog_1 = require("./recurring-income.catalog");
let ExpensesService = class ExpensesService {
    expenseSources = recurring_expense_catalog_1.recurringExpenseCatalog.map((entry) => ({
        id: entry.id,
        label: entry.label,
        keywords: entry.keywords,
        category: entry.category,
        type: 'expense',
    }));
    incomeSources = recurring_income_catalog_1.recurringIncomeCatalog.map((entry) => ({
        id: entry.id,
        label: entry.label,
        keywords: entry.keywords,
        category: entry.category,
        type: 'income',
    }));
    getLabelSuggestions(query, type) {
        try {
            const safeType = this.normalizeType(type);
            const normalizedQuery = this.normalizeText(query);
            if (!safeType) {
                console.log('[expenses][label-suggestions] type invalide, retour []', type ?? 'undefined');
                return [];
            }
            if (normalizedQuery.length < 2) {
                return [];
            }
            const source = safeType === 'expense' ? this.expenseSources : this.incomeSources;
            const scored = [];
            source.forEach((entry) => {
                const score = this.computeScore(normalizedQuery, entry);
                if (score <= 0) {
                    return;
                }
                scored.push({
                    id: entry.id,
                    label: entry.label,
                    type: entry.type,
                    category: entry.category,
                    score,
                });
            });
            const topSuggestions = scored
                .sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                return a.label.localeCompare(b.label, 'fr');
            })
                .slice(0, 5);
            console.log(`[expenses][label-suggestions] type=${safeType} queryLength=${normalizedQuery.length} results=${topSuggestions.length}`);
            return topSuggestions;
        }
        catch (error) {
            console.error('[expenses][label-suggestions] erreur', error);
            return [];
        }
    }
    normalizeType(type) {
        if (!type) {
            return null;
        }
        const normalized = type.trim().toLowerCase();
        if (normalized === 'expense' || normalized === 'income') {
            return normalized;
        }
        return null;
    }
    normalizeText(value) {
        if (!value) {
            return '';
        }
        return value
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    computeScore(query, source) {
        const label = this.normalizeText(source.label);
        const keywords = source.keywords.map((keyword) => this.normalizeText(keyword));
        if (label.startsWith(query)) {
            return 100;
        }
        if (keywords.some((keyword) => keyword.startsWith(query))) {
            return 85;
        }
        if (label.includes(query)) {
            return 70;
        }
        if (keywords.some((keyword) => keyword.includes(query))) {
            return 55;
        }
        return 0;
    }
};
exports.ExpensesService = ExpensesService;
exports.ExpensesService = ExpensesService = __decorate([
    (0, common_1.Injectable)()
], ExpensesService);
//# sourceMappingURL=expenses.service.js.map