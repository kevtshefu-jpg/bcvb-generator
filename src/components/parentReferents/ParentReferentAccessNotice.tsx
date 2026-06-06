import {
  canAccessEditorialStudio,
  canEditPlanning,
  canEditSession,
  canViewInternalCoachComments,
  canViewPlayerEvaluations,
  canViewSensitivePlayerData,
} from "../../lib/permissions/parentReferentPermissions";

export function ParentReferentAccessNotice({ userRole }: { userRole?: string | null }) {
  const blocked = [
    { label: "Évaluations joueurs", allowed: canViewPlayerEvaluations(userRole) },
    { label: "Notes individuelles", allowed: canViewSensitivePlayerData(userRole) },
    { label: "Commentaires techniques internes", allowed: canViewInternalCoachComments(userRole) },
    { label: "Modification des séances", allowed: canEditSession(userRole) },
    { label: "Modification des planifications", allowed: canEditPlanning(userRole) },
    { label: "Studio éditorial documentaire", allowed: canAccessEditorialStudio(userRole) },
  ];

  return (
    <section className="parent-referent-access-notice">
      <div className="parent-referent-section__title">
        <span>Limites d’accès</span>
        <h2>Cadre sécurisé</h2>
      </div>
      <p>Cet espace ne donne pas accès aux évaluations, aux notes individuelles ni aux documents internes du staff.</p>
      <div className="parent-referent-access-columns">
        <article className="parent-referent-access-list parent-referent-access-list--allowed">
          <h3>Toujours accessible</h3>
          <ul>
            <li>Informations pratiques équipe</li>
            <li>Rendez-vous publics</li>
            <li>Documents parents publiés</li>
            <li>Messages validés</li>
            <li>Besoins logistiques</li>
          </ul>
        </article>
        <article className="parent-referent-access-list parent-referent-access-list--blocked">
          <h3>Jamais accessible</h3>
          <ul>
            <li>Évaluations joueurs</li>
            <li>Notes internes et données médicales</li>
            <li>Choix sportifs non communiqués</li>
            <li>Documents admin et brouillons club</li>
            <li>Studio éditorial et planifications modifiables</li>
          </ul>
        </article>
      </div>
      <div className="parent-referent-access-grid">
        {blocked.map((item) => (
          <article key={item.label} className={item.allowed ? "is-allowed" : "is-blocked"}>
            <strong>{item.allowed ? "Autorisé" : "Masqué"}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
