import {
  DOCUMENT_GOLD_STANDARDS,
  type DocumentGoldStandard,
  type DocumentGoldStandardKey,
} from '../features/documents/standards/documentGoldStandards'

export type DocumentContentStandardKey =
  | 'technicalBookU7U11'
  | 'technicalBookU13U15'
  | 'categoryTechnicalBook'
  | 'pedagogicRibbon'
  | 'trainingPlan'
  | 'completeSession'
  | 'clubFramework'
  | 'annualProgression'
  | 'trainingCycle'
  | 'coachGuide'
  | 'detailedSession'
  | 'generic'

export type DocumentContentStandard = {
  key: DocumentContentStandardKey
  label: string
  mandatorySections: string[]
  recommendedSections: string[]
  minimumTables: number
  minimumSituations: number
  recommendedSituations: string
  minimumDiagrams: number
  recommendedDiagrams: string
  requiresPlanning: boolean
  requiresProgression: boolean
  requiresCycle: boolean
  requiresSession: boolean
  requiresSynthesis: boolean
  goldStandard?: DocumentGoldStandard
  minimumAnnexes?: number
  requiresToc?: boolean
  requiresEvaluation?: boolean
  requiresFamiliesCommunication?: boolean
  requiresNextCategoryBridge?: boolean
  requiresMicrocycles?: boolean
  minimumMicrocycles?: number
}

export type DocumentDepthLevel =
  | 'synthetic'
  | 'standard'
  | 'premium'
  | 'reference'

export const DOCUMENT_DEPTH_LABELS: Record<DocumentDepthLevel, string> = {
  synthetic: 'Synthétique',
  standard: 'Standard',
  premium: 'Premium',
  reference: 'Référence BCVB / Publication club',
}

export function getExpectedRichBlockMinimum(standard: DocumentContentStandard) {
  if (standard.key === 'technicalBookU7U11') return 20
  if (standard.key === 'technicalBookU13U15') return 24
  if (standard.key === 'categoryTechnicalBook') return 20
  if (standard.key === 'coachGuide') return 7
  if (standard.key === 'detailedSession') return 6
  if (standard.minimumSituations > 0) return Math.max(6, standard.minimumSituations + 3)
  return 1
}

export function getDepthMultiplier(depth: DocumentDepthLevel) {
  if (depth === 'synthetic') return 0.65
  if (depth === 'standard') return 0.85
  if (depth === 'premium') return 1
  return 1.15
}

export function getDepthAdjustedMinimum(value: number, depth: DocumentDepthLevel) {
  if (value === 0) return 0
  return Math.max(1, Math.ceil(value * getDepthMultiplier(depth)))
}

export function getRecommendedDepthForStandard(standard: DocumentContentStandard): DocumentDepthLevel {
  if (
    standard.key === 'technicalBookU7U11' ||
    standard.key === 'technicalBookU13U15' ||
    standard.key === 'categoryTechnicalBook' ||
    standard.key === 'pedagogicRibbon' ||
    standard.key === 'trainingPlan'
  ) {
    return 'reference'
  }

  if (standard.key === 'coachGuide') return 'reference'
  if (standard.key === 'detailedSession' || standard.key === 'completeSession') return 'premium'

  return 'standard'
}

function fromGoldStandard(
  key: DocumentContentStandardKey,
  goldKey: DocumentGoldStandardKey
): DocumentContentStandard {
  const goldStandard = DOCUMENT_GOLD_STANDARDS[goldKey]

  return {
    key,
    label: goldStandard.label,
    mandatorySections: goldStandard.mandatorySections,
    recommendedSections: goldStandard.recommendedSections,
    minimumTables: goldStandard.minimumTables,
    minimumSituations: goldStandard.minimumSituations,
    recommendedSituations: goldStandard.targetSituations,
    minimumDiagrams: goldStandard.minimumDiagrams,
    recommendedDiagrams: goldStandard.targetDiagrams,
    requiresPlanning: goldStandard.requiresPlanning,
    requiresProgression: goldStandard.requiresPlanning,
    requiresCycle: goldStandard.requiresMicrocycles,
    requiresSession: true,
    requiresSynthesis: goldStandard.requiresSynthesis,
    goldStandard,
    minimumAnnexes: goldStandard.minimumAnnexes,
    requiresToc: goldStandard.requiresToc,
    requiresEvaluation: goldStandard.requiresEvaluation,
    requiresFamiliesCommunication: goldStandard.requiresFamiliesCommunication,
    requiresNextCategoryBridge: goldStandard.requiresNextCategoryBridge,
    requiresMicrocycles: goldStandard.requiresMicrocycles,
    minimumMicrocycles: goldStandard.minimumMicrocycles,
  }
}

export const DOCUMENT_CONTENT_STANDARDS: Record<
  DocumentContentStandardKey,
  DocumentContentStandard
