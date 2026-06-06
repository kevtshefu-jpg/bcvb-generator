import type { LibraryDocumentRow } from '../../library/services/libraryService'
import { BCVBAttachmentDropzone } from './BCVBAttachmentDropzone'

export type DocumentSourceMode = 'text' | 'attachment' | 'library' | 'ocr'
export type DocumentSourceState = 'idle' | 'uploading' | 'extracting' | 'extracted' | 'error'

export type DocumentSourcePayload = {
  mode: DocumentSourceMode
  text: string
  fileName?: string
  fileType?: string
  status: DocumentSourceState
  quality?: string
}

type DocumentSourcePanelProps = {
  documents: LibraryDocumentRow[]
  source: DocumentSourcePayload
  onSourceChange: (source: DocumentSourcePayload) => void
}

const SOURCE_MODES: Array<{ value: DocumentSourceMode; label: string }> = [
  { value: 'text', label: 'Coller un texte' },
  { value: 'attachment', label: 'Importer une pièce jointe' },
  { value: 'library', label: 'Depuis la bibliothèque' },
  { value: 'ocr', label: 'OCR PDF / image scannée' },
]

function estimateQuality(text: string) {
  if (!text.trim()) return 'Aucune source'
  if (text.length > 4000) return 'Bonne'
  if (text.length > 1200) return 'Correcte'
  return 'Courte, à vérifier'
}

export function DocumentSourcePanel({
  documents,
  source,
  onSourceChange,
}: DocumentSourcePanelProps) {
  function setMode(mode: DocumentSourceMode) {
    onSourceChange({ ...source, mode, status: source.text ? 'extracted' : 'idle' })
  }

  function useLibraryDocument(id: string) {
    const document = documents.find((item) => item.id === id)
    onSourceChange({
      mode: 'library',
      text: document?.content ?? '',
      fileName: document?.title,
      fileType: 'Bibliothèque BCVB',
      status: document?.content ? 'extracted' : 'error',
      quality: estimateQuality(document?.content ?? ''),
    })
  }

  return (
    <section className="ai-studio-card">
      <div className="ai-studio-card__header">
        <p className="ai-studio-kicker">Étape 2</p>
        <h2>Sources</h2>
        <p>Ajoute une matière première à transformer ou pars d’un document vierge.</p>
      </div>

      <div className="ai-source-tabs">
        {SOURCE_MODES.map((mode) => (
          <button
            type="button"
            key={mode.value}
            className={source.mode === mode.value ? 'is-active' : ''}
            onClick={() => setMode(mode.value)}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {source.mode === 'text' && (
        <textarea
          className="ai-studio-textarea"
          value={source.text}
          onChange={(event) =>
            onSourceChange({
              ...source,
              text: event.target.value,
              status: event.target.value.trim() ? 'extracted' : 'idle',
              quality: estimateQuality(event.target.value),
            })
          }
          placeholder="Colle ici un document brut, une trame de séance ou un texte à transformer."
        />
      )}

      {(source.mode === 'attachment' || source.mode === 'ocr') && (
        <>
          {source.mode === 'ocr' && (
            <p className="bcvb-demo-fallback">
              L’extraction OCR est disponible en version expérimentale. Pour une présentation optimale,
              privilégier un PDF texte ou un copier-coller.
            </p>
          )}
          <BCVBAttachmentDropzone
            onExtractedText={(payload) =>
              onSourceChange({
                mode: source.mode,
                text: payload.text,
                fileName: payload.fileName,
                fileType: payload.fileType,
                status: payload.text.trim() ? 'extracted' : 'error',
                quality: payload.warning || estimateQuality(payload.text),
              })
            }
          />
        </>
      )}

      {source.mode === 'library' && (
        <select onChange={(event) => useLibraryDocument(event.target.value)} defaultValue="">
          <option value="" disabled>Choisir un document de bibliothèque</option>
          {documents.map((document) => (
            <option key={document.id} value={document.id}>{document.title}</option>
          ))}
        </select>
      )}

      <div className="ai-source-summary">
        <span><strong>État</strong>{source.status}</span>
        <span><strong>Nom</strong>{source.fileName || 'Texte libre'}</span>
        <span><strong>Type</strong>{source.fileType || source.mode}</span>
        <span><strong>Caractères</strong>{source.text.length}</span>
        <span><strong>Extraction</strong>{source.quality || estimateQuality(source.text)}</span>
      </div>

      {source.text && (
        <details className="ai-studio-details">
          <summary>Prévisualiser la source utilisée</summary>
          <textarea
            value={source.text}
            onChange={(event) =>
              onSourceChange({
                ...source,
                text: event.target.value,
                status: event.target.value.trim() ? 'extracted' : 'idle',
                quality: estimateQuality(event.target.value),
              })
            }
          />
        </details>
      )}
    </section>
  )
}
