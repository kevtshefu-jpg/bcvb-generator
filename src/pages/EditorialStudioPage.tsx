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

  function scrollToStudioBlock(blockId: string) {
    window.setTimeout(() => {
      document.getElementById(blockId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  function saveStudioNow() {
    const nextState = saveEditorialStudioState(savedState)
    setLastSavedAt(nextState.updatedAt)
    setMessage('Studio sauvegardé.')
  }

  function appendToFinalDocument(label: string, snippet: string) {
    const base = state.finalDocument.trim() || state.analyzedResponse.trim() || state.sourceText.trim()
    const nextDocument = `${base ? `${base}\n\n` : ''}${snippet}`.trim()
    patch({
      finalDocument: nextDocument,
      qualityScore: computeQualityScore(nextDocument),
      recommendedAction: 'Bloc ajouté. Relance le score puis vérifie le rendu.',
    })
    setMessage(`${label} ajouté au document.`)
    scrollToStudioBlock('studio-editor')
  }

  const studioWarnings = useMemo(() => {
    const content = state.finalDocument || state.analyzedResponse || state.sourceText
    const warnings = []
    if (!state.sourceText.trim()) warnings.push('Source absente : ajoute un prompt, un OCR ou une note admin.')
    if (!state.editorialPlan.trim()) warnings.push('Plan éditorial à construire.')
    if (!content.trim()) warnings.push('Document final non généré.')
    if (state.qualityScore < 90) warnings.push('Score qualité à améliorer avant publication.')
    if (!/objectif|objectifs/i.test(content)) warnings.push('Objectifs explicites manquants.')
    if (!/crit[eè]re|observable|réussite/i.test(content)) warnings.push('Critères de réussite à ajouter.')
    if (!/vigilance|attention|point clé/i.test(content)) warnings.push('Bloc vigilance conseillé.')
    return warnings
  }, [state.editorialPlan, state.finalDocument, state.analyzedResponse, state.sourceText, state.qualityScore])

  const editorStats = useMemo(() => {
    const content = state.finalDocument || ''
    return [
      { label: 'Sections', value: String((content.match(/^##\s+/gm) || []).length) },
      { label: 'Tableaux', value: String((content.match(/\|.+\|/g) || []).length > 0 ? (content.match(/\n\|/g) || []).length : 0) },
      { label: 'Situations', value: String((content.match(/bcvb-situation|situation pédagogique|situation/gi) || []).length) },
      { label: 'Encarts', value: String((content.match(/:::bcvb-/gi) || []).length) },
    ]
  }, [state.finalDocument])

  const quickActions = [
    {
      label: 'Ajouter identité BCVB',
      action: () => appendToFinalDocument('Identité BCVB', ':::bcvb-identity\ntitle: Identité BCVB\ncontent: Défendre Fort, Courir et Partager la Balle. Défense Homme à Homme, intensité, agressivité maîtrisée, maîtrise et jeu collectif.\n:::'),
    },
    {
      label: 'Ajouter objectifs',
      action: () => appendToFinalDocument('Objectifs', '## Objectifs\n- Objectif principal : à préciser.\n- Objectif terrain : action observable à obtenir.\n- Objectif BCVB : relier Défendre Fort, Courir ou Partager la Balle.'),
    },
    {
      label: 'Ajouter critères de réussite',
      action: () => appendToFinalDocument('Critères de réussite', '## Critères de réussite\n- Critère observable 1 : comportement visible.\n- Critère observable 2 : décision juste sous pression.\n- Critère quantifiable : fréquence, durée ou réussite attendue.'),
    },
    {
      label: 'Ajouter tableau',
      action: () => appendToFinalDocument('Tableau', '## Tableau de synthèse\n| Élément | Intention | Critère | Point de vigilance |\n| --- | --- | --- | --- |\n| À compléter | À préciser | Observable | À relire |'),
    },
    {
      label: 'Ajouter situation pédagogique',
      action: () => appendToFinalDocument('Situation pédagogique', ':::bcvb-situation\ntitle: Situation à compléter\nobjectif: Relier l’objectif à une action terrain.\norganisation: Espace, joueurs, matériel, rotations.\nconsignes_joueurs: Défendre Fort, Courir, Partager la Balle.\ncriteres_reussite: Critères observables et mesurables.\nevolution_1: Simplifier ou complexifier.\n:::'),
    },
    {
      label: 'Ajouter bloc vigilance',
      action: () => appendToFinalDocument('Bloc vigilance', ':::bcvb-vigilance\ntitle: Point de vigilance\ncontent: À relire avant publication : clarté des consignes, sécurité, cohérence avec le niveau et rôle des adultes.\n:::'),
    },
    {
      label: 'Ajouter bilan',
      action: () => appendToFinalDocument('Bilan', '## Bilan\n- Ce qui est acquis.\n- Ce qui reste à travailler.\n- Prochaine action coach / admin / dirigeant.\n- Décision de publication.'),
    },
    {
      label: 'Améliorer le style',
      action: () => generatePrompt('massive-correction'),
    },
    {
      label: 'Préparer export PDF',
      action: () => scrollToStudioBlock('studio-export'),
    },
  ]

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

      <section className="editorial-top-toolbar">
        <button type="button" onClick={saveStudioNow}>Sauvegarder</button>
        <button type="button" onClick={() => { analyzeResponse(); scrollToStudioBlock('studio-preview') }}>Prévisualiser</button>
        <button type="button" onClick={analyzeResponse}>Scorer</button>
        <button type="button" onClick={() => generatePrompt('massive-correction')}>Améliorer</button>
        <button type="button" onClick={exportPdf}>Exporter</button>
        <button type="button" onClick={resumeWork}>Historique</button>
      </section>

      <div className="editorial-studio-layout editorial-studio-layout--workbench">
        <aside className="editorial-source-column" id="studio-source">
          <section className="editorial-panel">
            <header>
              <p className="bcvb-eyebrow">Source</p>
              <h2>Prompt initial</h2>
            </header>
            <textarea
              className="editorial-textarea editorial-textarea--small"
              value={state.activePrompt}
              onChange={(event) => patch({ activePrompt: event.target.value })}
              placeholder="Prompt initial ou prompt généré par le module Créer."
            />
            <div className="editorial-actions">
              <button type="button" onClick={() => generatePrompt('chatgpt')}>Prompt ChatGPT</button>
              <button type="button" onClick={() => generatePrompt('claude')}>Prompt Claude</button>
              <button type="button" onClick={copyPrompt}>Copier</button>
            </div>
            {copied && <p className="editorial-message">{copied}</p>}
          </section>

          <section className="editorial-panel">
            <header>
              <p className="bcvb-eyebrow">OCR / texte brut</p>
              <h2>Sources importées</h2>
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
              <Link to="/admin/ocr-pieces-jointes">OCR avancé</Link>
            </div>
            <textarea
              className="editorial-textarea"
              value={state.sourceText}
              onChange={(event) => patch({ sourceText: event.target.value })}
              placeholder="Texte OCR, source brute, notes de fichier ou contenu à transformer."
            />
          </section>

          <section className="editorial-panel">
            <header>
              <p className="bcvb-eyebrow">Notes admin</p>
              <h2>Cadrage et métadonnées</h2>
            </header>
            <div className="editorial-form-grid editorial-form-grid--single">
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
            <dl className="editorial-metadata-list">
              <div><dt>Fichier associé</dt><dd>{state.transformedFromTitle || 'Aucun fichier associé'}</dd></div>
              <div><dt>Source document</dt><dd>{state.sourceDocumentId || 'Source locale'}</dd></div>
              <div><dt>Dernière sauvegarde</dt><dd>{lastSavedAt ? new Date(lastSavedAt).toLocaleString('fr-FR') : 'Autosave actif'}</dd></div>
            </dl>
          </section>
        </aside>

        <section className="editorial-editor-column" id="studio-editor">
          <section className="editorial-panel editorial-editor-shell">
            <header>
              <p className="bcvb-eyebrow">Éditeur</p>
              <h2>BCVB Rich Markdown</h2>
              <span>Sections · tableaux · situations · encarts</span>
            </header>
            <div className="editorial-editor-stats">
              {editorStats.map((item) => (
                <article key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </article>
              ))}
            </div>
            <textarea
              className="editorial-markdown-editor"
              value={state.finalDocument}
              onChange={(event) => patch({ finalDocument: event.target.value, qualityScore: computeQualityScore(event.target.value) })}
              placeholder="Écris ou colle ici le document final BCVB Rich Markdown. Les actions rapides à droite ajoutent des blocs prêts à relire."
            />
          </section>

          <section className="editorial-panel">
            <header>
              <p className="bcvb-eyebrow">Structure</p>
              <h2>Plan et production IA</h2>
            </header>
            <textarea
              className="editorial-textarea editorial-textarea--small"
              value={state.editorialPlan}
              onChange={(event) => patch({ editorialPlan: event.target.value })}
              placeholder="Plan éditorial, sections, progression, situations, schémas, évaluations..."
            />
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
            <div className="editorial-actions">
              <button type="button" onClick={() => patch({ editorialPlan: buildPlanDraft(state) })}>Générer plan</button>
              <button type="button" onClick={() => generatePrompt('fusion')}>Fusion ChatGPT + Claude</button>
              <button type="button" onClick={() => generatePrompt('publication-reconstruction')}>Reconstruction publication</button>
            </div>
          </section>

          <section className="editorial-panel">
            <header>
              <p className="bcvb-eyebrow">Réponses IA</p>
              <h2>Comparer et analyser</h2>
            </header>
            <div className="editorial-response-grid">
              <textarea value={state.chatGptResponse} onChange={(event) => patch({ chatGptResponse: event.target.value })} placeholder="Réponse ChatGPT" />
              <textarea value={state.claudeResponse} onChange={(event) => patch({ claudeResponse: event.target.value })} placeholder="Réponse Claude" />
            </div>
            <textarea
              className="editorial-textarea editorial-textarea--small"
              value={state.analyzedResponse}
              onChange={(event) => patch({ analyzedResponse: event.target.value })}
              placeholder="Réponse finale à analyser ou à convertir en document final."
            />
            <div className="editorial-actions">
              <button type="button" onClick={analyzeResponse}>Analyser et envoyer dans l’éditeur</button>
              <button type="button" onClick={() => patch({ finalDocument: state.analyzedResponse || state.chatGptResponse || state.claudeResponse })}>Utiliser comme document final</button>
            </div>
          </section>

          <section className="editorial-panel editorial-preview" id="studio-preview">
            <header>
              <p className="bcvb-eyebrow">Aperçu / Export</p>
              <h2>Document final</h2>
            </header>
            {finalDocumentExists ? (
              <pre>{state.finalDocument}</pre>
            ) : (
              <div className="editorial-empty-preview">
                Colle ou génère une réponse finale pour activer la prévisualisation.
              </div>
            )}
            {finalDocumentExists && (
              <div className="editorial-actions editorial-actions--export" id="studio-export">
                <button type="button" onClick={exportPdf}>Export PDF</button>
                <button type="button" onClick={() => downloadText(`${state.targetDocument}.md`, state.finalDocument)}>Télécharger source</button>
                <button type="button" onClick={saveToLibrary}>Enregistrer bibliothèque</button>
              </div>
            )}
          </section>
        </section>

        <aside className="editorial-assistance-column">
          <section className="editorial-status-sidebar">
            <p className="bcvb-eyebrow">Assistance</p>
            <h2>{state.targetDocument}</h2>
            <div className="editorial-quality-summary editorial-quality-summary--compact">
              <strong>{state.qualityScore}/100</strong>
              <div>
                <p>{state.recommendedAction}</p>
              </div>
            </div>
            <dl>
              <div><dt>Famille</dt><dd>{selectedFamily.label}</dd></div>
              <div><dt>Catégorie</dt><dd>{state.category}</dd></div>
              <div><dt>Source</dt><dd>{savedState.steps.sources}</dd></div>
              <div><dt>Plan</dt><dd>{savedState.steps.plan}</dd></div>
              <div><dt>Production</dt><dd>{savedState.steps.production}</dd></div>
              <div><dt>Export</dt><dd>{savedState.steps.export}</dd></div>
            </dl>
            <p className="editorial-message">{message}</p>
          </section>

          <section className="editorial-panel editorial-assist-panel">
            <header>
              <p className="bcvb-eyebrow">Recommandations</p>
              <h2>À améliorer</h2>
            </header>
            <ul className="editorial-assist-list">
              {qualityActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </section>

          <section className="editorial-panel editorial-assist-panel">
            <header>
              <p className="bcvb-eyebrow">Warnings</p>
              <h2>Points à relire</h2>
            </header>
            <ul className="editorial-warning-list">
              {studioWarnings.length > 0 ? studioWarnings.map((warning) => (
                <li key={warning}>{warning}</li>
              )) : <li>Aucun warning majeur détecté.</li>}
            </ul>
          </section>

          <section className="editorial-panel editorial-assist-panel">
            <header>
              <p className="bcvb-eyebrow">Actions rapides</p>
              <h2>Améliorer sans chercher</h2>
            </header>
            <div className="editorial-quick-actions">
              {quickActions.map((item) => (
                <button type="button" key={item.label} onClick={item.action}>
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          <section className="editorial-panel editorial-assist-panel">
            <header>
              <p className="bcvb-eyebrow">Checklist publication</p>
              <h2>Avant diffusion</h2>
            </header>
            <ul className="editorial-checklist">
              <li>Source conservée et compréhensible.</li>
              <li>Objectifs et critères de réussite visibles.</li>
              <li>Tableaux, situations et encarts relus.</li>
              <li>Score qualité contrôlé par l’admin.</li>
              <li>Export PDF testé avant publication.</li>
            </ul>
          </section>
        </aside>
      </div>
    </main>
  )
}
