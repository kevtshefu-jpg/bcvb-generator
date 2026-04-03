export interface SituationPanelState {
  nom: string;
  categorie: string;
  theme: string;
  etapePedagogique: string;
}

interface Props extends SituationPanelState {
  onChange: (patch: Partial<SituationPanelState>) => void;
}

const CATEGORIES = ["U7", "U9", "U11", "U13", "U15"];
const THEMES = ["1c1", "Tir", "Jeu rapide", "Passe"];
const ETAPES = ["Découvrir", "S'exercer", "Retranscrire", "Réguler"];

export function SituationPanel({ nom, categorie, theme, etapePedagogique, onChange }: Props) {
  return (
    <div className="bcvb-panel">
      <div className="bcvb-panel-title">Situation</div>

      <div className="bcvb-form-stack">
        <div className="bcvb-label-block">
          <span>Nom de la situation</span>
          <input
            type="text"
            className="bcvb-input"
            value={nom}
            onChange={(e) => onChange({ nom: e.target.value })}
            placeholder="Nom de la situation"
          />
        </div>

        <div className="bcvb-label-block">
          <span>Catégorie</span>
          <select
            className="bcvb-input"
            value={categorie}
            onChange={(e) => onChange({ categorie: e.target.value })}
          >
            <option value="">— Choisir —</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="bcvb-label-block">
          <span>Thème</span>
          <select
            className="bcvb-input"
            value={theme}
            onChange={(e) => onChange({ theme: e.target.value })}
          >
            <option value="">— Choisir —</option>
            {THEMES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="bcvb-label-block">
          <span>Étape pédagogique</span>
          <select
            className="bcvb-input"
            value={etapePedagogique}
            onChange={(e) => onChange({ etapePedagogique: e.target.value })}
          >
            <option value="">— Choisir —</option>
            {ETAPES.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