> = {
  technicalBookU7U11: fromGoldStandard('technicalBookU7U11', 'technicalBookU7U11'),
  technicalBookU13U15: fromGoldStandard('technicalBookU13U15', 'technicalBookU13U15'),
  trainingPlan: fromGoldStandard('trainingPlan', 'trainingPlan'),
  completeSession: fromGoldStandard('completeSession', 'completeSession'),
  clubFramework: fromGoldStandard('clubFramework', 'clubFramework'),
  categoryTechnicalBook: {
    key: 'categoryTechnicalBook',
    label: 'Cahier technique de catégorie',
    mandatorySections: [
      'Titre principal',
      'Sous-titre éditorial',
      'Introduction',
      'Finalité de la catégorie dans le parcours BCVB',
      'Place de la catégorie dans le parcours joueur BCVB',
      'Lien explicite avec la préparation à la catégorie suivante',
      'Identité BCVB appliquée à la catégorie',
      'Philosophie BCVB adaptée à l’âge',
      'Rôle du coach de catégorie',
      'Objectifs du document',
      'Public concerné',
      'Principes clés de formation',
      'Développement moteur ou athlétique',
      'Objectifs offensifs',
      'Objectifs défensifs',
      'Objectifs de lecture du jeu',
      'Objectifs collectifs',
      'Objectifs comportementaux',
      'Organisation détaillée d’une séance',
      'Planification annuelle',
      'Progression par période',
      'Progression par domaine',
      'Cycle type de 6 semaines',
      'Deux exemples de séances complètes prêtes à l’emploi',
      'Tableau objectif → contenu → situation',
      'Contenus opérationnels prioritaires',
      'Situations pédagogiques détaillées',
      'Exemples de cycles d’apprentissage',
      'Exemple de séance complète',
      'Points de vigilance',
      'Critères de réussite',
      'Évaluation joueur ou repères d’observation',
      'Grille d’observation joueur',
      'Auto-évaluation coach',
      'Indicateurs de réussite d’une séance',
      'Erreurs fréquentes du coach et ajustements',
      'Gestion des parents avant et pendant la saison',
      'Organisation des plateaux',
      'Rôle du parent référent',
      'Communication WhatsApp et hors séance',
      'Posture éducative face aux familles',
      'Priorités avant l’entrée dans la catégorie suivante',
      'Synthèse finale exploitable',
    ],
    recommendedSections: [
      'Erreurs fréquentes et corrections',
      'Repères coach courts',
      'Différenciation par niveau',
      'Transfert match',
      'Gestion des vacances et imprévus',
      'Rituels d’accueil et de fin de séance',
    ],
    minimumTables: 12,
    minimumSituations: 18,
    recommendedSituations: '20 à 24 situations pour un cahier technique complet',
    minimumDiagrams: 18,
    recommendedDiagrams: '24 à 30 diagrammes pour couvrir mise en place, évolution et transfert',
    requiresPlanning: true,
    requiresProgression: true,
    requiresCycle: true,
    requiresSession: true,
    requiresSynthesis: true,
  },
  pedagogicRibbon: {
    key: 'pedagogicRibbon',
    label: 'Ruban pédagogique',
    mandatorySections: [
      'Finalité du ruban',
      'Progression par étapes',
      'Planification par périodes',
      'Situations pivots',
      'Critères de passage',
      'Synthèse coach',
    ],
    recommendedSections: ['Cycle exemple', 'Points de vigilance', 'Transferts match'],
    minimumTables: 6,
    minimumSituations: 8,
    recommendedSituations: '10 à 12 situations pivots',
    minimumDiagrams: 6,
    recommendedDiagrams: '8 à 12 diagrammes',
    requiresPlanning: true,
    requiresProgression: true,
    requiresCycle: true,
    requiresSession: false,
    requiresSynthesis: true,
  },
  annualProgression: {
    key: 'annualProgression',
    label: 'Progression annuelle',
    mandatorySections: [
      'Objectifs annuels',
      'Planification annuelle',
      'Progression par période',
      'Progression par domaine',
      'Critères de réussite',
      'Synthèse',
    ],
    recommendedSections: ['Cycle type', 'Séances repères', 'Vigilances'],
    minimumTables: 7,
    minimumSituations: 6,
    recommendedSituations: '8 à 10 situations repères',
    minimumDiagrams: 4,
    recommendedDiagrams: '6 à 8 diagrammes',
    requiresPlanning: true,
    requiresProgression: true,
    requiresCycle: true,
    requiresSession: false,
    requiresSynthesis: true,
  },
  trainingCycle: {
    key: 'trainingCycle',
    label: 'Cycle d’entraînement',
    mandatorySections: [
      'Objectif du cycle',
      'Organisation du cycle',
      'Séances détaillées',
      'Situations pédagogiques',
      'Critères de réussite',
      'Bilan de cycle',
    ],
    recommendedSections: ['Évaluation de départ', 'Évaluation finale', 'Transfert match'],
    minimumTables: 5,
    minimumSituations: 6,
    recommendedSituations: '6 à 8 situations',
    minimumDiagrams: 4,
    recommendedDiagrams: '6 à 8 diagrammes',
    requiresPlanning: true,
    requiresProgression: true,
    requiresCycle: true,
    requiresSession: true,
    requiresSynthesis: true,
  },
  coachGuide: {
    key: 'coachGuide',
    label: 'Guide coach',
    mandatorySections: [
      'Finalité',
      'Repères coach',
      'Principes d’intervention',
      'Situations ou exemples terrain',
      'Points de vigilance',
      'Synthèse',
    ],
    recommendedSections: ['Cas concrets', 'Erreurs fréquentes', 'Outils d’observation'],
    minimumTables: 4,
    minimumSituations: 8,
    recommendedSituations: '8 à 12 situations ou cas terrain',
    minimumDiagrams: 8,
    recommendedDiagrams: '8 à 12 diagrammes si le sujet est terrain',
    requiresPlanning: false,
    requiresProgression: false,
    requiresCycle: false,
    requiresSession: false,
    requiresSynthesis: true,
  },
  detailedSession: {
    key: 'detailedSession',
    label: 'Séance détaillée',
    mandatorySections: [
      'Objectif de séance',
      'Organisation',
      'Déroulé minute par minute',
      'Situations pédagogiques',
      'Critères de réussite',
      'Retour au calme',
    ],
    recommendedSections: ['Variables', 'Transfert match', 'Bilan coach'],
    minimumTables: 3,
    minimumSituations: 3,
    recommendedSituations: '3 à 5 situations',
    minimumDiagrams: 3,
    recommendedDiagrams: 'un diagramme par situation',
    requiresPlanning: false,
    requiresProgression: false,
    requiresCycle: false,
    requiresSession: true,
    requiresSynthesis: true,
  },
  generic: {
    key: 'generic',
    label: 'Document BCVB',
    mandatorySections: ['Titre', 'Objectif', 'Contenu principal', 'Synthèse'],
    recommendedSections: ['Tableau de synthèse', 'Repères opérationnels'],
    minimumTables: 1,
    minimumSituations: 0,
    recommendedSituations: 'selon le sujet',
    minimumDiagrams: 0,
    recommendedDiagrams: 'selon le sujet',
    requiresPlanning: false,
    requiresProgression: false,
    requiresCycle: false,
    requiresSession: false,
    requiresSynthesis: true,
  },
}

