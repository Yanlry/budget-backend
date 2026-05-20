import { Injectable } from '@nestjs/common';
import { recurringExpenseCatalog } from './recurring-expense.catalog';
import { recurringIncomeCatalog } from './recurring-income.catalog';

type SuggestionType = 'expense' | 'income';

type SuggestionSource = {
  id: string;
  label: string;
  keywords: string[];
  category?: string;
  type: SuggestionType;
};

export type LabelSuggestion = {
  id: string;
  label: string;
  type: SuggestionType;
  category?: string;
  score: number;
};

@Injectable()
export class ExpensesService {
  private readonly expenseSources: SuggestionSource[] = recurringExpenseCatalog.map(
    (entry) => ({
      id: entry.id,
      label: entry.label,
      keywords: entry.keywords,
      category: entry.category,
      type: 'expense',
    }),
  );

  private readonly incomeSources: SuggestionSource[] = recurringIncomeCatalog.map((entry) => ({
    id: entry.id,
    label: entry.label,
    keywords: entry.keywords,
    category: entry.category,
    type: 'income',
  }));

  getLabelSuggestions(
    query: string | undefined,
    type: string | undefined,
  ): LabelSuggestion[] {
    try {
      const safeType = this.normalizeType(type);
      const normalizedQuery = this.normalizeText(query);

      if (!safeType) {
        console.log(
          '[expenses][label-suggestions] type invalide, retour []',
          type ?? 'undefined',
        );
        return [];
      }

      if (normalizedQuery.length < 2) {
        return [];
      }

      const source = safeType === 'expense' ? this.expenseSources : this.incomeSources;
      const scored: LabelSuggestion[] = [];

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

      console.log(
        `[expenses][label-suggestions] type=${safeType} queryLength=${normalizedQuery.length} results=${topSuggestions.length}`,
      );

      return topSuggestions;
    } catch (error) {
      console.error('[expenses][label-suggestions] erreur', error);
      return [];
    }
  }

  private normalizeType(type: string | undefined): SuggestionType | null {
    if (!type) {
      return null;
    }

    const normalized = type.trim().toLowerCase();
    if (normalized === 'expense' || normalized === 'income') {
      return normalized;
    }

    return null;
  }

  private normalizeText(value: string | undefined): string {
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

  private computeScore(query: string, source: SuggestionSource): number {
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
}
