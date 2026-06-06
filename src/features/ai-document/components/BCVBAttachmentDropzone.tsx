import { useRef, useState } from 'react'
import {
  extractTextFromAttachment,
  type ExtractedAttachmentText,
} from '../utils/extractTextFromAttachment'

type ExtractionStatus =
  | 'idle'
  | 'reading'
  | 'pdf-text-extraction'
  | 'pdf-rendering'
  | 'ocr-processing'
  | 'cleaning'
  | 'success'
  | 'error'

export type BCVBAttachmentDropzoneProps = {
  onExtractedText: (payload: ExtractedAttachmentText) => void
}

function formatSize(size: number) {
  if (size < 1024) return `${size} o`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`
}

export function BCVBAttachmentDropzone({ onExtractedText }: BCVBAttachmentDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [status, setStatus] = useState<ExtractionStatus>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  async function handleFile(selectedFile: File | undefined) {
    if (!selectedFile) return

    setFile(selectedFile)
    setError(null)
    setWarning(null)
    const extension = selectedFile.name.split('.').pop()?.toLowerCase() ?? ''
    const isPdf = extension === 'pdf' || selectedFile.type === 'application/pdf'
    const isOcrCandidate =
      selectedFile.type.startsWith('image/') ||
      ['png', 'jpg', 'jpeg', 'webp'].includes(extension)
    setStatus(isOcrCandidate ? 'ocr-processing' : isPdf ? 'pdf-text-extraction' : 'reading')

    try {
      const payload = await extractTextFromAttachment(selectedFile)
      setWarning(payload.warning ?? null)
      setStatus(payload.warning && !payload.text.trim() ? 'error' : 'success')
      onExtractedText(payload)
    } catch (extractError) {
      setStatus('error')
      setError(
        extractError instanceof Error
          ? extractError.message
          : 'Erreur lors de l’extraction du fichier.'
      )
    }
  }

  return (
    <section
      style={styles.dropzone}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        handleFile(event.dataTransfer.files[0]).catch(() => undefined)
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md,.pdf,.docx,image/*"
        style={{ display: 'none' }}
        onChange={(event) => handleFile(event.target.files?.[0]).catch(() => undefined)}
      />

      <div>
        <p style={styles.kicker}>Pièce jointe</p>
        <h3 style={styles.title}>Importer un document source</h3>
        <p style={styles.text}>
          Dépose un fichier ou sélectionne un document `.txt`, `.md`, `.pdf` ou `.docx`.
        </p>
      </div>

      <button
        type="button"
        className="bcvb-primary-btn"
        onClick={() => inputRef.current?.click()}
      >
        Choisir un fichier
      </button>

      {file && (
        <div style={styles.fileCard}>
          <strong>{file.name}</strong>
          <span>{file.type || 'Type inconnu'} · {formatSize(file.size)}</span>
          <small>
            {status === 'reading'
              ? 'Lecture du fichier...'
              : status === 'pdf-text-extraction'
                ? 'Extraction texte PDF...'
              : status === 'pdf-rendering'
                ? 'Rendu PDF en images...'
              : status === 'ocr-processing'
                ? 'OCR en cours...'
              : status === 'cleaning'
                ? 'Nettoyage du texte...'
              : status === 'success'
                ? 'Texte extrait'
                : status === 'error'
                  ? 'Extraction à vérifier'
                  : 'En attente'}
          </small>
          {status === 'success' && warning?.includes('OCR') && (
            <small>{warning}</small>
          )}
        </div>
      )}

      {warning && <p style={styles.warning}>{warning}</p>}
      {error && <p style={styles.error}>{error}</p>}
    </section>
  )
}

const styles: Record<string, React.CSSProperties> = {
  dropzone: {
    display: 'grid',
    gap: 14,
    padding: 20,
    borderRadius: 18,
    border: '2px dashed rgba(200, 16, 46, 0.35)',
    background: '#fff7f7',
  },
  kicker: {
    margin: '0 0 6px',
    color: '#c8102e',
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  title: {
    margin: 0,
    color: '#111827',
  },
  text: {
    margin: '8px 0 0',
    color: '#4b5563',
    fontWeight: 700,
  },
  fileCard: {
    display: 'grid',
    gap: 4,
    padding: 14,
    borderRadius: 14,
    background: '#ffffff',
    border: '1px solid #fecaca',
    color: '#111827',
  },
  warning: {
    margin: 0,
    color: '#92400e',
    fontWeight: 800,
  },
  error: {
    margin: 0,
    color: '#991b1b',
    fontWeight: 800,
  },
}
