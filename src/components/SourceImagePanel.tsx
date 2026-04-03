import type { SessionSourceImage } from "../types/session";

interface Props {
  images: SessionSourceImage[];
  onSetPrimary: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateKind: (id: string, kind: SessionSourceImage["kind"]) => void;
}

export function SourceImagePanel({
  images,
  onSetPrimary,
  onDelete,
  onUpdateKind,
}: Props) {
  return (
    <div className="source-images-panel">
      <div className="source-images-header">
        <h3>Visuels sources</h3>
        <p>{images.length} image(s)</p>
      </div>

      {images.length === 0 ? (
        <div className="source-images-empty">
          Aucun visuel importé pour cette séance.
        </div>
      ) : (
        <div className="source-images-grid">
          {images.map((image) => (
            <div
              key={image.id}
              className={`source-image-card ${image.isPrimary ? "primary" : ""}`}
            >
              <div className="source-image-preview">
                <img src={image.dataUrl} alt={image.name} />
              </div>

              <div className="source-image-meta">
                <strong>{image.name}</strong>
                <span>
                  {image.width} × {image.height}
                </span>
                {typeof image.page === "number" ? <span>Page {image.page}</span> : null}
              </div>

              <div className="source-image-controls">
                <select
                  value={image.kind || "source"}
                  onChange={(e) =>
                    onUpdateKind(image.id, e.target.value as SessionSourceImage["kind"])
                  }
                >
                  <option value="source">Source</option>
                  <option value="diagramme_pdf">Diagramme PDF</option>
                  <option value="illustration">Illustration</option>
                </select>

                <button onClick={() => onSetPrimary(image.id)}>
                  {image.isPrimary ? "Visuel principal" : "Définir principal"}
                </button>

                <button onClick={() => onDelete(image.id)}>Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
