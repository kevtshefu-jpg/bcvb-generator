import { createCourtFrame, normalizeSession, type TrainingSessionV2 } from './sessionModels'
import { parseTransformedSession, transformRawTextToSession } from './sessionTransformer'

type ImportContext = {
  fileName?: string
  fileType?: string
  category?: string
  theme?: string
  subTheme?: string
  coachName?: string
  teamLabel?: string
}

const courtFramePromptRules = `RÈGLES TERRAIN FIBA BCVB
- Chaque situation doit contenir au minimum 3 courtFrames : mise en place, déclenchement, évolution ou lecture.
- Utilise des coordonnées métriques : terrain entier x 0 à 28 et y 0 à 15 ; demi-terrain x 0 à 14 et y 0 à 15.
- courtType autorisés : "full", "half-right", "half-left". Ne recadre jamais un terrain entier pour fabriquer un demi-terrain.
- Place joueurs, ballons, plots, zones et flèches dans les limites FIBA.
- Les notes doivent préciser le panier visé, les rotations et la consigne coach visible sur la frame.`

function ensureThreeCourtFrames(frames: ReturnType<typeof createCourtFrame>[]) {
  const presets = [
    createCourtFrame({ title: 'Mise en place', courtType: 'half-right', intent: 'Placement initial en coordonnées métriques' }),
    createCourtFrame({ title: 'Déclenchement', courtType: 'half-right', intent: 'Première passe, course ou fixation' }),
    createCourtFrame({ title: 'Lecture / évolution', courtType: 'half-left', intent: 'Réponse défensive, option ou évolution' }),
  ]
  return [...frames, ...presets].slice(0, Math.max(3, frames.length))
}

export function buildOcrSessionPrompt(fileContext: ImportContext = {}) {
  return `Tu es un assistant OCR spécialisé dans les fiches de séances de basket.

Analyse l’image ou le PDF fourni.

Objectif :
Extraire toutes les informations visibles, même si elles sont manuscrites, inclinées, partiellement floues ou organisées en tableaux.

Contexte fichier :
- Nom : ${fileContext.fileName || 'à confirmer'}
- Type : ${fileContext.fileType || 'photo, PDF ou scan'}

Tu dois repérer :
- titre de séance si visible ;
- date ;
- équipe ou catégorie ;
- durée ;
- effectif ;
- objectifs ;
- bilan de séance ;
- axes d’amélioration ;
- chaque situation ;
- chaque terrain dessiné ;
- les consignes techniques ;
- les évolutions ;
- les rotations ;
- les flèches ;
- les joueurs ;
- les défenseurs ;
- les plots ;
- le ballon.

Format de sortie :
1. Texte brut corrigé.
2. Liste structurée des situations.
3. Pour chaque situation :
   - titre supposé ;
   - objectif ;
   - durée ;
   - organisation ;
   - déroulement ;
   - consignes ;
   - évolutions ;
   - éléments visibles sur le terrain ;
   - incertitudes OCR.
4. Ne pas inventer ce qui n’est pas visible.
5. Si une information est incertaine, écris : “à confirmer”.

Retourne ensuite un JSON exploitable.`
}

export function buildImportedSessionToBcvbPrompt(extractedText: string, context: ImportContext = {}) {
  return `Tu es directeur technique basket et responsable éditorial BCVB.

À partir de la source extraite ci-dessous, transforme cette fiche en séance BCVB complète, claire et exploitable.

CONTEXTE BCVB
- Philosophie : Défendre Fort, Courir et Partager la Balle.
- Défense prioritaire : Homme à Homme.
- Valeurs : intensité, agressivité maîtrisée, maîtrise, jeu.
- Démarche pédagogique : je découvre / je m’exerce / je retranscris en match / je régule.

CONTEXTE FICHE
- Fichier : ${context.fileName || 'texte collé'}
- Catégorie pressentie : ${context.category || 'à confirmer'}
- Thème pressenti : ${context.theme || 'à confirmer'}
- Sous-thème pressenti : ${context.subTheme || 'à confirmer'}

MISSION
Transformer une fiche brute, photo, scan ou PDF en séance moderne BCVB.

Tu dois produire :
- un titre clair ;
- une catégorie cible ;
- un thème ;
- un sous-thème ;
- une durée ;
- un effectif conseillé ;
- les objectifs de séance ;
- les objectifs BCVB ;
- le matériel ;
- un déroulé chronologique ;
- une liste de situations détaillées ;
- les critères de réussite ;
- les critères observables ;
- les critères quantifiables ;
- les adaptations par niveau ;
- les liens avec le jeu réel ;
- les liens avec l’identité BCVB.

Pour chaque situation :
- titre ;
- durée ;
- phase pédagogique : je découvre / je m’exerce / je retranscris en match / je régule ;
- objectif ;
- organisation ;
- description ;
- consignes joueurs ;
- consignes coach ;
- évolution ;
- régression ;
- critères observables ;
- critères quantifiables ;
- réussite attendue ;
- lien BCVB ;
- erreurs fréquentes ;
- corrections coach ;
- terrain à générer.

${courtFramePromptRules}

IMPORTANT
Si la fiche source est pauvre, tu dois l’enrichir intelligemment sans trahir son intention.
Si le terrain manuscrit est incomplet, reconstruis une version propre et coachable.
Si plusieurs situations sont visibles, sépare-les clairement.

Retourne obligatoirement :
1. JSON strict.
2. Markdown BCVB lisible.

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
  "sessionFlow": [],
  "situations": [
    {
      "title": "",
      "durationMinutes": 0,
      "pedagogicalPhase": "",
      "objective": "",
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
      "courtFrames": [
        {
          "title": "Mise en place",
          "courtType": "full",
          "intent": "",
          "objects": [],
          "arrows": [],
          "zones": [],
          "notes": ""
        },
        {
          "title": "Déclenchement",
          "courtType": "half-right",
          "intent": "",
          "objects": [],
          "arrows": [],
          "zones": [],
          "notes": ""
        },
        {
          "title": "Évolution",
          "courtType": "half-left",
          "intent": "",
          "objects": [],
          "arrows": [],
          "zones": [],
          "notes": ""
        }
      ]
    }
  ],
  "coachNotes": "",
  "qualityWarnings": []
}

SOURCE EXTRAITE :
${extractedText}`
}

export function parseImportedSession(responseText: string, context: ImportContext = {}): TrainingSessionV2 {
  const session = parseTransformedSession(responseText || '')
  const sourceFallback = responseText.trim()
    ? session
    : transformRawTextToSession('Source vide à compléter manuellement', context)

  return normalizeSession({
    ...sourceFallback,
    sourceFileName: context.fileName || sourceFallback.sourceFileName,
    sourceType: context.fileName ? 'pdf' : sourceFallback.sourceType,
    sourceExtractedText: responseText,
    transformedFromSource: true,
    courtFrames: undefined,
    situations: sourceFallback.situations.map((situation) => ({
      ...situation,
      courtFrames: ensureThreeCourtFrames(situation.courtFrames),
    })),
  } as Partial<TrainingSessionV2>)
}
