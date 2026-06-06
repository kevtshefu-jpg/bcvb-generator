import { getEditorialFamilyStandard } from './documentFamilyStandards'
import { getQualityTarget } from './documentQualityTargets'

export type ImprovementMode =
  | 'light_fix'
  | 'editorial_elevation'
  | 'publication_rebuild'

export type EditorialElevationInput = {
  document: string
  qualityScore: number
  documentFamily: string
  category: string
  audience: string
  season: string
  qualityIssues: string[]
  qualityMetrics: {
    tables: number
    situations: number
    diagrams: number
    bcvbBlocks: number
    rawTables: number
    missingRequiredSections: string[]
  }
  editorialStandard: string
  mode: ImprovementMode
}

export const IMPROVEMENT_MODE_LABELS: Record<ImprovementMode, string> = {
  light_fix: 'Correction légère',
  editorial_elevation: 'Élévation éditoriale',
  publication_rebuild: 'Reconstruction publication club',
}

const MODE_DESCRIPTIONS: Record<ImprovementMode, string> = {
  light_fix:
    'Corrige la syntaxe, les tableaux bruts, les balises cassées et les blocs incomplets.',
  editorial_elevation:
    'Renforce la hiérarchie, la structure, les tableaux, les sections faibles, les transitions et les contenus pédagogiques.',
  publication_rebuild:
    'Reconstruit le document pour viser un niveau publiable BCVB 90+/100, sans se limiter au texte existant.',
}

function formatList(items: string[]) {
  return items.length > 0 ? items.map((item) => `- ${item}`).join('\n') : '- Aucun élément listé.'
}

export function buildMissingBlocksInstruction(
  metrics: EditorialElevationInput['qualityMetrics'],
  target: ReturnType<typeof getQualityTarget>
): string {
  const missingSituations = Math.max(0, target.minSituations - metrics.situations)
  const missingDiagrams = Math.max(0, target.minDiagrams - metrics.diagrams)
  const missingTables = Math.max(0, target.minTables - metrics.tables)
  const missingBlocks = Math.max(0, target.minBcvbBlocks - metrics.bcvbBlocks)

  return `
Le document actuel contient :
- ${metrics.tables} tableaux détectés
- ${metrics.situations} situations
- ${metrics.diagrams} diagrammes
- ${metrics.bcvbBlocks} blocs BCVB
- ${metrics.rawTables} tableaux bruts ou lignes de tableau non typées

Le standard exige :
- au moins ${target.minTables} tableaux propres
- au moins ${target.minSituations} situations complètes
- au moins ${target.minDiagrams} diagrammes exploitables
- au moins ${target.minBcvbBlocks} blocs BCVB typés
- aucun tableau brut
- aucune balise technique visible

Actions obligatoires :
- convertir les ${metrics.rawTables} tableaux bruts en blocs :::bcvb-table
- ajouter ${missingTables} tableau(x) utile(s) si nécessaire
- ajouter ${missingSituations} situation(s) pédagogique(s) complète(s) si nécessaire
- ajouter ${missingDiagrams} diagramme(s) terrain si nécessaire
- ajouter ${missingBlocks} bloc(s) BCVB structurant(s) si nécessaire
- enrichir les situations existantes
- vérifier que chaque situation possède un diagramme
- ajouter les sections manquantes : ${metrics.missingRequiredSections.join(', ') || 'aucune section listée'}
- renforcer la planification
- produire une version finale structurée
`.trim()
}

function modeDirective(mode: ImprovementMode) {
  if (mode === 'publication_rebuild') {
    return `
MODE RECONSTRUCTION PUBLICATION CLUB
Tu peux reconstruire le document.
Tu dois conserver les informations utiles du document source, mais tu n’es pas prisonnier de sa structure.
Tu dois produire le meilleur document possible selon :
- la famille documentaire ;
- la catégorie ;
- l’audience ;
- les valeurs BCVB ;
- les exigences terrain ;
- les standards FFBB/FIBA/internationaux ;
- la qualité éditoriale attendue.

Tu dois viser un document plus clair, plus complet, plus utile, plus beau et plus exploitable.
Tu dois choisir la meilleure architecture documentaire.
`.trim()
  }

  if (mode === 'editorial_elevation') {
    return `
MODE ÉLÉVATION ÉDITORIALE
Tu dois conserver l’ossature utile, mais réorganiser et enrichir fortement le document.
Ne fais pas une retouche légère : vise un gain réel de qualité de +8 à +20 points.
`.trim()
  }

  return `
MODE CORRECTION LÉGÈRE
Corrige prioritairement la structure technique, les tableaux bruts, les blocs incomplets et les incohérences simples.
Ne change pas l’intention générale si elle est déjà bonne.
`.trim()
}

