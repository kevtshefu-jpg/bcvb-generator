import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import RichMarkdownRenderer from '../../rich-markdown/components/RichMarkdownRenderer'
import { scoreDocument } from '../../document-quality/services/qualityScorer'
import type { DocumentFamily } from '../../document-quality/types/quality.types'
import {
  buildInternalCreationPrompt,
  creationAudiences,
  creationCategories,
  creationLevels,
  creationModeLabels,
  documentTypeOptions,
  generateBcvbRichMarkdownDraft,
} from '../services/documentCreationPrompt'
import type {
  CreationContentMode,
  CreationContext,
  CreationDocumentType,
  CreationSource,
  DocumentCreationDraft,
  DocumentCreationInput,
} from '../types/documentCreation.types'
import { defaultEditorialStudioState, saveEditorialStudioState } from '../../../utils/editorialStudioStorage'
import '../../document-quality/styles/documentQuality.css'
import '../styles/createDocumentPage.css'

const defaultContext: CreationContext = {
  category: 'U13',
  audience: 'coachs',
  level: 'formation',
  mainObjective: '',
  constraints: '',
}

const defaultSource: CreationSource = {
  mode: 'prompt_libre',
  freePrompt: '',
  guidedNotes: '',
  importedFileName: '',
  importedText: '',
}

const creationSteps = [
  'Type de document',
  'Contexte',
  'Contenu',
  'Brouillon',
]

function mapToStudioFamily(family: CreationDocumentType) {
  const mapping: Record<CreationDocumentType, string> = {
    guide_coach: 'coach-guide',
    cahier_technique: 'technical-book',
    fiche_seance: 'practice-session',
    situation_pedagogique: 'situation',
    outil_evaluation: 'evaluation',
    document_familles: 'families',
    compte_rendu: 'report',
    document_administratif: 'administrative',
  }

  return mapping[family]
}

function fileTextFallback(file: File) {
  return [
    `Fichier importé : ${file.name}`,
    `Type : ${file.type || 'format à analyser'}`,
    'Contenu complet à extraire depuis le module OCR si le fichier est un PDF, une image ou un scan.',
  ].join('\n')
}

