import type { DirectorDocumentView, DirectorSpaceModel } from "../../types/directors";
import { canRequestCorrection, canValidateDocument } from "../../lib/directors/directorPermissions";
import { DirectorStatusBadge } from "./DirectorStatusBadge";

export function DirectorDocumentQuality({
  documents,
  comments,
  userRole,
}: {
  documents: DirectorDocumentView[];
  comments: DirectorSpaceModel["qualityComments"];
  userRole?: string | null;
}) {
  const averageScore = documents.length
    ? Math.round(documents.reduce((sum, document) => sum + (document.qualityScore || 0), 0) / documents.length)
    : 0;
  const statusCounts = documents.reduce<Record<string, number>>((counts, document) => ({
    ...counts,
    [document.status]: (counts[document.status] || 0) + 1,
  }), {});
  const canValidate = canValidateDocument(userRole);
  const canCorrect = canRequestCorrection(userRole);
  const canOpenEditorialStudio = userRole === "admin";

  return (
    <section className="director-card" id="directors-quality">
      <div className="director-card__header">
        <div>
          <span>Qualité documentaire</span>
          <h2>Documents publiables ou à corriger</h2>
        </div>
        <strong className="director-quality-score">{averageScore}/100</strong>
      </div>

      <div className="director-kpi-grid">
        <article className="director-kpi director-kpi--ok"><span>Documents publiés</span><strong>{statusCounts.published || 0}</strong><p>Validés et consultables.</p></article>
        <article className="director-kpi director-kpi--warning"><span>À valider</span><strong>{statusCounts.pending_validation || 0}</strong><p>À traiter en commission.</p></article>
        <article className="director-kpi director-kpi--critical"><span>À corriger</span><strong>{statusCounts.to_correct || 0}</strong><p>Correction demandée.</p></article>
      </div>

      <div className="director-quality-list">
        {documents.map((document) => (
          <article key={document.id} className="director-quality-row">
            <div>
              <span>{document.family}</span>
              <strong>{document.title}</strong>
            </div>
            <div className="director-quality-meter"><span style={{ width: `${document.qualityScore || 0}%` }} /></div>
            <b>{document.qualityScore || 0}/100</b>
            <DirectorStatusBadge status={document.status} />
            <div className="director-actions">
              {canCorrect && canOpenEditorialStudio ? (
                <a href="/admin/studio-editorial">Demander correction</a>
              ) : (
                <button type="button" disabled title={canCorrect ? "Correction à traiter depuis le studio éditorial admin" : "Action réservée aux validateurs documentaires"}>Demander correction</button>
              )}
              {canValidate && document.canValidate && canOpenEditorialStudio ? (
                <a href="/admin/studio-editorial">Valider pour publication</a>
              ) : (
                <button type="button" disabled title={canValidate && document.canValidate ? "Validation finale à réaliser depuis le studio éditorial admin" : "Validation disponible quand le document est prêt et que le rôle le permet"}>Valider pour publication</button>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="director-comments">
        <h3>Commentaires de validation</h3>
        {comments.length === 0 ? <p>Aucun commentaire dirigeant enregistré.</p> : comments.map((comment) => (
          <article key={comment.id}>
            <strong>{comment.author}</strong>
            <span>{comment.target} · {new Date(comment.createdAt).toLocaleDateString("fr-FR")}</span>
            <p>{comment.comment}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
