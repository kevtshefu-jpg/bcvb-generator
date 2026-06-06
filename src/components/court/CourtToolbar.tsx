import type { CourtMode, CourtObjectKind, MotionKind } from "../../types/court";
import { getReadableModeLabel } from "../../lib/courtGeometry";

export type CourtActiveTool =
  | { type: "object"; kind: CourtObjectKind }
  | { type: "motion"; kind: MotionKind }
  | { type: "zone" }
  | null;

type CourtToolbarProps = {
  mode: CourtMode;
  activeTool: CourtActiveTool;
  curvedMode: boolean;
  pendingMotionLabel?: string;
  showCenterLogo?: boolean;
  onModeChange: (mode: CourtMode) => void;
  onLogoChange: (show: boolean) => void;
  onSelectObjectTool: (kind: CourtObjectKind) => void;
  onSelectMotionTool: (kind: MotionKind) => void;
  onSelectZoneTool: () => void;
  onCurvedModeChange: (curved: boolean) => void;
  onClearTool: () => void;
  onExportSvg: () => void;
  onExportPng: () => void;
  onDuplicate?: () => void;
};

export function CourtToolbar({
  mode,
  activeTool,
  curvedMode,
  pendingMotionLabel,
  showCenterLogo,
  onModeChange,
  onLogoChange,
  onSelectObjectTool,
  onSelectMotionTool,
  onSelectZoneTool,
  onCurvedModeChange,
  onClearTool,
  onExportSvg,
  onExportPng,
  onDuplicate,
}: CourtToolbarProps) {
  const activeLabel = activeTool
    ? activeTool.type === "zone"
      ? "Zone"
      : activeTool.kind
    : "Selection";
  const isObjectActive = (kind: CourtObjectKind) => activeTool?.type === "object" && activeTool.kind === kind;
  const isMotionActive = (kind: MotionKind) => activeTool?.type === "motion" && activeTool.kind === kind;

  return (
    <div className="fastdraw-toolbar" aria-label="Outils terrain">
      <div className="fastdraw-toolbar__group">
        <span>Terrain</span>
        <select value={mode} onChange={(event) => onModeChange(event.target.value as CourtMode)} aria-label="Mode terrain">
          <option value="half-right">{getReadableModeLabel("half-right")}</option>
          <option value="half-left">{getReadableModeLabel("half-left")}</option>
          <option value="full">{getReadableModeLabel("full")}</option>
        </select>
        <label className="fastdraw-logo-toggle">
          <input type="checkbox" checked={Boolean(showCenterLogo)} onChange={(event) => onLogoChange(event.target.checked)} />
          Logo central : {showCenterLogo ? "ON" : "OFF"}
        </label>
      </div>

      <div className="fastdraw-toolbar__group">
        <span>Objets</span>
        <button type="button" className={isObjectActive("player") ? "is-active" : ""} onClick={() => onSelectObjectTool("player")}>Joueur</button>
        <button type="button" className={isObjectActive("defender") ? "is-active" : ""} onClick={() => onSelectObjectTool("defender")}>Defense</button>
        <button type="button" className={isObjectActive("coach") ? "is-active" : ""} onClick={() => onSelectObjectTool("coach")}>Coach</button>
        <button type="button" className={isObjectActive("ball") ? "is-active" : ""} onClick={() => onSelectObjectTool("ball")}>Ballon</button>
        <button type="button" className={isObjectActive("cone") ? "is-active" : ""} onClick={() => onSelectObjectTool("cone")}>Plot</button>
        <button type="button" className={isObjectActive("hands") ? "is-active" : ""} onClick={() => onSelectObjectTool("hands")}>H</button>
        <button type="button" className={isObjectActive("text") ? "is-active" : ""} onClick={() => onSelectObjectTool("text")}>Texte</button>
      </div>

      <div className="fastdraw-toolbar__group">
        <span>Actions</span>
        <button type="button" className={isMotionActive("move") ? "is-active" : ""} onClick={() => onSelectMotionTool("move")}>Course</button>
        <button type="button" className={isMotionActive("pass") ? "is-active" : ""} onClick={() => onSelectMotionTool("pass")}>Passe</button>
        <button type="button" className={isMotionActive("dribble") ? "is-active" : ""} onClick={() => onSelectMotionTool("dribble")}>Dribble</button>
        <button type="button" className={isMotionActive("screen") ? "is-active" : ""} onClick={() => onSelectMotionTool("screen")}>Ecran</button>
        <button type="button" className={activeTool?.type === "zone" ? "is-active" : ""} onClick={onSelectZoneTool}>Zone</button>
        <label className="fastdraw-logo-toggle">
          <input type="checkbox" checked={curvedMode} onChange={(event) => onCurvedModeChange(event.target.checked)} />
          Courbe : {curvedMode ? "ON" : "OFF"}
        </label>
      </div>

      <div className="fastdraw-toolbar__group fastdraw-toolbar__status">
        <span>Outil actif</span>
        <strong>{activeLabel}</strong>
        {pendingMotionLabel && <em>{pendingMotionLabel}</em>}
        <button type="button" onClick={onClearTool}>Selection</button>
      </div>

      <div className="fastdraw-toolbar__group fastdraw-toolbar__group--exports">
        <span>Export</span>
        {onDuplicate && <button type="button" onClick={onDuplicate}>Dupliquer</button>}
        <button type="button" onClick={onExportSvg}>SVG</button>
        <button type="button" onClick={onExportPng}>PNG</button>
      </div>
    </div>
  );
}
