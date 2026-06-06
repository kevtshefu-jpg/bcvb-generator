import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  EDITORIAL_AI_MODES,
  EDITORIAL_DOCUMENT_FAMILIES,
  EDITORIAL_STUDIO_STEPS,
} from '../config/editorialStudioModules.js'
import {
  buildChatGPTPrompt,
  buildClaudePrompt,
  buildFusionPrompt,
  buildMassiveCorrectionPrompt,
  buildPublicationReconstructionPrompt,
  defaultEditorialStudioState,
  loadEditorialStudioState,
  resetEditorialStudioState,
  saveEditorialStudioState,
  type EditorialStudioState,
} from '../utils/editorialStudioStorage.js'
import './EditorialStudioPage.css'

function computeSteps(state: EditorialStudioState) {
  return {
    framing: state.targetDocument && state.family ? 'validé' : 'en cours',
    sources: state.sourceText ? 'validé' : 'en cours',
    plan: state.editorialPlan ? 'validé' : state.sourceText ? 'en cours' : 'non démarré',
    production: state.activePrompt ? 'validé' : state.editorialPlan ? 'en cours' : 'non démarré',
    quality: state.finalDocument ? (state.qualityScore >= 95 ? 'validé' : 'à corriger') : 'non démarré',
    export: state.finalDocument ? 'validé' : 'non démarré',
  }
}

function computeQualityScore(content: string) {
  if (!content.trim()) return 72
  const situationCount = (content.match(/situation|exercice|atelier/gi) || []).length
  const diagramCount = (content.match(/terrain|schéma|players|arrows|zones|ball/gi) || []).length
  const evaluationCount = (content.match(/évaluation|critères|observables|quantifiables/gi) || []).length
  const planningCount = (content.match(/planification|cycle|progression|séance/gi) || []).length
  const rawTablePenalty = /\|.+\|/.test(content) ? 8 : 0
  return Math.max(50, Math.min(100, 70 + situationCount + diagramCount + evaluationCount + planningCount - rawTablePenalty))
}

function buildPlanDraft(state: EditorialStudioState) {
  return [
    `# ${state.targetDocument}`,
    '',
    '1. Intention BCVB et public cible',
    '2. Principes techniques et pédagogiques',
    '3. Progression par étapes',
    '4. Situations pédagogiques autonomes',
    '5. Schémas terrain associés',
    '6. Planification et modalités d’évaluation',
    '7. Relation familles et communication',
    '8. Checklist publication club',
  ].join('\n')
}

