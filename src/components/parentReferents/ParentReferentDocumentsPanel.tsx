import { useMemo, useState } from "react";
import type { ParentReferentDocument } from "../../types/parentReferent";
import { filterParentReferentDocuments } from "../../lib/parentReferents/parentReferentMessages";
import { canViewParentUsefulDocuments } from "../../lib/permissions/parentReferentPermissions";

export function ParentReferentDocumentsPanel({
  documents,
  teamId,
  userRole,
}: {
  documents: ParentReferentDocument[];
  teamId: string;
  userRole?: string | null;
}) {
  const [category, setCategory] = useState("all");
  const [season, setSeason] = useState("all");
  const [type, setType] = useState("all");
  const [audience, setAudience] = useState("all");
  const [status, setStatus] = useState("published");
  const [query, setQuery] = useState("");
  const visibleDocuments = useMemo(() => filterParentReferentDocuments(documents, {
    category,
    type,
    audience,
    teamId,
    season,
  }).filter((document) => {
    const matchStatus = status === "all" || document.status === status;
    const matchQuery = !query || `${document.title} ${document.category} ${document.type}`.toLowerCase().includes(query.toLowerCase());
    return matchStatus && matchQuery && canViewParentUsefulDocuments(userRole, document);
  }), [audience, category, documents, query, season, status, teamId, type, userRole]);

  async function copyPublicLink(document: ParentReferentDocument) {
    await navigator.clipboard.writeText(`${window.location.origin}${document.route}`);
  }

  return (
    <section className="parent-referent-section">
      <div className="parent-referent-section__title">
        <span>Documents utiles</span>
        <h2>Ressources familles publiées</h2>
      </div>

      <div className="parent-referent-filters">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un document" />
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">Toutes catégories</option>
          {[...new Set(documents.map((document) => document.category))].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={season} onChange={(event) => setSeason(event.target.value)}>
          <option value="all">Toutes saisons</option>
          {[...new Set(documents.map((document) => document.season))].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="all">Tous types</option>
          {[...new Set(documents.map((document) => document.type))].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={audience} onChange={(event) => setAudience(event.target.value)}>
          <option value="all">Tous publics</option>
          {[...new Set(documents.map((document) => document.audience))].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="published">Publié</option>
          <option value="club_validated">Validé club</option>
          <option value="all">Tous statuts visibles</option>
        </select>
      </div>

      <div className="parent-referent-documents-grid">
        {visibleDocuments.map((document) => (
          <article key={document.id} className="parent-referent-card">
            <span>{document.category}</span>
            <h3>{document.title}</h3>
            <p>{document.type} · {document.season}</p>
            <small>Mis à jour le {new Date(document.updatedAt || "2026-06-01T00:00:00.000Z").toLocaleDateString("fr-FR")}</small>
            <div className="parent-referent-badge-row">
              {document.badges.map((badge) => <strong key={badge}>{badge}</strong>)}
            </div>
            <div className="parent-referent-action-row">
              <a href={document.route}>Ouvrir</a>
              {document.downloadUrl ? <a href={document.downloadUrl}>Télécharger</a> : <button type="button" disabled>Indisponible</button>}
              {document.audience === "public" ? <button type="button" onClick={() => copyPublicLink(document)}>Copier lien</button> : <button type="button" disabled>Lien privé</button>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
