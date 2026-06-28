import { useMemo, useState } from 'react'
import type { LibraryDocumentRow } from '../../library/services/libraryService'
import { saveManualGeneratedDocument } from '../../../services/manualGeneratedDocuments'
import {
  analyzeDocumentQuality,
  type DocumentQualityReport,
} from '../../../utils/documentQuality'
import { normalizeBCVBRichMarkdown } from '../../documents/utils/normalizeBCVBRichMarkdown'
import {
  buildBCVBTransformationPrompt,
  type BCVBTransformationDocumentType,
  type BCVBTransformationLevel,
} from '../prompts/buildBCVBTransformationPrompt'
import { BCVBAttachmentDropzone } from './BCVBAttachmentDropzone'
import type { ExtractedAttachmentText } from '../utils/extractTextFromAttachment'
import { normalizeExtractedText } from '../utils/normalizeExtractedText'

type BCVBDocumentTransformerProps = {
  documents: LibraryDocumentRow[]
  onSaved?: () => Promise<void> | void
}

type SourceKind = 'text' | 'attachment' | 'library'

const DOCUMENT_TYPES: BCVBTransformationDocumentType[] = [
  'Guide coach',
  'Cahier technique',
  'Séance',
  'Situation pédagogique',
  'Planification annuelle',
  'Document cadre',
  'Support de formation',
  'Newsletter',
  'Autre',
]

const TRANSFORMATION_LEVELS: BCVBTransformationLevel[] = [
  'Nettoyage simple',
  'Harmonisation BCVB',
  'Enrichissement technique',
  'Qualité éditeur',
  'Référence club',
]

const CATEGORY_OPTIONS = [
  'Général BCVB',
  'U7',
  'U9',
  'U11',
  'U13',
  'U15',
  'U18',
  'U21',
  'Seniors',
  'Formation coachs',
  'Organisation club',
]

const AUDIENCE_OPTIONS = [
  'Coachs',
  'Responsables techniques',
  'Dirigeants',
  'Joueurs',
  'Parents',
  'Interne club',
]

const SEASON_OPTIONS = ['2025-2026', '2026-2027', 'Générique / intemporel']

function extractTitle(content: string, fallback: string) {
  const heroTitle = /:::bcvb-hero[\s\S]*?^title\s*:\s*(.+)$/im.exec(content)?.[1]
  const markdownTitle = /^#\s+(.+)$/m.exec(content)?.[1]
  return (heroTitle || markdownTitle || fallback).trim()
}

function getQualityMessage(report: DocumentQualityReport | null) {
  if (!report) return null
  if (report.score >= 90) return 'Document transformé au standard Référence club.'
  if (report.score < 85) {
    return 'Transformation encore insuffisante pour publication club. Recommander un enrichissement.'
  }
  return 'Transformation solide, à relire avant publication.'
}