function downloadText(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function EditorialStudioPage() {
  const [state, setState] = useState<EditorialStudioState>(() => loadEditorialStudioState() ?? defaultEditorialStudioState)
  const [copied, setCopied] = useState('')
  const [message, setMessage] = useState('Studio prêt.')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(state.updatedAt)
  const selectedFamily = EDITORIAL_DOCUMENT_FAMILIES.find((family) => family.id === state.family) ?? EDITORIAL_DOCUMENT_FAMILIES[1]
  const finalDocumentExists = Boolean(state.finalDocument.trim())

  const savedState = useMemo(() => ({ ...state, steps: computeSteps(state) }), [state])
  const qualityActions = useMemo(() => {
    if (!finalDocumentExists) {
      return [
        'Coller ou analyser une réponse IA.',
        'Générer un prompt ChatGPT ou Claude.',
        'Construire le plan éditorial avant production.',
      ]
    }

    const actions = []
    if (state.qualityScore < 95) actions.push('Lancer une correction massive.')
    if (state.qualityScore < 90) actions.push('Utiliser la reconstruction publication club.')
    if (/\|.+\|/.test(state.finalDocument)) actions.push('Convertir les tableaux bruts en blocs visuels.')
    if (!/évaluation|critères|observables/i.test(state.finalDocument)) actions.push('Ajouter une grille d’évaluation exploitable.')
    if (!/terrain|schéma|players|arrows|zones|ball/i.test(state.finalDocument)) actions.push('Ajouter les schémas terrain obligatoires.')
    if (actions.length === 0) actions.push('Document prêt à publier et exporter.')
    return actions
  }, [finalDocumentExists, state.finalDocument, state.qualityScore])

  useEffect(() => {
    const nextState = saveEditorialStudioState(savedState)
    setLastSavedAt(nextState.updatedAt)
  }, [savedState])

  useEffect(() => {
    const handler = () => {
      saveEditorialStudioState(savedState)
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [savedState])

  function patch(patchState: Partial<EditorialStudioState>) {
    setState((current) => ({
      ...current,
      ...patchState,
      steps: computeSteps({ ...current, ...patchState }),
    }))
  }

  function generatePrompt(mode: string) {
    const nextState = { ...state, activeMode: mode }
    const builders: Record<string, (current: EditorialStudioState) => string> = {
      chatgpt: buildChatGPTPrompt,
      claude: buildClaudePrompt,
      fusion: buildFusionPrompt,
      'massive-correction': buildMassiveCorrectionPrompt,
      'publication-reconstruction': buildPublicationReconstructionPrompt,
    }
    const nextPrompt = (builders[mode] ?? buildChatGPTPrompt)(nextState)
    patch({ activeMode: mode, activePrompt: nextPrompt, steps: computeSteps({ ...nextState, activePrompt: nextPrompt }) })
    setMessage(`Prompt ${EDITORIAL_AI_MODES.find((item) => item.id === mode)?.label ?? mode} généré.`)
  }

  async function copyPrompt() {
    if (!state.activePrompt.trim()) return
    await navigator.clipboard.writeText(state.activePrompt)
    setCopied('Prompt copié.')
    window.setTimeout(() => setCopied(''), 1800)
  }

  function analyzeResponse() {
    const source = state.analyzedResponse || state.chatGptResponse || state.claudeResponse
    const score = computeQualityScore(source)
    patch({
      finalDocument: source,
      qualityScore: score,
      recommendedAction: score >= 95 ? 'Document prêt à publier et exporter.' : 'Lancer correction massive ou reconstruction publication club.',
    })
    setMessage(`Réponse analysée : score estimé ${score}/100.`)
  }

  function resetStudio() {
    const nextState = resetEditorialStudioState()
    setState(nextState)
    setMessage('Studio réinitialisé.')
  }

  function resumeWork() {
    const loaded = loadEditorialStudioState()
    if (!loaded) {
      setMessage('Aucun travail précédent trouvé.')
      return
    }
    setState(loaded)
    setMessage('Travail restauré.')
  }

  function exportPdf() {
    window.print()
  }

  function getStepStatus(stepId: string) {
    return savedState.steps[stepId as keyof typeof savedState.steps] ?? 'non démarré'
  }

  async function handleAttachment(file: File | null) {
    if (!file) return

    const canReadAsText =
      file.type.startsWith('text/') ||
      /\.(md|txt|csv|json)$/i.test(file.name)

    const extractedText = canReadAsText
      ? await file.text()
      : [
          `Pièce jointe importée : ${file.name}`,
          `Type : ${file.type || 'format bureautique'}`,
          'Source prête pour OCR / extraction avancée.',
          'Pour extraction complète PDF, image ou DOCX, utiliser le module OCR ou l’ancien studio avancé.',
        ].join('\n')

    patch({
      sourceText: state.sourceText.trim()
        ? `${state.sourceText.trim()}\n\n---\n${extractedText}`
        : extractedText,
    })
    setMessage(`Pièce jointe ajoutée : ${file.name}.`)
  }

  function saveToLibrary() {
    const savedDocuments = JSON.parse(window.localStorage.getItem('bcvb-editorial-library-drafts') || '[]')
    window.localStorage.setItem(
      'bcvb-editorial-library-drafts',
      JSON.stringify([
        {
          title: state.targetDocument,
          family: state.family,
          content: state.finalDocument,
          score: state.qualityScore,
          savedAt: new Date().toISOString(),
        },
        ...savedDocuments,
      ])
    )
    setMessage('Document enregistré dans les brouillons bibliothèque.')
  }

  return (
    <main className="editorial-studio-page bcvb-page">
      <section className="editorial-studio-hero">
        <div>
          <p className="bcvb-eyebrow">Studio éditorial documentaire</p>
          <h1>Produire, transformer, contrôler, exporter</h1>
          <p>
            Un outil de production documentaire BCVB pensé pour la publication club,
            avec prompts spécialisés, contrôle qualité et reprise de travail automatique.
          </p>
        </div>
        <div className="editorial-studio-hero__actions">
          <button type="button" onClick={resumeWork}>Reprendre mon travail</button>
          <button type="button" onClick={resetStudio}>Réinitialiser le studio</button>
          <Link to="/admin/ia-documentaire">Ancien studio avancé</Link>
        </div>
      </section>

      <section className="editorial-stepper">
        {EDITORIAL_STUDIO_STEPS.map((step) => (
          <article className={`editorial-step editorial-step--${getStepStatus(step.id).replace(/\s+/g, '-')}`} key={step.id}>
            <span>{step.label}</span>
            <strong>{getStepStatus(step.id)}</strong>
          </article>
        ))}
      </section>

      <div className="editorial-studio-layout">
        <section className="editorial-studio-main">
          <section className="editorial-panel">
            <header>
              <p className="bcvb-eyebrow">Cadrage</p>
              <h2>Document cible</h2>
            </header>
            <div className="editorial-form-grid">
              <label>
                <span>Titre du document</span>
                <input value={state.targetDocument} onChange={(event) => patch({ targetDocument: event.target.value })} />
              </label>
              <label>
                <span>Famille</span>
                <select value={state.family} onChange={(event) => patch({ family: event.target.value })}>
                  {EDITORIAL_DOCUMENT_FAMILIES.map((family) => (
                    <option value={family.id} key={family.id}>{family.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Catégorie</span>
                <input value={state.category} onChange={(event) => patch({ category: event.target.value })} />
              </label>
              <label>
                <span>Public</span>
                <input value={state.audience} onChange={(event) => patch({ audience: event.target.value })} />
              </label>
            </div>
            <ul className="editorial-requirements">
              {selectedFamily.requirements.map((requirement) => (
                <li key={requirement}>{requirement}</li>
              ))}
            </ul>
          </section>

          <section className="editorial-panel">
            <header>
              <p className="bcvb-eyebrow">Sources</p>
              <h2>Sources / OCR / pièces jointes</h2>
            </header>
            <div className="editorial-attachment-row">
              <label>
                <span>Importer PDF, image, DOCX ou texte</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md,.csv,image/*"
                  onChange={(event) => handleAttachment(event.target.files?.[0] ?? null)}
                />
              </label>
              <Link to="/admin/ocr-pieces-jointes">Ouvrir OCR avancé</Link>
            </div>
            <textarea
              className="editorial-textarea"
              value={state.sourceText}
              onChange={(event) => patch({ sourceText: event.target.value })}
              placeholder="Colle ici le texte source, une extraction OCR, le contenu d’un PDF ou une matière brute à transformer."
            />
            <div className="editorial-actions">
              <button type="button" onClick={() => patch({ editorialPlan: buildPlanDraft(state) })}>Générer plan éditorial</button>
              <button type="button" onClick={() => generatePrompt('chatgpt')}>Générer prompt ChatGPT</button>
              <button type="button" onClick={() => generatePrompt('claude')}>Générer prompt Claude</button>
            </div>
          </section>

          <section className="editorial-panel">
            <header>
              <p className="bcvb-eyebrow">Plan éditorial</p>
              <h2>Architecture publication club</h2>
            </header>
            <textarea
              className="editorial-textarea editorial-textarea--small"
              value={state.editorialPlan}
              onChange={(event) => patch({ editorialPlan: event.target.value })}
              placeholder="Plan éditorial, sections, progression, situations, schémas, évaluations..."
            />
          </section>

          <section className="editorial-panel">
            <header>
              <p className="bcvb-eyebrow">Production IA</p>
              <h2>Modes spécialisés</h2>
            </header>
            <div className="editorial-mode-grid">
              {EDITORIAL_AI_MODES.map((mode) => (
                <button
                  type="button"
                  className={state.activeMode === mode.id ? 'is-active' : ''}
                  onClick={() => generatePrompt(mode.id)}
                  key={mode.id}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <textarea
              className="editorial-textarea"
              value={state.activePrompt}
              onChange={(event) => patch({ activePrompt: event.target.value })}
              placeholder="Le prompt spécialisé apparaît ici."
            />
            <div className="editorial-actions">
              <button type="button" onClick={copyPrompt}>Copier prompt</button>
              <button type="button" onClick={() => generatePrompt('fusion')}>Fusionner les réponses</button>
              <button type="button" onClick={() => generatePrompt('massive-correction')}>Correction massive</button>
              <button type="button" onClick={() => generatePrompt('publication-reconstruction')}>Reconstruction publication club</button>
            </div>
            {copied && <p className="editorial-message">{copied}</p>}
          </section>

          <section className="editorial-panel">
            <header>
              <p className="bcvb-eyebrow">Réponses IA</p>
              <h2>Coller / analyser réponse</h2>
            </header>
            <div className="editorial-response-grid">
              <textarea value={state.chatGptResponse} onChange={(event) => patch({ chatGptResponse: event.target.value })} placeholder="Réponse ChatGPT" />
              <textarea value={state.claudeResponse} onChange={(event) => patch({ claudeResponse: event.target.value })} placeholder="Réponse Claude" />
            </div>
            <textarea
              className="editorial-textarea editorial-textarea--small"
              value={state.analyzedResponse}
              onChange={(event) => patch({ analyzedResponse: event.target.value })}
              placeholder="Colle ici la réponse finale à analyser ou prévisualiser."
            />
            <div className="editorial-actions">
              <button type="button" onClick={analyzeResponse}>Coller / analyser réponse</button>
              <button type="button" onClick={analyzeResponse}>Prévisualiser</button>
            </div>
          </section>

          <section className="editorial-panel editorial-quality-panel">
            <header>
              <p className="bcvb-eyebrow">Contrôle qualité actionable</p>
              <h2>Score et corrections recommandées</h2>
            </header>
            <div className="editorial-quality-summary">
              <strong>{state.qualityScore}/100</strong>
              <div>
                <p>{state.recommendedAction}</p>
                <ul>
                  {qualityActions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="editorial-actions">
              <button type="button" onClick={analyzeResponse}>Relancer contrôle qualité</button>
              <button type="button" onClick={() => generatePrompt('massive-correction')}>Correction massive</button>
              <button type="button" onClick={() => generatePrompt('publication-reconstruction')}>Reconstruction publication club</button>
            </div>
          </section>

          <section className="editorial-panel editorial-preview">
            <header>
              <p className="bcvb-eyebrow">Export</p>
              <h2>Document final</h2>
            </header>
            {finalDocumentExists ? (
              <pre>{state.finalDocument}</pre>
            ) : (
              <div className="editorial-empty-preview">
                Colle ou génère une réponse finale pour activer les exports.
              </div>
            )}
            {finalDocumentExists && (
              <div className="editorial-actions editorial-actions--export">
                <button type="button" onClick={exportPdf}>Export PDF</button>
                <button type="button" onClick={() => downloadText(`${state.targetDocument}.md`, state.finalDocument)}>Télécharger source</button>
                <button type="button" onClick={saveToLibrary}>Enregistrer bibliothèque</button>
              </div>
            )}
          </section>

        </section>

        <aside className="editorial-status-sidebar">
          <p className="bcvb-eyebrow">Statut studio</p>
          <h2>{state.targetDocument}</h2>
          <dl>
            <div><dt>Famille</dt><dd>{selectedFamily.label}</dd></div>
            <div><dt>Catégorie</dt><dd>{state.category}</dd></div>
            <div><dt>Score qualité</dt><dd>{state.qualityScore}/100</dd></div>
            <div><dt>Source</dt><dd>{savedState.steps.sources}</dd></div>
            <div><dt>Plan</dt><dd>{savedState.steps.plan}</dd></div>
            <div><dt>Production</dt><dd>{savedState.steps.production}</dd></div>
            <div><dt>Export</dt><dd>{savedState.steps.export}</dd></div>
            <div><dt>Dernière sauvegarde</dt><dd>{lastSavedAt ? new Date(lastSavedAt).toLocaleString('fr-FR') : 'Autosave actif'}</dd></div>
          </dl>
          <article className="editorial-status-sidebar__action">
            <span>Action recommandée</span>
            <p>{state.recommendedAction}</p>
          </article>
          <p className="editorial-message">{message}</p>
          {state.updatedAt && <p className="editorial-save-state">Sauvegardé automatiquement.</p>}
        </aside>
      </div>
    </main>
  )
}
