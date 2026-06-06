import {
  createCourtFrame,
  createSession,
  createSituation,
  normalizeSession,
  sessionCategories,
  sessionThemes,
  sessionSubThemes,
  type SessionCategory,
  type TrainingSessionV2,
} from './sessionModels'
import { textToList } from './sessionUtils'

type TransformationContext = {
  category?: string
  theme?: string
  subTheme?: string
  coachName?: string
  teamLabel?: string
  sourceFileName?: string
}

const phaseHints = ['je-decouvre', 'je-m-exerce', 'je-retranscris', 'je-regule'] as const

const courtFramePromptRules = `RÈGLES TERRAIN FIBA BCVB
- Chaque situation doit contenir au minimum 3 courtFrames : mise en place, déclenchement, évolution ou lecture.
- Utilise des coordonnées métriques, jamais des coordonnées en pixels : terrain entier x 0 à 28 et y 0 à 15 ; demi-terrain x 0 à 14 et y 0 à 15.
- courtType autorisés : "full", "half-right", "half-left". N'utilise pas un demi-terrain obtenu par recadrage du terrain entier.
- Tous les joueurs, ballons, plots, zones et flèches doivent rester dans les limites FIBA.
- Les notes de chaque frame doivent expliquer le panier visé, les rotations, les courses et les consignes coach visibles.`

function pickCategory(rawText: string, fallback = 'U13'): SessionCategory {
  const found = sessionCategories.find((category) => rawText.toLowerCase().includes(category.toLowerCase()))
  return (found || fallback) as SessionCategory
}

function pickOption(options: readonly string[], rawText: string, fallback = '') {
  return options.find((option) => rawText.toLowerCase().includes(option.toLowerCase())) || fallback
}

