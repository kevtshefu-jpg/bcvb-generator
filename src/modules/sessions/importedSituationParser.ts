import {
  createCourtFrame,
  createSituation,
  normalizeSituation,
  sessionCategories,
  sessionSubThemes,
  sessionThemes,
  type SessionSituation,
} from './sessionModels'

type SituationImportContext = {
  fileName?: string
  category?: string
  theme?: string
  subTheme?: string
  createdBy?: string
  ownerId?: string
}

const courtFramePromptRules = `RÈGLES TERRAIN FIBA BCVB
- Génère au minimum 3 courtFrames : mise en place, déclenchement, évolution ou lecture.
- Utilise des coordonnées métriques : terrain entier x 0 à 28 et y 0 à 15 ; demi-terrain x 0 à 14 et y 0 à 15.
- courtType autorisés : "full", "half-right", "half-left". Ne produis jamais un demi-terrain par recadrage.
- Les objets, zones et flèches doivent rester dans les limites FIBA.
- Les notes doivent préciser le panier visé, les rotations et la consigne coach visible.`

function extractJson(responseText: string) {
  const fenced = responseText.match(/```json\s*([\s\S]*?)```/i)
  if (fenced?.[1]) return fenced[1]
  const start = responseText.indexOf('{')
  const end = responseText.lastIndexOf('}')
  if (start >= 0 && end > start) return responseText.slice(start, end + 1)
  return ''
}

function pickOption(options: readonly string[], rawText: string, fallback = '') {
  return options.find((option) => rawText.toLowerCase().includes(option.toLowerCase())) || fallback
}

function firstLine(rawText: string) {
  return rawText.split(/\r?\n/).map((line) => line.trim()).find(Boolean) || 'Situation pédagogique BCVB'
}

function ensureThreeFrames(situation: SessionSituation) {
  const frames = situation.courtFrames.length ? situation.courtFrames : []
  const presets = [
    createCourtFrame({ title: 'Mise en place', courtType: 'half-right', intent: 'Placement initial en coordonnées métriques' }),
    createCourtFrame({ title: 'Départ de l’action', courtType: 'half-right', intent: 'Déclenchement' }),
    createCourtFrame({ title: 'Lecture / décision', courtType: 'half-left', intent: 'Option ou évolution' }),
  ]
  return [...frames, ...presets].slice(0, Math.max(3, frames.length))
}

export function buildSingleSituationImportPrompt(extractedText: string, context: SituationImportContext = {}) {
  return `Tu es expert basket, formateur de coachs et responsable technique BCVB.

Transforme cette situation pédagogique isolée en exercice complet BCVB.

La situation doit être directement utilisable par un coach.

Contexte :
- Fichier : ${context.fileName || 'texte collé'}
- Catégorie pressentie : ${context.category || 'à confirmer'}
- Thème pressenti : ${context.theme || 'à confirmer'}
- Sous-thème pressenti : ${context.subTheme || 'à confirmer'}

Structure obligatoire :
- titre ;
- catégorie conseillée ;
- thème ;
- sous-thème ;
- durée ;
- nombre de joueurs ;
- espace ;
- matériel ;
- objectif ;
- objectif BCVB ;
- organisation ;
- déroulement ;
- consignes joueurs ;
- consignes coach ;
- évolution ;
- régression ;
- critères observables ;
- critères quantifiables ;
- méthode d’évaluation ;
- erreurs fréquentes ;
- corrections possibles ;
- lien avec le match ;
- lien avec Défendre Fort ;
- lien avec Courir ;
- lien avec Partager la Balle ;
- lien avec défense Homme à Homme ;
- terrain en 3 frames minimum.

${courtFramePromptRules}

Retourne un JSON strict :
{
  "title": "",
  "category": "",
  "theme": "",
  "subTheme": "",
  "durationMinutes": 0,
  "playerCount": "",
  "space": "",
  "equipment": [],
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
  "evaluationMethod": "",
  "commonMistakes": [],
  "coachCorrections": [],
  "matchTransfer": "",
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
  "courtFrames": [
    {
      "title": "Mise en place",
      "courtType": "half-right",
      "intent": "Placement initial en coordonnées métriques",
      "objects": [],
      "arrows": [],
      "zones": [],
      "notes": ""
    },
    {
      "title": "Déclenchement",
      "courtType": "half-right",
      "intent": "Première passe, course ou fixation",
      "objects": [],
      "arrows": [],
      "zones": [],
      "notes": ""
    },
    {
      "title": "Lecture / évolution",
      "courtType": "half-left",
      "intent": "Réponse défensive, option ou évolution",
      "objects": [],
      "arrows": [],
      "zones": [],
      "notes": ""
    }
  ]
}

SOURCE :
${extractedText}`
}

