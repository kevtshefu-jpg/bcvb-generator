import type { ButtonHTMLAttributes, ReactNode } from "react";

export function PageShell({
  children,
  compact = false,
  variant,
}: {
  children: ReactNode;
  compact?: boolean;
  variant?: "standard" | "reading" | "wide" | "fullBleed";
}) {
  const resolvedVariant = variant ?? (compact ? "reading" : "standard");

  return (
    <main className={`bcvb-page-shell bcvb-page-shell--${resolvedVariant}`}>
      {children}
    </main>
  );
}

export function ActionCard({
  title,
  description,
  to,
  action,
  tone = "neutral",
}: {
  title: string;
  description?: string;
  to?: string;
  action?: ReactNode;
  tone?: "neutral" | "primary" | "danger";
}) {
  const content = (
    <>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action ? <span>{action}</span> : null}
    </>
  );

  if (to) {
    return (
      <a className={`bcvb-action-card bcvb-action-card--${tone}`} href={to}>
        {content}
      </a>
    );
  }

  return <article className={`bcvb-action-card bcvb-action-card--${tone}`}>{content}</article>;
}

export function FeatureCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <article className="bcvb-feature-card">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {children}
    </article>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <article className="bcvb-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <p>{hint}</p> : null}
    </article>
  );
}

export function AdminOnlyPanel({
  title = "Détails techniques",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <details className="bcvb-admin-only-panel">
      <summary>{title}</summary>
      <div>{children}</div>
    </details>
  );
}

export function LoadingState({
  title = "Chargement en cours",
  description = "Les informations arrivent dans un instant.",
  skeleton = false,
}: {
  title?: ReactNode;
  description?: ReactNode;
  skeleton?: boolean;
}) {
  return (
    <div className="bcvb-feedback-state bcvb-feedback-state--loading" role="status" aria-live="polite" aria-busy="true">
      <strong>{title}</strong>
      <p>{description}</p>
      {skeleton ? <span className="bcvb-feedback-state__skeleton" aria-hidden="true" /> : null}
    </div>
  );
}

export function RetryAction({ children = "Réessayer", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props}>{children}</button>;
}

export function ErrorState({
  title = "Action non finalisée",
  description,
  action,
  technicalDetail,
  isAdmin = false,
}: {
  title?: ReactNode;
  description: string;
  action?: ReactNode;
  technicalDetail?: ReactNode;
  isAdmin?: boolean;
}) {
  return (
    <div className="bcvb-feedback-state bcvb-feedback-state--error" role="alert">
      <strong>{title}</strong>
      <p>{description}</p>
      {action ? <div className="bcvb-feedback-state__action">{action}</div> : null}
      {technicalDetail && isAdmin ? <AdminOnlyPanel title="Voir le détail technique">{technicalDetail}</AdminOnlyPanel> : null}
    </div>
  );
}

export function EmptyState({
  title = "Aucune donnée disponible",
  description,
  action,
  cause = "no_data",
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  cause?: "no_data" | "unauthorized" | "no_results" | "not_loaded";
}) {
  const defaultDescriptions = {
    no_data: "Aucune donnée n’a encore été créée.",
    unauthorized: "Aucune donnée n’est disponible pour votre rôle.",
    no_results: "Aucune donnée ne correspond aux filtres actuels.",
    not_loaded: "Les données n’ont pas encore été chargées.",
  };

  return (
    <div className="bcvb-feedback-state bcvb-feedback-state--empty" role="status" data-empty-cause={cause}>
      <strong>{title}</strong>
      <p>{description ?? defaultDescriptions[cause]}</p>
      {action ? <div className="bcvb-feedback-state__action">{action}</div> : null}
    </div>
  );
}

export function AccessSuspendedState({ action }: { action?: ReactNode }) {
  return (
    <main className="bcvb-page-loading" role="alert">
      <div className="bcvb-loading-card bcvb-feedback-state--suspended">
        <p className="bcvb-eyebrow">Accès suspendu</p>
        <h1>Profil non vérifié</h1>
        <p>Votre profil n’a pas pu être vérifié. L’accès est suspendu par sécurité.</p>
        <p>Contactez un responsable du club si vous pensez qu’il s’agit d’une erreur.</p>
        {action ? <div className="bcvb-feedback-state__action">{action}</div> : null}
      </div>
    </main>
  );
}

