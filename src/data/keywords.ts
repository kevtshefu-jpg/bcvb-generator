export const SECTION_ALIASES: Record<string, string[]> = {
  title: ['titre', 'nom', 'situation'],
  category: ['catégorie', 'categorie', 'niveau'],
  durationMin: ['durée', 'duree', 'temps'],
  theme: ['thème', 'theme', 'objectif principal'],
  step: ['étape', 'etape', 'découverte'],
  philosophy: ['philosophie', 'principes'],
  axes: ['axe', 'axes', 'dimensions'],
  objective: ['objectif', 'but'],
  intentions: ['intention', 'intentions', 'focus'],
  organization: ['organisation', 'organization', 'dispositif'],
  equipment: ['matériel', 'materiel', 'équipement', 'equipement'],
  setup: ['dispositif', 'mise en place', 'mise-en-place'],
  instructions: ['consigne', 'consignes', 'instruction'],
  variables: ['variable', 'variables', 'progression'],
  successCriteria: ['critère de réussite', 'criteres de reussite', 'critère', 'critere', 'réussite', 'reussite']
}

export const AXES = ['intensité', 'agressivité', 'maîtrise', 'jeu']

export const STEP_KEYWORDS: SessionStep[] = [
  'je découvre',
  'je m\'exerce',
  'je retranscris',
  'je régule'
]

export const EQUIPMENT_KEYWORDS = [
  'ballon', 'cônes', 'cones', 'panier', 'plot', 'mannequin',
  'dossard', 'chasubles', 'ceinture', 'portique', 'cerceaux',
  'marques', 'plots', 'filet', 'raquette', 'espalier'
]

export const ORGANIZATION_KEYWORDS = [
  'groupe', 'groupes', 'poste', 'postes', 'station', 'stations',
  'file', 'files', 'cercle', 'cercles', 'ligne', 'lignes',
  'par deux', 'en duo', 'seul', 'seule'
]

export const ACTION_KEYWORDS: Record<string, string[]> = {
  pass: ['passe', 'passes', 'transmission', 'transmettre'],
  dribble: ['dribble', 'dribbled', 'conduite', 'conduire'],
  cut: ['cut', 'coupure', 'arret', 'arrêt'],
  shot: ['tir', 'tirs', 'shoot', 'panier'],
  move: ['mouvement', 'mouvements', 'deplacement', 'déplacement', 'course']
}

export const DURATION_PATTERN = /(\d+)\s*(?:mn|min|minutes?)/i

export type SessionStep = 'je découvre' | 'je m\'exerce' | 'je retranscris' | 'je régule'
