import { useMemo, useState } from 'react'
import { buildDocumentFamilyPrompt } from '../../documents/prompts/buildDocumentFamilyPrompt'
import { normalizeBCVBRichMarkdown } from '../../documents/utils/normalizeBCVBRichMarkdown'
import { normalizeBcvbBlocks } from '../../documents/utils/normalizeBcvbBlocks'
import { normalizeRawMarkdownTables } from '../../documents/utils/normalizeRawMarkdownTables'
import type { DocumentStandard } from '../../documents/standards/documentFamilyStandards'
import {
  AI_API_ENABLED,
  AI_PROVIDERS,
  DEFAULT_CLAUDE_MODEL,
  DEFAULT_OPENAI_MODEL,
} from '../ai/aiProviders'
import { generateWithAi } from '../ai/generateWithAi'
import type { AiProvider } from '../ai/types'
import type { EditorialProvider } from '../../../utils/editorialDraftStorage'
import { analyzeDocumentIntent, type DocumentFamily as IntelligentDocumentFamily } from '../../editorial-intelligence/documentIntentEngine'
import { buildEditorialPlan } from '../../editorial-intelligence/editorialPlanBuilder'
import { buildMasterPromptFromPlan } from '../../editorial-intelligence/promptMasterBuilder'
import { buildFusionPrompt } from '../../../lib/fusionPromptBuilder'
import type { DocumentProductionSettings } from './DocumentFramingPanel'
import type { DocumentSourcePayload } from './DocumentSourcePanel'
import type { EditorialPlan } from './EditorialPlanPanel'

type ProductionPanelProps = {
  settings: DocumentProductionSettings
  standard: DocumentStandard | null
  source: DocumentSourcePayload
  plan: EditorialPlan | null
  planValidated: boolean
  prompt: string
  responseContent: string
  initialProvider?: EditorialProvider
  onPromptChange: (prompt: string) => void
  onResponseChange: (content: string) => void
  onAnalyze: (content: string) => void
  onPreview: () => void
  onProviderChange?: (provider: EditorialProvider) => void
}

function normalizeForStudio(content: string) {
  const withTables = normalizeRawMarkdownTables(content)
  const withBlocks = normalizeBcvbBlocks(withTables)
  const normalized = normalizeBCVBRichMarkdown(withBlocks.content).content
  return {
    content: normalized,
    warnings: withBlocks.warnings,
  }
}

function mapIntelligentFamily(value: string): IntelligentDocumentFamily {
  if (value === 'technical-book') return 'cahier_technique'
  if (value === 'coach-guide') return 'guide_coach'
  if (value === 'training-plan') return 'plan_formation'
  if (value === 'pedagogical-ribbon') return 'ruban_pedagogique'
  if (value === 'practice-session') return 'seance_entrainement'
  return 'fiche_theme'
}

function mapEditorialProvider(provider?: EditorialProvider): AiProvider {
  if (provider === 'claude') return 'manual_claude'
  return 'manual_chatgpt'
}

function toEditorialProvider(provider: AiProvider): EditorialProvider {
  if (provider === 'manual_claude' || provider === 'anthropic') return 'claude'
  if (provider === 'manual_chatgpt' || provider === 'openai') return 'chatgpt'
  return 'manual'
}

