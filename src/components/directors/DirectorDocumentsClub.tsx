import { useMemo, useState } from "react";
import type { DirectorDocumentView } from "../../types/directors";
import { EmptyState, MobileDetailCard, ResponsiveDataList, StatusBadge } from "../ui/ResponsiveDataView";
import { DirectorStatusBadge } from "./DirectorStatusBadge";

export function DirectorDocumentsClub({ documents }: { documents: DirectorDocumentView[] }) {
  const [family, setFamily] = useState("all");
  const [category, setCategory] = useState("all");
  const [season, setSeason] = useState("all");
  const [status, setStatus] = useState("all");

  const visibleDocuments = useMemo(() => documents.filter((document) => {
    const matchFamily = family === "all" || document.family === family;
    const matchCategory = category === "all" || document.category === category;
    const matchSeason = season === "all" || document.season === season;
    const matchStatus = status === "all" || document.status === status;
    return matchFamily && matchCategory && matchSeason && matchStatus;
  }), [category, documents, family, season, status]);

  return (
    <section className="director-card">
      <div className="director-card__header">
        <div>
          <span>Documents club</span>
          <h2>Documents validés et validations</h2>
        </div>
        <DirectorStatusBadge status={documents.some((document) => document.status === "pending_validation") ? "warning" : "ok"} />
      </div>

      <div className="director-filters">
        <select value={family} onChange={(event) => setFamily(event.target.value)}>
          <option value="all">Toutes familles</option>
          {[...new Set(documents.map((document) => document.family))].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">Toutes catégories</option>
          {[...new Set(documents.map((document) => document.category).filter(Boolean))].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={season} onChange={(event) => setSeason(event.target.value)}>
          <option value="all">Toutes saisons</option>
          {[...new Set(documents.map((document) => document.season).filter(Boolean))].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">Tous statuts</option>
          <option value="published">Publié</option>
          <option value="pending_validation">À valider</option>
          <option value="to_correct">À corriger</option>
          <option value="archived">Archivé</option>
        </select>
      </div>

      <div className="director-table-scroll responsive-data-table">
        <table className="director-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Famille</th>
              <th>Catégorie</th>
              <th>Score qualité</th>
              <th>Statut</th>
              <th>Dernière modification</th>
              <th>Validation</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleDocuments.map((document) => (
              <tr key={document.id}>
                <td>{document.title}</td>
                <td>{document.family}</td>
                <td>{document.category || "Club"}</td>
                <td>{document.qualityScore ?? "—"}/100</td>
                <td><DirectorStatusBadge status={document.status} /></td>
                <td>{document.updatedAt ? new Date(document.updatedAt).toLocaleDateString("fr-FR") : "—"}</td>
                <td>{document.validatedBy || (document.status === "pending_validation" ? "En attente" : "—")}</td>
                <td>
                  <div className="director-actions">
                    <a href="/bibliotheque">Consulter</a>
                    {document.canDownloadPdf ? <a href="/bibliotheque">PDF</a> : <button type="button" disabled>PDF indispo.</button>}
                    {document.canViewSource && <a href="/bibliotheque">Source</a>}
                    {document.canValidate && <button type="button" disabled title="Validation finale à réaliser depuis le studio éditorial admin">Valider</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="responsive-data-mobile">
        <ResponsiveDataList
          empty={(
            <EmptyState
              title="Aucun document trouvé"
              description="Ajuste les filtres ou publie un document club pour alimenter cette liste."
            />
          )}
        >
          {visibleDocuments.map((document) => (
            <MobileDetailCard
              key={document.id}
              eyebrow={document.family}
              title={document.title}
              subtitle={document.category || "Club"}
              badge={<DirectorStatusBadge status={document.status} />}
              items={[
                { label: "Score qualité", value: `${document.qualityScore ?? "—"}/100` },
                { label: "Modification", value: document.updatedAt ? new Date(document.updatedAt).toLocaleDateString("fr-FR") : "—" },
                { label: "Validation", value: document.validatedBy || (document.status === "pending_validation" ? "En attente" : "—"), full: true },
              ]}
              actions={(
                <>
                  <a href="/bibliotheque">Consulter</a>
                  {document.canDownloadPdf ? <a href="/bibliotheque">PDF</a> : <StatusBadge>PDF indispo.</StatusBadge>}
                  {document.canViewSource && <a href="/bibliotheque">Source</a>}
                  {document.canValidate && <StatusBadge>Validation admin</StatusBadge>}
                </>
              )}
            />
          ))}
        </ResponsiveDataList>
      </div>
    </section>
  );
}
