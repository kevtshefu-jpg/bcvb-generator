import { categories } from '../../../data/categories';
import { PageHeader } from '../../../components/ui/PageHeader';
import { CategoryCard } from '../components/CategoryCard';

export function CategoriesPage() {
  return (
    <div className="bcvb-page-stack">
      <PageHeader title="Catégories" subtitle="Progressions et priorités par âge." />
      <div className="category-cards">
        {categories.map((category) => <CategoryCard key={category.id} category={category} />)}
      </div>
    </div>
  );
}
