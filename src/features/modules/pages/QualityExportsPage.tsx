import { useEffect, useMemo, useState } from "react";
import { DocumentActionBar, type DocumentAction } from "../../../components/navigation/DocumentActionBar";
import { DocumentWorkflowNav } from "../../../components/navigation/DocumentWorkflowNav";
import ExportPanel from "../../document-export/components/ExportPanel";
import { exportDocumentToPdf } from "../../document-export/services/pdfExportService";
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
import DocumentWorkflowStepper, {
  type DocumentWorkflowStep,
  type DocumentWorkflowStatus,
} from "../../workflow/components/DocumentWorkflowStepper";
import { loadEditorialStudioState } from "../../../utils/editorialStudioStorage";

const EXPORT_ELEMENT_ID = "bcvb-quality-export-document";

const workflowSteps = [
  { id: "source", label: "Source", detail: "Texte" },
  { id: "structure", label: "Structure", detail: "Famille" },
  { id: "apercu", label: "Aperçu", detail: "Rendu" },
  { id: "qualite", label: "Qualité", detail: "Score" },
  { id: "correction", label: "Correction", detail: "Améliorer" },
  { id: "export", label: "Export", detail: "PDF" },
  { id: "versions", label: "Versions", detail: "Historique" },
];

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

function activeAwareStatus(
  stepId: string,
  activeStep: string,
  baseStatus: Exclude<DocumentWorkflowStatus, "in_progress">
): DocumentWorkflowStatus {
  return activeStep === stepId && baseStatus !== "done" ? "in_progress" : baseStatus;
}

