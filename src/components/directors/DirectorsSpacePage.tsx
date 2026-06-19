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
  const priorityBlock = model.blocks.find((block) => block.status === "Prioritaire") ?? model.blocks[0];
  const secondaryBlocks = model.blocks.filter((block) => block.id !== priorityBlock?.id);

  if (!authorized) {
    return (
      <main className="directors-page bcvb-premium-page">
        <section className="directors-hero bcvb-premium-hero">
          <p className="bcvb-eyebrow bcvb-premium-hero__eyebrow">Espace dirigeants</p>
          <h1 className="bcvb-premium-hero__title">Accès réservé</h1>
          <span className="bcvb-premium-hero__text">Cet espace stratégique est réservé aux dirigeants autorisés, à l’admin et au responsable technique.</span>
        </section>
      </main>
    );
  }

  return (
    <main className="directors-page bcvb-premium-page">
      <section className="directors-hero bcvb-premium-hero">
        <div>
          <p className="bcvb-eyebrow bcvb-premium-hero__eyebrow">Espaces dédiés</p>
          <h1 className="bcvb-premium-hero__title">Espace dirigeants</h1>
          <span className="bcvb-premium-hero__text">Pilotage sportif, documentaire et organisationnel du BCVB.</span>
        </div>
        <div className="director-actions directors-hero__badges">
          <span className="director-readonly-badge">Lecture stratégique</span>
          <span className="director-readonly-badge">Accès sécurisé</span>
        </div>
      </section>

      {priorityBlock && (
        <section className="bcvb-premium-card bcvb-premium-card--priority premium-pilotage-priority bcvb-card-safe">
          <div>
            <p className="bcvb-premium-card__eyebrow bcvb-tag-safe">Priorité dirigeants</p>
            <h2 className="bcvb-premium-card__title bcvb-text-clamp-2">{priorityBlock.title}</h2>
            <p className="bcvb-premium-card__text bcvb-text-clamp-3">{priorityBlock.why}</p>
            <ul className="bcvb-premium-card__meta bcvb-scroll-row">
              <li className="bcvb-badge-safe">{priorityBlock.whyFor}</li>
              <li className="bcvb-status-safe">{priorityBlock.status}</li>
            </ul>
          </div>
          <div className="bcvb-premium-actions bcvb-action-row-safe">
            <Link className="bcvb-premium-button bcvb-premium-button--primary" to={priorityBlock.quickAccess.startsWith("#") ? "/dirigeants" : priorityBlock.quickAccess}>
              Ouvrir la priorité
            </Link>
            <span className="bcvb-premium-status bcvb-premium-status--critical bcvb-status-safe">{priorityBlock.recommendedAction}</span>
          </div>
        </section>
      )}

      <section className="director-kpi-grid director-kpi-grid--hero bcvb-premium-grid bcvb-premium-grid--3 bcvb-grid-safe">
        {model.indicators.slice(0, 6).map((indicator) => (
          <article key={indicator.id} className={`director-kpi director-kpi--${indicator.status} bcvb-premium-kpi bcvb-card-safe`}>
            <span className="bcvb-premium-kpi__label bcvb-text-clamp-2">{indicator.label}</span>
            <strong className="bcvb-premium-kpi__value">{indicator.value}</strong>
            <p className="bcvb-text-clamp-3">{indicator.description}</p>
          </article>
        ))}
      </section>

      <section className="directors-grid directors-grid--blocks bcvb-premium-grid bcvb-premium-grid--3 bcvb-grid-safe">
        {secondaryBlocks.map((block) => (
          <article className="director-card director-block-card bcvb-premium-card bcvb-card-safe" key={block.id}>
            <div className="director-card__header">
              <div>
                <span className="bcvb-premium-card__eyebrow bcvb-tag-safe">{block.title}</span>
                <h2 className="bcvb-premium-card__title bcvb-text-clamp-2">{block.whyFor}</h2>
              </div>
              <DirectorStatusBadge status={block.status === "Prioritaire" ? "critical" : block.status === "À valider" ? "warning" : "ok"} />
            </div>
            <p className="bcvb-premium-card__text bcvb-text-clamp-3">{block.why}</p>
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
