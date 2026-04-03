import { categories } from '../../../data/categories';
import { themes } from '../../../data/themes';

interface Props {
  category: string;
  theme: string;
  query: string;
  onChange: (patch: Partial<{ category: string; theme: string; query: string }>) => void;
}

export function SituationFilters({ category, theme, query, onChange }: Props) {
  return (
    <div className="filters-bar">
      <select className="bcvb-input" value={category} onChange={(e) => onChange({ category: e.target.value })}>
        <option value="">Toutes catégories</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
      </select>

      <select className="bcvb-input" value={theme} onChange={(e) => onChange({ theme: e.target.value })}>
        <option value="">Tous thèmes</option>
        {themes.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
      </select>

      <input className="bcvb-input" value={query} onChange={(e) => onChange({ query: e.target.value })} placeholder="Rechercher..." />
    </div>
  );
}
