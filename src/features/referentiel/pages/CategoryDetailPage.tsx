import { useParams } from "react-router-dom";
import { categories } from "../../../data/categories";
import { PageHeader } from "../../../components/ui/PageHeader";
import { SectionCard } from "../../../components/ui/SectionCard";
import { Tag } from "../../../components/ui/Tag";

export function CategoryDetailPage() {
  const { categoryId } = useParams();
  const category = categories.find((item) => item.id === categoryId);

  if (!category) {
    return <div>Catégorie introuvable.</div>;
  }

  return (
    <>
      <PageHeader title={category.title} subtitle={category.finality} />

      <div className="grid-2">
        <SectionCard title="Profil du joueur à former">
          <p>{category.profile}</p>
        </SectionCard>

        <SectionCard title="Passerelle suivante">
          <p>{category.nextStep}</p>
        </SectionCard>

        <SectionCard title="Intentions prioritaires">
          <ul className="list-clean">
            {category.priorities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Attendus offensifs">
          <ul className="list-clean">
            {category.offensiveTargets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Attendus défensifs">
          <ul className="list-clean">
            {category.defensiveTargets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Repères coach">
          <div className="tag-list">
            {category.coachingPoints.map((item) => (
              <Tag key={item} label={item} />
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
