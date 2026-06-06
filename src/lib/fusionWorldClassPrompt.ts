import type { EditorialScoreReport } from './editorialScoreEngine'
import { getWorldClassEditorialStandard, normalizeEditorialFamilyKey } from './editorialStandards'

export function buildFusionWorldClassPrompt(params: {
  title: string
  familyKey: string
  category: string
  targetScore: number
  chatgptResponse: string
  claudeResponse: string
  report?: EditorialScoreReport
}) {
  const standard = getWorldClassEditorialStandard(normalizeEditorialFamilyKey(params.familyKey))

  return `
Tu es le directeur éditorial technique du BCVB.

MISSION :
Fusionner deux réponses IA pour produire UNE version finale supérieure aux deux, directement publiable au standard ${params.targetScore}/100.

Document : ${params.title}
Famille : ${standard.label}
Catégorie : ${params.category}
Score cible : ${params.targetScore}/100

OBJECTIF :
- conserver la précision opérationnelle de ChatGPT ;
- conserver la profondeur éditoriale de Claude ;
- supprimer les doublons ;
- garder la structure BCVB la plus propre ;
- conserver les meilleurs tableaux ;
- compléter les situations faibles ;
- associer chaque situation à un schéma ;
- convertir toute syntaxe brute ;
- atteindre directement le score cible ;
- produire une seule version finale BCVB Rich Markdown.

STANDARD À RESPECTER :
- Format : ${standard.format}
- Mise en page : ${standard.layout}
- Tableaux min : ${standard.minTables}
- Situations min : ${standard.minSituations}
- Schémas min : ${standard.minDiagrams}
- Sections : ${standard.requiredSections.join(', ')}

POINTS À SURCLASSER :
${params.report?.blockersFor100?.map((item) => `- ${item}`).join('\n') || '- Vérifier tableaux, situations, schémas, style, sections, synthèse.'}

RÈGLES STRICTES :
- Répondre uniquement avec la version finale.
- Commencer par :::bcvb-hero.
- Ne jamais expliquer.
- Ne jamais écrire de tableau brut.
- Chaque tableau doit être dans :::bcvb-table avec columns et rows.
- Chaque situation doit être suivie par :::bcvb-diagram.
- Aucun champ players/arrows/zones hors bloc diagramme.
- Aucun bloc générique.

RÉPONSE CHATGPT :
---
${params.chatgptResponse}
---

RÉPONSE CLAUDE :
---
${params.claudeResponse}
---

Produis maintenant la version fusionnée finale en BCVB Rich Markdown strict.
`.trim()
}
