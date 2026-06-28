import { AI_PROVIDER_PROFILES, type EditorialAiProvider } from '../ai-provider/providerProfiles'
import { getEditorialStandard } from './editorialStandards'
import type { EditorialPlan } from './editorialPlanBuilder'

export function buildMasterPromptFromPlan(params: {
  plan: EditorialPlan
  sourceText: string
  selectedReferentials: string[]
  provider: EditorialAiProvider
}): string {
  const standard = getEditorialStandard(params.plan.family)
  const providerProfile = AI_PROVIDER_PROFILES[params.provider]
  const providerInstruction =
    params.provider === 'claude'
      ? 'Tu dois produire une écriture éditoriale longue, naturelle et cohérente, mais conserver strictement les blocs BCVB typés.'
      : 'Tu dois produire une structure stricte, balisée, contrôlée, compatible avec le parseur BCVB.'

  return `
CADRE MAÎTRE EN 2 TEMPS — ${providerProfile.label}

ÉTAGE 1 — PLAN ÉDITORIAL VALIDÉ
- Titre : ${params.plan.title}
- Famille : ${standard.label}
- Catégorie : ${params.plan.category}
- Audience : ${params.plan.audience}
- Format : ${params.plan.format}
- Niveau : ${params.plan.productionLevel}
- Référentiels : ${params.selectedReferentials.join(', ') || 'BCVB'}
- Forces du modèle : ${providerProfile.strengths.join(', ')}

PLAN VALIDÉ :
${params.plan.chapters
  .map(
    (chapter, index) => `${index + 1}. ${chapter.title}
   - Intention : ${chapter.intent}
   - Blocs attendus : ${chapter.expectedBlocks.join(', ')}
   - Tableaux : ${chapter.requiredTables}
   - Situations : ${chapter.requiredSituations}
   - Schémas : ${chapter.requiredDiagrams}`
  )
  .join('\n')}

ÉTAGE 2 — PRODUCTION FINALE
${providerInstruction}

STANDARD DOCUMENTAIRE :
- But : ${standard.purpose}
- Format : ${standard.format}
- Mise en page : ${standard.layout}
- Signature visuelle : ${standard.visualSignature}
- Sections obligatoires : ${standard.requiredSections.join(', ')}
- Quotas : ${standard.minimumTargets.tables} tableaux, ${standard.minimumTargets.situations} situations, ${standard.minimumTargets.diagrams} schémas, ${standard.minimumTargets.bcvbBlocks} blocs BCVB.

CONTRAINTES DE RENDU BCVB :
- Utiliser uniquement des blocs typés :::bcvb-*.
- Chaque tableau doit être dans :::bcvb-table ou un bloc table spécialisé.
- Aucun tableau markdown brut hors bloc typé.
- Chaque situation doit être dans :::bcvb-situation.
- Chaque situation doit avoir un :::bcvb-diagram si le standard demande des schémas.
- Aucun champ players/arrows/zones hors bloc diagramme.
- Répondre uniquement avec le document final complet.

SOURCE EXTRAITE :
---
${params.sourceText.trim() || 'Document vierge à construire selon le plan validé.'}
---
`.trim()
}