function compactLines(rawText: string) {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function splitSituationBlocks(rawText: string) {
  const normalized = rawText.replace(/\r/g, '')
  const blocks = normalized
    .split(/\n(?=(?:situation|exercice|atelier|jeu|bloc|séquence)\s*\d*[\s:.-])/gi)
    .map((block) => block.trim())
    .filter((block) => block.length > 24)
  return blocks.length ? blocks : compactLines(rawText).reduce<string[]>((chunks, line) => {
    if (line.length > 80 || chunks.length === 0) chunks.push(line)
    else chunks[chunks.length - 1] = `${chunks[chunks.length - 1]}\n${line}`
    return chunks
  }, [])
}

function extractDuration(block: string, fallback = 10) {
  const match = block.match(/(\d{1,3})\s*(?:min|minutes|')/i)
  return match ? Number(match[1]) : fallback
}

function extractTitle(block: string, index: number) {
  const firstLine = compactLines(block)[0] || `Situation ${index + 1}`
  return firstLine.replace(/^(situation|exercice|atelier|jeu|bloc|séquence)\s*\d*[\s:.-]*/i, '').slice(0, 86)
}

function extractListAfter(label: string, block: string) {
  const pattern = new RegExp(`${label}\\s*:?\\s*([^\\n]+)`, 'i')
  const match = block.match(pattern)
  return match ? textToList(match[1]) : []
}

export function buildSessionTransformationPrompt(rawText: string, context: TransformationContext = {}) {
  return `Tu es directeur technique basket, expert formation coachs, pédagogie terrain et identité BCVB.

Transforme la séance brute ci-dessous en séance complète BCVB exploitable directement au gymnase.

IDENTITÉ BCVB À RESPECTER
- Club : BCVB — Basket Club Villefranche Beaujolais.
- Philosophie : Défendre Fort, Courir et Partager la Balle.
- Défense prioritaire : Homme à Homme.
- Valeurs : intensité, agressivité maîtrisée, maîtrise, jeu.
- Démarche pédagogique : je découvre / je m’exerce / je retranscris en match / je régule.

CONTEXTE
- Catégorie pressentie : ${context.category || 'à déterminer'}
- Thème pressenti : ${context.theme || 'à déterminer'}
- Sous-thème pressenti : ${context.subTheme || 'à déterminer'}
- Équipe : ${context.teamLabel || 'BCVB'}
- Coach : ${context.coachName || 'à renseigner'}
- Source : ${context.sourceFileName || 'texte collé'}

OBJECTIF
Produire une séance complète, claire, structurée, modifiable et exportable.

FORMAT DE SORTIE OBLIGATOIRE
Retourne d’abord un JSON strict, puis une version Markdown lisible.

JSON attendu :
{
  "title": "",
  "category": "",
  "theme": "",
  "subTheme": "",
  "durationMinutes": 0,
  "expectedPlayers": 0,
  "objectives": [],
  "bcvbObjectives": [],
  "equipment": [],
  "globalOrganization": "",
  "sessionFlow": [],
  "situations": [
    {
      "title": "",
      "durationMinutes": 0,
      "pedagogicalPhase": "",
      "objective": "",
      "bcvbObjective": "",
      "organization": "",
      "description": "",
      "instructions": "",
      "coachCues": [],
      "evolution": "",
      "regression": "",
      "observableCriteria": [],
      "measurableCriteria": [],
      "successIndicators": [],
      "evaluationMethod": "",
      "bcvbLinks": {
        "defendreFort": "",
        "courir": "",
        "partager": "",
        "hommeHomme": "",
        "intensite": "",
        "agressiviteMaitrisee": "",
        "maitrise": "",
        "jeu": ""
      },
      "equipment": [],
      "playerCount": "",
      "space": "",
      "oppositionType": "",
      "security": "",
      "commonMistakes": [],
      "coachCorrections": [],
      "courtFrames": [
        {
          "title": "Frame 1 - mise en place",
          "courtType": "half-right",
          "intent": "Placements initiaux en coordonnées métriques",
          "objects": [],
          "arrows": [],
          "zones": [],
          "notes": ""
        },
        {
          "title": "Frame 2 - déclenchement",
          "courtType": "half-right",
          "intent": "Première passe, course ou fixation",
          "objects": [],
          "arrows": [],
          "zones": [],
          "notes": ""
        },
        {
          "title": "Frame 3 - lecture / évolution",
          "courtType": "half-left",
          "intent": "Réponse défensive, option ou évolution",
          "objects": [],
          "arrows": [],
          "zones": [],
          "notes": ""
        }
      ]
    }
  ],
  "evaluationGlobal": "",
  "coachNotes": ""
}

CONTRAINTES
- Ne laisse aucune situation floue.
- Chaque situation doit être coachable.
- Les critères doivent être observables et quantifiables.
- Les évolutions et régressions doivent permettre d’adapter au niveau.
- Le lien BCVB doit être explicite.
- Le terrain recommandé doit expliquer les placements et déplacements.
${courtFramePromptRules}
- Utilise un langage terrain, pas un langage universitaire.
- Si la source est incomplète, complète intelligemment sans inventer d’informations absurdes.

SOURCE À TRANSFORMER :
${rawText}`
}

export function buildSessionUpgradePrompt(session: TrainingSessionV2) {
  return `Tu es directeur technique BCVB et éditeur de séances basket haut niveau.

Ta mission :
améliorer fortement cette séance pour la rendre publiable dans la bibliothèque technique BCVB.

Ne fais pas une correction légère.
Reconstruis les parties faibles.

À renforcer obligatoirement :
- objectifs ;
- organisation ;
- description ;
- consignes ;
- évolution ;
- régression ;
- critères observables ;
- critères quantifiables ;
- lien BCVB ;
- situations trop vagues ;
- terrains à préciser ;
- cohérence durée ;
- progression pédagogique.

Respecte :
- Défendre Fort, Courir et Partager la Balle ;
- défense Homme à Homme ;
- intensité, agressivité maîtrisée, maîtrise, jeu ;
- je découvre / je m’exerce / je retranscris en match / je régule.

${courtFramePromptRules}

Retourne une séance complète au format JSON strict + Markdown.

SÉANCE À AMÉLIORER :
${JSON.stringify(session, null, 2)}`
}

function extractJson(responseText: string) {
  const fenced = responseText.match(/```json\s*([\s\S]*?)```/i)
  if (fenced?.[1]) return fenced[1]
  const start = responseText.indexOf('{')
  const end = responseText.lastIndexOf('}')
  if (start >= 0 && end > start) return responseText.slice(start, end + 1)
  return ''
}

export function transformRawTextToSession(rawText: string, context: TransformationContext = {}) {
  const category = pickCategory(rawText, context.category || 'U13')
  const theme = context.theme || pickOption(sessionThemes, rawText, 'Défense Homme à Homme')
  const subTheme = context.subTheme || pickOption(sessionSubThemes, rawText, 'Close-out')
  const blocks = splitSituationBlocks(rawText).slice(0, 8)
  const fallbackDuration = blocks.length >= 5 ? 12 : 15
  const situations = blocks.map((block, index) => {
    const duration = extractDuration(block, fallbackDuration)
    const title = extractTitle(block, index)
    return createSituation({
      order: index + 1,
      title,
      category,
      theme,
      subTheme,
      durationMinutes: duration,
      pedagogicalPhase: phaseHints[Math.min(index, phaseHints.length - 1)],
      objective: extractListAfter('objectif', block)[0] || `Rendre ${title.toLowerCase()} directement transférable en match.`,
      bcvbObjective: 'Installer Défendre Fort, Courir et Partager la Balle dans une situation coachable.',
      organization: block.match(/organisation\s*:?\s*([^\n]+)/i)?.[1] || 'Groupes courts, rotations rapides, coach placé pour voir ballon, défenseur et espace.',
      description: block,
      instructions: block.match(/consignes?\s*:?\s*([^\n]+)/i)?.[1] || 'Jouer intense, communiquer, respecter l’espace, décider vite et rester disponible.',
      coachCues: ['Corriger un point à la fois', 'Relancer vite les passages', 'Valoriser l’intention avant le résultat'],
      evolution: 'Réduire le temps de décision ou ajouter une opposition plus active.',
      regression: 'Agrandir l’espace, ralentir le rythme ou retirer une contrainte.',
      adaptationsByLevel: {
        easier: 'Plus d’espace et consigne unique.',
        standard: 'Contrainte principale BCVB avec opposition contrôlée.',
        harder: 'Temps limité, score ou défense plus agressive.',
      },
      observableCriteria: ['Posture active', 'Communication', 'Décision rapide', 'Respect de l’espace'],
      measurableCriteria: ['7 actions réussies sur 10', '3 stops ou avantages créés consécutifs'],
      successIndicators: ['Les joueurs comprennent la consigne', 'Le transfert match est visible'],
      evaluationMethod: 'Observation coach sur 2 séries puis feedback court.',
      bcvbLinks: {
        defendreFort: 'Pression utile, orientation et aide-reprise.',
        courir: 'Relance ou replacement immédiat après chaque action.',
        partager: 'Choix de passe ou de fixation au bon moment.',
        hommeHomme: 'Responsabilité individuelle avant aide collective.',
        intensite: 'Rythme élevé avec passages courts.',
        agressiviteMaitrisee: 'Engagement fort sans faute inutile.',
        maitrise: 'Vitesse avec contrôle technique.',
        jeu: 'Lecture libre dans un cadre clair.',
      },
      equipment: extractListAfter('matériel', block).length ? extractListAfter('matériel', block) : ['Ballons', 'Plots', 'Chasubles'],
      playerCount: block.match(/(\d+\s*(?:à|-)\s*\d+)\s*joueurs/i)?.[1] || '8 à 12',
      space: 'Demi-terrain ou terrain entier selon effectif.',
      oppositionType: 'Opposition progressive',
      security: 'Espaces dégagés, contacts contrôlés, rotations sans attente.',
      commonMistakes: ['Regarder uniquement le ballon', 'Arriver en retard', 'Forcer le choix'],
      coachCorrections: ['Nommer le repère prioritaire', 'Rejouer immédiatement la bonne réponse', 'Utiliser un feedback court'],
      courtFrames: [
        createCourtFrame({ title: 'Frame 1 - mise en place', courtType: 'half-right', intent: 'Placements et espaces de départ' }),
        createCourtFrame({ title: 'Frame 2 - déclenchement', courtType: 'half-right', intent: 'Déplacement ou passe clé' }),
        createCourtFrame({ title: 'Frame 3 - lecture / évolution', courtType: 'half-left', intent: 'Réponse défensive, option ou évolution' }),
      ],
    })
  })

  return createSession({
    title: compactLines(rawText)[0]?.slice(0, 82) || `Séance ${category} BCVB`,
    category,
    theme,
    subTheme,
    coachName: context.coachName || '',
    teamLabel: context.teamLabel || '',
    durationMinutes: situations.reduce((sum, situation) => sum + situation.durationMinutes, 0) || 90,
    expectedPlayers: Number(rawText.match(/(\d{1,2})\s*joueurs/i)?.[1] || 12),
    objectives: ['Défendre Fort', 'Courir', 'Partager la Balle'],
    bcvbObjectives: ['Défense Homme à Homme prioritaire', 'Intensité maîtrisée', 'Transfert match'],
    equipment: ['Ballons', 'Plots', 'Chasubles', 'Chronomètre'],
    globalOrganization: 'Séance reconstruite en blocs courts, rotations actives et feedback terrain.',
    sessionFlow: situations.map((situation) => `${situation.order}. ${situation.title} - ${situation.durationMinutes} min`),
    situations,
    sourceType: context.sourceFileName ? 'txt' : 'pasted_text',
    sourceFileName: context.sourceFileName || '',
    sourceRawText: rawText,
    sourceExtractedText: rawText,
    transformedFromSource: true,
    visibility: 'private',
    status: 'draft',
    tags: [category, theme, subTheme, 'BCVB'].filter(Boolean),
    summary: 'Séance importée puis structurée selon l’identité BCVB.',
  })
}

export function parseTransformedSession(responseText: string) {
  const jsonText = extractJson(responseText)
  if (jsonText) {
    try {
      const parsed = JSON.parse(jsonText)
      return normalizeSession(createSession({
        ...parsed,
        transformedFromSource: true,
        sourceExtractedText: responseText,
      }))
    } catch {
      return transformRawTextToSession(responseText)
    }
  }
  return transformRawTextToSession(responseText)
}
