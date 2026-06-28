import { useMemo, useState } from 'react'
import { buildManualPrompt } from '../utils/buildManualPrompt'
import { analyzeDocumentQuality } from '../utils/documentQuality'
import {
  DOCUMENT_DEPTH_LABELS,
  getDepthAdjustedMinimum,
  getDocumentContentStandard,
  getExpectedRichBlockMinimum,
  getRecommendedDepthForStandard,
  type DocumentDepthLevel,
} from '../utils/documentContentStandards'
import { normalizeBCVBRichMarkdown } from '../features/documents/utils/normalizeBCVBRichMarkdown'
import { NormalizerPanel } from '../features/documents/components/NormalizerPanel'
import type { SaveManualGeneratedDocumentInput } from '../services/manualGeneratedDocuments'

type ManualDocumentMetadata = Omit<
  SaveManualGeneratedDocumentInput,
  'content' | 'sourceDocumentId' | 'generationType'
>

type ManualChatGptGeneratorProps = {
  generationType: string
  sourceTitle?: string
  sourceContent?: string
  userInstruction?: string
  useBcvbIdentity?: boolean
  useFfbbFrame?: boolean
  useEuropeanTrends?: boolean
  useUsCanadaApproach?: boolean
  useOperationalApproach?: boolean
  onSaveGeneratedContent: (
    content: string,
    metadata: ManualDocumentMetadata
  ) => Promise<void>
}

const DOCUMENT_TYPE_OPTIONS = [
  'Cahier technique',
  'Guide coach de catégorie',
  'Séance',
  'Document cadre',
  'Guide coach',
  'Support de formation',
  'Procédure club',
  'Newsletter',
  'Autre',
]

