import type { SituationRecord } from '../../../types/referentiel';

export interface SituationFilterInput {
  category?: string;
  theme?: string;
  query?: string;
}

export function filterSituations(items: SituationRecord[], input: SituationFilterInput): SituationRecord[] {
  const query = (input.query ?? '').trim().toLowerCase();
  return items.filter((item) => {
    const categoryOk = !input.category || item.categoryIds.includes(input.category as any);
    const themeOk = !input.theme || item.themeIds.includes(input.theme as any);
    const queryOk = !query || `${item.title} ${item.objective} ${item.tags.join(' ')}`.toLowerCase().includes(query);
    return categoryOk && themeOk && queryOk;
  });
}
