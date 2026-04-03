import { useParams } from "react-router-dom";
import { themes } from "../../../data/themes";
import { situations } from "../../../data/situations";
import { PageHeader } from "../../../components/ui/PageHeader";
import { SectionCard } from "../../../components/ui/SectionCard";
import { Tag } from "../../../components/ui/Tag";

export function ThemeDetailPage() {
  const { themeId } = useParams();
  const theme = themes.find((item) => item.id === themeId);

  if (!theme) {
    return <div>Thème introuvable.</div>;
  }

  const relatedSituations = situations.filter((s) => s.themeIds.includes(theme.id));

  return (
    <>
      <PageHeader title={theme.title} subtitle={theme.summary} />

      <div className="grid-2">
        <SectionCard title="Piliers">
          <div className="tag-list">
            {theme.pillars.map((item) => (
              <Tag key={item} label={item} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Focus coach">
          <ul className="list-clean">
            {theme.coachingFocus.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <div style={{ marginTop: 24 }}>
        <SectionCard title="Situations liées">
          <div className="grid-2">
            {relatedSituations.map((situation) => (
              <div key={situation.id} style={{ border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
                <strong>{situation.title}</strong>
                <p>{situation.objective}</p>
                <div className="tag-list">
                  {situation.tags.slice(0, 4).map((tag) => (
                    <Tag key={tag} label={tag} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