export function buildEditorialElevationPrompt(input: EditorialElevationInput): string {
  const familyStandard = getEditorialFamilyStandard(input.documentFamily)
  const target = getQualityTarget(input.documentFamily)
  const missingBlocksInstruction = buildMissingBlocksInstruction(input.qualityMetrics, target)

  return `
Tu es le directeur éditorial technique du BCVB.
Tu es aussi un expert mondial de la production documentaire sportive.
Tu ne fais pas une simple correction.
Tu dois l’élever fortement vers un niveau publication club / qualité éditeur sportif professionnel.

CONTEXTE BCVB
Le document doit respecter :
- Philosophie : Défendre Fort, Courir et Partager la Balle.
- Identité prioritaire : défense Homme à Homme.
- Valeurs : intensité, agressivité maîtrisée, maîtrise, jeu, respect.
- Démarche pédagogique : je découvre / je m’exerce / je retranscris en match / je régule.
- Exigence terrain : document directement utilisable par un coach.

SCORE ACTUEL
${input.qualityScore}/100

FAMILLE DOCUMENTAIRE
${input.documentFamily}

CATÉGORIE
${input.category}

PUBLIC
${input.audience}

MODE D’AMÉLIORATION :
${IMPROVEMENT_MODE_LABELS[input.mode]} — ${MODE_DESCRIPTIONS[input.mode]}

${modeDirective(input.mode)}

DOCUMENT CIBLE :
- Famille documentaire : ${input.documentFamily}
- Catégorie : ${input.category}
- Audience : ${input.audience}
- Saison : ${input.season}
- Score actuel : ${input.qualityScore}/100
- Objectif publication : ${target.minScore}/100
- Gain attendu : viser +8 à +20 points si le document est insuffisant

STANDARD ÉDITORIAL À RESPECTER
- Famille : ${familyStandard.label}
- Identité : ${familyStandard.identity}
- Mise en page attendue : ${familyStandard.layout}
- Style visuel attendu : ${familyStandard.visualStyle}
- Structure obligatoire :
${formatList(familyStandard.mandatoryStructure)}
- Erreurs à éviter :
${formatList(familyStandard.errorsToAvoid)}

STANDARD ÉDITORIAL ACTUEL :
${input.editorialStandard}

PROBLÈMES DÉTECTÉS
${formatList(input.qualityIssues)}

MÉTRIQUES ACTUELLES
- Tableaux : ${input.qualityMetrics.tables}
- Situations : ${input.qualityMetrics.situations}
- Diagrammes : ${input.qualityMetrics.diagrams}
- Blocs BCVB : ${input.qualityMetrics.bcvbBlocks}
- Tableaux bruts : ${input.qualityMetrics.rawTables}
- Sections obligatoires manquantes : ${input.qualityMetrics.missingRequiredSections.join(', ') || 'aucune section listée'}

OBJECTIF
Produire une version nettement supérieure.
Ne vise pas une amélioration marginale.
Vise un gain réel de qualité.

SI LE DOCUMENT EST INFÉRIEUR À 60/100
Reconstruis-le presque entièrement.

SI LE DOCUMENT EST ENTRE 60 ET 82/100
Conserve ce qui est bon, mais réorganise, enrichis et complète fortement.

SI LE DOCUMENT EST SUPÉRIEUR À 82/100
Corrige les derniers écarts, renforce la finition et la cohérence.

MÉTRIQUES ET ACTIONS OBLIGATOIRES
${missingBlocksInstruction}

RÈGLES DE RECONSTRUCTION
1. Choisir la meilleure architecture documentaire selon la famille.
2. Créer une hiérarchie éditoriale claire.
3. Transformer tous les tableaux bruts en blocs :::bcvb-table.
4. Ajouter les tableaux manquants.
5. Ajouter ou renforcer la planification.
6. Ajouter ou renforcer les situations pédagogiques.
7. Chaque situation doit être autonome, numérotée et exploitable.
8. Chaque situation doit contenir :
   - finalité
   - objectif
   - organisation
   - matériel
   - déroulement
   - consignes joueurs
   - points coach
   - critères de réussite
   - variables simplification
   - variables complexification
   - évolution 1
   - évolution 2
   - transfert match
   - erreurs fréquentes
   - corrections possibles
9. Chaque situation doit avoir un :::bcvb-diagram associé.
10. Les diagrammes doivent être lisibles, cohérents, non coupés et adaptés au format terrain.
11. Les planifications doivent être exploitables sur une saison ou un cycle.
12. Les titres et sous-titres doivent être éditoriaux, hiérarchisés et lisibles.
13. Le document doit être plus humain, plus terrain, plus professionnel.
14. Supprimer les répétitions et formulations génériques.
15. Garder le style BCVB.

MISSION SILENCIEUSE
- Diagnostiquer silencieusement la famille documentaire.
- Vérifier si la forme actuelle correspond au document attendu.
- Choisir la meilleure structure pour ce type de document.
- Réorganiser les sections si nécessaire.
- Réécrire les tableaux bruts en blocs typés.
- Ajouter les blocs manquants.
- Ajouter des situations pédagogiques si le quota est insuffisant.
- Ajouter des diagrammes terrain exploitables si le quota est insuffisant.
- Renforcer la planification.
- Renforcer la hiérarchie éditoriale.
- Renforcer l’utilité terrain.
- Supprimer les doublons.
- Produire uniquement le document final normalisé.

INTERDICTIONS :
- Ne pas expliquer ce que tu fais.
- Ne pas produire un commentaire.
- Ne pas dire “voici la version améliorée”.
- Ne pas conserver les tableaux markdown bruts.
- Ne pas conserver de texte brut qui devrait être dans un bloc typé.
- Ne pas se limiter à une correction superficielle.
- Ne pas augmenter légèrement la qualité : viser une amélioration forte.

SORTIE OBLIGATOIRE :
- Produire uniquement le document final en BCVB Rich Markdown.
- Aucun commentaire.
- Aucune explication.
- Aucune phrase du type “voici la version”.
- Utiliser selon le type : :::bcvb-hero, :::bcvb-identity, :::bcvb-section, :::bcvb-table, :::bcvb-planning-table, :::bcvb-planning, :::bcvb-progression, :::bcvb-situation, :::bcvb-diagram, :::bcvb-evaluation-grid, :::bcvb-evaluation, :::bcvb-coach-note, :::bcvb-summary, :::bcvb-conclusion.
- Aucun tableau markdown brut hors bloc :::bcvb-table.
- Aucun schéma sans bloc :::bcvb-diagram.
- Aucune situation sans bloc :::bcvb-situation.
- Aucun bloc générique non typé.
- Aucune balise cassée.
- Aucun champ technique visible hors bloc.

DOCUMENT À AMÉLIORER
${input.document}
`.trim()
}
