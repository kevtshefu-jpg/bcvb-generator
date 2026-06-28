import { useMemo, useState } from 'react'
import type { SessionSituation, SessionVisibility, TrainingSessionV2 } from './sessionModels'
import { buildSingleSituationImportPrompt, parseImportedSituation, transformRawTextToSituation } from './importedSituationParser'
import { saveSituation } from './sessionStorage'
import { SessionAttachmentImporter } from './SessionAttachmentImporter'

type SingleSituationImportPanelProps = {
  currentSession: TrainingSessionV2
  currentUser?: { id?: string | null; role?: string | null }
  onAddToSession: (situation: SessionSituation) => void
  onClose?: () => void
}

export function SingleSituationImportPanel({ currentSession, currentUser, onAddToSession, onClose }: SingleSituationImportPanelProps) {
  const [fileName, setFileName] = useState('')
  const [extractedText, setExtractedText] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState(currentSession.category)
  const [theme, setTheme] = useState(currentSession.theme)
  const [subTheme, setSubTheme] = useState(currentSession.subTheme)
  const [level, setLevel] = useState('intermédiaire')
  const [visibility, setVisibility] = useState<SessionVisibility>('private')
  const [adaptToBcvb, setAdaptToBcvb] = useState(true)

  const prompt = useMemo(() => buildSingleSituationImportPrompt(extractedText, {
    fileName,
    category,
    theme,
    subTheme,
    createdBy: currentUser?.id || '',
    ownerId: currentUser?.id || '',
  }), [category, currentUser?.id, extractedText, fileName, subTheme, theme])

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt)
      setMessage('Consigne situation copiée.')
    } catch {
      setMessage('Copie automatique impossible. La consigne reste affichée.')
    }
  }

  function buildSituationFromSource(useAiResponse = false) {
    const source = useAiResponse ? aiResponse : extractedText
    if (!source.trim()) {
      setMessage('Ajoute un texte extrait ou un contenu préparé avant de transformer.')
      return null
    }
    return useAiResponse
      ? parseImportedSituation(source, {
          fileName,
          category,
          theme,
          subTheme,
          createdBy: currentUser?.id || '',
          ownerId: currentUser?.id || '',
        })
      : transformRawTextToSituation(source, {
          fileName,
          category,
          theme,
          subTheme,
          createdBy: currentUser?.id || '',
          ownerId: currentUser?.id || '',
        })
  }

  function addToSession(useAiResponse = false) {
    const situation = buildSituationFromSource(useAiResponse)
    if (!situation) return
    onAddToSession({
      ...situation,
      category,
      theme,
      subTheme,
      level,
      visibility,
      bcvbObjective: adaptToBcvb
        ? situation.bcvbObjective || 'Adapter la situation aux valeurs BCVB : Défendre Fort, Courir, Partager la Balle.'
        : situation.bcvbObjective,
    })
    setMessage('Situation ajoutée à la séance en cours.')
    onClose?.()
  }

  function saveToLibrary(useAiResponse = false) {
    const situation = buildSituationFromSource(useAiResponse)
    if (!situation) return
    saveSituation({
      ...situation,
      category,
      theme,
      subTheme,
      level,
      visibility,
    })
    setMessage('Situation sauvegardée dans la bibliothèque de situations.')
  }

  function adaptValues() {
    setAdaptToBcvb(true)
    setMessage('Adaptation aux valeurs BCVB activée pour la prochaine transformation.')
  }

  function createCourtAutomatically() {
    const situation = buildSituationFromSource(false)
    if (!situation) return
    onAddToSession({
      ...situation,
      category,
      theme,
      subTheme,
      level,
      visibility,
      courtFrames: situation.courtFrames.length ? situation.courtFrames : transformRawTextToSituation(extractedText || 'Situation terrain à compléter', { category, theme, subTheme }).courtFrames,
    })
    setMessage('Terrain et frames créés automatiquement, situation ajoutée à la séance.')
    onClose?.()
  }

  return (
    <section className="session-card session-import-panel">
      <header className="session-section-header">
        <div>
          <p className="bcvb-eyebrow">Situation isolée</p>
          <h2>Importer une situation pédagogique</h2>
        </div>
        {onClose && <button type="button" onClick={onClose}>Fermer</button>}
      </header>
      <SessionAttachmentImporter
        label="Image, PDF ou document d’exercice"
        extractedText={extractedText}
        fileName={fileName}
        onExtractedTextChange={setExtractedText}
        onFileNameChange={setFileName}
      />
      <div className="session-import-grid">
        <label><span>Catégorie</span><input value={category} onChange={(event) => setCategory(event.target.value as TrainingSessionV2['category'])} /></label>
        <label><span>Thème</span><input value={theme} onChange={(event) => setTheme(event.target.value)} /></label>
        <label><span>Sous-thème</span><input value={subTheme} onChange={(event) => setSubTheme(event.target.value)} /></label>
        <label><span>Niveau</span><select value={level} onChange={(event) => setLevel(event.target.value)}><option value="débutant">Débutant</option><option value="intermédiaire">Intermédiaire</option><option value="confirmé">Confirmé</option><option value="performance">Performance</option></select></label>
        <label><span>Public / privé</span><select value={visibility} onChange={(event) => setVisibility(event.target.value as SessionVisibility)}><option value="private">Privé</option><option value="public_technicians">Techniciens</option><option value="club_reference">Référence BCVB</option></select></label>
        <label className="session-toggle-line"><input type="checkbox" checked={adaptToBcvb} onChange={(event) => setAdaptToBcvb(event.target.checked)} /> Adapter aux valeurs BCVB</label>
      </div>
      <div className="session-actions">
        <button type="button" onClick={adaptValues}>Adapter aux valeurs BCVB</button>
        <button type="button" onClick={createCourtAutomatically}>Créer le terrain automatiquement</button>
        <button type="button" onClick={createCourtAutomatically}>Créer les frames</button>
        <button type="button" onClick={() => addToSession(false)}>Transformer en situation BCVB</button>
        <button type="button" onClick={() => addToSession(false)}>Ajouter à ma séance</button>
        <button type="button" onClick={() => saveToLibrary(false)}>Enregistrer dans la bibliothèque de situations</button>
        <button type="button" onClick={copyPrompt}>Copier la consigne situation</button>
      </div>
      <label className="session-full-field">
        <span>Contenu préparé pour cette situation</span>
        <textarea value={aiResponse} onChange={(event) => setAiResponse(event.target.value)} placeholder="Colle ici le JSON préparé pour cette situation." />
      </label>
      <div className="session-actions">
        <button type="button" onClick={() => addToSession(true)}>Créer depuis le contenu préparé</button>
        <button type="button" onClick={() => saveToLibrary(true)}>Sauvegarder le contenu préparé</button>
      </div>
      <details className="session-import-prompt">
        <summary>Voir la consigne situation BCVB</summary>
        <pre>{prompt}</pre>
      </details>
      {message && <p className="session-warning">{message}</p>}
    </section>
  )
}