export default function QualityExportsPage() {
  const initialDocument = useMemo(loadInitialDocument, []);
  const [title, setTitle] = useState(initialDocument.title);
  const [family, setFamily] = useState<DocumentFamily>(initialDocument.family);
  const [contentSource, setContentSource] = useState(initialDocument.source);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [activeStep, setActiveStep] = useState(() => {
    const hash = typeof window === "undefined" ? "" : window.location.hash.replace("#", "");
    return workflowSteps.some((step) => step.id === hash) ? hash : "source";
  });
  const [message, setMessage] = useState("Atelier prêt : analyse qualité, correction, export et versionnage séparés.");
  const documentId = useMemo(() => makeDocumentId(initialDocument.title), [initialDocument.title]);
  const score: QualityScore = useMemo(
    () => scoreDocument({ contentSource, renderedContent: contentSource, family }),
    [contentSource, family]
  );
  const currentVersion = versions[0]?.version ?? 0;
  const hasSource = contentSource.trim().length > 0;
  const criticalWarningCount = score.warnings.filter((warning) => warning.level === "critical").length;
  const qualityBaseStatus: Exclude<DocumentWorkflowStatus, "in_progress"> =
    criticalWarningCount > 0 ? "error" : score.globalScore < 85 ? "needs_review" : "done";
  const correctionBaseStatus: Exclude<DocumentWorkflowStatus, "in_progress"> =
    score.globalScore < 85 || criticalWarningCount > 0 ? "needs_review" : "done";
  const exportBaseStatus: Exclude<DocumentWorkflowStatus, "in_progress"> =
    criticalWarningCount > 0 ? "error" : score.globalScore < 85 ? "needs_review" : "todo";
  const archiveBaseStatus: Exclude<DocumentWorkflowStatus, "in_progress"> = versions.length > 0 ? "done" : "todo";

  async function refreshVersions() {
    const nextVersions = await getVersionHistory(documentId);
    setVersions(nextVersions);
  }

  useEffect(() => {
    void refreshVersions();
  }, [documentId]);

  useEffect(() => {
    function syncHashStep() {
      const nextStep = window.location.hash.replace("#", "");
      if (workflowSteps.some((step) => step.id === nextStep)) setActiveStep(nextStep);
    }

    window.addEventListener("hashchange", syncHashStep);
    return () => window.removeEventListener("hashchange", syncHashStep);
  }, []);

  function goToStep(stepId: string) {
    setActiveStep(stepId);
    window.setTimeout(() => {
      document.getElementById(stepId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

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

  async function handleExportPdf() {
    setMessage("Export PDF lancé depuis la barre d’actions persistante.");
    await exportDocumentToPdf({
      documentId,
      title,
      contentElementId: EXPORT_ELEMENT_ID,
      orientation: "portrait",
    });
  }

  const activeStepLabel = workflowSteps.find((step) => step.id === activeStep)?.label ?? "Source";
  const guidedWorkflowSteps: DocumentWorkflowStep[] = [
    {
      id: "source",
      label: "Source",
      status: activeAwareStatus("source", activeStep, hasSource ? "done" : "todo"),
      explanation: "Ajoute un brief, un PDF, une image ou un texte brut.",
      primaryAction: {
        label: "Importer / écrire",
        onClick: () => goToStep("source"),
      },
      secondaryAction: {
        label: "Voir OCR",
        onClick: () => {
          window.location.href = "/admin/ocr-pieces-jointes";
        },
      },
    },
    {
      id: "structure",
      label: "Structuration",
      status: activeAwareStatus("structure", activeStep, hasSource && family !== "unknown" ? "done" : "todo"),
      explanation: "Le contenu est transformé en document BCVB Rich Markdown.",
      primaryAction: {
        label: "Structurer",
        onClick: () => goToStep("structure"),
      },
      secondaryAction: {
        label: "Changer famille",
        onClick: () => goToStep("source"),
      },
    },
    {
      id: "apercu",
      label: "Aperçu",
      status: activeAwareStatus("apercu", activeStep, hasSource ? "done" : "todo"),
      explanation: "Vérifie le rendu avant export.",
      primaryAction: {
        label: "Prévisualiser",
        onClick: () => goToStep("apercu"),
      },
      secondaryAction: {
        label: "Modifier source",
        onClick: () => goToStep("source"),
      },
    },
    {
      id: "qualite",
      label: "Qualité",
      status: activeAwareStatus("qualite", activeStep, qualityBaseStatus),
      explanation: "Le document reçoit un score sur 100.",
      primaryAction: {
        label: "Lancer le score",
        onClick: () => {
          setMessage(`Score actuel : ${score.globalScore}/100. ${criticalWarningCount} warning critique.`);
          goToStep("qualite");
        },
      },
      secondaryAction: {
        label: "Voir warnings",
        onClick: () => goToStep("qualite"),
      },
    },
    {
      id: "correction",
      label: "Correction",
      status: activeAwareStatus("correction", activeStep, correctionBaseStatus),
      explanation: "Le site propose une amélioration forte.",
      primaryAction: {
        label: "Améliorer fortement",
        onClick: () => {
          setMessage("Correction massive prête : vérifiez le plan proposé.");
          goToStep("correction");
        },
      },
      secondaryAction: {
        label: "Comparer",
        onClick: () => goToStep("correction"),
      },
    },
    {
      id: "export",
      label: "Export",
      status: activeAwareStatus("export", activeStep, exportBaseStatus),
      explanation: "Génère une version PDF propre.",
      primaryAction: {
        label: "Exporter",
        disabled: criticalWarningCount > 0,
        onClick: () => {
          void handleExportPdf();
        },
      },
      secondaryAction: {
        label: "Préparer PDF",
        onClick: () => goToStep("export"),
      },
    },
    {
      id: "versions",
      label: "Archivage",
      status: activeAwareStatus("versions", activeStep, archiveBaseStatus),
      explanation: "La source et les versions sont conservées.",
      primaryAction: {
        label: "Voir l’historique",
        onClick: () => goToStep("versions"),
      },
      secondaryAction: {
        label: "Sauvegarder",
        onClick: () => {
          void handleSaveVersion(["Archivage manuel depuis le parcours guidé."]);
        },
      },
    },
  ];
  const documentActions: DocumentAction[] = [
    {
      id: "save",
      label: "Sauvegarder",
      detail: "Créer une version source restaurable.",
      tone: "primary",
      onClick: () => {
        void handleSaveVersion();
      },
    },
    {
      id: "score",
      label: "Scorer",
      detail: "Afficher le score qualité et les warnings.",
      onClick: () => {
        setMessage(`Score actuel : ${score.globalScore}/100. Consultez les warnings qualité.`);
        goToStep("qualite");
      },
    },
    {
      id: "improve",
      label: "Améliorer",
      detail: "Ouvrir la correction massive guidée par le score.",
      onClick: () => {
        setMessage("Correction massive prête : vérifiez le plan avant lancement.");
        goToStep("correction");
      },
    },
    {
      id: "preview",
      label: "Prévisualiser",
      detail: "Revenir au rendu exportable.",
      onClick: () => goToStep("apercu"),
    },
    {
      id: "export",
      label: "Exporter",
      detail: "Exporter la zone document en PDF.",
      onClick: () => {
        void handleExportPdf();
      },
    },
    {
      id: "history",
      label: "Historique",
      detail: "Consulter et restaurer les versions.",
      onClick: () => goToStep("versions"),
    },
  ];

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

      <DocumentWorkflowStepper steps={guidedWorkflowSteps} activeStepId={activeStep} onStepSelect={goToStep} />
      <DocumentWorkflowNav steps={workflowSteps} activeStep={activeStep} onStepChange={setActiveStep} />

      <section className="quality-page__workspace">
        <aside className="quality-side-panel no-print" aria-label="Pilotage qualité documentaire">
          <div id="qualite" className="quality-anchor">
            <QualityScorePanel
              score={score}
              onImprove={() => {
                setMessage("Plan prêt : utilisez la reconstruction publication club ci-dessous.");
                goToStep("correction");
              }}
            />
          </div>
          <div id="correction" className="quality-anchor">
            <MassiveCorrectionPanel
              contentSource={contentSource}
              family={family}
              score={score}
              onCorrectionApplied={(result) => {
                void handleCorrectionApplied(result);
              }}
            />
          </div>
          <div id="export" className="quality-anchor">
            <ExportPanel
              documentId={documentId}
              title={title}
              contentElementId={EXPORT_ELEMENT_ID}
              contentSource={contentSource}
              score={score}
              version={currentVersion}
            />
          </div>
          <div id="versions" className="quality-anchor">
            <VersionHistoryPanel versions={versions} onRestore={handleRestore} />
          </div>
        </aside>

        <div className="quality-main-panel">
          <section id="source" className="quality-editor-panel no-print quality-anchor">
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

          <section id="structure" className="quality-structure-panel no-print quality-anchor">
            <header>
              <div>
                <p className="bcvb-eyebrow">Document actif</p>
                <h2>{title}</h2>
                <span>{familyOptions.find((option) => option.value === family)?.label ?? "Famille non définie"}</span>
              </div>
            </header>
            <div className="quality-structure-grid">
              <article>
                <strong>Étape active</strong>
                <p>{activeStepLabel}</p>
              </article>
              <article>
                <strong>Action suivante</strong>
                <p>{score.globalScore < 85 ? "Scorer puis améliorer avant export." : "Prévisualiser et exporter après relecture."}</p>
              </article>
              <article>
                <strong>Publication</strong>
                <p>{score.status.replace(/_/g, " ")}</p>
              </article>
            </div>
          </section>

          <section id="apercu" className="quality-preview-panel quality-anchor">
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

      <DocumentActionBar
        documentTitle={title}
        activeStepLabel={`Étape ${activeStepLabel}`}
        qualityLabel={`Score ${score.globalScore}/100`}
        actions={documentActions}
      />
    </main>
  );
}
