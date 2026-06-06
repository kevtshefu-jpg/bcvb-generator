import { useEffect, useMemo, useState } from "react";
import ExportPanel from "../../document-export/components/ExportPanel";
import MassiveCorrectionPanel from "../../document-quality/components/MassiveCorrectionPanel";
import QualityScorePanel from "../../document-quality/components/QualityScorePanel";
import "../../document-quality/styles/documentQuality.css";
import { scoreDocument } from "../../document-quality/services/qualityScorer";
import type { DocumentFamily, MassiveCorrectionResult, QualityScore } from "../../document-quality/types/quality.types";
import VersionHistoryPanel from "../../document-versioning/components/VersionHistoryPanel";
import {
  getVersionHistory,
  saveDocumentVersion,
} from "../../document-versioning/services/documentVersionService";
import type { DocumentVersion } from "../../document-versioning/types/version.types";
import RichMarkdownRenderer from "../../rich-markdown/components/RichMarkdownRenderer";
import { loadEditorialStudioState } from "../../../utils/editorialStudioStorage";

const EXPORT_ELEMENT_ID = "bcvb-quality-export-document";

const familyOptions: Array<{ value: DocumentFamily; label: string }> = [
  { value: "guide_coach", label: "Guide coach" },
  { value: "cahier_technique", label: "Cahier technique" },
  { value: "fiche_seance", label: "Fiche séance" },
  { value: "situation_pedagogique", label: "Situation pédagogique" },
  { value: "outil_evaluation", label: "Outil d'évaluation" },
  { value: "document_familles", label: "Document familles" },
  { value: "document_administratif", label: "Document administratif" },
  { value: "compte_rendu", label: "Compte rendu" },
  { value: "unknown", label: "Autre document" },
];

const sampleDocument = `
# Guide coach U13 - Défendre Fort

## Introduction
Ce document sert de base de publication club pour aider les coachs BCVB à transformer une source en document lisible, exploitable et exportable.

:::bcvb-identity
title: Identité BCVB
content: Défendre Fort, Courir et Partager la Balle. Défense Homme à Homme, intensité, agressivité maîtrisée et lecture collective.
:::

## Objectifs terrain
- Installer une posture défensive agressive mais maîtrisée.
- Relier chaque situation à un critère observable.
- Préparer la retranscription en match.

## Situation pédagogique
:::bcvb-situation
title: Tenir son joueur - cadrage et orientation
objectif: Orienter le porteur vers une zone moins dangereuse.
organisation: Demi-terrain, 3 attaquants, 3 défenseurs, départ coach.
consignes_joueurs: Parler, cadrer, contenir, ne pas ouvrir l'axe.
criteres_reussite: 8 secondes sans pénétration plein axe, communication audible, rebond sécurisé.
evolution_1: Ajouter un retard défensif puis une aide côté opposé.
:::

## Tableau de progression
| Temps | Intention | Organisation | Critère observable |
| --- | --- | --- | --- |
| Je découvre | Cadrer | 1 contre 1 couloir | Le défenseur reste entre joueur et panier |
| Je m'exerce | Aider | 2 contre 2 côté fort | L'aide est visible avant le dribble |
| Je retranscris | Jouer | 4 contre 4 tout terrain | La première passe est contestée |
| Je régule | Ajuster | Débrief court | Le joueur cite un repère défensif |

## Checklist publication
- Source conservée.
- Score qualité relu par l'admin.
- Tableaux vérifiés en écran et impression.
- Export PDF contrôlé avant diffusion.
`.trim();

function makeDocumentId(title: string) {
  return (
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "document-qualite-bcvb"
  );
}

function mapStudioFamily(family?: string): DocumentFamily {
  const normalized = family ?? "";
  if (["coach-guide", "guide_coach", "guide-coach"].includes(normalized)) return "guide_coach";
  if (["technical-book", "cahier_technique", "cahier-technique"].includes(normalized)) return "cahier_technique";
  if (["practice-session", "fiche_seance", "session", "seance"].includes(normalized)) return "fiche_seance";
  if (["situation", "situation_pedagogique", "situation-pedagogique"].includes(normalized)) return "situation_pedagogique";
  if (["evaluation", "outil_evaluation", "outil-evaluation"].includes(normalized)) return "outil_evaluation";
  if (["families", "document_familles", "document-familles"].includes(normalized)) return "document_familles";
  if (["administrative", "document_administratif", "document-administratif"].includes(normalized)) {
    return "document_administratif";
  }
  if (["report", "compte_rendu", "compte-rendu"].includes(normalized)) return "compte_rendu";
  return "unknown";
}

function loadInitialDocument() {
  if (typeof window === "undefined") {
    return {
      title: "Document qualité BCVB",
      family: "guide_coach" as DocumentFamily,
      source: sampleDocument,
    };
  }

  const studioState = loadEditorialStudioState();
  const source =
    studioState?.finalDocument ||
    studioState?.analyzedResponse ||
    studioState?.chatGptResponse ||
    studioState?.claudeResponse ||
    studioState?.sourceText ||
    sampleDocument;

  return {
    title: studioState?.targetDocument || "Document qualité BCVB",
    family: mapStudioFamily(studioState?.family),
    source,
  };
}

