import { useEffect, useMemo, useRef, useState } from "react";
import { CourtCanvas } from "./components/CourtCanvas";
import { DiagramToolbar } from "./components/DiagramToolbar";
import { JsonPanel } from "./components/JsonPanel";
import { LibraryPanel } from "./components/LibraryPanel";
import { ReconstructionAssistPanel } from "./components/ReconstructionAssistPanel";
import { SessionCard } from "./components/SessionCard";
import { SessionMetaEditor } from "./components/SessionMetaEditor";
import { SourceImagePanel } from "./components/SourceImagePanel";
import { extractTextFromPdf } from "./parser/pdfParser";
import { parseCoachText } from "./parser/textParser";
import { exportNodeToPdf } from "./utils/exportPdf";
import { loadImageFile } from "./utils/fileImage";
import { makeId, nowIso } from "./utils/ids";
import {
  deleteSessionFromLibrary,
  downloadSessionJson,
  loadCurrentSessionFromLocal,
  loadLibraryFromLocal,
  loadSessionFromJsonFile,
  saveCurrentSessionToLocal,
  saveLibraryToLocal,
  upsertSessionInLibrary,
} from "./utils/localStorage";
import type {
  BCVBSession,
  DiagramActionType,
  DiagramData,
  DiagramElementType,
  ReconstructionPoint,
  SessionSourceImage,
} from "./types/session";

const DEMO_TEXT = `Titre : 1c1 à 45° après passe
Catégorie : U13
Durée : 12 min
Thème : 1c1 offensif
Étape : je m'exerce
Objectif : attaquer l'avantage dès la réception et finir fort
Intentions : jouer vite ; lire l'épaule haute ; finir dans le cercle proche
Organisation : 2 files à 45°, 1 coach à la tête de raquette, demi-terrain, 4 plots, 1c1 après réception
Matériel : 4 plots ; 3 ballons ; 1 panier
Déroulement :
- le joueur fait une passe au coach
- il reçoit en mouvement
- il attaque le cône en dribble
- il joue un 1c1
- rotation attaque / défense
Consignes :
- départ bas et orienté cercle
- décision en moins d'une seconde
- maximum 3 dribbles
Variables :
- départ assis
- main faible imposée
- défenseur en retard
Critères de réussite :
- créer un avantage avant la 2e pose d'appui
- finir équilibré
- jouer à pleine vitesse
`;

const POINT_COLORS = [
  "#C8102E",
  "#111111",
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#be123c",
];

function normalizeActionOrders(diagram: DiagramData): DiagramData {
  const sorted = [...diagram.actions].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  return {
    ...diagram,
    actions: sorted.map((action, index) => ({
      ...action,
      order: index + 1,
    })),
  };
}

function buildFreshParsedSession(input: string): BCVBSession {
  const parsed = parseCoachText(input);
  return {
    ...parsed,
    sourceImages: [],
    reconstruction: {
      activeSourceImageId: null,
      points: [],
      notes: "",
    },
  };
}

