import { forwardRef } from "react";
import { CourtCanvas } from "./CourtCanvas";
import type { BCVBSession } from "../types/session";

interface Props {
  session: BCVBSession;
}

function renderList(items: string[]) {
  if (!items.length) return <p className="muted">Non renseigné</p>;

  return (
    <ul className="premium-list">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

export const SessionCard = forwardRef<HTMLDivElement, Props>(function SessionCard(
  { session },
  ref
) {
  const primaryImage =
    session.sourceImages.find((image) => image.isPrimary) || session.sourceImages[0] || null;

  return (
    <div className="session-card-premium" ref={ref}>
      <div className="session-card-top">
        <div>
          <div className="brand-kicker">BCVB</div>
          <h2>{session.title}</h2>
          <p className="session-meta-line">
            {session.category} • {session.durationMin} min • {session.theme}
          </p>
        </div>
        <div className="step-badge-premium">{session.step}</div>
      </div>

      <div className="session-tags-row">
        {(session.axes.length ? session.axes : ["intensité", "agressivité", "maîtrise", "jeu"]).map((axis) => (
          <span key={axis} className="tag-pill">
            {axis}
          </span>
        ))}
      </div>

      {primaryImage ? (
        <section className="preview-block">
          <div className="preview-block-title">Visuel source</div>
          <div className="source-preview-premium">
            <img src={primaryImage.dataUrl} alt={primaryImage.name} />
          </div>
        </section>
      ) : null}

      <section className="preview-block">
        <div className="preview-block-title">Diagramme BCVB</div>
        <div className="embedded-diagram-premium">
          <CourtCanvas
            diagram={session.diagram}
            selectedElementId={null}
            selectedActionId={null}
            actionCreationType=""
            linkMode={false}
            onSelectElement={() => {}}
            onSelectAction={() => {}}
            onCreateAction={() => {}}
            onChange={() => {}}
          />
        </div>
      </section>

      <div className="session-card-grid">
        <section className="info-card">
          <h3>Objectif</h3>
          <p>{session.objective || "Non renseigné"}</p>
        </section>

        <section className="info-card">
          <h3>Intentions</h3>
          {renderList(session.intentions)}
        </section>

        <section className="info-card">
          <h3>Organisation</h3>
          <p>{session.organization || "Non renseigné"}</p>
        </section>

        <section className="info-card">
          <h3>Matériel</h3>
          {renderList(session.equipment)}
        </section>

        <section className="info-card">
          <h3>Déroulement</h3>
          {renderList(session.setup)}
        </section>

        <section className="info-card">
          <h3>Consignes / coaching</h3>
          {renderList(session.instructions)}
        </section>

        <section className="info-card">
          <h3>Variables</h3>
          {renderList(session.variables)}
        </section>

        <section className="info-card">
          <h3>Critères de réussite</h3>
          {renderList(session.successCriteria)}
        </section>
      </div>

      <section className="club-identity-box">
        <h3>Identité BCVB</h3>
        <p>{session.philosophy}</p>
      </section>

      <div className="session-card-footer">
        <span>ID : {session.id}</span>
        <span>Maj : {new Date(session.updatedAt).toLocaleString()}</span>
      </div>
    </div>
  );
});
