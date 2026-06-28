import { useMemo, useState } from 'react'
import {
  DOCTRINE_PROFILES,
  type CategoryCode,
  type DoctrineId,
  type DocumentFamily,
  type ProductionDepth,
} from '../../document-intelligence'
import { generateMasterPrompt } from '../utils/generateMasterPrompt'

type MasterPromptGeneratorProps = {
  availableSources: Array<{ id: string; title: string }>
  onPromptGenerated?: (prompt: string) => void
}

const FAMILY_OPTIONS: Array<{ value: DocumentFamily; label: string }> = [
  { value: 'category-technical-handbook', label: 'Cahier technique de catégorie' },
  { value: 'category-coach-guide', label: 'Guide coach de catégorie' },
  { value: 'general-coach-guide', label: 'Guide coach général' },
  { value: 'training-plan', label: 'Plan de formation' },
  { value: 'pedagogical-ribbon', label: 'Ruban pédagogique' },
  { value: 'full-session', label: 'Séance complète' },
  { value: 'club-framework', label: 'Document cadre club' },
  { value: 'theme-sheet', label: 'Fiche thème' },
]

const DEPTH_OPTIONS: Array<{ value: ProductionDepth; label: string }> = [
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'bcvb-reference', label: 'Référence BCVB' },
  { value: 'editorial-publication', label: 'Publication club / Qualité éditeur' },
]

const CATEGORY_OPTIONS: CategoryCode[] = [
  'U7',
  'U9',
  'U11',
  'U13',
  'U15',
  'U18',
  'U21',
  'Seniors',
  'General',
]

const DOCTRINE_OPTIONS = Object.values(DOCTRINE_PROFILES)

export function MasterPromptGenerator({
  availableSources,
  onPromptGenerated,
}: MasterPromptGeneratorProps) {
  const [family, setFamily] = useState<DocumentFamily>('category-coach-guide')
  const [depth, setDepth] = useState<ProductionDepth>('bcvb-reference')
  const [category, setCategory] = useState<CategoryCode>('U7')
  const [title, setTitle] = useState('Guide complet du coach U7 au BCVB')
  const [selectedDoctrines, setSelectedDoctrines] = useState<DoctrineId[]>([
    'bcvb',
    'ffbb',
    'canada',
    'usa',
  ])
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [prompt, setPrompt] = useState('')
  const selectedSourceTitles = useMemo(
    () =>
      availableSources
        .filter((source) => selectedSources.includes(source.id))
        .map((source) => source.title),
    [availableSources, selectedSources]
  )

  function toggleDoctrine(id: DoctrineId) {
    setSelectedDoctrines((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )
  }

  function toggleSource(id: string) {
    setSelectedSources((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )
  }

  function handleGenerate() {
    const nextPrompt = generateMasterPrompt({
      family,
      depth,
      category,
      title,
      selectedDoctrines,
      selectedSourceDocuments: selectedSourceTitles,
    })
    setPrompt(nextPrompt)
    onPromptGenerated?.(nextPrompt)
  }

  async function handleCopy() {
    if (!prompt.trim()) return
    await navigator.clipboard.writeText(prompt)
  }

  return (
    <section className="bcvb-premium-panel">
      <div className="bcvb-premium-panel__head">
        <p>Production éditoriale</p>
        <h2>Cadre maître qualité éditeur</h2>
      </div>

      <div className="bcvb-premium-grid">
        <label>
          Famille documentaire
          <select value={family} onChange={(event) => setFamily(event.target.value as DocumentFamily)}>
            {FAMILY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Niveau de production
          <select value={depth} onChange={(event) => setDepth(event.target.value as ProductionDepth)}>
            {DEPTH_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Catégorie
          <select value={category} onChange={(event) => setCategory(event.target.value as CategoryCode)}>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === 'General' ? 'Général BCVB' : option}
              </option>
            ))}
          </select>
        </label>

        <label>
          Titre cible
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
      </div>

      <div className="bcvb-premium-checks">
        {DOCTRINE_OPTIONS.map((doctrine) => (
          <label key={doctrine.id}>
            <input
              type="checkbox"
              checked={selectedDoctrines.includes(doctrine.id)}
              onChange={() => toggleDoctrine(doctrine.id)}
            />
            <span>{doctrine.label}</span>
          </label>
        ))}
      </div>

      {availableSources.length > 0 && (
        <details className="bcvb-premium-sources">
          <summary>Documents source à mobiliser</summary>
          {availableSources.map((source) => (
            <label key={source.id}>
              <input
                type="checkbox"
                checked={selectedSources.includes(source.id)}
                onChange={() => toggleSource(source.id)}
              />
              <span>{source.title}</span>
            </label>
          ))}
        </details>
      )}

      <div className="bcvb-premium-actions">
        <button type="button" onClick={handleGenerate}>
          Préparer le cadre maître qualité éditeur
        </button>
        <button type="button" onClick={handleCopy} disabled={!prompt.trim()}>
          Copier le cadre maître
        </button>
      </div>

      {prompt && <pre className="bcvb-premium-prompt">{prompt}</pre>}
    </section>
  )
}