export default function CreateDocumentPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [documentType, setDocumentType] = useState<CreationDocumentType>('guide_coach')
  const [context, setContext] = useState<CreationContext>(defaultContext)
  const [source, setSource] = useState<CreationSource>(defaultSource)
  const [draft, setDraft] = useState<DocumentCreationDraft | null>(null)
  const selectedType = documentTypeOptions.find((option) => option.id === documentType) ?? documentTypeOptions[0]
  const input: DocumentCreationInput = useMemo(
    () => ({ documentType, context, source }),
    [documentType, context, source]
  )
  const internalPrompt = useMemo(() => buildInternalCreationPrompt(input), [input])
  const score = useMemo(
    () => scoreDocument({ contentSource: draft?.richMarkdown ?? '', family: documentType as DocumentFamily }),
    [draft?.richMarkdown, documentType]
  )

  function patchContext(patch: Partial<CreationContext>) {
    setContext((current) => ({ ...current, ...patch }))
  }

  function patchSource(patch: Partial<CreationSource>) {
    setSource((current) => ({ ...current, ...patch }))
  }

  async function handleFile(file: File | null) {
    if (!file) return

    const canReadText = file.type.startsWith('text/') || /\.(md|txt|csv|json)$/i.test(file.name)
    const importedText = canReadText ? await file.text() : fileTextFallback(file)
    patchSource({
      mode: 'fichier_importe',
      importedFileName: file.name,
      importedText,
    })
  }

  function generateDraft() {
    const nextDraft = generateBcvbRichMarkdownDraft(input)
    setDraft(nextDraft)
    setCurrentStep(4)
  }

  function saveDraftToStudio(targetPath: string) {
    const nextDraft = draft ?? generateBcvbRichMarkdownDraft(input)
    saveEditorialStudioState({
      ...defaultEditorialStudioState,
      targetDocument: nextDraft.title,
      family: mapToStudioFamily(documentType),
      category: context.category,
      audience: context.audience,
      productionLevel: context.level,
      sourceText: source.importedText || source.freePrompt || source.guidedNotes,
      activePrompt: nextDraft.internalPrompt,
      finalDocument: nextDraft.richMarkdown,
      qualityScore: score.globalScore,
      recommendedAction:
        score.globalScore >= 90 ? 'Prévisualiser et exporter après relecture.' : 'Lancer une amélioration forte.',
      steps: {
        framing: 'validé',
        sources: 'validé',
        plan: 'validé',
        production: 'validé',
        quality: score.globalScore >= 90 ? 'validé' : 'à corriger',
        export: 'non démarré',
      },
      updatedAt: null,
    })
    navigate(targetPath)
  }

  return (
    <main className="create-document-page">
      <section className="create-document-hero">
        <div>
          <p className="bcvb-eyebrow">Créer un document</p>
          <h1>Assistant de création BCVB</h1>
          <p>
            Choisis un type, renseigne le contexte, ajoute une source simple : le site prépare un cadre de rédaction
            et un brouillon BCVB Rich Markdown sans demander de connaître les réglages avancés.
          </p>
        </div>
        <Link to="/admin/studio-editorial">Ouvrir le studio complet</Link>
      </section>

      <nav className="create-document-steps" aria-label="Étapes de création">
        {creationSteps.map((step, index) => {
          const stepNumber = index + 1
          return (
            <button
              type="button"
              className={currentStep === stepNumber ? 'create-document-steps__item create-document-steps__item--active' : 'create-document-steps__item'}
              key={step}
              onClick={() => setCurrentStep(stepNumber)}
            >
              <span>{stepNumber}</span>
              {step}
            </button>
          )
        })}
      </nav>

      {currentStep === 1 && (
        <section className="create-document-panel">
          <header>
            <p className="bcvb-eyebrow">Étape 1</p>
            <h2>Choisir le type de document</h2>
          </header>
          <div className="document-type-grid">
            {documentTypeOptions.map((option) => (
              <article
                className={`document-type-card${documentType === option.id ? ' document-type-card--selected' : ''}`}
                key={option.id}
              >
                <span>{option.label}</span>
                <h3>À quoi ça sert</h3>
                <p>{option.purpose}</p>
                <strong>Exemple concret</strong>
                <p>{option.example}</p>
                <strong>Niveau de détail attendu</strong>
                <p>{option.detailLevel}</p>
                <button
                  type="button"
                  onClick={() => {
                    setDocumentType(option.id)
                    setCurrentStep(2)
                  }}
                >
                  Créer ce type de document
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {currentStep === 2 && (
        <section className="create-document-panel">
          <header>
            <p className="bcvb-eyebrow">Étape 2</p>
            <h2>Choisir le contexte</h2>
            <span>{selectedType.label}</span>
          </header>
          <div className="create-context-grid">
            <label>
              Catégorie
              <select value={context.category} onChange={(event) => patchContext({ category: event.target.value as CreationContext['category'] })}>
                {creationCategories.map((category) => (
                  <option value={category} key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label>
              Public cible
              <select value={context.audience} onChange={(event) => patchContext({ audience: event.target.value as CreationContext['audience'] })}>
                {creationAudiences.map((audience) => (
                  <option value={audience} key={audience}>{audience}</option>
                ))}
              </select>
            </label>
            <label>
              Niveau
              <select value={context.level} onChange={(event) => patchContext({ level: event.target.value as CreationContext['level'] })}>
                {creationLevels.map((level) => (
                  <option value={level} key={level}>{level}</option>
                ))}
              </select>
            </label>
            <label className="create-context-grid__wide">
              Objectif principal
              <input
                value={context.mainObjective}
                onChange={(event) => patchContext({ mainObjective: event.target.value })}
                placeholder="Ex. défendre le porteur sans ouvrir l’axe"
              />
            </label>
            <label className="create-context-grid__wide">
              Contraintes éventuelles
              <textarea
                value={context.constraints}
                onChange={(event) => patchContext({ constraints: event.target.value })}
                placeholder="Ex. format 1 page, public débutant, réunion commission, séance 75 minutes..."
              />
            </label>
          </div>
          <div className="create-document-actions">
            <button type="button" onClick={() => setCurrentStep(1)}>Retour</button>
            <button type="button" onClick={() => setCurrentStep(3)}>Continuer vers le contenu</button>
          </div>
        </section>
      )}

      {currentStep === 3 && (
        <section className="create-document-panel">
          <header>
            <p className="bcvb-eyebrow">Étape 3</p>
            <h2>Saisir le contenu</h2>
            <span>Mode actif : {creationModeLabels[source.mode]}</span>
          </header>
          <div className="creation-mode-grid">
            {Object.entries(creationModeLabels).map(([mode, label]) => (
              <button
                type="button"
                className={source.mode === mode ? 'creation-mode-card creation-mode-card--active' : 'creation-mode-card'}
                key={mode}
                onClick={() => patchSource({ mode: mode as CreationContentMode })}
              >
                <strong>{label}</strong>
                <span>
                  {mode === 'prompt_libre'
                    ? 'Écrire avec tes mots.'
                    : mode === 'modele_guide'
                      ? 'Répondre à quelques repères.'
                      : 'Utiliser une source existante.'}
                </span>
              </button>
            ))}
          </div>

          {source.mode === 'prompt_libre' && (
            <label className="create-source-field">
              Brief libre
              <textarea
                value={source.freePrompt}
                onChange={(event) => patchSource({ freePrompt: event.target.value })}
                placeholder="Décris simplement ce que tu veux obtenir. Le site transforme ensuite en cadre BCVB propre."
              />
            </label>
          )}

          {source.mode === 'modele_guide' && (
            <label className="create-source-field">
              Modèle guidé
              <textarea
                value={source.guidedNotes}
                onChange={(event) => patchSource({ guidedNotes: event.target.value })}
                placeholder="Points clés, situations à intégrer, contraintes terrain, messages à transmettre, critères d’évaluation..."
              />
            </label>
          )}

          {source.mode === 'fichier_importe' && (
            <div className="create-source-field">
              <label>
                Fichier source
                <input type="file" accept=".txt,.md,.csv,.json,.pdf,.png,.jpg,.jpeg,.docx" onChange={(event) => void handleFile(event.target.files?.[0] ?? null)} />
              </label>
              {source.importedFileName && <p>Fichier sélectionné : {source.importedFileName}</p>}
              <textarea
                value={source.importedText}
                onChange={(event) => patchSource({ importedText: event.target.value })}
                placeholder="Texte extrait ou notes OCR à vérifier."
              />
              <Link to="/admin/ocr-pieces-jointes">Ouvrir OCR avancé</Link>
            </div>
          )}

          <section className="internal-prompt-preview">
            <p className="bcvb-eyebrow">Cadre de rédaction généré</p>
            <pre>{internalPrompt}</pre>
          </section>

          <div className="create-document-actions">
            <button type="button" onClick={() => setCurrentStep(2)}>Retour</button>
            <button type="button" onClick={generateDraft}>Générer le brouillon</button>
          </div>
        </section>
      )}

      {currentStep === 4 && (
        <section className="create-document-panel">
          <header>
            <p className="bcvb-eyebrow">Étape 4</p>
            <h2>Générer le brouillon</h2>
            <span>Score initial {score.globalScore}/100</span>
          </header>

          {!draft ? (
            <div className="create-empty-draft">
              <h3>Brouillon non généré</h3>
              <p>Reviens à l’étape contenu ou lance la génération.</p>
              <button type="button" onClick={generateDraft}>Générer maintenant</button>
            </div>
          ) : (
            <div className="draft-review-layout">
              <section className="draft-source-panel">
                <p className="bcvb-eyebrow">Source</p>
                <h3>Cadre de rédaction propre</h3>
                <pre>{draft.internalPrompt}</pre>
              </section>

              <section className="draft-document-panel">
                <p className="bcvb-eyebrow">Document généré</p>
                <div className="draft-score-card">
                  <strong>{score.globalScore}/100</strong>
                  <span>{score.status.replace(/_/g, ' ')}</span>
                </div>
                <RichMarkdownRenderer content={draft.richMarkdown} title={draft.title} />
              </section>
            </div>
          )}

          <div className="create-document-actions create-document-actions--sticky">
            <button type="button" onClick={() => setCurrentStep(3)}>Modifier la source</button>
            <button type="button" onClick={() => saveDraftToStudio('/admin/qualite-exports#correction')} disabled={!draft}>
              Améliorer
            </button>
            <button type="button" onClick={() => saveDraftToStudio('/admin/qualite-exports#apercu')} disabled={!draft}>
              Aperçu
            </button>
            <button type="button" onClick={() => saveDraftToStudio('/admin/studio-editorial')} disabled={!draft}>
              Continuer dans le studio
            </button>
          </div>
        </section>
      )}
    </main>
  )
}
