import { useMemo, useRef } from "react";
import type { ReconstructionPoint, SessionSourceImage } from "../types/session";

interface Props {
  images: SessionSourceImage[];
  activeSourceImageId: string | null;
  points: ReconstructionPoint[];
  notes: string;
  onSetActiveImage: (id: string | null) => void;
  onAddPoint: (payload: { x: number; y: number }) => void;
  onDeletePoint: (id: string) => void;
  onRenamePoint: (id: string, label: string) => void;
  onUpdateNotes: (notes: string) => void;
}

export function ReconstructionAssistPanel({
  images,
  activeSourceImageId,
  points,
  notes,
  onSetActiveImage,
  onAddPoint,
  onDeletePoint,
  onRenamePoint,
  onUpdateNotes,
}: Props) {
  const imageRef = useRef<HTMLImageElement | null>(null);

  const activeImage = useMemo(() => {
    if (!images.length) return null;
    return (
      images.find((img) => img.id === activeSourceImageId) ||
      images.find((img) => img.isPrimary) ||
      images[0]
    );
  }, [images, activeSourceImageId]);

  const handleImageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!activeImage || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    if (x < 0 || x > 1 || y < 0 || y > 1) return;

    onAddPoint({
      x: Number(x.toFixed(4)),
      y: Number(y.toFixed(4)),
    });
  };

  return (
    <div className="reconstruction-panel">
      <div className="reconstruction-header">
        <h3>Reconstruction assistée</h3>
        <p>{points.length} repère(s)</p>
      </div>

      {images.length > 0 ? (
        <div className="reconstruction-source-select">
          <label>
            <span>Visuel actif</span>
            <select
              value={activeImage?.id || ""}
              onChange={(e) => onSetActiveImage(e.target.value || null)}
            >
              {images.map((img) => (
                <option key={img.id} value={img.id}>
                  {img.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {!activeImage ? (
        <div className="reconstruction-empty">
          Ajoute d’abord un visuel source pour commencer la reconstruction assistée.
        </div>
      ) : (
        <>
          <div className="reconstruction-instructions">
            Clique sur le visuel pour poser des repères. Tu pourras ensuite les nommer.
          </div>

          <div className="reconstruction-image-stage" onClick={handleImageClick}>
            <img ref={imageRef} src={activeImage.dataUrl} alt={activeImage.name} />

            {points.map((point, index) => (
              <div
                key={point.id}
                className="reconstruction-point-marker"
                style={{
                  left: `${point.x * 100}%`,
                  top: `${point.y * 100}%`,
                  background: point.color,
                }}
                title={`${index + 1}. ${point.label}`}
              >
                {index + 1}
              </div>
            ))}
          </div>

          <div className="reconstruction-points-list">
            {points.length === 0 ? (
              <div className="reconstruction-empty">Aucun repère pour le moment.</div>
            ) : (
              points.map((point, index) => (
                <div key={point.id} className="reconstruction-point-row">
                  <div
                    className="reconstruction-point-swatch"
                    style={{ background: point.color }}
                  />
                  <span className="reconstruction-point-index">{index + 1}</span>
                  <input
                    type="text"
                    value={point.label}
                    onChange={(e) => onRenamePoint(point.id, e.target.value)}
                  />
                  <span className="reconstruction-point-coords">
                    {point.x.toFixed(2)} / {point.y.toFixed(2)}
                  </span>
                  <button onClick={() => onDeletePoint(point.id)}>Supprimer</button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <div className="reconstruction-notes">
        <label>
          <span>Notes de reconstruction</span>
          <textarea
            value={notes}
            onChange={(e) => onUpdateNotes(e.target.value)}
            placeholder="Ex : file de départ en bas à gauche, coach axe haut, cône central..."
          />
        </label>
      </div>
    </div>
  );
}
