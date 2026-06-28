import { useMemo, useState } from 'react'
import { buildOcrSessionPrompt } from './importedSessionParser'

type SessionAttachmentImporterProps = {
  label?: string
  extractedText: string
  fileName: string
  onExtractedTextChange: (text: string) => void
  onFileNameChange: (fileName: string) => void
}

const acceptedExtensions = '.jpg,.jpeg,.png,.webp,.pdf,.docx,.txt,.md'

export function SessionAttachmentImporter({ label = 'Pièce jointe', extractedText, fileName, onExtractedTextChange, onFileNameChange }: SessionAttachmentImporterProps) {
  const [message, setMessage] = useState('')
  const ocrPrompt = useMemo(() => buildOcrSessionPrompt({ fileName, fileType: fileName.split('.').pop() || '' }), [fileName])

  async function handleFile(file?: File) {
    if (!file) return
    onFileNameChange(file.name)
    const extension = file.name.split('.').pop()?.toLowerCase()

    if (extension && ['txt', 'md'].includes(extension)) {
      const text = await file.text()
      onExtractedTextChange(text)
      setMessage('Texte extrait depuis le document texte.')
      return
    }

    setMessage('Lecture automatique non disponible localement. Colle le texte extrait ou utilise la consigne de transcription.')
    if (!extractedText) onExtractedTextChange(`Fichier importé : ${file.name}\nColle ici le texte OCR ou la transcription de la fiche.`)
  }

  async function copyOcrPrompt() {
    try {
      await navigator.clipboard.writeText(ocrPrompt)
      setMessage('Consigne de transcription copiée.')
    } catch {
      setMessage('Copie automatique impossible. La consigne de transcription reste visible.')
    }
  }

  return (
    <div className="session-attachment-importer">
      <div className="session-import-grid">
        <label>
          <span>{label}</span>
          <input type="file" accept={acceptedExtensions} onChange={(event) => handleFile(event.target.files?.[0])} />
        </label>
        <div>
          <p className="bcvb-eyebrow">Formats acceptés</p>
          <p>Importer une photo, un PDF, un scan ou un document texte.</p>
        </div>
      </div>
      <label className="session-full-field">
        <span>Texte extrait / transcription</span>
        <textarea value={extractedText} onChange={(event) => onExtractedTextChange(event.target.value)} placeholder="Colle ici le texte OCR, la transcription ou le contenu brut de la fiche." />
      </label>
      <div className="session-actions">
        <button type="button" onClick={copyOcrPrompt}>Copier la consigne de transcription</button>
      </div>
      <details className="session-import-prompt">
        <summary>Voir la consigne de transcription</summary>
        <pre>{ocrPrompt}</pre>
      </details>
      {message && <p className="session-warning">{message}</p>}
    </div>
  )
}
