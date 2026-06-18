import type { PrintOrientation } from "../services/printLayoutService";

type PrintPreviewToolbarProps = {
  orientation: PrintOrientation;
  recommendedOrientation?: PrintOrientation;
  onOrientationChange: (orientation: PrintOrientation) => void;
};

export default function PrintPreviewToolbar({
  orientation,
  recommendedOrientation,
  onOrientationChange,
}: PrintPreviewToolbarProps) {
  return (
    <div className="print-preview-toolbar no-print">
      <span>
        Orientation PDF
        {recommendedOrientation && recommendedOrientation !== orientation
          ? ` · recommandée : ${recommendedOrientation === "landscape" ? "paysage" : "portrait"}`
          : ""}
      </span>
      <button type="button" className={orientation === "portrait" ? "is-active" : ""} onClick={() => onOrientationChange("portrait")}>
        A4 portrait
      </button>
      <button type="button" className={orientation === "landscape" ? "is-active" : ""} onClick={() => onOrientationChange("landscape")}>
        A4 paysage
      </button>
    </div>
  );
}
