import { getQualityTarget, type QualityTargetKey } from './documentQualityTargets'

export type EditorialFamilyStandard = {
  key: QualityTargetKey
  label: string
  identity: string
  mandatoryStructure: string[]
  layout: string
  visualStyle: string
  errorsToAvoid: string[]
  minTables: number
  minSituations: number
  minDiagrams: number
  minBcvbBlocks: number
}

const BASE_STANDARDS: Record<QualityTargetKey, Omit<EditorialFamilyStandard, 'minTables' | 'minSituations' | 'minDiagrams' | 'minBcvbBlocks'>> = {
  cahier_technique: {
    key: 'cahier_technique',
    label: 'Cahier technique',
    identity: 'Document durable, autonome, utilisé comme référence technique par les coachs.',
    layout: 'Double colonne texte / schéma obligatoire pour les situations, exercices autonomes numérotés, terrain intégré.',
    visualStyle: 'Fiches terrain haut de gamme, progression par âge, objectifs techniques, critères et évaluations.',
    mandatoryStructure: [
      'couverture',
      'identité catégorie',
      'objectifs techniques',
      'progression par âge',
      'planification annuelle',
      'situations détaillées',
      'diagrammes terrain',
      'critères de réussite',
      'évaluations',
      'synthèse coach',
    ],
    errorsToAvoid: [
      'Situations sans terrain',
      'Exercices non numérotés',
      'Planification trop vague',
      'Critères non observables',
    ],
  },
  guide_coach: {
    key: 'guide_coach',
    label: 'Guide du coach',
    identity: 'Document de lecture profonde qui clarifie le rôle, la posture et les outils du coach.',
    layout: 'Espaces blancs assumés, encarts latéraux, filet orange gauche sur principes importants.',
    visualStyle: 'Guide premium avec rôle du coach, relation familles, séance type, planification annuelle et outils d’évaluation.',
    mandatoryStructure: [
      'couverture',
      'rôle du coach',
      'posture attendue',
      'principes pédagogiques',
      'relation familles',
      'séance type',
      'planification annuelle',
      'outils d’évaluation',
      'passerelle catégorie suivante',
      'annexes pratiques',
    ],
    errorsToAvoid: [
      'Document uniquement technique sans posture coach',
      'Absence de relation familles',
      'Séance type absente',
      'Transitions trop mécaniques',
    ],
  },
  plan_formation: {
    key: 'plan_formation',
    label: 'Plan de formation',
    identity: 'Rapport institutionnel qui pilote la formation du club sur plusieurs années.',
    layout: 'Pages de transition pleine couleur, vision pluriannuelle, tableaux de bord, timelines et matrices.',
    visualStyle: 'Institutionnel premium : indicateurs, organigramme, parcours joueur, pilotage club.',
    mandatoryStructure: [
      'éditorial',
      'philosophie BCVB',
      'vision pluriannuelle',
      'parcours joueur',
      'matrices compétences',
      'indicateurs',
      'timeline',
      'tableaux de bord',
      'pilotage club',
    ],
    errorsToAvoid: [
      'Liste d’idées sans pilotage',
      'Absence d’indicateurs',
      'Aucune vision pluriannuelle',
      'Tableaux de bord absents',
    ],
  },
  ruban_pedagogique: {
    key: 'ruban_pedagogique',
    label: 'Ruban pédagogique',
    identity: 'Synthèse horizontale de progression par séances, temps et thèmes.',
    layout: 'Format paysage obligatoire, lecture horizontale par temps et verticale par thème.',
    visualStyle: 'Typographie compacte 9-10px, objectifs, contenus, situations, critères, régulations.',
    mandatoryStructure: [
      'période',
      'séances',
      'thèmes',
      'objectifs',
      'contenus',
      'situations',
      'critères',
      'régulations',
      'transfert match',
    ],
    errorsToAvoid: [
      'Narratif long',
      'Absence de timeline',
      'Pas de lecture horizontale',
      'Critères trop vagues',
    ],
  },
  seance_entrainement: {
    key: 'seance_entrainement',
    label: 'Séance d’entraînement',
    identity: 'Document terrain prioritairement lisible en 30 secondes.',
    layout: 'Une page si possible, terrain visible, objectif prioritaire, timing, organisation et rotations.',
    visualStyle: 'Fiche gymnase claire : consignes courtes, vigilance, critères de réussite, bilan rapide.',
    mandatoryStructure: [
      'thème',
      'objectif prioritaire',
      'timing',
      'matériel',
      'organisation',
      'situation principale',
      'terrain',
      'consignes',
      'rotations',
      'vigilance',
      'critères de réussite',
    ],
    errorsToAvoid: [
      'Trop de texte',
      'Terrain absent',
      'Timing absent',
      'Consignes non directement utilisables',
    ],
  },
  fiche_theme: {
    key: 'fiche_theme',
    label: 'Fiche à thème',
    identity: 'Document ciblé sur un thème, avec exemples terrain et déclinaisons par catégorie.',
    layout: 'Format flexible, bannière colorée selon thème, blocs courts et repères visuels.',
    visualStyle: 'Définition, points coach, erreurs fréquentes, situations, transfert match.',
    mandatoryStructure: [
      'définition',
      'pourquoi c’est important',
      'points coach',
      'erreurs fréquentes',
      'exemples terrain',
      'déclinaisons par catégorie',
      'critères',
      'transfert match',
    ],
    errorsToAvoid: [
      'Fiche trop générale',
      'Absence d’exemples terrain',
      'Aucun transfert match',
      'Pas de déclinaison par catégorie',
    ],
  },
}

export function getEditorialFamilyStandard(family: string): EditorialFamilyStandard {
  const normalized = family
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  const familyKey: QualityTargetKey =
    /cahier|technical/.test(normalized)
      ? 'cahier_technique'
      : /guide|coach/.test(normalized)
        ? 'guide_coach'
        : /formation|plan/.test(normalized)
          ? 'plan_formation'
          : /ruban|ribbon/.test(normalized)
            ? 'ruban_pedagogique'
            : /seance|session|entrainement/.test(normalized)
              ? 'seance_entrainement'
              : 'fiche_theme'

  const base = BASE_STANDARDS[familyKey]
  const quotas = getQualityTarget(base.label)

  return {
    ...base,
    minTables: quotas.minTables,
    minSituations: quotas.minSituations,
    minDiagrams: quotas.minDiagrams,
    minBcvbBlocks: quotas.minBcvbBlocks,
  }
}
