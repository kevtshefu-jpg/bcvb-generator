import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../features/auth/context/AuthContext";
import { buildDirectorSpaceModel } from "../../lib/directors/directorDashboard";
import { canViewDirectorSpace } from "../../lib/directors/directorPermissions";
import { DirectorDocumentQuality } from "./DirectorDocumentQuality";
import { DirectorDocumentsClub } from "./DirectorDocumentsClub";
import { DirectorOrganisationPanel } from "./DirectorOrganisationPanel";
import { DirectorPlanningOverview } from "./DirectorPlanningOverview";
import { DirectorSportDashboard } from "./DirectorSportDashboard";
import { DirectorStatusBadge } from "./DirectorStatusBadge";
import "../../styles/directors.css";

export function DirectorsSpacePage() {
  const { profile } = useAuth();
  const model = useMemo(() => buildDirectorSpaceModel(profile), [profile]);
  const authorized = canViewDirectorSpace(profile);

  if (!authorized) {
    return (
      <main className="directors-page">
        <section className="directors-hero">
          <p className="bcvb-eyebrow">Espace dirigeants</p>
          <h1>Accès réservé</h1>
          <span>Cet espace stratégique est réservé aux dirigeants autorisés, à l’admin et au responsable technique.</span>
        </section>
      </main>
    );
  }

  return (
    <main className="directors-page">
      <section className="directors-hero">
        <div>
          <p className="bcvb-eyebrow">Espaces dédiés</p>
          <h1>Espace dirigeants</h1>
          <span>Pilotage sportif, documentaire et organisationnel du BCVB.</span>
        </div>
        <div className="director-actions directors-hero__badges">
          <span className="director-readonly-badge">Lecture stratégique</span>
          <span className="director-readonly-badge">Accès sécurisé</span>
        </div>
      </section>

      <section className="director-kpi-grid director-kpi-grid--hero">
        {model.indicators.slice(0, 6).map((indicator) => (
          <article key={indicator.id} className={`director-kpi director-kpi--${indicator.status}`}>
            <span>{indicator.label}</span>
            <strong>{indicator.value}</strong>
            <p>{indicator.description}</p>
          </article>
        ))}
      </section>

      <section className="directors-grid directors-grid--blocks">
        {model.blocks.map((block) => (
          <article className="director-card director-block-card" key={block.id}>
            <div className="director-card__header">
              <div>
                <span>{block.title}</span>
                <h2>{block.whyFor}</h2>
              </div>
              <DirectorStatusBadge status={block.status === "Prioritaire" ? "critical" : block.status === "À valider" ? "warning" : "ok"} />
            </div>
            <p>{block.why}</p>
            <dl>
              <div><dt>Accès rapide</dt><dd>{block.quickAccess}</dd></div>
              <div><dt>Statut</dt><dd>{block.status}</dd></div>
              <div><dt>Action recommandée</dt><dd>{block.recommendedAction}</dd></div>
            </dl>
            <div className="director-mini-indicators">
              {block.indicators.slice(0, 3).map((indicator) => (
                <span key={indicator.id}>{indicator.label} : {indicator.value}</span>
              ))}
            </div>
            <Link to={block.quickAccess.startsWith("#") ? "/dirigeants" : block.quickAccess}>Ouvrir</Link>
          </article>
        ))}
      </section>

      <DirectorSportDashboard indicators={model.indicators} teams={model.teams} />
      <DirectorDocumentsClub documents={model.documents} />
      <DirectorPlanningOverview plannings={model.plannings} />
      <DirectorOrganisationPanel teams={model.teams} />
      <DirectorDocumentQuality documents={model.documents} comments={model.qualityComments} userRole={profile?.role} />
    </main>
  );
}

export default DirectorsSpacePage;