export default function App() {
  const [input, setInput] = useState<string>(DEMO_TEXT);
  const [sessionOverride, setSessionOverride] = useState<BCVBSession | null>(null);
  const [library, setLibrary] = useState<BCVBSession[]>([]);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfInfo, setPdfInfo] = useState<string>("");
  const [showJson, setShowJson] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [actionCreationType, setActionCreationType] = useState<DiagramActionType | "">("");
  const [linkMode, setLinkMode] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  const parsedSession: BCVBSession = useMemo(() => buildFreshParsedSession(input), [input]);
  const session = sessionOverride ?? parsedSession;

  useEffect(() => {
    const savedCurrent = loadCurrentSessionFromLocal();
    const savedLibrary = loadLibraryFromLocal();

    if (savedCurrent) {
      setSessionOverride({
        ...savedCurrent,
        sourceImages: savedCurrent.sourceImages ?? [],
        reconstruction: savedCurrent.reconstruction ?? {
          activeSourceImageId: null,
          points: [],
          notes: "",
        },
      });
      setInput(savedCurrent.rawText || DEMO_TEXT);
    }

    setLibrary(savedLibrary);
  }, []);

  useEffect(() => {
    saveCurrentSessionToLocal(session);
  }, [session]);

  const refreshLibrary = () => {
    setLibrary(loadLibraryFromLocal());
  };

  const resetSelections = () => {
    setSelectedElementId(null);
    setSelectedActionId(null);
    setActionCreationType("");
  };

  const handlePdfImport = async (file: File | null) => {
    if (!file) return;

    try {
      setLoadingPdf(true);
      setPdfInfo("");

      const result = await extractTextFromPdf(file);
      const nextParsed = parseCoachText(result.text);

      setInput(result.text);
      setSessionOverride((prev) => ({
        ...nextParsed,
        sourceImages: prev?.sourceImages ?? [],
        reconstruction: prev?.reconstruction ?? {
          activeSourceImageId: null,
          points: [],
          notes: "",
        },
      }));

      setPdfInfo(`PDF importé : ${result.pageCount} page(s). Texte extrait.`);
      resetSelections();
    } catch (error) {
      console.error(error);
      setPdfInfo("Échec de lecture du PDF.");
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleImageImport = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const imported: SessionSourceImage[] = [];

    for (const file of Array.from(files)) {
      const image = await loadImageFile(file);

      imported.push({
        id: makeId("img"),
        name: image.name,
        dataUrl: image.dataUrl,
        mimeType: image.mimeType,
        width: image.width,
        height: image.height,
        page: null,
        isPrimary: false,
        kind: "source",
      });
    }

    const hasPrimary = session.sourceImages.some((img) => img.isPrimary);
    const merged = [...session.sourceImages, ...imported].map((img, index) => ({
      ...img,
      isPrimary: hasPrimary ? img.isPrimary : index === 0,
    }));

    const activeId =
      session.reconstruction.activeSourceImageId ||
      merged.find((img) => img.isPrimary)?.id ||
      merged[0]?.id ||
      null;

    patchSession({
      sourceImages: merged,
      reconstruction: {
        ...session.reconstruction,
        activeSourceImageId: activeId,
      },
    });
  };

  const handleJsonImport = async (file: File | null) => {
    if (!file) return;

    try {
      const loaded = await loadSessionFromJsonFile(file);
      setSessionOverride({
        ...loaded,
        sourceImages: loaded.sourceImages ?? [],
        reconstruction: loaded.reconstruction ?? {
          activeSourceImageId: null,
          points: [],
          notes: "",
        },
        updatedAt: nowIso(),
      });
      setInput(loaded.rawText || DEMO_TEXT);
      resetSelections();
    } catch (error) {
      console.error(error);
      alert("Impossible de charger le JSON.");
    }
  };

  const patchSession = (patch: Partial<BCVBSession>) => {
    setSessionOverride({
      ...session,
      ...patch,
      updatedAt: nowIso(),
    });
  };

  const handleDiagramChange = (diagram: DiagramData) => {
    patchSession({ diagram: normalizeActionOrders(diagram) });
  };

  const handleSaveLibrary = () => {
    upsertSessionInLibrary({
      ...session,
      updatedAt: nowIso(),
    });
    refreshLibrary();
    alert("Séance enregistrée dans la bibliothèque.");
  };

  const handleOpenLibrarySession = (item: BCVBSession) => {
    setSessionOverride({
      ...item,
      sourceImages: item.sourceImages ?? [],
      reconstruction: item.reconstruction ?? {
        activeSourceImageId: null,
        points: [],
        notes: "",
      },
      updatedAt: nowIso(),
    });
    setInput(item.rawText || DEMO_TEXT);
    resetSelections();
  };

  const handleDuplicateLibrarySession = (item: BCVBSession) => {
    const duplicated: BCVBSession = {
      ...item,
      id: makeId("session"),
      title: `${item.title} - copie`,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      sourceImages: item.sourceImages ?? [],
      reconstruction: item.reconstruction ?? {
        activeSourceImageId: null,
        points: [],
        notes: "",
      },
    };

    const nextLibrary = [duplicated, ...library];
    setLibrary(nextLibrary);
    saveLibraryToLocal(nextLibrary);
  };

  const handleDeleteLibrarySession = (item: BCVBSession) => {
    const confirmed = window.confirm(`Supprimer la séance "${item.title}" ?`);
    if (!confirmed) return;

    deleteSessionFromLibrary(item.id);
    refreshLibrary();
  };

  const handleSaveLocalCurrent = () => {
    saveCurrentSessionToLocal(session);
    alert("Séance courante sauvegardée.");
  };

  const handleExportPdf = async () => {
    if (!cardRef.current) return;
    await exportNodeToPdf(cardRef.current, `${session.title || "fiche-bcvb"}.pdf`);
  };

  const handleAddElement = (type: DiagramElementType) => {
    const countOfType = session.diagram.elements.filter((el) => el.type === type).length + 1;
    const defaultLabelMap: Record<DiagramElementType, string> = {
      attacker: `A${countOfType}`,
      defender: `D${countOfType}`,
      coach: `C${countOfType}`,
      cone: "",
      ball: "",
      "zone-label": `Z${countOfType}`,
    };

    const newElement = {
      id: makeId(type),
      type,
      x: 50,
      y: 65,
      label: defaultLabelMap[type],
    };

    patchSession({
      diagram: {
        ...session.diagram,
        elements: [...session.diagram.elements, newElement],
      },
    });

    setSelectedElementId(newElement.id);
    setSelectedActionId(null);
  };

  const handleDeleteSelectedElement = () => {
    if (!selectedElementId) return;

    const nextDiagram = {
      ...session.diagram,
      elements: session.diagram.elements.filter((el) => el.id !== selectedElementId),
      actions: session.diagram.actions.map((action) => ({
        ...action,
        from:
          action.from.elementId === selectedElementId
            ? { ...action.from, elementId: null }
            : action.from,
        to:
          action.to.elementId === selectedElementId
            ? { ...action.to, elementId: null }
            : action.to,
      })),
    };

    patchSession({
      diagram: normalizeActionOrders(nextDiagram),
    });

    setSelectedElementId(null);
  };

  const handleRenameSelectedElement = (label: string) => {
    if (!selectedElementId) return;

    patchSession({
      diagram: {
        ...session.diagram,
        elements: session.diagram.elements.map((el) =>
          el.id === selectedElementId ? { ...el, label } : el
        ),
      },
    });
  };

  const handleStartAddAction = (type: DiagramActionType) => {
    setActionCreationType(type);
    setSelectedElementId(null);
    setSelectedActionId(null);
  };

  const handleCancelAddAction = () => {
    setActionCreationType("");
  };

  const handleCreateAction = (
    type: DiagramActionType,
    from: { x: number; y: number; elementId?: string | null },
    to: { x: number; y: number; elementId?: string | null }
  ) => {
    const defaultLabelMap: Record<DiagramActionType, string> = {
      move: "déplacement",
      pass: "passe",
      dribble: "dribble",
      cut: "coupe",
      shot: "tir",
      screen: "écran",
    };

    const nextOrder = session.diagram.actions.length + 1;

    const newAction = {
      id: makeId(type),
      type,
      from,
      to,
      label: defaultLabelMap[type],
      order: nextOrder,
    };

    patchSession({
      diagram: normalizeActionOrders({
        ...session.diagram,
        actions: [...session.diagram.actions, newAction],
      }),
    });

    setSelectedActionId(newAction.id);
    setSelectedElementId(null);
    setActionCreationType("");
  };

  const handleDeleteSelectedAction = () => {
    if (!selectedActionId) return;

    patchSession({
      diagram: normalizeActionOrders({
        ...session.diagram,
        actions: session.diagram.actions.filter((action) => action.id !== selectedActionId),
      }),
    });

    setSelectedActionId(null);
  };

  const handleRenameSelectedAction = (label: string) => {
    if (!selectedActionId) return;

    patchSession({
      diagram: {
        ...session.diagram,
        actions: session.diagram.actions.map((action) =>
          action.id === selectedActionId ? { ...action, label } : action
        ),
      },
    });
  };

  const moveSelectedAction = (direction: "forward" | "backward") => {
    if (!selectedActionId) return;

    const sorted = [...session.diagram.actions].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    const index = sorted.findIndex((action) => action.id === selectedActionId);
    if (index < 0) return;

    const targetIndex = direction === "forward" ? index + 1 : index - 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const temp = sorted[index];
    sorted[index] = sorted[targetIndex];
    sorted[targetIndex] = temp;

    patchSession({
      diagram: normalizeActionOrders({
        ...session.diagram,
        actions: sorted,
      }),
    });
  };

  const handleSetPrimaryImage = (id: string) => {
    patchSession({
      sourceImages: session.sourceImages.map((img) => ({
        ...img,
        isPrimary: img.id === id,
      })),
      reconstruction: {
        ...session.reconstruction,
        activeSourceImageId: id,
      },
    });
  };

  const handleDeleteImage = (id: string) => {
    const nextImages = session.sourceImages.filter((img) => img.id !== id);
    const hasPrimary = nextImages.some((img) => img.isPrimary);

    const normalizedImages = nextImages.map((img, index) => ({
      ...img,
      isPrimary: hasPrimary ? img.isPrimary : index === 0,
    }));

    const nextActive =
      session.reconstruction.activeSourceImageId === id
        ? normalizedImages.find((img) => img.isPrimary)?.id || normalizedImages[0]?.id || null
        : session.reconstruction.activeSourceImageId;

    patchSession({
      sourceImages: normalizedImages,
      reconstruction: {
        ...session.reconstruction,
        activeSourceImageId: nextActive,
      },
    });
  };

  const handleUpdateImageKind = (id: string, kind: SessionSourceImage["kind"]) => {
    patchSession({
      sourceImages: session.sourceImages.map((img) =>
        img.id === id ? { ...img, kind } : img
      ),
    });
  };

  const handleAddReconstructionPoint = ({ x, y }: { x: number; y: number }) => {
    const nextIndex = session.reconstruction.points.length + 1;
    const newPoint: ReconstructionPoint = {
      id: makeId("pt"),
      label: `Repère ${nextIndex}`,
      x,
      y,
      color: POINT_COLORS[(nextIndex - 1) % POINT_COLORS.length],
    };

    patchSession({
      reconstruction: {
        ...session.reconstruction,
        points: [...session.reconstruction.points, newPoint],
      },
    });
  };

  const handleDeleteReconstructionPoint = (id: string) => {
    patchSession({
      reconstruction: {
        ...session.reconstruction,
        points: session.reconstruction.points.filter((point) => point.id !== id),
      },
    });
  };

  const handleRenameReconstructionPoint = (id: string, label: string) => {
    patchSession({
      reconstruction: {
        ...session.reconstruction,
        points: session.reconstruction.points.map((point) =>
          point.id === id ? { ...point, label } : point
        ),
      },
    });
  };

  return (
    <div className="app-premium">
      <header className="premium-topbar">
        <div>
          <div className="topbar-kicker">BCVB</div>
          <h1>Générateur de fiches séance</h1>
          <p>Version premium — diagrammes, reconstruction assistée et fiche finale</p>
        </div>
      </header>

      <main className="premium-layout">
        <section className="premium-column">
          <div className="panel-premium">
            <div className="panel-title-row">
              <h2>Entrée coach</h2>
              <span className="panel-badge">Saisie</span>
            </div>

            <div className="action-toolbar-premium">
              <label className="premium-upload">
                <span>{loadingPdf ? "Lecture..." : "Importer PDF"}</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handlePdfImport(e.target.files?.[0] || null)}
                  disabled={loadingPdf}
                />
              </label>

              <label className="premium-upload">
                <span>Importer image(s)</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  onChange={(e) => handleImageImport(e.target.files)}
                />
              </label>

              <label className="premium-upload">
                <span>Importer JSON</span>
                <input
                  type="file"
                  accept="application/json"
                  onChange={(e) => handleJsonImport(e.target.files?.[0] || null)}
                />
              </label>

              <button className="btn-secondary" onClick={() => { setInput(DEMO_TEXT); setSessionOverride(null); resetSelections(); }}>
                Charger exemple
              </button>
              <button className="btn-secondary" onClick={handleSaveLocalCurrent}>Sauvegarder</button>
              <button className="btn-primary" onClick={handleSaveLibrary}>Ajouter à la bibliothèque</button>
              <button className="btn-secondary" onClick={() => downloadSessionJson(session)}>Exporter JSON</button>
              <button className="btn-primary" onClick={handleExportPdf}>Exporter PDF</button>
              <button className="btn-ghost" onClick={() => setShowJson((prev) => !prev)}>
                {showJson ? "Masquer JSON" : "Voir JSON"}
              </button>
            </div>

            {pdfInfo ? <div className="info-banner">{pdfInfo}</div> : null}

            <textarea
              className="coach-input-premium"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setSessionOverride(null);
                resetSelections();
              }}
              placeholder="Colle ici ton texte séance..."
            />
          </div>

          <SourceImagePanel
            images={session.sourceImages}
            onSetPrimary={handleSetPrimaryImage}
            onDelete={handleDeleteImage}
            onUpdateKind={handleUpdateImageKind}
          />

          <LibraryPanel
            sessions={library}
            currentSessionId={session.id}
            onOpen={handleOpenLibrarySession}
            onDuplicate={handleDuplicateLibrarySession}
            onDelete={handleDeleteLibrarySession}
          />
        </section>

        <section className="premium-column">
          <SessionMetaEditor session={session} onChange={patchSession} />

          <ReconstructionAssistPanel
            images={session.sourceImages}
            activeSourceImageId={session.reconstruction.activeSourceImageId}
            points={session.reconstruction.points}
            notes={session.reconstruction.notes}
            onSetActiveImage={(id) =>
              patchSession({
                reconstruction: {
                  ...session.reconstruction,
                  activeSourceImageId: id,
                },
              })
            }
            onAddPoint={handleAddReconstructionPoint}
            onDeletePoint={handleDeleteReconstructionPoint}
            onRenamePoint={handleRenameReconstructionPoint}
            onUpdateNotes={(notes) =>
              patchSession({
                reconstruction: {
                  ...session.reconstruction,
                  notes,
                },
              })
            }
          />

          <DiagramToolbar
            diagram={session.diagram}
            selectedElementId={selectedElementId}
            selectedActionId={selectedActionId}
            actionCreationType={actionCreationType}
            linkMode={linkMode}
            onAddElement={handleAddElement}
            onDeleteSelectedElement={handleDeleteSelectedElement}
            onRenameSelectedElement={handleRenameSelectedElement}
            onStartAddAction={handleStartAddAction}
            onCancelAddAction={handleCancelAddAction}
            onDeleteSelectedAction={handleDeleteSelectedAction}
            onRenameSelectedAction={handleRenameSelectedAction}
            onToggleLinkMode={() => setLinkMode((prev) => !prev)}
            onMoveSelectedActionBackward={() => moveSelectedAction("backward")}
            onMoveSelectedActionForward={() => moveSelectedAction("forward")}
          />

          <div className="panel-premium">
            <CourtCanvas
              diagram={session.diagram}
              selectedElementId={selectedElementId}
              selectedActionId={selectedActionId}
              actionCreationType={actionCreationType}
              linkMode={linkMode}
              onSelectElement={setSelectedElementId}
              onSelectAction={setSelectedActionId}
              onCreateAction={handleCreateAction}
              onChange={handleDiagramChange}
            />
          </div>

          {showJson ? <JsonPanel session={session} /> : null}
        </section>

        <section className="premium-column">
          <SessionCard ref={cardRef} session={session} />
        </section>
      </main>
    </div>
  );
}
