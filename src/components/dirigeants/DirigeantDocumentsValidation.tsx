import { Link } from "react-router-dom";
import type { DirigeantDocumentSummary } from "../../types/dirigeants";
import { PlanningStatusBadge } from "../planning/PlanningStatusBadge";

export function DirigeantDocumentsValidation({ documents }: { documents: DirigeantDocumentSummary[] }) {
  const visibleDocuments = documents.filter((document) => document.status !== "draft");

  return (
    <section className="dirigeant-section">
      <div className="dirigeant-section__title">
        <span>Documents club</span>
        <h2>Officiels et validations</h2>
      </div>

      <div className="dirigeant-document-grid">
        {visibleDocuments.map((document) => (
          <article key={document.id} className="dirigeant-card dirigeant-validation-card">
            <div className="dirigeant-card__top">
              <span>{document.family}</span>
              <PlanningStatusBadge status={document.status} />
            </div>
            <h3>{document.title}</h3>
            <p>{document.category} · Score qualité {document.qualityScore}/100</p>
            {document.status === "published" ? (
              <strong className="dirigeant-official-badge">Document officiel BCVB</strong>
            ) : (
              <strong className="dirigeant-pending-badge">En validation</strong>
            )}
            <Link to={document.route}>Ouvrir bibliothèque</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