export function BCVBDocumentTransformer({
  documents,
  onSaved,
}: BCVBDocumentTransformerProps) {
  const [sourceText, setSourceText] = useState('')
  const [sourceKind, setSourceKind] = useState<SourceKind>('text')
  const [selectedDocumentId, setSelectedDocumentId] = useState('')
  const [attachmentPayload, setAttachmentPayload] =
    useState<ExtractedAttachmentText | null>(null)
  const [attachmentRawText, setAttachmentRawText] = useState('')
  const [attachmentPreviewTab, setAttachmentPreviewTab] =
    useState<'raw' | 'clean'>('clean')
  const [targetDocumentType, setTargetDocumentType] =
    useState<BCVBTransformationDocumentType>('Guide coach')
  const [targetCategory, setTargetCategory] = useState('U7')
  const [targetAudience, setTargetAudience] = useState('Coachs')
  const [targetSeason, setTargetSeason] = useState('Générique / intemporel')
  const [transformationLevel, setTransformationLevel] =
    useState<BCVBTransformationLevel>('Qualité éditeur')
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [transformedContent, setTransformedContent] = useState('')
  const [qualityResult, setQualityResult] = useState<DocumentQualityReport | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId),
    [documents, selectedDocumentId]
  )

  function handleUseSelectedDocument(documentId: string) {
    setSelectedDocumentId(documentId)
    setSourceKind('library')
    const document = documents.find((item) => item.id === documentId)
    if (document?.content) {
      setSourceText(document.content)
      setMessage(`Source chargée : ${document.title}`)
    }
  }

  function buildPrompt() {
    const prompt = buildBCVBTransformationPrompt({
      sourceText,
      sourceKind,
      sourceFileName: attachmentPayload?.fileName,
      targetDocumentType,
      targetCategory,
      targetAudience,
      targetSeason,
      transformationLevel,
    })
    setGeneratedPrompt(prompt)
    setMessage('Cadre de transformation préparé.')
  }

  async function copyPrompt() {
    const prompt = generatedPrompt || buildBCVBTransformationPrompt({
      sourceText,
      sourceKind,
      sourceFileName: attachmentPayload?.fileName,
      targetDocumentType,
      targetCategory,
      targetAudience,
      targetSeason,
      transformationLevel,
    })
    setGeneratedPrompt(prompt)
    await navigator.clipboard.writeText(prompt)
    setMessage('Cadre de transformation copié.')
  }

  function runQualityCheck(content = transformedContent) {
    const normalized = normalizeBCVBRichMarkdown(content).content
    setTransformedContent(normalized)
    const report = analyzeDocumentQuality({
      content: normalized,
      documentType: targetDocumentType,
      title: extractTitle(normalized, selectedDocument?.title || 'Document transformé BCVB'),
      category: targetCategory,
      subcategory: transformationLevel,
    })
    setQualityResult(report)
    setMessage(getQualityMessage(report))
  }

  async function saveTransformedDocument() {
    const normalized = normalizeBCVBRichMarkdown(transformedContent).content
    const report =
      qualityResult ??
      analyzeDocumentQuality({
        content: normalized,
        documentType: targetDocumentType,
        category: targetCategory,
        subcategory: transformationLevel,
      })
    const title = extractTitle(normalized, selectedDocument?.title || 'Document transformé BCVB')
    const tags = [
      'BCVB',
      'Transformé',
      report.score >= 90 ? 'Référence club' : '',
      sourceKind === 'attachment' ? 'Source pièce jointe' : '',
      targetCategory,
      targetDocumentType,
    ].filter(Boolean)

    setSaving(true)
    try {
      await saveManualGeneratedDocument({
        title,
        content: normalized,
        description: `Document transformé au format BCVB (${transformationLevel}).`,
        documentType: targetDocumentType,
        category: targetCategory,
        subcategory: transformationLevel,
        audience: targetAudience,
        season: targetSeason === 'Générique / intemporel' ? null : targetSeason,
        tags,
        sourceDocumentId: selectedDocument?.id ?? null,
        generationType:
          sourceKind === 'attachment'
            ? 'transformed_attachment'
            : 'transformed_document',
      })
      setMessage('Document transformé enregistré dans la bibliothèque.')
      await onSaved?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <section style={styles.panel}>
      <div>
        <p style={styles.kicker}>Transformation BCVB</p>
        <h2 style={styles.title}>Transformer en document BCVB</h2>
        <p style={styles.lead}>
          Convertit un contenu brut en document structuré, enrichi et conforme à
          l’identité BCVB.
        </p>
      </div>

      {message && <p style={styles.message}>{message}</p>}

      <section style={styles.sourcePanel}>
        <h3 style={{ margin: 0 }}>Source du document</h3>
        <div style={styles.sourceSwitch}>
          <button
            type="button"
            className={sourceKind === 'text' ? 'bcvb-primary-btn' : undefined}
            style={sourceKind === 'text' ? undefined : styles.secondaryButton}
            onClick={() => {
              setSourceKind('text')
              setSelectedDocumentId('')
            }}
          >
            Coller un texte
          </button>
          <button
            type="button"
            className={sourceKind === 'attachment' ? 'bcvb-primary-btn' : undefined}
            style={sourceKind === 'attachment' ? undefined : styles.secondaryButton}
            onClick={() => {
              setSourceKind('attachment')
              setSelectedDocumentId('')
            }}
          >
            Importer une pièce jointe
          </button>
          <button
            type="button"
            className={sourceKind === 'library' ? 'bcvb-primary-btn' : undefined}
            style={sourceKind === 'library' ? undefined : styles.secondaryButton}
            onClick={() => setSourceKind('library')}
          >
            Depuis la bibliothèque
          </button>
        </div>
      </section>

      <div style={styles.grid}>
        {sourceKind === 'library' && (
          <label style={styles.field}>
            <span>Document existant</span>
            <select
              value={selectedDocumentId}
              onChange={(event) => handleUseSelectedDocument(event.target.value)}
            >
              <option value="">Choisir un document</option>
              {documents.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.title}
                </option>
              ))}
            </select>
          </label>
        )}

        <label style={styles.field}>
          <span>Type cible</span>
          <select
            value={targetDocumentType}
            onChange={(event) =>
              setTargetDocumentType(event.target.value as BCVBTransformationDocumentType)
            }
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label style={styles.field}>
          <span>Catégorie cible</span>
          <select value={targetCategory} onChange={(event) => setTargetCategory(event.target.value)}>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label style={styles.field}>
          <span>Audience cible</span>
          <select value={targetAudience} onChange={(event) => setTargetAudience(event.target.value)}>
            {AUDIENCE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label style={styles.field}>
          <span>Saison</span>
          <select value={targetSeason} onChange={(event) => setTargetSeason(event.target.value)}>
            {SEASON_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label style={styles.field}>
          <span>Niveau d’enrichissement</span>
          <select
            value={transformationLevel}
            onChange={(event) =>
              setTransformationLevel(event.target.value as BCVBTransformationLevel)
            }
          >
            {TRANSFORMATION_LEVELS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      {sourceKind === 'attachment' && (
        <>
          <BCVBAttachmentDropzone
            onExtractedText={(payload) => {
              const raw = payload.rawText ?? payload.text
              const clean = normalizeExtractedText(payload.text)
              setAttachmentPayload(payload)
              setAttachmentRawText(raw)
              setSourceText(clean)
              setAttachmentPreviewTab('clean')
              setMessage(
                payload.warning
                  ? `${payload.warning}${payload.ocrPageCount ? ` (${payload.ocrPageCount} page${payload.ocrPageCount > 1 ? 's' : ''} OCRisée${payload.ocrPageCount > 1 ? 's' : ''})` : ''}`
                  : `Texte extrait de la pièce jointe : ${payload.fileName}`
              )
            }}
          />

          <label style={styles.field}>
            <span>Texte extrait de la pièce jointe</span>
            <div style={styles.sourceSwitch}>
              <button
                type="button"
                className={attachmentPreviewTab === 'raw' ? 'bcvb-primary-btn' : undefined}
                style={attachmentPreviewTab === 'raw' ? undefined : styles.secondaryButton}
                onClick={() => setAttachmentPreviewTab('raw')}
              >
                Texte extrait brut
              </button>
              <button
                type="button"
                className={attachmentPreviewTab === 'clean' ? 'bcvb-primary-btn' : undefined}
                style={attachmentPreviewTab === 'clean' ? undefined : styles.secondaryButton}
                onClick={() => setAttachmentPreviewTab('clean')}
              >
                Texte nettoyé proposé
              </button>
            </div>
            <textarea
              value={attachmentPreviewTab === 'raw' ? attachmentRawText : sourceText}
              onChange={(event) => {
                if (attachmentPreviewTab === 'raw') {
                  setAttachmentRawText(event.target.value)
                  return
                }
                setSourceText(event.target.value)
              }}
              rows={10}
              placeholder="Le texte extrait apparaîtra ici et reste modifiable..."
              style={styles.textarea}
            />
            {attachmentPreviewTab === 'raw' && (
              <button
                type="button"
                className="bcvb-primary-btn"
                onClick={() => {
                  setSourceText(normalizeExtractedText(attachmentRawText))
                  setAttachmentPreviewTab('clean')
                }}
              >
                Nettoyer et utiliser ce texte
              </button>
            )}
          </label>
        </>
      )}

      {sourceKind !== 'attachment' && (
        <label style={styles.field}>
          <span>{sourceKind === 'library' ? 'Texte source du document bibliothèque' : 'Document source ou texte brut'}</span>
          <textarea
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
            rows={10}
            placeholder="Colle ici le document source à transformer..."
            style={styles.textarea}
          />
        </label>
      )}

      <div style={styles.actions}>
        <button
          type="button"
          className="bcvb-primary-btn"
          onClick={buildPrompt}
          disabled={!sourceText.trim()}
        >
          Transformer en document BCVB
        </button>
        <button
          type="button"
          className="bcvb-primary-btn"
          onClick={copyPrompt}
          disabled={!sourceText.trim()}
        >
          Copier le cadre de transformation
        </button>
      </div>

      {generatedPrompt && (
        <pre style={styles.promptPreview}>{generatedPrompt}</pre>
      )}

      <label style={styles.field}>
        <span>Réponse transformée</span>
        <textarea
          value={transformedContent}
          onChange={(event) => setTransformedContent(event.target.value)}
          rows={12}
          placeholder="Colle ici le contenu transformé..."
          style={styles.textarea}
        />
      </label>

      <div style={styles.actions}>
        <button
          type="button"
          className="bcvb-primary-btn"
          onClick={() => runQualityCheck()}
          disabled={!transformedContent.trim()}
        >
          Contrôler la qualité
        </button>
        <button
          type="button"
          className="bcvb-primary-btn"
          onClick={saveTransformedDocument}
          disabled={!transformedContent.trim() || saving}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer dans la bibliothèque'}
        </button>
      </div>

      {qualityResult && (
        <section style={styles.qualityPanel}>
          <p style={styles.kicker}>Contrôle qualité</p>
          <h3 style={{ marginTop: 0 }}>
            {qualityResult.status} — {qualityResult.score}/100
          </h3>
          <div style={styles.quotaGrid}>
            <span>Tableaux · {qualityResult.counts.tables}</span>
            <span>Situations · {qualityResult.counts.situations}</span>
            <span>Schémas · {qualityResult.counts.diagrams}</span>
            <span>Blocs BCVB · {qualityResult.counts.richBlocks}</span>
          </div>
          <p>{qualityResult.verdict}</p>
          <ul style={styles.checkList}>
            {qualityResult.checks.slice(0, 10).map((check) => (
              <li key={check.label}>
                <strong>{check.label}</strong> · {check.detail}
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  )
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    display: 'grid',
    gap: 18,
    margin: '28px 0 32px',
    padding: 24,
    borderRadius: 20,
    border: '1px solid #c8102e',
    background: '#fff',
    boxShadow: '0 18px 52px rgba(17, 24, 39, 0.1)',
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
  lead: {
    margin: '8px 0 0',
    color: '#4b5563',
    fontWeight: 700,
  },
  message: {
    margin: 0,
    padding: 12,
    borderRadius: 12,
    background: '#fef2f2',
    color: '#991b1b',
    fontWeight: 800,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 14,
  },
  sourcePanel: {
    display: 'grid',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    border: '1px solid #e5e7eb',
    background: '#f9fafb',
  },
  sourceSwitch: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
  },
  secondaryButton: {
    minHeight: 40,
    border: '1px solid #d1d5db',
    borderRadius: 999,
    padding: '0 16px',
    background: '#ffffff',
    color: '#111827',
    fontWeight: 900,
    cursor: 'pointer',
  },
  field: {
    display: 'grid',
    gap: 8,
    color: '#111827',
    fontSize: 14,
    fontWeight: 850,
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    padding: 14,
    borderRadius: 14,
    border: '1px solid #d1d5db',
    fontFamily: 'inherit',
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
  },
  promptPreview: {
    maxHeight: 320,
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    padding: 14,
    borderRadius: 14,
    background: '#111827',
    color: '#f9fafb',
    fontSize: 12,
    lineHeight: 1.5,
  },
  qualityPanel: {
    padding: 18,
    borderRadius: 16,
    border: '1px solid #e5e7eb',
    background: '#f9fafb',
  },
  quotaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 10,
    margin: '12px 0',
  },
  checkList: {
    margin: 0,
    paddingLeft: 18,
    color: '#374151',
  },
}
