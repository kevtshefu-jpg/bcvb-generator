import { useState } from "react";
import { Link } from "react-router-dom";
import type { TeamLinkedDocument } from "../../types/teams";
import { filterTeamDocuments } from "../../lib/teams/teamLinks";
import { downloadTeamFile } from "../../lib/teams/teamExports";

const documentTypes: Array<TeamLinkedDocument["documentType"] | "all"> = [
  "all",
  "effectif",
  "session",
  "seance",
  "planning",
  "planification",
  "presence",
  "evaluation",
  "bilan",
  "cahier_technique",
  "guide_coach",
  "document",
  "export",
  "autre",
];

export type TeamLinkedDocumentsProps = {
  documents: TeamLinkedDocument[];
  canEdit: boolean;
  canTransform?: boolean;
  onChange: (documents: TeamLinkedDocument[]) => void;
};

export function TeamLinkedDocuments({
  documents,
  canEdit,
  canTransform,
  onChange,
}: TeamLinkedDocumentsProps) {
  const [type, setType] = useState<TeamLinkedDocument["documentType"] | "all">("all");
  const visibleDocuments = filterTeamDocuments(documents, type);

  function unlink(documentId: string) {
    onChange(documents.filter((document) => document.id !== documentId));
  }

  function linkPlaceholder() {
    onChange([
      ...documents,
      {
        id: `linked-doc-${Date.now()}`,
        teamId: documents[0]?.teamId || "team",
        documentId: `library-doc-${Date.now()}`,
        documentType: "document",
        title: "Document bibliothèque à sélectionner",
        url: "/bibliotheque",
        visibility: "staff",
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  function exportLinkedDocument(document: TeamLinkedDocument) {
    downloadTeamFile(
      `${document.title.toLowerCase().replace(/[^a-z0-9]+/gi, "-") || "document-lie"}-bcvb.json`,
      JSON.stringify(document, null, 2),
      "application/json;charset=utf-8"
    );
  }

  return (
    <section className="team-linked-documents">
      <div className="teams-section-title">
        <span>Documents liés</span>
        <h2>Séances, planifications, présences, évaluations</h2>
      </div>
      <div className="team-doc-toolbar">
        <select value={type} onChange={(event) => setType(event.target.value as TeamLinkedDocument["documentType"] | "all")}>
          {documentTypes.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <button type="button" disabled={!canEdit} onClick={linkPlaceholder}>Lier document existant</button>
        {canTransform ? (
          <Link className="team-doc-action-link" to="/admin/documents/nouveau">Créer document équipe</Link>
        ) : (
          <button type="button" disabled title="Création documentaire réservée à l’admin">Créer document équipe</button>
        )}
      </div>
      <div className="team-doc-list">
        {visibleDocuments.map((document) => (
          <article key={document.id}>
            <span>{document.documentType}</span>
            <strong>{document.title}</strong>
            <p>Visibilité : {document.visibility || "staff"} · Ajouté le {new Date(document.createdAt).toLocaleDateString("fr-FR")}</p>
            <div>
              <a href={document.url || "/bibliotheque"}>Ouvrir</a>
              {canTransform ? (
                <Link to="/admin/documents/transformer" state={{ sourceDocumentId: document.documentId, transformedFromTitle: document.title }}>Transformer</Link>
              ) : (
                <button type="button" disabled title="Transformation réservée à l’admin">Transformer</button>
              )}
              {document.url ? (
                <a href={document.url}>Télécharger PDF</a>
              ) : (
                <button type="button" disabled title="Aucun PDF lié à ce document">PDF à générer</button>
              )}
              <button type="button" onClick={() => exportLinkedDocument(document)}>Exporter lien</button>
              <button type="button" disabled={!canEdit} onClick={() => unlink(document.id)}>Délier</button>
            </div>
          </article>
        ))}
        {visibleDocuments.length === 0 && <p>Aucun document lié pour ce filtre.</p>}
      </div>
    </section>
  );
}
