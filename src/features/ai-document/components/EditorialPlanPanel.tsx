import type { DocumentStandard } from '../../documents/standards/documentFamilyStandards'
import { analyzeDocumentIntent, type DocumentFamily } from '../../editorial-intelligence/documentIntentEngine'
import { buildEditorialPlan } from '../../editorial-intelligence/editorialPlanBuilder'
import type { DocumentProductionSettings } from './DocumentFramingPanel'
import type { DocumentSourcePayload } from './DocumentSourcePanel'

export type EditorialPlan = {
  title: string
  summary: string[]
  mandatoryBlocks: string[]
  expectedTables: number
  expectedSituations: number
  expectedDiagrams: number
  sectionsToEnrich: string[]
  referentials: string[]
  format?: string
  chapterCount?: number
  detectedFamily?: DocumentFamily
  recommendedFamily?: DocumentFamily
  manuallyEdited?: boolean
}

type EditorialPlanPanelProps = {
  settings: DocumentProductionSettings
  standard: DocumentStandard | null
  source: DocumentSourcePayload
  plan: EditorialPlan | null
  validated: boolean
  onPlanChange: (plan: EditorialPlan) => void
  onValidate: () => void
}

function buildPlan(settings: DocumentProductionSettings, standard: DocumentStandard): EditorialPlan {
  const intent = analyzeDocumentIntent({
    title: settings.targetTitle,
    selectedFamily: mapFamily(settings.family),
    category: settings.category,
    audience: settings.audience,
    productionLevel: mapLevel(settings.productionLevel),
  })
  const intelligentPlan = buildEditorialPlan(intent)

  return {
    title: settings.targetTitle,
    summary: intelligentPlan.chapters.map((chapter) => chapter.title),
    mandatoryBlocks: intelligentPlan.chapters.flatMap((chapter) => chapter.expectedBlocks),
    expectedTables: intelligentPlan.globalTargets.tables,
    expectedSituations: intelligentPlan.globalTargets.situations,
    expectedDiagrams: intelligentPlan.globalTargets.diagrams,
    sectionsToEnrich: standard.qualityCriteria,
    referentials: settings.selectedReferentials,
    format: intelligentPlan.format,
    chapterCount: intelligentPlan.chapters.length,
    detectedFamily: intent.detectedFamily,
    recommendedFamily: intent.recommendedFamily,
  }
}

function mapFamily(value: string): DocumentFamily {
  if (value === 'technical-book') return 'cahier_technique'
  if (value === 'coach-guide') return 'guide_coach'
  if (value === 'training-plan') return 'plan_formation'
  if (value === 'pedagogical-ribbon') return 'ruban_pedagogique'
  if (value === 'practice-session') return 'seance_entrainement'
  return 'fiche_theme'
}

function mapLevel(value: string) {
  if (/premium|edition/i.test(value)) return 'edition_premium' as const
  if (/publication/i.test(value)) return 'publication_club' as const
  if (/reference/i.test(value)) return 'reference_bcvb' as const
  return 'standard_club' as const
}

export function EditorialPlanPanel({
  settings,
  standard,
  source,
  plan,
  validated,
  onPlanChange,
  onValidate,
}: EditorialPlanPanelProps) {
  const canBuild = Boolean(standard && settings.targetTitle.trim())

  function handleBuildPlan() {
    if (!standard) return
    onPlanChange(buildPlan(settings, standard))
  }

  function handleManualEdit(value: string) {
    if (!plan) return
    onPlanChange({
      ...plan,
      summary: value.split('\n').map((line) => line.trim()).filter(Boolean),
      manuallyEdited: true,
    })
  }

  return (
    <section className="ai-studio-card">
      <div className="ai-studio-card__header">
        <p className="ai-studio-kicker">Étape 3</p>
        <h2>Plan éditorial</h2>
        <p>Le document complet ne peut être généré que lorsque le plan est construit et validé.</p>
      </div>

      {!canBuild && (
        <p className="ai-studio-alert ai-studio-alert--blocked">
          Cadrage incomplet : impossible de construire un plan éditorial.
        </p>
      )}

      <div className="ai-studio-actions">
        <button type="button" className="ai-studio-primary" onClick={handleBuildPlan} disabled={!canBuild}>
          Construire le plan éditorial
        </button>
        <button type="button" className="ai-studio-secondary" onClick={onValidate} disabled={!plan}>
          Valider ce plan
        </button>
      </div>

      {plan && (
        <div className="ai-plan-grid">
          <div>
            <h3>{plan.title}</h3>
            <textarea
              value={plan.summary.join('\n')}
              onChange={(event) => handleManualEdit(event.target.value)}
              aria-label="Modifier manuellement le plan"
            />
          </div>
          <aside>
            <span><strong>Tableaux</strong>{plan.expectedTables}</span>
            <span><strong>Situations</strong>{plan.expectedSituations}</span>
            <span><strong>Schémas</strong>{plan.expectedDiagrams}</span>
            <span><strong>Format</strong>{plan.format || 'A4 portrait'}</span>
            <span><strong>Chapitres</strong>{plan.chapterCount ?? plan.summary.length}</span>
            <span><strong>Famille recommandée</strong>{plan.recommendedFamily || 'Non analysée'}</span>
            <span><strong>Source</strong>{source.text ? `${source.text.length} caractères` : 'Document vierge'}</span>
            <span><strong>Référentiels</strong>{plan.referentials.join(', ') || 'BCVB'}</span>
            <span><strong>État</strong>{validated ? 'Plan validé' : 'À valider'}</span>
          </aside>
        </div>
      )}
    </section>
  )
}
