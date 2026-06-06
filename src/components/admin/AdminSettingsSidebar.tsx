export type AdminSettingsSection =
  | "roles"
  | "seasons"
  | "standards"
  | "referentials"
  | "exports"
  | "security";

type AdminSettingsSidebarProps = {
  activeSection: AdminSettingsSection;
  onChange: (section: AdminSettingsSection) => void;
  metrics: Array<{ label: string; value: string }>;
};

const sections: Array<{ id: AdminSettingsSection; label: string; text: string; priority: string }> = [
  {
    id: "roles",
    label: "Rôles & permissions",
    text: "Qui peut faire quoi dans la plateforme.",
    priority: "Très haute",
  },
  {
    id: "seasons",
    label: "Saisons sportives",
    text: "Saison active, archives et structuration.",
    priority: "Haute",
  },
  {
    id: "standards",
    label: "Standards documentaires",
    text: "Scores, blocs, tableaux, situations et exports.",
    priority: "Haute",
  },
  {
    id: "referentials",
    label: "Référentiels",
    text: "BCVB, FFBB, FIBA, Europe, USA, Canada.",
    priority: "Haute",
  },
  {
    id: "exports",
    label: "Exports",
    text: "PDF, source, marges, logo et pied de page.",
    priority: "Moyenne",
  },
  {
    id: "security",
    label: "Sécurité plateforme",
    text: "Garde-fous admin, Supabase et périmètres.",
    priority: "Critique",
  },
];

export default function AdminSettingsSidebar({ activeSection, onChange, metrics }: AdminSettingsSidebarProps) {
  return (
    <aside className="admin-settings-sidebar">
      <div className="admin-settings-sidebar__metrics">
        {metrics.map((metric) => (
          <article key={metric.label}>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </article>
        ))}
      </div>

      <nav className="admin-settings-sidebar__nav" aria-label="Sections administration">
        {sections.map((section) => (
          <button
            type="button"
            key={section.id}
            className={
              activeSection === section.id
                ? "admin-settings-sidebar__button admin-settings-sidebar__button--active"
                : "admin-settings-sidebar__button"
            }
            onClick={() => onChange(section.id)}
          >
            <span>{section.priority}</span>
            <strong>{section.label}</strong>
            <em>{section.text}</em>
          </button>
        ))}
      </nav>
    </aside>
  );
}
