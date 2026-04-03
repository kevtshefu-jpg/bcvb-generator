import { themes } from "../../../data/themes";
import { PageHeader } from "../../../components/ui/PageHeader";
import { SectionCard } from "../../../components/ui/SectionCard";
import { Link } from "react-router-dom";

export function ThemesPage() {
  return (
    <>
      <PageHeader
        title="Thèmes de formation"
        subtitle="Les grands piliers techniques, pédagogiques et culturels du référentiel BCVB."
      />

      <div className="grid-3">
        {themes.map((theme) => (
          <SectionCard key={theme.id} title={theme.title}>
            <p>{theme.summary}</p>
            <Link to={`/themes/${theme.id}`} style={{ color: "#9B0B22", fontWeight: 800 }}>
              Ouvrir le thème
            </Link>
          </SectionCard>
        ))}
      </div>
    </>
  );
}
