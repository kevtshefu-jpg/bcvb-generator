export type DocumentGoldStandardKey =
  | 'technicalBookU7U11'
  | 'technicalBookU13U15'
  | 'coachGuide'
  | 'trainingPlan'
  | 'pedagogicRibbon'
  | 'completeSession'
  | 'clubFramework'

export type DocumentGoldStandard = {
  key: DocumentGoldStandardKey
  label: string
  mandatorySections: string[]
  recommendedSections: string[]
  minimumTables: number
  targetTables: string
  minimumSituations: number
  targetSituations: string
  minimumDiagrams: number
  targetDiagrams: string
  minimumAnnexes: number
  requiresToc: boolean
  requiresPlanning: boolean
  requiresSynthesis: boolean
  requiresEvaluation: boolean
  requiresFamiliesCommunication: boolean
  requiresNextCategoryBridge: boolean
  requiresMicrocycles: boolean
  minimumMicrocycles: number
}

export const DOCUMENT_GOLD_STANDARDS: Record<
  DocumentGoldStandardKey,
  DocumentGoldStandard
> = {
  technicalBookU7U11: {
    key: 'technicalBookU7U11',
    label: 'BCVB Gold Standard — Cahier technique U7-U11',
    mandatorySections: [
      'Couverture',
      'Sommaire détaillé',
      'Finalité de la catégorie',
      'Connaissance du public / profil développemental',
      'Lexique BCVB adapté à l’âge',
      'Posture du coach',
      'Principes pédagogiques',
      'Planification annuelle',
      'Structure type de séance',
      'Méthode BCVB en 4 temps',
      'Guide de correction du coach',
      'Cadre club / familles / plateaux / communication',
      'Situations pédagogiques classées par familles',
      'Évaluation / grille d’observation',
      'Passerelle vers catégorie suivante',
      'Annexes pratiques',
      'Poster synthèse ou bloc l’essentiel',
    ],
    recommendedSections: [
      'Continuum DLTA',
      'Rituels de séance',
      'Banque de jeux réduits',
      'Guide parent référent',
      'Posture éducative face aux familles',
    ],
    minimumTables: 15,
    targetTables: '18+ tableaux utiles',
    minimumSituations: 18,
    targetSituations: '20 à 24 situations pédagogiques',
    minimumDiagrams: 18,
    targetDiagrams: '20 à 30 schémas terrain',
    minimumAnnexes: 3,
    requiresToc: true,
    requiresPlanning: true,
    requiresSynthesis: true,
    requiresEvaluation: true,
    requiresFamiliesCommunication: true,
    requiresNextCategoryBridge: true,
    requiresMicrocycles: false,
    minimumMicrocycles: 0,
  },
  technicalBookU13U15: {
    key: 'technicalBookU13U15',
    label: 'BCVB Gold Standard — Cahier technique U13-U15',
    mandatorySections: [
      'Couverture',
      'Avant-propos',
      'Profil de catégorie',
      'DLTA / continuum BCVB',
      'Identité club',
      'Lexique technique BCVB',
      'Référentiel externe ou tendances de formation',
      'Planification annuelle',
      'Architecture hebdomadaire',
      'Développement physique spécifique',
      'Défenses / principes club',
      'Microcycles prêts à l’emploi',
      'Structure de séance',
      'Intentions prioritaires attaque / défense / transition',
      'Suivi et évaluation des joueurs',
      'Banque de 20 exercices premium minimum',
      'Coaching de match ou organisation de compétition',
      'Parents / communication / organisation week-end',
      'Passerelle vers catégorie suivante',
      'Conclusion synthétique et annexes',
    ],
    recommendedSections: [
      'Tendances européennes',
      'Développement individuel',
      'Gestion des charges',
      'Scénarios de match',
    ],
    minimumTables: 18,
    targetTables: '20+ tableaux structurants',
    minimumSituations: 20,
    targetSituations: '20 exercices premium minimum',
    minimumDiagrams: 20,
    targetDiagrams: '20 à 28 schémas terrain',
    minimumAnnexes: 3,
    requiresToc: true,
    requiresPlanning: true,
    requiresSynthesis: true,
    requiresEvaluation: true,
    requiresFamiliesCommunication: true,
    requiresNextCategoryBridge: true,
    requiresMicrocycles: true,
    minimumMicrocycles: 6,
  },
  coachGuide: {
    key: 'coachGuide',
    label: 'BCVB Gold Standard — Guide coach',
    mandatorySections: ['Couverture', 'Finalité', 'Posture coach', 'Repères terrain', 'Outils d’observation', 'Synthèse'],
    recommendedSections: ['Cas concrets', 'Erreurs fréquentes', 'Annexes'],
    minimumTables: 6,
    targetTables: '8+ tableaux',
    minimumSituations: 8,
    targetSituations: '8 à 12 cas terrain',
    minimumDiagrams: 8,
    targetDiagrams: '8 à 12 schémas',
    minimumAnnexes: 1,
    requiresToc: true,
    requiresPlanning: false,
    requiresSynthesis: true,
    requiresEvaluation: true,
    requiresFamiliesCommunication: false,
    requiresNextCategoryBridge: false,
    requiresMicrocycles: false,
    minimumMicrocycles: 0,
  },
  trainingPlan: {
    key: 'trainingPlan',
    label: 'BCVB Gold Standard — Plan de formation',
    mandatorySections: ['Couverture', 'Finalité', 'Planification annuelle', 'Progressions', 'Cycles', 'Évaluation', 'Synthèse'],
    recommendedSections: ['Annexes', 'Passerelles catégories', 'Outils coach'],
    minimumTables: 14,
    targetTables: '16+ tableaux',
    minimumSituations: 12,
    targetSituations: '12 à 16 situations pivots',
    minimumDiagrams: 10,
    targetDiagrams: '10 à 16 schémas',
    minimumAnnexes: 2,
    requiresToc: true,
    requiresPlanning: true,
    requiresSynthesis: true,
    requiresEvaluation: true,
    requiresFamiliesCommunication: false,
    requiresNextCategoryBridge: true,
    requiresMicrocycles: true,
    minimumMicrocycles: 4,
  },
  pedagogicRibbon: {
    key: 'pedagogicRibbon',
    label: 'BCVB Gold Standard — Ruban pédagogique',
    mandatorySections: ['Couverture', 'Finalité', 'Progression par étapes', 'Planification', 'Situations pivots', 'Critères de passage', 'Synthèse'],
    recommendedSections: ['Cycles exemples', 'Annexes', 'Vigilances'],
    minimumTables: 10,
    targetTables: '12+ tableaux',
    minimumSituations: 10,
    targetSituations: '10 à 14 situations pivots',
    minimumDiagrams: 8,
    targetDiagrams: '8 à 12 schémas',
    minimumAnnexes: 1,
    requiresToc: true,
    requiresPlanning: true,
    requiresSynthesis: true,
    requiresEvaluation: true,
    requiresFamiliesCommunication: false,
    requiresNextCategoryBridge: true,
    requiresMicrocycles: true,
    minimumMicrocycles: 3,
  },
  completeSession: {
    key: 'completeSession',
    label: 'BCVB Gold Standard — Séance complète',
    mandatorySections: ['Objectif', 'Organisation', 'Déroulé', 'Situations', 'Schémas', 'Critères', 'Bilan'],
    recommendedSections: ['Variables', 'Transfert match'],
    minimumTables: 4,
    targetTables: '5+ tableaux',
    minimumSituations: 4,
    targetSituations: '4 à 6 situations',
    minimumDiagrams: 4,
    targetDiagrams: 'un schéma par situation',
    minimumAnnexes: 0,
    requiresToc: false,
    requiresPlanning: false,
    requiresSynthesis: true,
    requiresEvaluation: true,
    requiresFamiliesCommunication: false,
    requiresNextCategoryBridge: false,
    requiresMicrocycles: false,
    minimumMicrocycles: 0,
  },
  clubFramework: {
    key: 'clubFramework',
    label: 'BCVB Gold Standard — Document cadre club',
    mandatorySections: ['Couverture', 'Finalité', 'Principes club', 'Rôles', 'Processus', 'Synthèse'],
    recommendedSections: ['Annexes', 'FAQ', 'Tableaux de décision'],
    minimumTables: 6,
    targetTables: '8+ tableaux',
    minimumSituations: 0,
    targetSituations: 'selon le sujet',
    minimumDiagrams: 0,
    targetDiagrams: 'selon le sujet',
    minimumAnnexes: 1,
    requiresToc: true,
    requiresPlanning: false,
    requiresSynthesis: true,
    requiresEvaluation: false,
    requiresFamiliesCommunication: true,
    requiresNextCategoryBridge: false,
    requiresMicrocycles: false,
    minimumMicrocycles: 0,
  },
}
