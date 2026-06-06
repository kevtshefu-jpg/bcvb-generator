const tabs = [
  "Vue d’ensemble",
  "Effectif",
  "Staff",
  "Objectifs",
  "Séances",
  "Planification",
  "Présences",
  "Évaluations",
  "Documents",
  "Historique",
  "Exports",
];

export function TeamTabs({
  active,
  onChange,
}: {
  active: string;
  onChange: (tab: string) => void;
}) {
  return (
    <nav className="team-tabs" aria-label="Navigation fiche équipe">
      {tabs.map((tab) => (
        <button key={tab} type="button" className={active === tab ? "is-active" : ""} onClick={() => onChange(tab)}>
          {tab}
        </button>
      ))}
    </nav>
  );
}
