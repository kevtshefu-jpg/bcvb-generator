export type EditorialFamilyKey =
  | 'cahier_technique'
  | 'guide_coach'
  | 'plan_formation'
  | 'ruban_pedagogique'
  | 'seance_entrainement'
  | 'seance'
  | 'fiche_theme'

export type WorldClassEditorialStandard = {
  label: string
  targetScore: number
  minTables: number
  minSituations: number
  minDiagrams: number
  minBcvbBlocks: number
  format: string
  expectedVolume: string
  targetAudience: string
  editorialStyle: string
  layout: string
  requiredStructure: string[]
  requiredSections: string[]
  blockingIssues: string[]
}

export const EDITORIAL_STANDARDS: Record<EditorialFamilyKey, WorldClassEditorialStandard> = {
  cahier_technique: {
    label: 'Cahier technique',
    targetScore: 97,
    minTables: 12,
    minSituations: 12,
    minDiagrams: 12,
    minBcvbBlocks: 32,
    format: 'A4 portrait',
    expectedVolume: '20 à 60 pages',
    targetAudience: 'Coachs, responsables techniques, commission sportive',
    editorialStyle: 'Précis, technique, autonome, directement exploitable sur le terrain.',
    layout: 'Double colonne texte / schéma pour les situations, numérotation visible, fiches autonomes.',
    requiredStructure: [
      'Couverture éditoriale',
      'Identité BCVB',
      'Finalité technique',
      'Repères de développement',
      'Objectifs de formation',
      'Planification annuelle',
      'Progression par cycle',
      'Situations pédagogiques numérotées',
      'Diagrammes terrain',
      'Critères de réussite',
      'Points de vigilance',
      'Outils d’évaluation',
      'Synthèse coach',
    ],
    requiredSections: [
      'Couverture éditoriale',
      'Identité BCVB',
      'Finalité technique',
      'Objectifs de formation',
      'Planification annuelle',
      'Progression par cycle',
      'Situations pédagogiques',
      'Critères de réussite',
      'Outils d’évaluation',
      'Synthèse coach',
    ],
    blockingIssues: [
      'Situation sans diagramme',
      'Tableau brut non converti',
      'Absence de progression technique',
      'Absence de critères de réussite',
      'Diagramme terrain incomplet',
    ],
  },
  guide_coach: {
    label: 'Guide du coach',
    targetScore: 97,
    minTables: 10,
    minSituations: 10,
    minDiagrams: 10,
    minBcvbBlocks: 30,
    format: 'A4 portrait',
    expectedVolume: '25 à 80 pages',
    targetAudience: 'Coachs, aides-coachs, responsables d’équipes, commission sportive',
    editorialStyle: 'Humain, exigeant, formateur, opérationnel.',
    layout: 'Lecture profonde, sidebar, encarts clés, espaces blancs assumés, filet rouge ou orange sur les principes importants.',
    requiredStructure: [
      'Couverture éditoriale',
      'Identité BCVB',
      'Finalité de la catégorie',
      'Profil du joueur',
      'Rôle du coach',
      'Posture attendue',
      'Principes pédagogiques',
      'Planification annuelle',
      'Progression opérationnelle',
      'Séance type',
      'Situations pédagogiques',
      'Schémas terrain',
      'Relation familles',
      'Outils d’évaluation',
      'Passerelle catégorie suivante',
      'Synthèse coach',
      'Annexes pratiques',
    ],
    requiredSections: [
      'Couverture éditoriale',
      'Identité BCVB',
      'Finalité de la catégorie',
      'Profil du joueur',
      'Rôle du coach',
      'Posture attendue',
      'Principes pédagogiques',
      'Planification annuelle',
      'Progression opérationnelle',
      'Séance type',
      'Situations pédagogiques',
      'Relation familles',
      'Outils d’évaluation',
      'Passerelle catégorie suivante',
      'Synthèse coach',
    ],
    blockingIssues: [
      'Situation sans diagramme',
      'Tableau brut non converti',
      'Absence de planification',
      'Absence de grille d’évaluation',
      'Absence de transfert match',
      'Absence de critères de réussite',
      'Absence de synthèse coach',
    ],
  },
  plan_formation: {
    label: 'Plan de formation',
    targetScore: 98,
    minTables: 14,
    minSituations: 0,
    minDiagrams: 6,
    minBcvbBlocks: 30,
    format: 'A4 portrait',
    expectedVolume: '30 à 80 pages',
    targetAudience: 'Dirigeants, DTR, responsables techniques, coachs référents',
    editorialStyle: 'Institutionnel, visionnaire, pilotable, premium.',
    layout: 'Rapport institutionnel avec pages de transition, matrices, tableaux de bord, timelines.',
    requiredStructure: [
      'Éditorial président / DTR',
      'Vision club',
      'Philosophie BCVB',
      'Parcours joueur',
      'Objectifs par catégorie',
      'Matrice compétences',
      'Indicateurs de suivi',
      'Calendrier de mise en œuvre',
      'Organisation technique',
      'Tableaux de bord',
    ],
    requiredSections: [
      'Éditorial',
      'Philosophie BCVB',
      'Parcours joueur',
      'Objectifs par catégorie',
      'Matrice compétences',
      'Indicateurs de suivi',
      'Calendrier de mise en œuvre',
      'Tableaux de bord',
    ],
    blockingIssues: [
      'Absence de vision club',
      'Absence de matrice compétences',
      'Absence d’indicateurs',
      'Absence de calendrier',
      'Tableau brut non converti',
    ],
  },
  ruban_pedagogique: {
    label: 'Ruban pédagogique',
    targetScore: 96,
    minTables: 6,
    minSituations: 0,
    minDiagrams: 0,
    minBcvbBlocks: 14,
    format: 'A4 paysage',
    expectedVolume: '1 à 6 pages',
    targetAudience: 'Coachs, formateurs, responsables techniques',
    editorialStyle: 'Synthétique, compact, très lisible, orienté progression.',
    layout: 'Lecture horizontale par le temps et verticale par les thèmes, tableau large, codes couleur.',
    requiredStructure: [
      'Objectif général',
      'Période',
      'Thèmes',
      'Objectifs',
      'Contenus',
      'Situations supports',
      'Critères observables',
      'Régulations',
      'Charge / complexité',
      'Transfert match',
    ],
    requiredSections: [
      'Objectif général',
      'Progression par séances',
      'Objectifs par séance',
      'Situations supports',
      'Critères observables',
      'Régulations',
    ],
    blockingIssues: [
      'Absence de timeline horizontale',
      'Absence de progression visible',
      'Tableau brut non converti',
      'Objectifs non observables',
    ],
  },
  seance_entrainement: {
    label: 'Séance d’entraînement',
    targetScore: 95,
    minTables: 3,
    minSituations: 2,
    minDiagrams: 2,
    minBcvbBlocks: 10,
    format: 'A4 portrait ou paysage',
    expectedVolume: '1 à 2 pages',
    targetAudience: 'Coach terrain',
    editorialStyle: 'Direct, clair, utilisable en 30 secondes au gymnase.',
    layout: 'Timing visible, terrain immédiat, consignes courtes, bilan rapide.',
    requiredStructure: [
      'Thème',
      'Objectifs',
      'Durée',
      'Matériel',
      'Déroulé chronologique',
      'Situation principale',
      'Schéma terrain',
      'Consignes',
      'Points coach',
      'Critères de réussite',
      'Variantes',
      'Bilan rapide',
    ],
    requiredSections: [
      'Objectif prioritaire',
      'Durée',
      'Matériel',
      'Déroulé',
      'Situation principale',
      'Schéma terrain',
      'Critères de réussite',
      'Bilan rapide',
    ],
    blockingIssues: [
      'Absence de timing',
      'Absence de schéma terrain',
      'Consignes trop longues',
      'Situation sans critères',
    ],
  },
  seance: {
    label: 'Séance d’entraînement',
    targetScore: 95,
    minTables: 3,
    minSituations: 2,
    minDiagrams: 2,
    minBcvbBlocks: 10,
    format: 'A4 portrait ou paysage',
    expectedVolume: '1 à 2 pages',
    targetAudience: 'Coach terrain',
    editorialStyle: 'Direct, clair, utilisable en 30 secondes au gymnase.',
    layout: 'Timing visible, terrain immédiat, consignes courtes, bilan rapide.',
    requiredStructure: [
      'Thème',
      'Objectifs',
      'Durée',
      'Matériel',
      'Déroulé chronologique',
      'Situation principale',
      'Schéma terrain',
      'Consignes',
      'Points coach',
      'Critères de réussite',
      'Variantes',
      'Bilan rapide',
    ],
    requiredSections: [
      'Objectif prioritaire',
      'Durée',
      'Matériel',
      'Déroulé',
      'Situation principale',
      'Schéma terrain',
      'Critères de réussite',
      'Bilan rapide',
    ],
    blockingIssues: [
      'Absence de timing',
      'Absence de schéma terrain',
      'Consignes trop longues',
      'Situation sans critères',
    ],
  },
  fiche_theme: {
    label: 'Fiche à thème',
    targetScore: 95,
    minTables: 4,
    minSituations: 4,
    minDiagrams: 4,
    minBcvbBlocks: 14,
    format: 'A4 portrait ou recto-verso',
    expectedVolume: '2 à 8 pages',
    targetAudience: 'Coachs',
    editorialStyle: 'Ciblé, concret, visuel, orienté application.',
    layout: 'Bannière thématique, blocs courts, erreurs fréquentes, transfert match.',
    requiredStructure: [
      'Définition',
      'Pourquoi c’est important',
      'Repères coach',
      'Erreurs fréquentes',
      'Situations d’apprentissage',
      'Variantes',
      'Critères d’évaluation',
      'Transfert match',
    ],
    requiredSections: [
      'Définition',
      'Repères coach',
      'Erreurs fréquentes',
      'Situations pédagogiques',
      'Critères d’évaluation',
      'Transfert match',
    ],
    blockingIssues: [
      'Absence de définition',
      'Absence d’erreurs fréquentes',
      'Situation sans diagramme',
      'Absence de transfert match',
    ],
  },
}

export function normalizeEditorialFamilyKey(value?: string | null): EditorialFamilyKey {
  if (value === 'technical-book') return 'cahier_technique'
  if (value === 'coach-guide') return 'guide_coach'
  if (value === 'training-plan') return 'plan_formation'
  if (value === 'pedagogical-ribbon') return 'ruban_pedagogique'
  if (value === 'practice-session') return 'seance_entrainement'
  if (value === 'theme-sheet') return 'fiche_theme'
  if (value === 'seance') return 'seance_entrainement'
  if (
    value === 'cahier_technique' ||
    value === 'guide_coach' ||
    value === 'plan_formation' ||
    value === 'ruban_pedagogique' ||
    value === 'seance_entrainement' ||
    value === 'fiche_theme'
  ) {
    return value
  }

  return 'guide_coach'
}

export function getWorldClassEditorialStandard(value?: string | null) {
  return EDITORIAL_STANDARDS[normalizeEditorialFamilyKey(value)]
}
