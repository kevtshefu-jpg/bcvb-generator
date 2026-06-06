import {
  getDocumentStandard,
  type DocumentFamilyId,
} from '../standards/documentFamilyStandards'

export type BuildDocumentFamilyPromptInput = {
  family: DocumentFamilyId
  category?: string
  theme?: string
  audience?: string
  season?: string
  sourceContent?: string
  options?: {
    depth?: string
    includeSource?: boolean
  }
}

function bulletList(items: string[]) {
  return items.map((item) => `- ${item}`).join('\n')
}

export function buildDocumentFamilyPrompt({
  family,
  category,
  theme,
  audience,
  season,
  sourceContent,
  options,
}: BuildDocumentFamilyPromptInput) {
  const standard = getDocumentStandard(family)

  return `
Tu dois produire un document BCVB de type ${standard.label}. Ce type de document possède une logique éditoriale spécifique. Tu dois respecter strictement le standard suivant.

STANDARD ÉDITORIAL À RESPECTER
- Intention : ${standard.promptIntention}
- Format : ${standard.format}
- Volume attendu : ${standard.volume}
- Public : ${audience || standard.publicTarget}
- Catégorie : ${category || 'Général BCVB'}
- Thème : ${theme || 'Thème BCVB à structurer'}
- Saison : ${season || 'Intemporel'}
- Mise en page : ${standard.layout}
- Typographie : ${standard.typography}
- Première page : ${standard.firstPage}
- Palette : ${standard.palette}
- Éléments graphiques : ${standard.graphicElements}
- Niveau attendu : ${options?.depth || 'Référence BCVB / publication club'}

RÈGLES NON NÉGOCIABLES
${bulletList(standard.nonNegotiables)}

BLOCS OBLIGATOIRES
${bulletList(standard.mandatoryBlocks)}

CRITÈRES QUALITÉ
${bulletList(standard.qualityCriteria)}

QUOTAS MINIMAUX
- Tableaux typés : ${standard.minTables} minimum.
- Situations pédagogiques : ${standard.minSituations} minimum.
- Diagrammes terrain : ${standard.minDiagrams} minimum.
- Blocs BCVB typés : tous les grands éléments doivent être encapsulés dans un bloc \`:::bcvb-*\`.

FORMAT DE SORTIE STRICTEMENT OBLIGATOIRE
- Produire uniquement le contenu final, sans phrase d’introduction.
- Utiliser uniquement des blocs typés \`:::bcvb-*\`.
- Ne jamais utiliser un bloc générique \`:::\`.
- Ne jamais écrire un tableau markdown hors d’un bloc \`:::bcvb-table\`, \`:::bcvb-planning-table\`, \`:::bcvb-progression\`, \`:::bcvb-session-template\` ou \`:::bcvb-evaluation-grid\`.
- Ne jamais afficher \`players:\`, \`arrows:\`, \`zones:\`, \`ball:\` hors d’un bloc \`:::bcvb-diagram\`.
- Chaque situation doit être dans \`:::bcvb-situation\`.
- Chaque diagramme doit être dans \`:::bcvb-diagram\`.
- Chaque situation terrain doit être suivie immédiatement d’au moins un diagramme.
- Les tableaux doivent utiliser des pipes markdown propres à l’intérieur du champ \`table:\`.
- Les diagrammes doivent utiliser des listes YAML indentées avec des tirets \`-\`.
- Ne jamais écrire “ChatGPT”, “IA”, “généré par IA”, ni commentaire méta.

EXEMPLE TABLEAU OBLIGATOIRE
\`\`\`md
:::bcvb-table
title: Organisation matérielle recommandée
variant: material
table:
| Matériel | Quantité idéale | Utilisation | Vigilance |
|---|---|---|---|
| Ballons taille 3 ou 5 | 1 par enfant si possible | Manipulation, dribble, lancer | Adapter au gabarit |
:::
\`\`\`

EXEMPLE SITUATION + DIAGRAMME
\`\`\`md
:::bcvb-situation
numero: Situation 1
title: Titre terrain exploitable
finalite: Finalité courte et claire.
objectif: Objectif joueur observable.
organisation: Organisation précise.
materiel: Matériel nécessaire.
deroulement: Déroulement étape par étape.
consignes_joueurs: Consignes simples.
points_coach: Repères d’intervention.
criteres_reussite: Critères mesurables.
variables_simplification: Variable plus simple.
variables_complexification: Variable plus difficile.
evolution_1: Première évolution.
evolution_2: Deuxième évolution.
transfert_match: Lien avec le jeu.
erreurs_frequentes: Erreurs probables.
corrections_possibles: Corrections coach.
:::

:::bcvb-diagram
step: 1
title: Mise en place
court: half
intent: Visualiser l’organisation de départ.
players:
  - id: J1
    team: offense
    x: 50
    y: 70
    label: 1
arrows:
  - type: move
    from: J1
    toX: 35
    toY: 42
    label: déplacement
notes:
  - Le coach sécurise les espaces et les trajectoires.
:::
\`\`\`

${options?.includeSource && sourceContent?.trim()
  ? `DOCUMENT SOURCE À TRANSFORMER OU ENRICHIR\n---\n${sourceContent.trim()}\n---`
  : ''}
`.trim()
}