export function ProductionPanel({
  settings,
  standard,
  source,
  plan,
  planValidated,
  prompt,
  responseContent,
  initialProvider,
  onPromptChange,
  onResponseChange,
  onAnalyze,
  onPreview,
  onProviderChange,
}: ProductionPanelProps) {
  const [provider, setProvider] = useState<AiProvider>(mapEditorialProvider(initialProvider))
  const [model, setModel] = useState(DEFAULT_OPENAI_MODEL)
  const [generating, setGenerating] = useState(false)
  const [aiStatus, setAiStatus] = useState('Mode manuel disponible sans crédit API.')
  const [selectedProvider, setSelectedProvider] = useState<'chatgpt' | 'claude'>(
    initialProvider === 'claude' ? 'claude' : 'chatgpt'
  )
  const [chatgptResponse, setChatgptResponse] = useState('')
  const [claudeResponse, setClaudeResponse] = useState('')
  const [fusionPrompt, setFusionPrompt] = useState('')
  const canGeneratePrompt = Boolean(standard && settings.family && settings.targetTitle.trim() && planValidated)
  const activeProvider = useMemo(
    () => AI_PROVIDERS.find((item) => item.provider === provider) ?? AI_PROVIDERS[0],
    [provider]
  )
  const apiBlocked = activeProvider.requiresApiKey && !AI_API_ENABLED

  function buildBasePrompt(providerOverride = provider) {
    if (!standard) return ''
    const providerProfile = providerOverride === 'manual_claude' || providerOverride === 'anthropic' ? 'claude' : 'chatgpt'
    const intent = analyzeDocumentIntent({
      title: settings.targetTitle,
      selectedFamily: mapIntelligentFamily(standard.id),
      category: settings.category,
      audience: settings.audience,
      productionLevel: /premium|edition/i.test(settings.productionLevel)
        ? 'edition_premium'
        : /reference/i.test(settings.productionLevel)
          ? 'reference_bcvb'
          : 'publication_club',
      sourceText: source.text,
    })
    const intelligentPlan = buildEditorialPlan(intent)
    const twoStagePrompt = buildMasterPromptFromPlan({
      plan: intelligentPlan,
      sourceText: [
        plan ? `PLAN ADMIN VALIDÉ\n${plan.summary.map((item, index) => `${index + 1}. ${item}`).join('\n')}` : '',
        source.text,
      ].filter(Boolean).join('\n\n'),
      selectedReferentials: settings.selectedReferentials,
      provider: providerProfile,
    })

    return buildDocumentFamilyPrompt({
      family: standard.id,
      category: settings.category,
      theme: settings.targetTitle,
      audience: settings.audience,
      season: settings.season,
      sourceContent: [
        plan ? `PLAN ÉDITORIAL VALIDÉ\n${plan.summary.map((item, index) => `${index + 1}. ${item}`).join('\n')}` : '',
        source.text,
      ].filter(Boolean).join('\n\n'),
      options: {
        depth: settings.productionLevel,
        includeSource: Boolean(source.text || plan),
      },
    }) + `\n\n${twoStagePrompt}`
  }

  async function buildPrompt() {
    const basePrompt = buildBasePrompt()
    if (!basePrompt) return
    const result = await generateWithAi({
      provider: provider === 'dual' ? 'manual_chatgpt' : provider,
      model,
      role: 'writer',
      prompt: basePrompt,
      system: 'Tu es un comité éditorial technique du BCVB.',
    })
    onPromptChange(result.text)
    setAiStatus(provider === 'manual_claude' ? 'Prompt Claude généré.' : 'Prompt ChatGPT généré.')
  }

  async function copyPrompt() {
    const nextPrompt = prompt || ''
    if (!nextPrompt.trim()) return
    await navigator.clipboard.writeText(nextPrompt)
  }

  async function copyPromptFor(nextProvider: 'chatgpt' | 'claude') {
    const nextAiProvider: AiProvider = nextProvider === 'claude' ? 'manual_claude' : 'manual_chatgpt'
    setSelectedProvider(nextProvider)
    setProvider(nextAiProvider)
    setModel(nextProvider === 'claude' ? DEFAULT_CLAUDE_MODEL : DEFAULT_OPENAI_MODEL)
    onProviderChange?.(nextProvider)

    const basePrompt = buildBasePrompt(nextAiProvider)
    if (!basePrompt) return

    const result = await generateWithAi({
      provider: nextAiProvider,
      model: nextProvider === 'claude' ? DEFAULT_CLAUDE_MODEL : DEFAULT_OPENAI_MODEL,
      role: 'writer',
      prompt: basePrompt,
      system: 'Tu es un comité éditorial technique du BCVB.',
    })
    onPromptChange(result.text)
    await navigator.clipboard.writeText(result.text)
    setAiStatus(nextProvider === 'claude' ? 'Prompt Claude copié.' : 'Prompt ChatGPT copié.')
  }

  function normalizeResponse() {
    const normalized = normalizeForStudio(responseContent)
    onResponseChange(normalized.content)
    onAnalyze(normalized.content)
  }

  async function runAiGeneration() {
    const basePrompt = prompt.trim() || buildBasePrompt()
    if (!basePrompt || apiBlocked) return

    setGenerating(true)
    setAiStatus('Génération IA en cours...')
    try {
      const result = await generateWithAi({
        provider,
        model,
        role: provider === 'dual' ? 'fusion' : 'writer',
        prompt: basePrompt,
        system: 'Tu es un comité éditorial technique du BCVB. Réponds uniquement avec du Rich Markdown BCVB propre.',
        maxTokens: 12000,
        temperature: 0.4,
      })

      if (provider === 'manual_chatgpt' || provider === 'manual_claude') {
        onPromptChange(result.text)
      } else {
        onResponseChange(result.text)
        onAnalyze(result.text)
      }

      setAiStatus(result.error ? `Erreur : ${result.error}` : `Réponse ${activeProvider.label} reçue.`)
    } finally {
      setGenerating(false)
    }
  }

  function extractFusionPrompt() {
    const marker = '## Prompt de fusion éditoriale'
    const index = responseContent.indexOf(marker)
    if (index < 0) return
    onPromptChange(responseContent.slice(index + marker.length).trim())
    setAiStatus('Prompt de fusion extrait dans la zone prompt.')
  }

  function generateFusionPrompt() {
    const nextPrompt = buildFusionPrompt({
      title: settings.targetTitle,
      family: standard?.label || settings.family || 'Document BCVB',
      category: settings.category,
      chatgptResponse,
      claudeResponse,
    })

    setFusionPrompt(nextPrompt)
    onPromptChange(nextPrompt)
    setAiStatus('Prompt de fusion ChatGPT + Claude généré.')
  }

  return (
    <section className="ai-studio-card">
      <div className="ai-studio-card__header">
        <p className="ai-studio-kicker">Étape 4</p>
        <h2>Production IA</h2>
        <p>Copie le prompt, colle la réponse IA à intégrer, puis lance la mise au format BCVB.</p>
      </div>

      {!planValidated && (
        <p className="ai-studio-alert ai-studio-alert--warning">
          Valide le plan éditorial avant de générer le document complet.
        </p>
      )}

      <div className="ai-provider-panel">
        <div className="provider-switch">
          <button
            type="button"
            className={selectedProvider === 'chatgpt' ? 'active' : ''}
            onClick={() => {
              setSelectedProvider('chatgpt')
              setProvider('manual_chatgpt')
              setModel(DEFAULT_OPENAI_MODEL)
              onProviderChange?.('chatgpt')
            }}
          >
            ChatGPT
          </button>

          <button
            type="button"
            className={selectedProvider === 'claude' ? 'active' : ''}
            onClick={() => {
              setSelectedProvider('claude')
              setProvider('manual_claude')
              setModel(DEFAULT_CLAUDE_MODEL)
              onProviderChange?.('claude')
            }}
          >
            Claude
          </button>
        </div>

        <div className="ai-studio-form-grid">
          <label>
            <span>Moteur IA</span>
            <select
              value={provider}
              onChange={(event) => {
                const nextProvider = event.target.value as AiProvider
                const nextEditorialProvider = toEditorialProvider(nextProvider)
                setProvider(nextProvider)
                if (nextEditorialProvider === 'chatgpt' || nextEditorialProvider === 'claude') {
                  setSelectedProvider(nextEditorialProvider)
                }
                onProviderChange?.(nextEditorialProvider)
                setModel(
                  nextProvider === 'anthropic' || nextProvider === 'manual_claude'
                    ? DEFAULT_CLAUDE_MODEL
                    : DEFAULT_OPENAI_MODEL
                )
              }}
            >
              {AI_PROVIDERS.map((item) => (
                <option key={item.provider} value={item.provider}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Modèle</span>
            <input
              value={model}
              onChange={(event) => setModel(event.target.value)}
              placeholder={
                provider === 'anthropic' || provider === 'manual_claude'
                  ? DEFAULT_CLAUDE_MODEL
                  : DEFAULT_OPENAI_MODEL
              }
            />
          </label>
        </div>

        <p>{activeProvider.description}</p>
        <div className="ai-provider-badges">
          <span>{activeProvider.requiresApiKey ? 'API' : 'Manuel'}</span>
          {activeProvider.supportsFiles && <span>Fichiers</span>}
          {activeProvider.supportsImages && <span>Images</span>}
          {activeProvider.supportsLongContext && <span>Long contexte</span>}
        </div>
        <p className="ai-studio-alert ai-studio-alert--warning">
          Les clés API restent côté serveur. Le mode manuel ne consomme aucun crédit.
          {apiBlocked ? ' Modes API désactivés : définir VITE_ENABLE_AI_API=true et les secrets Supabase.' : ''}
        </p>
        {aiStatus && <p className="ai-provider-status">{aiStatus}</p>}
      </div>

      <div className="ai-studio-actions">
        <button type="button" className="ai-studio-primary" onClick={buildPrompt} disabled={!canGeneratePrompt}>
          {provider === 'manual_claude' ? 'Générer prompt Claude' : 'Générer prompt ChatGPT'}
        </button>
        <button
          type="button"
          className="ai-studio-primary"
          onClick={runAiGeneration}
          disabled={!canGeneratePrompt || apiBlocked || generating}
        >
          {provider === 'openai'
            ? 'Lancer OpenAI'
            : provider === 'anthropic'
              ? 'Lancer Claude'
              : provider === 'dual'
                ? 'Lancer double génération'
                : generating
                  ? 'Préparation...'
                  : 'Préparer mode manuel'}
        </button>
        <button
          type="button"
          className="ai-studio-secondary"
          onClick={extractFusionPrompt}
          disabled={provider !== 'dual' || !responseContent.includes('## Prompt de fusion éditoriale')}
        >
          Fusionner les réponses
        </button>
        <button type="button" className="ai-studio-secondary" onClick={copyPrompt} disabled={!prompt.trim()}>
          Copier le prompt
        </button>
        <button type="button" className="ai-studio-secondary" onClick={() => onAnalyze(responseContent)} disabled={!responseContent.trim()}>
          Coller / analyser la réponse
        </button>
        <button type="button" className="ai-studio-secondary" onClick={normalizeResponse} disabled={!responseContent.trim()}>
          Mise au format BCVB
        </button>
        <button type="button" className="ai-studio-secondary" onClick={onPreview} disabled={!responseContent.trim()}>
          Prévisualiser
        </button>
      </div>

      <div className="bcvb-provider-actions">
        <button
          type="button"
          className="bcvb-button"
          onClick={() => copyPromptFor('chatgpt')}
          disabled={!canGeneratePrompt}
        >
          Copier pour ChatGPT
        </button>

        <button
          type="button"
          className="bcvb-button-secondary"
          onClick={() => copyPromptFor('claude')}
          disabled={!canGeneratePrompt}
        >
          Copier pour Claude
        </button>

	        <button
	          type="button"
	          className="bcvb-button-secondary"
	          onClick={() => {
	            document.querySelector<HTMLTextAreaElement>('[data-ai-response-textarea]')?.focus()
	          }}
	        >
	          Coller la réponse IA
	        </button>
      </div>

      <div className="ai-studio-card ai-studio-card--nested">
        <div className="ai-studio-card__header">
          <p className="ai-studio-kicker">Fusion éditoriale</p>
          <h3>Fusionner ChatGPT + Claude</h3>
          <p>Colle les deux versions, puis génère un prompt de fusion pour produire une version finale supérieure.</p>
        </div>

        <label className="ai-studio-full-field">
          <span>Réponse ChatGPT</span>
          <textarea
            value={chatgptResponse}
            onChange={(event) => setChatgptResponse(event.target.value)}
            placeholder="Colle ici la réponse ChatGPT"
          />
        </label>

        <label className="ai-studio-full-field">
          <span>Réponse Claude</span>
          <textarea
            value={claudeResponse}
            onChange={(event) => setClaudeResponse(event.target.value)}
            placeholder="Colle ici la réponse Claude"
          />
        </label>

        <button
          type="button"
          className="bcvb-button-secondary"
          onClick={generateFusionPrompt}
          disabled={!chatgptResponse.trim() || !claudeResponse.trim()}
        >
          Fusionner ChatGPT + Claude
        </button>

        <label className="ai-studio-full-field">
          <span>Prompt de fusion</span>
          <textarea value={fusionPrompt} readOnly />
        </label>
      </div>

      <label className="ai-studio-full-field">
        <span>Prompt maître</span>
        <textarea value={prompt} onChange={(event) => onPromptChange(event.target.value)} />
      </label>

      <label className="ai-studio-full-field">
        <span>Réponse IA à intégrer</span>
        <textarea
          value={responseContent}
          onChange={(event) => onResponseChange(event.target.value)}
          data-ai-response-textarea
          placeholder="Colle ici la réponse complète générée par ChatGPT ou Claude..."
        />
      </label>
    </section>
  )
}
