import { useMemo, useRef, useState } from "react";
import type {
  BCVBDiagramSnapshot,
  OverlayAction,
  OverlayElement,
} from "../diagram/fibaOverlaySvg";
import { InteractiveFibaEditorBCVB } from "./InteractiveFibaEditorBCVB";
import { BCVBSessionExportCard } from "./BCVBSessionExportCard";
import { SessionFormBCVB, type FormState } from "./SessionFormBCVB";
import { exportElementToPng } from "../utils/exportImage";
import { exportElementToPdf } from "../utils/exportPdf";
import { LibraryPanelBCVB } from "./LibraryPanelBCVB";
import {
  deleteDiagramLibraryItem,
  exportDiagramJson,
  importDiagramJson,
  loadDiagramLibrary,
  upsertDiagramLibraryItem,
} from "../utils/diagramLibrary";

function parseLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function nowIso() {
  return new Date().toISOString();
}

function makeSnapshot(
  id: string,
  form: FormState,
  elements: OverlayElement[],
  actions: OverlayAction[],
  previous?: BCVBDiagramSnapshot
): BCVBDiagramSnapshot {
  return {
    id,
    title: form.title,
    category: form.category,
    theme: form.theme,
    createdAt: previous?.createdAt || nowIso(),
    updatedAt: nowIso(),
    elements,
    actions,
  };
}

export function BCVBBuilderPage() {
  const exportRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [currentId, setCurrentId] = useState<string>("session-bcvb-courante");
  const [libraryVersion, setLibraryVersion] = useState(0);

  const [form, setForm] = useState<FormState>({
    title: "Situation BCVB",
    category: "U15",
    theme: "Lecture / avantage",
    duration: "12 min",
    objective: "Créer un avantage rapide sur réception puis enchaîner une lecture simple.",
    instructions: "Départ engagé\nRecevoir orienté cercle\nDécider vite",
    coachingPoints: "Bas sur appuis\nPrendre l'information avant réception\nJouer à pleine vitesse",
    variables: "Défenseur en retard\nMain faible imposée",
    successCriteria: "Avantage créé rapidement\nBonne lecture\nFinition équilibrée",
  });

  const [elements, setElements] = useState<OverlayElement[]>([
    { id: "a1", type: "attacker", x: 4.8, y: 3.0, label: "1" },
    { id: "a2", type: "attacker", x: 7.2, y: 6.0, label: "2" },
    { id: "a3", type: "attacker", x: 13.8, y: 3.8, label: "3" },
    { id: "d1", type: "defender", x: 11.2, y: 2.8, label: "X1" },
    { id: "c1", type: "coach", x: 13.5, y: 1.2, label: "C" },
    { id: "cone1", type: "cone", x: 3.8, y: 8.0 },
    { id: "ball1", type: "ball", x: 5.6, y: 3.3 },
    { id: "lab1", type: "label", x: 7.5, y: 2.6, label: "main droite !" },
    {
      id: "zone1",
      type: "zone",
      x: 8.6,
      y: 4.8,
      width: 3.6,
      height: 2.2,
      label: "Zone forte",
      color: "rgba(59,130,246,0.18)",
    },
  ]);

  const [actions, setActions] = useState<OverlayAction[]>([
    {
      id: "p1",
      type: "pass",
      from: { x: 5.0, y: 3.1 },
      to: { x: 12.0, y: 4.2 },
      label: "passe",
      order: 1,
    },
    {
      id: "dri1",
      type: "dribble",
      from: { x: 12.0, y: 4.2 },
      to: { x: 15.0, y: 3.2 },
      label: "attaque",
      order: 2,
    },
  ]);

  const library = useMemo(() => loadDiagramLibrary(), [libraryVersion]);
  const existingSnapshot = useMemo(
    () => library.find((item) => item.id === currentId),
    [library, currentId]
  );

  const snapshot = useMemo(
    () => makeSnapshot(currentId, form, elements, actions, existingSnapshot),
    [currentId, form, elements, actions, existingSnapshot]
  );

  return (
    <div className="bcvb-builder-page">
      <div className="bcvb-builder-topbar">
        <div>
          <div className="bcvb-topbar-kicker">BCVB</div>
          <h1>Builder séance + diagramme</h1>
          <p>V15 premium diagrammes • bibliothèque • JSON • export PNG / PDF / SVG</p>
        </div>

        <div className="bcvb-topbar-actions">
          <button
            className="bcvb-btn"
            onClick={() => {
              upsertDiagramLibraryItem(snapshot);
              setLibraryVersion((value) => value + 1);
            }}
          >
            Sauvegarder bibliothèque
          </button>

          <button
            className="bcvb-btn secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            Import JSON
          </button>

          <button
            className="bcvb-btn active"
            onClick={() => {
              if (exportRef.current) {
                void exportElementToPng(exportRef.current, "fiche-bcvb.png");
              }
            }}
          >
            Export PNG
          </button>

          <button
            className="bcvb-btn active"
            onClick={() => {
              if (exportRef.current) {
                void exportElementToPdf(exportRef.current, "fiche-bcvb.pdf");
              }
            }}
          >
            Export PDF
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;

            const imported = await importDiagramJson(file);

            setCurrentId(imported.id || `import-${Date.now()}`);
            setForm((previous) => ({
              ...previous,
              title: imported.title || previous.title,
              category: imported.category || previous.category,
              theme: imported.theme || previous.theme,
            }));
            setElements(imported.elements || []);
            setActions(imported.actions || []);

            event.target.value = "";
          }}
        />
      </div>

      <div className="bcvb-builder-grid">
        <div className="bcvb-builder-left">
          <SessionFormBCVB
            {...form}
            onChange={(patch) => setForm((previous) => ({ ...previous, ...patch }))}
          />

          <LibraryPanelBCVB
            items={library}
            currentId={currentId}
            onOpen={(item) => {
              setCurrentId(item.id);
              setForm((previous) => ({
                ...previous,
                title: item.title,
                category: item.category || previous.category,
                theme: item.theme || previous.theme,
              }));
              setElements(item.elements || []);
              setActions(item.actions || []);
            }}
            onDelete={(id) => {
              deleteDiagramLibraryItem(id);
              setLibraryVersion((value) => value + 1);
            }}
            onExport={(item) => exportDiagramJson(item)}
          />
        </div>

        <div className="bcvb-builder-center">
          <InteractiveFibaEditorBCVB
            elements={elements}
            actions={actions}
            onChangeElements={setElements}
            onChangeActions={setActions}
          />
        </div>

        <div className="bcvb-builder-right">
          <BCVBSessionExportCard
            ref={exportRef}
            title={form.title}
            category={form.category}
            theme={form.theme}
            duration={form.duration}
            objective={form.objective}
            instructions={parseLines(form.instructions)}
            coachingPoints={parseLines(form.coachingPoints)}
            variables={parseLines(form.variables)}
            successCriteria={parseLines(form.successCriteria)}
            elements={elements}
            actions={actions}
          />
        </div>
      </div>
    </div>
  );
}