export function SuccessFeedback({
  title = "Action réussie",
  description,
}: {
  title?: string;
  description: string;
}) {
  return (
    <div className="bcvb-feedback-state bcvb-feedback-state--success" role="status">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

const quickActionsByRole: Record<string, Array<{ title: string; description: string; to: string }>> = {
  admin: [
    { title: "Gérer les inscriptions", description: "Valider les demandes et envoyer l’accès.", to: "/admin/inscriptions" },
    { title: "Gérer les membres", description: "Rôles, statuts et accès utilisateurs.", to: "/admin/membres" },
    { title: "Consulter la bibliothèque", description: "Documents prêts à utiliser.", to: "/bibliotheque" },
    { title: "Ouvrir les diagnostics", description: "Contrôles admin repliés.", to: "/admin/inscriptions" },
  ],
  responsable_technique: [
    { title: "Documents sportifs", description: "Consulter les ressources utiles.", to: "/bibliotheque" },
    { title: "Gérer les équipes", description: "Effectifs, staffs et suivi sportif.", to: "/club/equipes" },
    { title: "Préparer un document", description: "Créer un brouillon structuré.", to: "/admin/studio-editorial" },
    { title: "Voir les alertes", description: "Points sportifs à surveiller.", to: "/dirigeants" },
  ],
  coach: [
    { title: "Documents utiles", description: "Retrouver les contenus club.", to: "/bibliotheque" },
    { title: "Voir mes équipes", description: "Suivre les groupes et objectifs.", to: "/coach/equipes" },
    { title: "Préparer une séance", description: "Construire une fiche terrain.", to: "/coach/seances" },
    { title: "Ouvrir les tutoriels", description: "Démarrer le parcours guidé.", to: "/tutoriels" },
  ],
  parent_referent: [
    { title: "Informations utiles", description: "Voir l’espace équipe.", to: "/parents-referents" },
    { title: "Documents autorisés", description: "Consulter les ressources partagées.", to: "/documents-utiles" },
    { title: "Trouver de l’aide", description: "Questions fréquentes et tutoriels.", to: "/faq" },
  ],
  team_staff: [
    { title: "Informations utiles", description: "Voir l’espace équipe.", to: "/parents-referents" },
    { title: "Documents autorisés", description: "Consulter les ressources partagées.", to: "/documents-utiles" },
    { title: "Présences utiles", description: "Suivre l’organisation d’équipe.", to: "/parents-referents/presences" },
  ],
  member: [
    { title: "Documents disponibles", description: "Consulter les ressources autorisées.", to: "/bibliotheque" },
    { title: "Trouver de l’aide", description: "FAQ et tutoriels.", to: "/faq" },
    { title: "Informations club", description: "Revenir aux contenus utiles.", to: "/" },
  ],
};

function normalizeQuickRole(role?: string | null) {
  if (role === "membre") return "member";
  if (role === "parent") return "member";
  if (role === "joueur") return "member";
  return role || "member";
}

export function RoleBasedQuickActions({ role }: { role?: string | null }) {
  const normalizedRole = normalizeQuickRole(role);
  const actions = quickActionsByRole[normalizedRole] || quickActionsByRole.member;

  return (
    <section className="bcvb-role-quick-actions" aria-label="Actions rapides selon le rôle">
      <div>
        <p className="bcvb-section-card__eyebrow">Aujourd’hui</p>
        <h2>Que voulez-vous faire ?</h2>
      </div>
      <div className="bcvb-role-quick-actions__grid">
        {actions.slice(0, 5).map((action, index) => (
          <ActionCard
            key={action.to}
            title={action.title}
            description={action.description}
            to={action.to}
            tone={index === 0 ? "primary" : "neutral"}
          />
        ))}
      </div>
    </section>
  );
}

export function CollapsibleSection({
  title,
  description,
  children,
  defaultOpen = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="bcvb-collapsible-section" open={defaultOpen}>
      <summary>
        <span>{title}</span>
        {description ? <small>{description}</small> : null}
      </summary>
      <div className="bcvb-collapsible-section__body">{children}</div>
    </details>
  );
}
