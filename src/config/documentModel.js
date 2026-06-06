export const documentModel = {
  id: '',
  title: '',
  description: '',
  summary: '',
  content: '',

  family: '',
  category: '',
  subCategory: '',
  theme: '',
  sportCategory: '',
  audience: [],

  season: '',
  status: 'draft',
  publicationLevel: 'internal',
  qualityScore: 0,

  tags: [],

  sourcePath: '',
  pdfPath: '',
  downloadUrl: '',
  sourceDownloadUrl: '',

  visibility: 'club',
  allowedRoles: [],

  ownerId: '',
  teamId: null,

  sourceDocumentId: null,
  parentDocumentId: null,
  createdFromDocumentId: null,

  version: 1,
  isLatestVersion: true,

  isArchived: false,
  archivedAt: null,
  archivedBy: null,

  isDeleted: false,
  deletedAt: null,
  deletedBy: null,
  deleteReason: '',

  createdAt: '',
  updatedAt: '',
}

export const DOCUMENT_FAMILIES = [
  'Cahier technique',
  'Guide du coach',
  'Plan de formation',
  'Ruban pédagogique',
  'Séance d’entraînement',
  'Fiche à thème',
  'Document administratif',
  'Communication club',
  'Document parents',
  'Document dirigeants',
  'Arbitrage / OTM',
  'Évaluation joueur',
  'Planification sportive',
]

export const DOCUMENT_MAIN_CATEGORIES = [
  'Général BCVB',
  'Formation joueur',
  'Formation coach',
  'Organisation sportive',
  'Gestion d’équipe',
  'Communication familles',
  'Administration club',
  'Arbitrage / OTM',
  'Événements / tournois',
  'Préparation physique',
  'Préparation mentale',
  'Technique individuelle',
  'Tactique collective',
]

export const DOCUMENT_SUB_CATEGORIES = [
  'U7',
  'U9',
  'U11',
  'U13',
  'U15',
  'U18',
  'U21',
  'Seniors',
  'Féminines',
  'Masculins',
  'Section sportive',
  'Parents référents',
  'Dirigeants',
  'Jeunes coachs',
  'BPJEPS / formation interne',
]

export const DOCUMENT_THEMES = [
  'Défense Homme à Homme',
  'Défendre Fort',
  'Courir',
  'Partager la Balle',
  '1 contre 1',
  'Tir',
  'Passe',
  'Dribble',
  'Appuis',
  'Lecture de jeu',
  'Transition offensive',
  'Repli défensif',
  'Communication coach',
  'Gestion parents',
  'Plateaux',
  'Évaluations',
  'Présences / absences',
  'Planification annuelle',
  'Préparation match',
  'Arbitrage',
  'Table de marque',
  'Tournois / stages',
]

export const SPORT_CATEGORIES = [
  'U7',
  'U9',
  'U11',
  'U13',
  'U15',
  'U18',
  'U21',
  'Seniors',
  'Toutes catégories',
]

export const PUBLICATION_LEVELS = [
  'internal',
  'club',
  'publication club',
  'référence BCVB',
  'archive',
]
