import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { categories } from "../../../data/categories";
import { situations } from "../../../data/situations";
import { themes } from "../../../data/themes";
import { PageHeader } from "../../../components/ui/PageHeader";
import { SectionCard } from "../../../components/ui/SectionCard";
import { Tag } from "../../../components/ui/Tag";

export function SituationsLibraryPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState("");
  const [theme, setTheme] = useState("");
  const [step, setStep] = useState("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return situations.filter((item) => {
      const matchesCategory = !category || item.categoryIds.includes(category as any);
      const matchesTheme = !theme || item.themeIds.includes(theme as any);
      const matchesStep = !step || item.pedagogicStep === step;
      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.objective.toLowerCase().includes(search.toLowerCase()) ||
        item.tags.join(" ").toLowerCase().includes(search.toLowerCase());

      return matchesCategory && matchesTheme && matchesStep && matchesSearch;
    });
  }, [category, theme, step, search]);

  return (
    <>
      <PageHeader
        title="Banque de situations"
        subtitle="Le référentiel donne le cadre, la banque donne les contenus, le générateur permet la production."
      />

      <div className="filters-row">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Toutes les catégories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>

        <select value={theme} onChange={(e) => setTheme(e.target.value)}>
          <option value="">Tous les thèmes</option>
          {themes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>

        <select value={step} onChange={(e) => setStep(e.target.value)}>
          <option value="">Toutes les étapes</option>
          <option>Je découvre</option>
          <option>Je m'exerce</option>
          <option>Je retranscris</option>
          <option>Je régule</option>
        </select>

        <input
          placeholder="Rechercher une situation"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid-2">
        {filtered.map((item) => (
          <SectionCard key={item.id} title={item.title}>
            <p><strong>Objectif :</strong> {item.objective}</p>
            <p><strong>Organisation :</strong> {item.setup}</p>
            <p><strong>Consignes :</strong> {item.instructions}</p>

            <p style={{ marginTop: 12 }}>
              <Link to={`/situations/${item.id}`} className="bcvb-secondary">
                Voir la fiche detail
              </Link>
            </p>

            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <button
                type="button"
                style={{
                  border: 0,
                  background: "#C8102E",
                  color: "#fff",
                  borderRadius: 10,
                  padding: "10px 12px",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
                onClick={() => navigate(`/generateur?situationId=${item.id}`)}
              >
                Ouvrir dans le générateur
              </button>
            </div>

            <div className="tag-list" style={{ marginTop: 12 }}>
              {item.tags.map((tag) => (
                <Tag key={tag} label={tag} />
              ))}
            </div>
          </SectionCard>
        ))}
      </div>
    </>
  );
}