export function transformRawTextToSituation(rawText: string, context: SituationImportContext = {}) {
  const category = (sessionCategories.find((item) => item === context.category) || pickOption(sessionCategories, rawText, 'U13'))
  const theme = context.theme || pickOption(sessionThemes, rawText, 'Défense Homme à Homme')
  const subTheme = context.subTheme || pickOption(sessionSubThemes, rawText, 'Close-out')
  const title = firstLine(rawText).replace(/^(situation|exercice|atelier)\s*[\d:.-]*/i, '').slice(0, 84)

  return createSituation({
    title,
    category,
    theme,
    subTheme,
    durationMinutes: Number(rawText.match(/(\d{1,2})\s*(?:min|minutes|')/i)?.[1] || 12),
    playerCount: rawText.match(/(\d+\s*(?:à|-)\s*\d+)\s*joueurs/i)?.[1] || '6 à 10',
    space: 'Demi-terrain adaptable selon effectif.',
    equipment: ['Ballons', 'Plots', 'Chasubles'],
    objective: `Rendre ${title.toLowerCase()} exploitable en match.`,
    bcvbObjective: 'Relier l’exercice à Défendre Fort, Courir et Partager la Balle.',
    organization: 'Passages courts, rotations fluides, coach placé face à l’action clé.',
    description: rawText,
    instructions: 'Intensité, communication, maîtrise technique et décision rapide.',
    coachCues: ['Un feedback court', 'Un repère prioritaire', 'Relance immédiate'],
    evolution: 'Ajouter un défenseur actif ou réduire le temps de décision.',
    regression: 'Agrandir l’espace ou retirer une contrainte.',
    observableCriteria: ['Posture active', 'Communication', 'Choix pertinent'],
    measurableCriteria: ['7 réussites sur 10', '3 actions positives consécutives'],
    evaluationMethod: 'Observer 2 séries, noter réussite et intention.',
    commonMistakes: ['Regard bas', 'Mauvais espacement', 'Décision tardive'],
    coachCorrections: ['Fixer un repère simple', 'Faire rejouer la bonne réponse', 'Limiter le nombre de consignes'],
    matchTransfer: 'Même repère en opposition : lire, décider, agir vite.',
    bcvbLinks: {
      defendreFort: 'Pression utile et replacement immédiat.',
      courir: 'Course ou replacement dès le changement de statut.',
      partager: 'Passe ou fixation pour créer l’avantage collectif.',
      hommeHomme: 'Responsabilité individuelle claire.',
      intensite: 'Passages courts et rythme élevé.',
      agressiviteMaitrisee: 'Engagement sans faute inutile.',
      maitrise: 'Vitesse avec contrôle.',
      jeu: 'Lecture libre dans un cadre clair.',
    },
    courtFrames: ensureThreeFrames(createSituation()).map((frame, index) => ({
      ...frame,
      title: ['Mise en place', 'Départ de l’action', 'Lecture / décision'][index] || frame.title,
    })),
    visibility: 'private',
    status: 'draft',
    createdBy: context.createdBy || '',
    ownerId: context.ownerId || '',
  })
}

export function parseImportedSituation(responseText: string, context: SituationImportContext = {}) {
  const jsonText = extractJson(responseText)
  if (jsonText) {
    try {
      const parsed = JSON.parse(jsonText)
      return normalizeSituation({
        ...parsed,
        createdBy: context.createdBy || parsed.createdBy,
        ownerId: context.ownerId || parsed.ownerId,
        courtFrames: ensureThreeFrames(normalizeSituation(parsed)),
      })
    } catch {
      return transformRawTextToSituation(responseText, context)
    }
  }
  return transformRawTextToSituation(responseText, context)
}
