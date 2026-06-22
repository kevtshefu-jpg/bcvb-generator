export type CoachToolMode = 'novice' | 'expert'

export type CoachToolStep = {
  id: string
  title: string
  description: string
  helper: string
}

export const COACH_TOOL_MODE_STORAGE_KEY = 'bcvb.coach.toolMode'

export const SESSION_NOVICE_STEPS: CoachToolStep[] = [
  {
    id: 'category',
    title: 'Catégorie',
    description: 'Choisir l’équipe ou la catégorie.',
    helper: 'Adapter les contenus à l’âge et au niveau.',
  },
  {
    id: 'main-objective',
    title: 'Objectif principal',
    description: 'Définir ce que les joueurs doivent apprendre.',
    helper: 'Un bon objectif commence par une intention claire.',
  },
  {
    id: 'organization',
    title: 'Organisation',
    description: 'Déterminer durée, matériel, espaces et groupes.',
    helper: 'Une organisation simple permet de mieux coacher.',
  },
  {
    id: 'situations',
    title: 'Situations',
    description: 'Choisir ou créer les exercices.',
    helper: 'Chaque situation doit servir l’objectif.',
  },
  {
    id: 'coach-instructions',
    title: 'Consignes coach',
    description: 'Préparer les consignes, critères de réussite et corrections.',
    helper: 'Le coach observe, corrige et régule.',
  },
  {
    id: 'match-transfer',
    title: 'Transfert match',
    description: 'Prévoir comment l’apprentissage sera réutilisé en jeu.',
    helper: 'Le joueur doit comprendre quand et pourquoi utiliser ce qu’il apprend.',
  },
  {
    id: 'review',
    title: 'Bilan',
    description: 'Noter ce qui a fonctionné et ce qui doit être régulé.',
    helper: 'Le bilan prépare la séance suivante.',
  },
]

export const PLANNING_NOVICE_STEPS: CoachToolStep[] = [
  {
    id: 'period',
    title: 'Période',
    description: 'Définir la période travaillée.',
    helper: 'Une période claire évite de disperser les priorités.',
  },
  {
    id: 'category',
    title: 'Catégorie',
    description: 'Choisir l’équipe ou la catégorie concernée.',
    helper: 'La progression doit respecter l’âge, le niveau et la charge.',
  },
  {
    id: 'cycle-objectives',
    title: 'Objectifs du cycle',
    description: 'Fixer ce que l’équipe doit maîtriser à la fin du cycle.',
    helper: 'Un cycle efficace relie apprentissage, match et régulation.',
  },
  {
    id: 'bcvb-priorities',
    title: 'Priorités BCVB',
    description: 'Ancrer le cycle dans Défendre Fort, Courir et Partager la Balle.',
    helper: 'Les priorités guident les séances et les arbitrages du coach.',
  },
  {
    id: 'weekly-progression',
    title: 'Progression hebdomadaire',
    description: 'Répartir les contenus semaine par semaine.',
    helper: 'La progression doit monter en complexité sans perdre le jeu.',
  },
  {
    id: 'checkpoints',
    title: 'Points de contrôle',
    description: 'Prévoir les observables et critères de réussite.',
    helper: 'Un point de contrôle transforme la planification en outil de suivi.',
  },
  {
    id: 'cycle-review',
    title: 'Bilan du cycle',
    description: 'Capitaliser sur ce qui est acquis et ce qui reste à réguler.',
    helper: 'Le bilan prépare le cycle suivant et nourrit les évaluations.',
  },
]

export const EXPERT_MODE_ITEMS = [
  'liberté complète',
  'réglages avancés',
  'cycles',
  'intensité',
  'objectifs multiples',
  'export',
  'bibliothèque',
]

export function getCoachToolSteps(context: 'session' | 'planning') {
  return context === 'session' ? SESSION_NOVICE_STEPS : PLANNING_NOVICE_STEPS
}

export function getInitialCoachToolMode(): CoachToolMode {
  if (typeof window === 'undefined') return 'novice'

  try {
    return window.localStorage.getItem(COACH_TOOL_MODE_STORAGE_KEY) === 'expert'
      ? 'expert'
      : 'novice'
  } catch {
    return 'novice'
  }
}

export function getNextCoachToolMode(mode: CoachToolMode): CoachToolMode {
  return mode === 'novice' ? 'expert' : 'novice'
}
