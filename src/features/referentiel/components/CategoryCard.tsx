import type { CategoryRecord } from '../../../types/referentiel';
import { SectionCard } from '../../../components/ui/SectionCard';

interface Props {
  category: CategoryRecord;
}

export function CategoryCard({ category }: Props) {
  return (
    <SectionCard title={category.title}>
      <p>{category.finality}</p>
      <a className="bcvb-link" href={`#/categories/${category.id}`}>Voir le détail</a>
    </SectionCard>
  );
}
