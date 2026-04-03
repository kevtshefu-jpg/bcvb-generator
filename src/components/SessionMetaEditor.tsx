import type { BCVBSession, SessionGameFormat, SessionUsageLevel } from "../types/session";

interface Props {
  session: BCVBSession;
  onChange: (patch: Partial<BCVBSession>) => void;
}

const USAGE_LEVELS: SessionUsageLevel[] = [
  "initiation",
  "formation",
  "perfectionnement",
  "pré-compétition",
  "compétition",
];

const GAME_FORMATS: SessionGameFormat[] = [
  "1c0",
  "1c1",
  "2c1",
  "2c2",
  "3c3",
  "4c4",
  "5c5",
  "atelier",
  "jeu réduit",
  "non précisé",
];

export function SessionMetaEditor({ session, onChange }: Props) {
  const patchMetadata = (patch: Partial<BCVBSession["metadata"]>) => {
    onChange({
      metadata: {
        ...session.metadata,
        ...patch,
      },
    });
  };

  const toggleAxis = (axis: string) => {
    const hasAxis = session.axes.includes(axis);
    onChange({
      axes: hasAxis
        ? session.axes.filter((value) => value !== axis)
        : [...session.axes, axis],
    });
  };

  return (
    <div className="meta-editor">
      <h3>Métadonnées séance</h3>

      <div className="meta-grid">
        <label>
          <span>Sous-thème</span>
          <input
            type="text"
            value={session.metadata.subTheme}
            onChange={(e) => patchMetadata({ subTheme: e.target.value })}
          />
        </label>

        <label>
          <span>Format de jeu</span>
          <select
            value={session.metadata.gameFormat}
            onChange={(e) => patchMetadata({ gameFormat: e.target.value as SessionGameFormat })}
          >
            {GAME_FORMATS.map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Niveau d'usage</span>
          <select
            value={session.metadata.usageLevel}
            onChange={(e) => patchMetadata({ usageLevel: e.target.value as SessionUsageLevel })}
          >
            {USAGE_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Nombre de joueurs</span>
          <input
            type="number"
            min={0}
            value={session.metadata.playerCount ?? ""}
            onChange={(e) => {
              const next = e.target.value.trim();
              patchMetadata({
                playerCount: next === "" ? null : Number(next),
              });
            }}
          />
        </label>

        <label className="meta-grid-full">
          <span>Mots-clés (séparés par ;)</span>
          <input
            type="text"
            value={session.metadata.keywords.join("; ")}
            onChange={(e) => {
              const keywords = e.target.value
                .split(";")
                .map((value) => value.trim())
                .filter(Boolean);
              patchMetadata({ keywords });
            }}
          />
        </label>
      </div>

      <div className="axes-editor">
        <span>Axes BCVB</span>
        <div className="axes-editor-buttons">
          {["intensité", "agressivité", "maîtrise", "jeu"].map((axis) => (
            <button
              key={axis}
              type="button"
              className={session.axes.includes(axis) ? "axis-active" : ""}
              onClick={() => toggleAxis(axis)}
            >
              {axis}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