const AUDIENCE_OPTIONS = [
  'Coachs',
  'Responsables techniques',
  'Dirigeants',
  'Joueurs',
  'Parents',
  'Interne club',
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

const SEASON_OPTIONS = ['2025-2026', '2026-2027', 'Générique / intemporel']

const DEPTH_OPTIONS: DocumentDepthLevel[] = [
  'synthetic',
  'standard',
  'premium',
  'reference',
]

const INITIAL_METADATA: ManualDocumentMetadata = {
  title: '',
  description: '',
  documentType: '',
  category: 'Général BCVB',
  subcategory: '',
  audience: 'Interne club',
  season: 'Générique / intemporel',
  tags: [],
}

function parseTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export function ManualChatGptGenerator({
  generationType,
  sourceTitle,
  sourceContent,
  userInstruction,
  useBcvbIdentity = true,
  useFfbbFrame = false,
  useEuropeanTrends = false,
  useUsCanadaApproach = false,
  useOperationalApproach = true,
  onSaveGeneratedContent,
}: ManualChatGptGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [chatGptResponse, setChatGptResponse] = useState('')
  const [metadata, setMetadata] = useState<ManualDocumentMetadata>(INITIAL_METADATA)
  const [depth, setDepth] = useState<DocumentDepthLevel>('reference')
  const [tagsInput, setTagsInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [normalizationMessage, setNormalizationMessage] = useState<string | null>(null)
  const normalizedResponse = useMemo(
    () => normalizeBCVBRichMarkdown(chatGptResponse).content,
    [chatGptResponse]
  )
  const productionStandard = useMemo(
    () =>
      getDocumentContentStandard({
        documentType: metadata.documentType,
        generationType,
        title: metadata.title || sourceTitle,
        category: metadata.category,
        subcategory: metadata.subcategory,
        userInstruction,
        content: chatGptResponse,
      }),
    [
      chatGptResponse,
      generationType,
      metadata.category,
      metadata.documentType,
      metadata.subcategory,
      metadata.title,
      sourceTitle,
      userInstruction,
    ]
  )
  const inferredStandardFromTitle = useMemo(
    () =>
      getDocumentContentStandard({
        title: metadata.title || sourceTitle,
        userInstruction,
        content: chatGptResponse,
      }),
    [chatGptResponse, metadata.title, sourceTitle, userInstruction]
  )
  const expectedRichBlocks = getDepthAdjustedMinimum(
    getExpectedRichBlockMinimum(productionStandard),
    depth
  )
  const expectedTables = getDepthAdjustedMinimum(productionStandard.minimumTables, depth)
  const expectedSituations = getDepthAdjustedMinimum(
    productionStandard.minimumSituations,
    depth
  )
  const expectedDiagrams = getDepthAdjustedMinimum(productionStandard.minimumDiagrams, depth)
  const recommendedDepth = getRecommendedDepthForStandard(productionStandard)
  const typeMismatchWarning =
    metadata.documentType &&
    inferredStandardFromTitle.key !== 'generic' &&
    inferredStandardFromTitle.key !== productionStandard.key
      ? `Le titre ou le contenu ressemble à “${inferredStandardFromTitle.label}”, mais le type sélectionné applique “${productionStandard.label}”.`
      : null
  const weakDepthWarning =
    (productionStandard.key === 'technicalBookU7U11' ||
      productionStandard.key === 'technicalBookU13U15' ||
      productionStandard.key === 'categoryTechnicalBook' ||
      productionStandard.key === 'coachGuide' ||
      productionStandard.key === 'pedagogicRibbon' ||
      productionStandard.key === 'trainingPlan') &&
    (depth === 'synthetic' || depth === 'standard')
      ? 'Ce niveau risque d’être insuffisant pour atteindre le standard BCVB de publication.'
      : null
  const qualityReport = useMemo(() => {
    if (!chatGptResponse.trim()) return null

    return analyzeDocumentQuality({
      content: normalizedResponse,
      documentType: metadata.documentType,
      generationType,
      title: metadata.title || sourceTitle,
      category: metadata.category,
      subcategory: metadata.subcategory,
      userInstruction,
    })
  }, [
    normalizedResponse,
    generationType,
    metadata.documentType,
    metadata.category,
    metadata.subcategory,
    metadata.title,
    sourceTitle,
    userInstruction,
  ])

  function updateMetadata<Field extends keyof ManualDocumentMetadata>(
    field: Field,
    value: ManualDocumentMetadata[Field]
  ) {
    setMetadata((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleBuildPrompt() {
    const nextPrompt = buildManualPrompt({
      generationType,
      sourceTitle,
      sourceContent,
      userInstruction,
      documentType: metadata.documentType,
      category: metadata.category,
      subcategory: metadata.subcategory,
      depth,
      useBcvbIdentity,
      useFfbbFrame,
      useEuropeanTrends,
      useUsCanadaApproach,
      useOperationalApproach,
    })

    setPrompt(nextPrompt)
    setCopied(false)
    setMessage(null)
  }

  function handleBuildMasterPrompt() {
    const nextPrompt = buildManualPrompt({
      generationType: `${generationType} — Cadre maître qualité éditeur`,
      sourceTitle,
      sourceContent,
      userInstruction: [
        userInstruction,
        'Produire un document final complet en une seule réponse, directement collable dans le site.',
        'Respecter strictement le BCVB Rich Markdown avec uniquement des blocs typés :::bcvb-*.',
        'Ne jamais utiliser de bloc générique ::: et ne jamais afficher players, arrows ou notes hors bloc :::bcvb-diagram.',
      ]
        .filter(Boolean)
        .join('\n'),
      documentType: metadata.documentType,
      category: metadata.category,
      subcategory: metadata.subcategory,
      depth: 'reference',
      useBcvbIdentity,
      useFfbbFrame,
      useEuropeanTrends,
      useUsCanadaApproach,
      useOperationalApproach,
    })

    setDepth('reference')
    setPrompt(`CADRE MAÎTRE QUALITÉ ÉDITEUR\n\n${nextPrompt}`)
    setCopied(false)
    setMessage('Cadre maître qualité éditeur préparé.')
  }

  async function handleCopyPrompt() {
    if (!prompt.trim()) return

    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setMessage('Cadre copié. Tu peux maintenant l’utiliser dans ton outil de rédaction.')
  }

  function handleNormalizeContent() {
    if (!chatGptResponse.trim()) {
      setNormalizationMessage('Colle d’abord un contenu à normaliser.')
      return
    }

    const result = normalizeBCVBRichMarkdown(chatGptResponse)
    setChatGptResponse(result.content)
    setNormalizationMessage(
      [
        `${result.report.convertedHeroes} hero`,
        `${result.report.convertedIdentityBlocks} blocs identité/conclusion`,
        `${result.report.convertedSituations} situations`,
        `${result.report.convertedDiagrams} diagrammes`,
        `${result.report.removedIsolatedClosures} fermetures isolées supprimées`,
        `${result.report.ambiguousBlocks} blocs ambigus ignorés`,
      ].join(' · ')
    )
  }

  async function handleSave() {
    const cleanTitle = metadata.title.trim()
    const cleanDocumentType = metadata.documentType.trim()

    if (!cleanTitle) {
      setMessage('Renseigne le titre du document avant l’enregistrement.')
      return
    }

    if (!cleanDocumentType) {
      setMessage('Choisis le type de document avant l’enregistrement.')
      return
    }

    if (!chatGptResponse.trim()) {
      setMessage('Colle d’abord le contenu préparé.')
      return
    }

    try {
      setSaving(true)
      setMessage('Enregistrement en cours...')

      console.log('Clic sur Enregistrer dans la bibliothèque')
      console.log('Longueur contenu préparé :', chatGptResponse.trim().length)

      const normalizedContent = normalizeBCVBRichMarkdown(chatGptResponse).content

      await onSaveGeneratedContent(normalizedContent.trim(), {
        ...metadata,
        title: cleanTitle,
        documentType: cleanDocumentType,
        description: metadata.description?.trim(),
        category: metadata.category?.trim(),
        subcategory: metadata.subcategory?.trim(),
        audience: metadata.audience?.trim(),
        season: metadata.season?.trim(),
        tags: parseTags(tagsInput),
      })

      setMessage('✅ Document enregistré dans la bibliothèque BCVB.')
      setChatGptResponse('')
      setTagsInput('')
      setMetadata(INITIAL_METADATA)
    } catch (error) {
      console.error('Erreur enregistrement manuel du contenu préparé :', error)

      const message =
        error instanceof Error
          ? error.message
          : "Erreur inconnue pendant l'enregistrement."

      setMessage(`❌ Impossible d'enregistrer le document : ${message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section style={styles.wrapper}>
      <div style={styles.header}>
        <p style={styles.kicker}>Mode manuel documentaire</p>

        <h2 style={styles.title}>Production sans crédit technique</h2>

        <p style={styles.description}>
          Le site prépare un cadre complet. Tu l’utilises dans ton outil de rédaction, puis tu
          colles le contenu préparé ici pour l’enregistrer dans la bibliothèque BCVB.
          Plus ta demande est précise, plus le document sera structuré pour la lecture premium et l’export PDF.
        </p>
      </div>

      <div style={styles.promptControlPanel}>
        <div style={styles.formGrid}>
          <label style={styles.formLabel}>
            <span>Type de document visé</span>
            <select
              value={metadata.documentType}
              onChange={(event) => updateMetadata('documentType', event.target.value)}
              style={styles.input}
            >
              <option value="">Choisir un type</option>
              {DOCUMENT_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.formLabel}>
            <span>Catégorie</span>
            <select
              value={metadata.category}
              onChange={(event) => updateMetadata('category', event.target.value)}
              style={styles.input}
            >
              <option value="">—</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.formLabel}>
            <span>Niveau de profondeur</span>
            <select
              value={depth}
              onChange={(event) => setDepth(event.target.value as DocumentDepthLevel)}
              style={styles.input}
            >
              {DEPTH_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {DOCUMENT_DEPTH_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={styles.productionStandard}>
          <div>
            <p style={styles.qualityKicker}>Standard de production appliqué</p>
            <h3 style={styles.qualityTitle}>{productionStandard.label}</h3>
            <p style={styles.qualityText}>
              Niveau : {DOCUMENT_DEPTH_LABELS[depth]}
            </p>
          </div>

          <div style={styles.standardGrid}>
            <span>Tableaux · {expectedTables}</span>
            <span>Situations · {expectedSituations}</span>
            <span>Schémas · {expectedDiagrams}</span>
            <span>Blocs BCVB · {expectedRichBlocks}</span>
          </div>
        </div>

        <div style={styles.promptSummary}>
          <strong>Ce cadre demandera :</strong>
          <span>format Rich Markdown strict</span>
          <span>aucune balise générique autorisée</span>
          <span>quotas injectés depuis le Gold Standard</span>
          <span>
            {productionStandard.requiresToc ? 'sommaire obligatoire' : 'sommaire selon besoin'}
          </span>
        </div>

        {(typeMismatchWarning || weakDepthWarning) && (
          <div style={styles.promptWarning}>
            {typeMismatchWarning && <p>{typeMismatchWarning}</p>}
            {typeMismatchWarning && (
              <button
                type="button"
                onClick={() => {
                  if (inferredStandardFromTitle.key === 'coachGuide') {
                    updateMetadata('documentType', 'Guide coach')
                  }
                  if (
                    inferredStandardFromTitle.key === 'technicalBookU7U11' ||
                    inferredStandardFromTitle.key === 'technicalBookU13U15' ||
                    inferredStandardFromTitle.key === 'categoryTechnicalBook'
                  ) {
                    const looksLikeCoachGuide = `${generationType} ${sourceTitle} ${metadata.title}`
                      .toLowerCase()
                      .includes('guide')
                    updateMetadata(
                      'documentType',
                      looksLikeCoachGuide ? 'Guide coach de catégorie' : 'Cahier technique'
                    )
                  }
                }}
                style={styles.inlineActionButton}
              >
                Basculer vers le type suggéré
              </button>
            )}
            {weakDepthWarning && <p>{weakDepthWarning}</p>}
            {weakDepthWarning && (
              <button
                type="button"
                onClick={() => setDepth(recommendedDepth)}
                style={styles.inlineActionButton}
              >
                Utiliser {DOCUMENT_DEPTH_LABELS[recommendedDepth]}
              </button>
            )}
          </div>
        )}

        {(productionStandard.key === 'technicalBookU7U11' ||
          productionStandard.key === 'technicalBookU13U15' ||
          productionStandard.key === 'pedagogicRibbon' ||
          productionStandard.key === 'trainingPlan') && (
          <p style={styles.longDocumentHint}>
            Document long détecté : une génération en plusieurs parties est recommandée
            pour atteindre le Gold Standard sans perdre de densité.
          </p>
        )}
      </div>

      <div style={styles.buttonRow}>
        <button
          type="button"
          onClick={handleBuildPrompt}
          style={styles.primaryButton}
        >
          Préparer le cadre
        </button>

        <button
          type="button"
          onClick={handleBuildMasterPrompt}
          style={styles.primaryButton}
        >
          Préparer un cadre maître qualité éditeur
        </button>

        <button
          type="button"
          onClick={handleCopyPrompt}
          disabled={!prompt.trim()}
          style={{
            ...styles.secondaryButton,
            opacity: prompt.trim() ? 1 : 0.45,
            cursor: prompt.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          {copied ? 'Cadre copié' : 'Copier le cadre'}
        </button>
      </div>

      <div style={styles.fieldBlock}>
        <label style={styles.label}>Cadre à utiliser</label>

        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={16}
          style={styles.textareaPrompt}
          placeholder="Clique sur “Préparer le cadre”. Le cadre demandera un Markdown structuré avec planifications, tableaux, situations pédagogiques, blocs coach et schémas terrain si utile."
        />
      </div>

      <div style={styles.fieldBlock}>
        <label style={styles.label}>Contenu préparé</label>

        <textarea
          value={chatGptResponse}
          onChange={(event) => setChatGptResponse(event.target.value)}
          rows={18}
          style={styles.textareaResponse}
          placeholder="Colle ici le contenu complet, idéalement en Markdown propre avec titres ##, tableaux, situations standardisées et blocs bcvb-diagram."
        />
      </div>

      <div style={styles.normalizeRow}>
        <button type="button" onClick={handleNormalizeContent} style={styles.secondaryButton}>
          Corriger le format BCVB
        </button>
        {normalizationMessage && (
          <p style={styles.message}>{normalizationMessage}</p>
        )}
      </div>

      <NormalizerPanel
        content={chatGptResponse}
        onNormalized={(normalized) => {
          setChatGptResponse(normalized)
          setNormalizationMessage('Document normalisé et prêt pour le contrôle qualité.')
        }}
      />

      {qualityReport && (
        <aside
          style={{
            ...styles.qualityPanel,
            borderColor:
              qualityReport.status === 'Référence club' ||
              qualityReport.status === 'Très bon niveau'
                ? '#15803d'
                : qualityReport.status === 'Solide mais incomplet'
                  ? '#c96a00'
                  : '#C8102E',
          }}
        >
          <div style={styles.qualityHeader}>
            <div>
              <p style={styles.qualityKicker}>Contrôle qualité documentaire</p>
              <h3 style={styles.qualityTitle}>
                {qualityReport.status} · {qualityReport.score}/100
              </h3>
              <p style={styles.qualityText}>
                Standard appliqué : {qualityReport.standard.label}
              </p>
            </div>
            <div style={styles.qualityStats}>
              <span>
                {qualityReport.counts.tables} / {qualityReport.standard.minimumTables} tableaux
              </span>
              <span>
                {qualityReport.counts.situations} / {qualityReport.standard.minimumSituations} situations
              </span>
              <span>
                {qualityReport.counts.diagrams} / {qualityReport.standard.minimumDiagrams} schémas
              </span>
              <span>
                {qualityReport.counts.richBlocks} / {qualityReport.counts.expectedRichBlocks} blocs BCVB
              </span>
              <span>
                {qualityReport.counts.parsedBlocks} blocs rendus
              </span>
            </div>
          </div>

          <p style={styles.qualityVerdict}>{qualityReport.verdict}</p>

          <div style={styles.qualityStats}>
            <span>Contenu · {qualityReport.scores.contentScore}/100</span>
            <span>Structure · {qualityReport.scores.structureScore}/100</span>
            <span>Rendu · {qualityReport.scores.renderScore}/100</span>
            <span>Export · {qualityReport.scores.exportScore}/100</span>
            <span>Global · {qualityReport.scores.globalScore}/100</span>
          </div>

          <div style={styles.qualityStats}>
            <span>Tables rendues · {qualityReport.counts.tablesRendered}</span>
            <span>Tables non rendues · {qualityReport.counts.tablesNotRendered}</span>
            <span>Situations avec schéma · {qualityReport.counts.situationsWithDiagram}</span>
            <span>Diagrammes valides · {qualityReport.counts.diagramsValid}</span>
            <span>Diagrammes inférés · {qualityReport.counts.diagramsInferred}</span>
            <span>Champs bruts visibles · {qualityReport.counts.rawTechnicalFieldsVisible}</span>
          </div>

          <div style={styles.qualityChecks}>
            {qualityReport.checks.map((check) => (
              <div key={check.label} style={styles.qualityCheck}>
                <span>
                  {check.status === 'pass'
                    ? '✅'
                    : check.status === 'warning'
                      ? '⚠️'
                      : '❌'}
                </span>
                <strong>{check.label}</strong>
                <small>{check.detail}</small>
              </div>
            ))}
          </div>

          {(qualityReport.status === 'Très incomplet' ||
            qualityReport.status === 'Base structurée mais insuffisante') && (
            <p style={styles.qualityWarning}>
              Ce document peut être enregistré, mais il est en dessous du niveau attendu
              pour un document de référence BCVB. Demande à ton outil de rédaction de compléter les
              points en échec avant publication.
            </p>
          )}
        </aside>
      )}

      <div style={styles.metadataPanel}>
        <h3 style={styles.metadataTitle}>Identification du document</h3>

        <div style={styles.formGrid}>
          <label style={styles.formLabel}>
            <span>Titre du document *</span>
            <input
              type="text"
              value={metadata.title}
              onChange={(event) => updateMetadata('title', event.target.value)}
              style={styles.input}
              placeholder="Ex. Cahier technique U13 - Jeu rapide"
            />
          </label>

          <label style={styles.formLabel}>
            <span>Type de document *</span>
            <select
              value={metadata.documentType}
              onChange={(event) => updateMetadata('documentType', event.target.value)}
              style={styles.input}
            >
              <option value="">Choisir un type</option>
              {DOCUMENT_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.formLabel}>
            <span>Catégorie</span>
            <select
              value={metadata.category}
              onChange={(event) => updateMetadata('category', event.target.value)}
              style={styles.input}
            >
              <option value="">—</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.formLabel}>
            <span>Sous-catégorie ou thème</span>
            <input
              type="text"
              value={metadata.subcategory}
              onChange={(event) => updateMetadata('subcategory', event.target.value)}
              style={styles.input}
              placeholder="Ex. Cahier technique de catégorie, transition, posture coach"
            />
          </label>

          <label style={styles.formLabel}>
            <span>Audience</span>
            <select
              value={metadata.audience}
              onChange={(event) => updateMetadata('audience', event.target.value)}
              style={styles.input}
            >
              {AUDIENCE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.formLabel}>
            <span>Saison</span>
            <select
              value={metadata.season ?? ''}
              onChange={(event) => updateMetadata('season', event.target.value)}
              style={styles.input}
            >
              <option value="">—</option>
              {SEASON_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label style={styles.formLabel}>
          <span>Description courte</span>
          <textarea
            value={metadata.description}
            onChange={(event) => updateMetadata('description', event.target.value)}
            rows={3}
            style={styles.metadataTextarea}
            placeholder="Résumé métier neutre affiché dans la carte et le PDF."
          />
        </label>

        <label style={styles.formLabel}>
          <span>Tags</span>
          <input
            type="text"
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            style={styles.input}
            placeholder="jeu rapide, U13, défense homme à homme"
          />
        </label>
      </div>

      <div style={styles.saveRow}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            ...styles.saveButton,
            opacity: saving ? 0.6 : 1,
            cursor: saving ? 'wait' : 'pointer',
          }}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer dans la bibliothèque'}
        </button>

        {message && <p style={styles.message}>{message}</p>}
      </div>
    </section>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    width: '100%',
    maxWidth: '980px',
    marginTop: '32px',
    padding: '24px',
    borderRadius: '22px',
    border: '1px solid #e5e7eb',
    background: '#ffffff',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
    boxSizing: 'border-box',
  },

  header: {
    marginBottom: '20px',
  },

  kicker: {
    margin: 0,
    marginBottom: '6px',
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#C8102E',
  },

  title: {
    margin: 0,
    fontSize: '24px',
    lineHeight: 1.2,
    fontWeight: 800,
    color: '#111827',
  },

  description: {
    marginTop: '8px',
    marginBottom: 0,
    fontSize: '15px',
    lineHeight: 1.55,
    color: '#4b5563',
  },

  buttonRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '22px',
  },

  promptControlPanel: {
    display: 'grid',
    gap: '14px',
    margin: '22px 0',
    padding: '18px',
    borderRadius: '18px',
    border: '1px solid #e5e7eb',
    background: '#f9fafb',
  },

  productionStandard: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '14px',
    padding: '16px',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    background: '#ffffff',
  },

  standardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))',
    gap: '8px',
    fontSize: '13px',
    fontWeight: 800,
    color: '#111827',
  },

  promptSummary: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center',
    fontSize: '13px',
    color: '#374151',
  },

  promptWarning: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    borderRadius: '14px',
    border: '1px solid #fed7aa',
    background: '#fff7ed',
    color: '#9a3412',
    fontSize: '13px',
    fontWeight: 800,
  },

  inlineActionButton: {
    border: '1px solid #fdba74',
    borderRadius: '999px',
    padding: '7px 10px',
    background: '#ffffff',
    color: '#9a3412',
    fontSize: '12px',
    fontWeight: 900,
    cursor: 'pointer',
  },

  longDocumentHint: {
    margin: 0,
    padding: '11px 13px',
    borderRadius: '12px',
    background: '#111827',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 700,
    lineHeight: 1.45,
  },

  primaryButton: {
    border: 'none',
    borderRadius: '14px',
    padding: '11px 18px',
    background: '#111827',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
  },

  secondaryButton: {
    border: '1px solid #d1d5db',
    borderRadius: '14px',
    padding: '11px 18px',
    background: '#ffffff',
    color: '#111827',
    fontSize: '14px',
    fontWeight: 700,
  },

  normalizeRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '12px',
    marginTop: '12px',
  },

  fieldBlock: {
    display: 'block',
    width: '100%',
    marginTop: '20px',
  },

  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '15px',
    fontWeight: 800,
    color: '#111827',
  },

  textareaPrompt: {
    display: 'block',
    width: '100%',
    minHeight: '320px',
    resize: 'vertical',
    boxSizing: 'border-box',
    borderRadius: '16px',
    border: '1px solid #d1d5db',
    background: '#f9fafb',
    padding: '14px',
    fontSize: '14px',
    lineHeight: 1.55,
    color: '#111827',
    outline: 'none',
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  textareaResponse: {
    display: 'block',
    width: '100%',
    minHeight: '360px',
    resize: 'vertical',
    boxSizing: 'border-box',
    borderRadius: '16px',
    border: '1px solid #d1d5db',
    background: '#ffffff',
    padding: '14px',
    fontSize: '14px',
    lineHeight: 1.55,
    color: '#111827',
    outline: 'none',
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  metadataPanel: {
    display: 'grid',
    gap: '16px',
    marginTop: '22px',
    padding: '18px',
    borderRadius: '18px',
    border: '1px solid #e5e7eb',
    background: '#f9fafb',
  },

  qualityPanel: {
    display: 'grid',
    gap: '16px',
    marginTop: '22px',
    padding: '18px',
    borderRadius: '18px',
    border: '2px solid #e5e7eb',
    background: '#ffffff',
    boxShadow: '0 14px 32px rgba(15, 23, 42, 0.08)',
  },

  qualityHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
  },

  qualityKicker: {
    margin: 0,
    marginBottom: '5px',
    fontSize: '11px',
    fontWeight: 900,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#C8102E',
  },

  qualityTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 900,
    color: '#111827',
  },

  qualityText: {
    margin: '6px 0 0',
    fontSize: '13px',
    fontWeight: 700,
    color: '#4b5563',
  },

  qualityVerdict: {
    margin: 0,
    padding: '13px 14px',
    borderRadius: '12px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    color: '#374151',
    fontSize: '13px',
    fontWeight: 700,
    lineHeight: 1.5,
  },

  qualityStats: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'flex-end',
  },

  qualityChecks: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '10px',
  },

  qualityCheck: {
    display: 'grid',
    gridTemplateColumns: '24px 1fr',
    columnGap: '8px',
    rowGap: '2px',
    padding: '11px',
    borderRadius: '12px',
    border: '1px solid #eef0f3',
    background: '#f9fafb',
    fontSize: '13px',
    color: '#111827',
  },

  qualityWarning: {
    margin: 0,
    padding: '12px 14px',
    borderRadius: '12px',
    background: '#fff7ed',
    color: '#9a3412',
    fontSize: '13px',
    fontWeight: 700,
    lineHeight: 1.5,
  },

  metadataTitle: {
    margin: 0,
    fontSize: '18px',
    lineHeight: 1.25,
    fontWeight: 800,
    color: '#111827',
  },

  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '14px',
  },

  formLabel: {
    display: 'grid',
    gap: '7px',
    fontSize: '14px',
    fontWeight: 800,
    color: '#111827',
  },

  input: {
    width: '100%',
    minHeight: '44px',
    boxSizing: 'border-box',
    borderRadius: '12px',
    border: '1px solid #d1d5db',
    background: '#ffffff',
    padding: '10px 12px',
    color: '#111827',
    fontSize: '14px',
    outline: 'none',
  },

  metadataTextarea: {
    display: 'block',
    width: '100%',
    minHeight: '96px',
    resize: 'vertical',
    boxSizing: 'border-box',
    borderRadius: '12px',
    border: '1px solid #d1d5db',
    background: '#ffffff',
    padding: '12px',
    fontSize: '14px',
    lineHeight: 1.5,
    color: '#111827',
    outline: 'none',
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  saveRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '14px',
    marginTop: '20px',
  },

  saveButton: {
    border: 'none',
    borderRadius: '14px',
    padding: '12px 18px',
    background: '#C8102E',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 800,
  },

  message: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
  },
}
