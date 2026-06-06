import type {
  DocumentFamilyId,
} from '../../documents/standards/documentFamilyStandards'
import type { DoctrineId } from '../../document-intelligence'

export type DocumentProductionSettings = {
  family: DocumentFamilyId | ''
  productionLevel: string
  category: string
  audience: string
  season: string
  targetTitle: string
  selectedReferentials: DoctrineId[]
}

type Option<T extends string = string> = {
  value: T
  label: string
  description?: string
}

type DocumentFramingPanelProps = {
  settings: DocumentProductionSettings
  onChange: (settings: DocumentProductionSettings) => void
  familyOptions: Array<Option<DocumentFamilyId>>
  referentialOptions: Array<Option<DoctrineId>>
}

const LEVELS = ['Standard', 'Premium', 'Qualité éditeur', 'Référence club']
const CATEGORIES = ['U7', 'U9', 'U11', 'U13', 'U15', 'U18', 'U21', 'Seniors', 'Général BCVB']
const AUDIENCES = ['Coachs', 'Responsables techniques', 'Dirigeants', 'Parents', 'Joueurs', 'Interne club']
const SEASONS = ['2025-2026', '2026-2027', 'Générique / intemporel']

export function DocumentFramingPanel({
  settings,
  onChange,
  familyOptions,
  referentialOptions,
}: DocumentFramingPanelProps) {
  const hasError = !settings.family || !settings.targetTitle.trim()

  function update<K extends keyof DocumentProductionSettings>(
    key: K,
    value: DocumentProductionSettings[K]
  ) {
    onChange({ ...settings, [key]: value })
  }

  function toggleReferential(id: DoctrineId) {
    update(
      'selectedReferentials',
      settings.selectedReferentials.includes(id)
        ? settings.selectedReferentials.filter((item) => item !== id)
        : [...settings.selectedReferentials, id]
    )
  }

  return (
    <section className="ai-studio-card">
      <div className="ai-studio-card__header">
        <p className="ai-studio-kicker">Étape 1</p>
        <h2>Cadrage documentaire</h2>
        <p>Définis le document cible avant de produire le prompt ou d’analyser une source.</p>
      </div>

      {hasError && (
        <p className="ai-studio-alert ai-studio-alert--warning">
          Famille documentaire et titre cible sont obligatoires pour générer un prompt fiable.
        </p>
      )}

      <div className="ai-studio-form-grid">
        <label>
          <span>Famille documentaire</span>
          <select value={settings.family} onChange={(event) => update('family', event.target.value as DocumentFamilyId)}>
            <option value="">Sélectionner une famille</option>
            {familyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Niveau de production</span>
          <select value={settings.productionLevel} onChange={(event) => update('productionLevel', event.target.value)}>
            {LEVELS.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Catégorie</span>
          <select value={settings.category} onChange={(event) => update('category', event.target.value)}>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Audience</span>
          <select value={settings.audience} onChange={(event) => update('audience', event.target.value)}>
            {AUDIENCES.map((audience) => (
              <option key={audience} value={audience}>{audience}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Saison</span>
          <select value={settings.season} onChange={(event) => update('season', event.target.value)}>
            {SEASONS.map((season) => (
              <option key={season} value={season}>{season}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Titre cible</span>
          <input
            value={settings.targetTitle}
            onChange={(event) => update('targetTitle', event.target.value)}
            placeholder="Ex : Guide complet du coach U7 BCVB"
          />
        </label>
      </div>

      <div className="ai-studio-referentials">
        <h3>Référentiels à mobiliser</h3>
        {referentialOptions.map((option) => (
          <label key={option.value} className="ai-studio-check-card">
            <input
              type="checkbox"
              checked={settings.selectedReferentials.includes(option.value)}
              onChange={() => toggleReferential(option.value)}
            />
            <span>
              <strong>{option.label}</strong>
              {option.description && <small>{option.description}</small>}
            </span>
          </label>
        ))}
      </div>
    </section>
  )
}
