import { useMemo, useState } from 'react'
import type { TrainingSessionV2 } from './sessionModels'
import { buildImportedSessionToBcvbPrompt, parseImportedSession } from './importedSessionParser'
import { transformRawTextToSession } from './sessionTransformer'
import { SessionAttachmentImporter } from './SessionAttachmentImporter'

type SessionImportPanelProps = {
  currentSession: TrainingSessionV2
  onImportSession: (session: TrainingSessionV2) => void
  onClose?: () => void
}

export function SessionImportPanel({ currentSession, onImportSession, onClose }: SessionImportPanelProps) {
  const [rawText, setRawText] = useState(currentSession.sourceRawText || '')
  const [extractedText, setExtractedText] = useState(currentSession.sourceExtractedText || '')
  const [fileName, setFileName] = useState(currentSession.sourceFileName || '')
  const [message, setMessage] = useState('')
  const [aiResponse, setAiResponse] = useState('')

  const transformationPrompt = useMemo(() => buildImportedSessionToBcvbPrompt(extractedText || rawText, {
    category: currentSession.category,
    theme: currentSession.theme,
    subTheme: currentSession.subTheme,
    coachName: currentSession.coachName,
    teamLabel: currentSession.teamLabel,
    fileName,
  }), [currentSession.category, currentSession.coachName, currentSession.subTheme, currentSession.teamLabel, currentSession.theme, extractedText, fileName, rawText])

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(transformationPrompt)
      setMessage('Consigne de transformation copiée.')
    } catch {
      setMessage('Copie automatique impossible. La consigne reste affichée et sélectionnable.')
    }
  }

  function transformLocally() {
    const source = extractedText || rawText
    if (!source.trim()) {
      setMessage('Ajoute une source texte avant de transformer.')
      return
    }
    onImportSession(transformRawTextToSession(source, {
      category: currentSession.category,
      theme: currentSession.theme,
      subTheme: currentSession.subTheme,
      coachName: currentSession.coachName,
      teamLabel: currentSession.teamLabel,
      sourceFileName: fileName,
    }))
    setMessage('Séance transformée avec le fallback local BCVB.')
    onClose?.()
  }

  function parseAiResponse() {
    const source = aiResponse || extractedText || rawText
    if (!source.trim()) {
      setMessage('Colle un contenu préparé ou une source texte avant de créer la séance.')
      return
    }
    const nextSession = parseImportedSession(source, {
      fileName,
      category: currentSession.category,
      theme: currentSession.theme,
      subTheme: currentSession.subTheme,
      coachName: currentSession.coachName,
      teamLabel: currentSession.teamLabel,
    })
    onImportSession({
      ...nextSession,
      sourceRawText: rawText,
      sourceExtractedText: extractedText || source,
      sourceFileName: fileName,
      coachName: currentSession.coachName || nextSession.coachName,
      teamLabel: currentSession.teamLabel || nextSession.teamLabel,
    })
    setMessage('Séance créée depuis la source transformée.')
    onClose?.()
  }

  return (
    <section className="session-card session-import-panel">
      <header className="session-section-header">
        <div>
          <p className="bcvb-eyebrow">Importer</p>
          <h2>Importer une séance existante</h2>
        </div>
        {onClose && <button type="button" onClick={onClose}>Fermer</button>}
      </header>

      <SessionAttachmentImporter
        label="Photo, PDF, scan ou document de séance"
        extractedText={extractedText || rawText}
        fileName={fileName}
        onExtractedTextChange={(text) => { setRawText(text); setExtractedText(text) }}
        onFileNameChange={setFileName}
      />

      <div className="session-actions">
        <button type="button" onClick={transformLocally}>Transformer en séance BCVB</button>
        <button type="button" onClick={parseAiResponse}>Créer une séance depuis cette source</button>
        <button type="button" onClick={copyPrompt}>Copier la consigne de transformation</button>
      </div>

      <label className="session-full-field">
        <span>Contenu préparé</span>
        <textarea value={aiResponse} onChange={(event) => setAiResponse(event.target.value)} placeholder="Colle ici le JSON + Markdown préparé si tu veux parser une transformation." />
      </label>

      <details className="session-import-prompt">
        <summary>Voir la consigne de transformation</summary>
        <pre>{transformationPrompt}</pre>
      </details>
      {message && <p className="session-warning">{message}</p>}
    </section>
  )
}
