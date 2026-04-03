import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../../../components/ui/PageHeader";
import { SectionCard } from "../../../components/ui/SectionCard";
import { Tag } from "../../../components/ui/Tag";
import { situations } from "../../../data/situations";

export function SituationDetailPage() {
  const { situationId } = useParams();
  const situation = situations.find((item) => item.id === situationId);

  if (!situation) {
    return (
      <>
        <PageHeader title="Situation introuvable" subtitle="Verifiez le lien ou retournez a la bibliotheque." />
        <Link to="/situations" className="bcvb-secondary">Retour aux situations</Link>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={situation.title}
        subtitle={`${situation.pedagogicStep} • ${situation.level} • ${situation.durationMin} min`}
      />

      <div className="grid-2">
        <SectionCard title="Objectif">
          <p>{situation.objective}</p>
        </SectionCard>

        <SectionCard title="Organisation">
          <p>{situation.setup}</p>
        </SectionCard>

        <SectionCard title="Consignes">
          <p>{situation.instructions}</p>
        </SectionCard>

        <SectionCard title="Materiel">
          <ul className="list-clean">
            {situation.materials.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Criteres de reussite">
          <ul className="list-clean">
            {situation.successCriteria.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Variables et coaching">
          <h4>Variables</h4>
          <ul className="list-clean">
            {situation.variables.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h4 style={{ marginTop: 12 }}>Points coaching</h4>
          <ul className="list-clean">
            {situation.coachingPoints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <div className="tag-list" style={{ marginTop: 14 }}>
        {situation.tags.map((tag) => (
          <Tag key={tag} label={tag} />
        ))}
      </div>
    </>
  );
}