function normalizeStandardInput(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function getDocumentContentStandard(input: {
  documentType?: string
  generationType?: string
  title?: string
  category?: string
  subcategory?: string
  userInstruction?: string
  content?: string
}) {
  const documentType = normalizeStandardInput(input.documentType ?? '')
  const category = normalizeStandardInput(input.category ?? '')
  const haystack = normalizeStandardInput(
    [
      input.documentType,
      input.generationType,
      input.title,
      input.category,
      input.subcategory,
      input.userInstruction,
      input.content,
    ]
      .filter(Boolean)
      .join(' ')
  )

  if (/cahier technique/.test(documentType)) {
    if (/\b(u13|u15)\b/.test(category) || /\b(u13|u15)\b/.test(haystack)) {
      return DOCUMENT_CONTENT_STANDARDS.technicalBookU13U15
    }

    if (/\b(u7|u9|u11)\b/.test(category) || /\b(u7|u9|u11)\b/.test(haystack)) {
      return DOCUMENT_CONTENT_STANDARDS.technicalBookU7U11
    }

    return DOCUMENT_CONTENT_STANDARDS.categoryTechnicalBook
  }

  if (/guide coach de categorie/.test(documentType)) {
    if (/\b(u13|u15)\b/.test(category) || /\b(u13|u15)\b/.test(haystack)) {
      return DOCUMENT_CONTENT_STANDARDS.technicalBookU13U15
    }

    if (/\b(u7|u9|u11)\b/.test(category) || /\b(u7|u9|u11)\b/.test(haystack)) {
      return DOCUMENT_CONTENT_STANDARDS.technicalBookU7U11
    }

    return DOCUMENT_CONTENT_STANDARDS.categoryTechnicalBook
  }

  if (/guide coach/.test(documentType)) {
    return DOCUMENT_CONTENT_STANDARDS.coachGuide
  }

  if (/seance|séance/.test(documentType)) {
    return DOCUMENT_CONTENT_STANDARDS.completeSession
  }

  if (/document cadre/.test(documentType)) {
    return DOCUMENT_CONTENT_STANDARDS.clubFramework
  }

  if (/plan de formation/.test(documentType)) {
    return DOCUMENT_CONTENT_STANDARDS.trainingPlan
  }

  if (/\b(u13|u15)\b/.test(haystack) && /(cahier technique|guide complet|guide du coach|coach|categorie)/.test(haystack)) {
    return DOCUMENT_CONTENT_STANDARDS.technicalBookU13U15
  }

  if (/\b(u7|u9|u11)\b/.test(haystack) && /(cahier technique|guide complet|guide du coach|coach|categorie)/.test(haystack)) {
    return DOCUMENT_CONTENT_STANDARDS.technicalBookU7U11
  }

  if (/cahier technique|document technique de categorie|categorie u\d+/.test(haystack)) {
    return DOCUMENT_CONTENT_STANDARDS.categoryTechnicalBook
  }

  if (/ruban pedagogique/.test(haystack)) {
    return DOCUMENT_CONTENT_STANDARDS.pedagogicRibbon
  }

  if (/plan de formation/.test(haystack)) {
    return DOCUMENT_CONTENT_STANDARDS.trainingPlan
  }

  if (/progression annuelle|plan annuel|planification annuelle/.test(haystack)) {
    return DOCUMENT_CONTENT_STANDARDS.annualProgression
  }

  if (/cycle|cycle d entrainement|cycle d'entrainement/.test(haystack)) {
    return DOCUMENT_CONTENT_STANDARDS.trainingCycle
  }

  if (/guide coach|support de formation/.test(haystack)) {
    return DOCUMENT_CONTENT_STANDARDS.coachGuide
  }

  if (/seance|séance/.test(haystack)) {
    return DOCUMENT_CONTENT_STANDARDS.detailedSession
  }

  return DOCUMENT_CONTENT_STANDARDS.generic
}

export function formatContentStandardForPrompt(standard: DocumentContentStandard) {
  const expectedRichBlocks = getExpectedRichBlockMinimum(standard)

  return `
STANDARD DE COMPLÉTUDE À RESPECTER : ${standard.label}

Sections obligatoires :
${standard.mandatorySections.map((section) => `- ${section}`).join('\n')}

Sections recommandées :
${standard.recommendedSections.map((section) => `- ${section}`).join('\n')}

Exigences quantitatives :
- Tableaux utiles minimum : ${standard.minimumTables}
- Situations pédagogiques minimum : ${standard.minimumSituations}
- Situations recommandées : ${standard.recommendedSituations}
- Diagrammes terrain minimum : ${standard.minimumDiagrams}
- Diagrammes recommandés : ${standard.recommendedDiagrams}
- Blocs BCVB typés minimum : ${expectedRichBlocks}
- Annexes minimum : ${standard.minimumAnnexes ?? 0}
- Sommaire obligatoire : ${standard.requiresToc ? 'oui' : 'non'}
- Planification obligatoire : ${standard.requiresPlanning ? 'oui' : 'non'}
- Progression obligatoire : ${standard.requiresProgression ? 'oui' : 'non'}
- Cycle type obligatoire : ${standard.requiresCycle ? 'oui' : 'non'}
- Séance type obligatoire : ${standard.requiresSession ? 'oui' : 'non'}
- Synthèse finale obligatoire : ${standard.requiresSynthesis ? 'oui' : 'non'}
- Évaluation obligatoire : ${standard.requiresEvaluation ? 'oui' : 'non'}
- Familles / communication obligatoire : ${standard.requiresFamiliesCommunication ? 'oui' : 'non'}
- Passerelle catégorie suivante obligatoire : ${standard.requiresNextCategoryBridge ? 'oui' : 'non'}
- Microcycles obligatoires : ${standard.requiresMicrocycles ? `oui, minimum ${standard.minimumMicrocycles ?? 0}` : 'non'}
${standard.key === 'categoryTechnicalBook' || standard.key === 'technicalBookU7U11' || standard.key === 'technicalBookU13U15' ? `

Standard renforcé Cahier Technique de catégorie :
- produire un document de référence club dense, pas une synthèse ;
- produire un document supérieur en richesse et en fonctionnalité aux cahiers techniques BCVB Premium déjà existants ;
- respecter le Gold Standard correspondant au type de document ;
- intégrer tous les tableaux, situations/exercices, schémas et annexes attendus ;
- si la catégorie est U7-U11, intégrer explicitement : public / profil développemental, lexique adapté, méthode BCVB en 4 temps, familles de situations, plateaux, communication familles, passerelle vers catégorie suivante ;
- si la catégorie est U13-U15, intégrer explicitement : DLTA / continuum, architecture hebdomadaire, microcycles, développement physique, intentions attaque / défense / transition, banque de 20 exercices premium minimum, suivi périodique joueur ;
- chaque situation doit contenir erreurs fréquentes et corrections possibles.
` : ''}
`.trim()
}