function formatDate(value?: string) {
  if (!value) return "Aucune sauvegarde";
  return new Date(value).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export default function QualityExportsPage() {
  const initialDocument = useMemo(loadInitialDocument, []);
  const [title, setTitle] = useState(initialDocument.title);
  const [family, setFamily] = useState<DocumentFamily>(initialDocument.family);
  const [contentSource, setContentSource] = useState(initialDocument.source);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [message, setMessage] = useState("Atelier prêt : analyse qualité, correction, export et versionnage séparés.");
  const documentId = useMemo(() => makeDocumentId(initialDocument.title), [initialDocument.title]);
  const score: QualityScore = useMemo(
    () => scoreDocument({ contentSource, renderedContent: contentSource, family }),
    [contentSource, family]
  );
  const currentVersion = versions[0]?.version ?? 0;

  async function refreshVersions() {
    const nextVersions = await getVersionHistory(documentId);
    setVersions(nextVersions);
  }

  useEffect(() => {
    void refreshVersions();
  }, [documentId]);

  async function handleSaveVersion(changeLog = ["Version source enregistrée manuellement."], scoreOverride = score) {
    const parentId = versions[0]?.id;
    await saveDocumentVersion({
      documentId,
      content_source: contentSource,
      content_rendered: contentSource,
      parentId,
      qualityScore: scoreOverride,
      changeLog,
    });
    await refreshVersions();
    setMessage("Version enregistrée : source et rendu conservés pour restauration.");
  }

  async function handleCorrectionApplied(result: MassiveCorrectionResult) {
    const correctedSource = result.correctedSource;
    const nextScore = result.newScore ?? scoreDocument({ contentSource: correctedSource, family });
    const parentId = versions[0]?.id;

    setContentSource(correctedSource);
    await saveDocumentVersion({
      documentId,
      content_source: correctedSource,
      content_rendered: correctedSource,
      parentId,
      qualityScore: nextScore,
      changeLog: result.changeLog,
    });
    await refreshVersions();
    setMessage("Correction massive appliquée dans une nouvelle version, sans écraser la source initiale.");
  }

  function handleRestore(version: DocumentVersion) {
    setContentSource(version.content_source);
    setMessage(`Version ${version.version} restaurée en aperçu. Enregistrez pour créer une nouvelle branche.`);
  }

  return (
    <main className="quality-page">
      <section className="quality-page__hero">
        <div>
          <p className="bcvb-eyebrow">Administration documentaire</p>
          <h1>Qualité documentaire & exports</h1>
          <p>
            Atelier admin pour contrôler le niveau publication club, améliorer une source BCVB Rich Markdown,
            préserver les versions et exporter un PDF propre.
          </p>
        </div>
        <div className="quality-page__meta no-print">
          <span>Score {score.globalScore}/100</span>
          <span>{score.warnings.filter((warning) => warning.level === "critical").length} critique(s)</span>
          <span>Version {currentVersion || "source"}</span>
        </div>
        <span className="quality-status-message no-print">{message}</span>
      </section>

      <section className="quality-page__workspace">
        <aside className="quality-side-panel no-print" aria-label="Pilotage qualité documentaire">
          <QualityScorePanel
            score={score}
            onImprove={() => setMessage("Plan prêt : utilisez la reconstruction publication club ci-dessous.")}
          />
          <MassiveCorrectionPanel
            contentSource={contentSource}
            family={family}
            score={score}
            onCorrectionApplied={(result) => {
              void handleCorrectionApplied(result);
            }}
          />
          <ExportPanel
            documentId={documentId}
            title={title}
            contentElementId={EXPORT_ELEMENT_ID}
            contentSource={contentSource}
            score={score}
            version={currentVersion}
          />
          <VersionHistoryPanel versions={versions} onRestore={handleRestore} />
        </aside>

        <div className="quality-main-panel">
          <section className="quality-editor-panel no-print">
            <header>
              <div>
                <p className="bcvb-eyebrow">Source conservée</p>
                <h2>Markdown / Rich Markdown</h2>
                <span>Dernière version : {formatDate(versions[0]?.createdAt)}</span>
              </div>
            </header>

            <div className="quality-editor-grid">
              <label className="quality-field">
                Titre document
                <input value={title} onChange={(event) => setTitle(event.target.value)} />
              </label>
              <label className="quality-field">
                Famille
                <select value={family} onChange={(event) => setFamily(event.target.value as DocumentFamily)}>
                  {familyOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="quality-field">
              Contenu source
              <textarea
                className="quality-source-editor"
                value={contentSource}
                onChange={(event) => setContentSource(event.target.value)}
                spellCheck={false}
              />
            </label>

            <div className="quality-editor-actions">
              <button
                type="button"
                onClick={() => {
                  void handleSaveVersion();
                }}
              >
                Enregistrer une version
              </button>
              <button type="button" onClick={() => setContentSource(sampleDocument)}>
                Recharger exemple BCVB
              </button>
              <span>Le correcteur, le moteur PDF, le stockage et le parser restent remplaçables par services.</span>
            </div>
          </section>

          <section className="quality-preview-panel">
            <header className="no-print">
              <div>
                <p className="bcvb-eyebrow">Aperçu exportable</p>
                <h2>Rendu BCVB Rich Markdown</h2>
                <span>Seule cette zone est envoyée au moteur PDF.</span>
              </div>
            </header>
            <div className="quality-preview-scroll">
              <div id={EXPORT_ELEMENT_ID}>
                <RichMarkdownRenderer content={contentSource} title={title} />
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
