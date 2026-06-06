export const EDITORIAL_STUDIO_STEPS = [
  { id: 'framing', label: 'Cadrage' },
  { id: 'sources', label: 'Sources' },
  { id: 'plan', label: 'Plan éditorial' },
  { id: 'production', label: 'Production IA' },
  { id: 'quality', label: 'Contrôle qualité' },
  { id: 'export', label: 'Export' },
]

export const EDITORIAL_STEP_STATUSES = [
  'non démarré',
  'en cours',
  'validé',
  'à corriger',
]

export const EDITORIAL_AI_MODES = [
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'claude', label: 'Claude' },
  { id: 'fusion', label: 'Fusion ChatGPT + Claude' },
  { id: 'massive-correction', label: 'Correction massive' },
  { id: 'publication-reconstruction', label: 'Reconstruction publication club' },
]

export const EDITORIAL_DOCUMENT_FAMILIES = [
  {
    id: 'technical-book',
    label: 'Cahier technique',
    requirements: [
      'double colonne texte / schéma non négociable',
      'situations autonomes numérotées',
      'terrain intégré à chaque situation',
      'minimum 18 situations pédagogiques',
      'minimum 18 schémas terrain associés',
    ],
  },
  {
    id: 'coach-guide',
    label: 'Guide coach',
    requirements: [
      'lecture profonde',
      'espaces blancs assumés',
      'sidebar avec encarts clés',
      'filet orange ou rouge gauche sur les principes importants',
      'minimum 18 situations et 18 schémas si guide complet',
    ],
  },
  {
    id: 'training-plan',
    label: 'Plan de formation',
    requirements: [
      'rendu institutionnel',
      'pages de transition pleine couleur',
      'graphiques de progression',
      'planification détaillée',
    ],
  },
  {
    id: 'pedagogical-ribbon',
    label: 'Ruban pédagogique',
    requirements: [
      'format paysage obligatoire',
      'lecture horizontale par temps',
      'lecture verticale par thèmes',
    ],
  },
  {
    id: 'practice-session',
    label: 'Séance d’entraînement',
    requirements: [
      'document opérationnel d’une page',
      '2 terrains entiers et 3 demi-terrains',
      'cases titre, temps, description, consignes, évolution, évaluation',
      'critères observables et quantifiables',
    ],
  },
  {
    id: 'theme-sheet',
    label: 'Fiche à thème',
    requirements: [
      'bannière colorée selon thème',
      'format flexible',
      'lecture très lisible',
    ],
  },
]

export const EDITORIAL_STUDIO_MODULES = [
  {
    id: 'creation',
    title: 'Création documentaire',
    forWhat: 'Générer des documents BCVB de qualité éditeur.',
    why: 'Disposer d’un référentiel club homogène et publiable.',
    forWhom: 'Admin, responsable technique.',
    how: 'Choisir famille, catégorie, niveau de production, sources, puis générer prompt ChatGPT / Claude.',
    evolution: 'Production multi-IA orchestrée.',
    howToEvolve: 'Créer pipeline cadrage → sources → plan → production → fusion → QA → export.',
    priority: 'Très haute',
    impact: 'Très fort',
    complexity: 'Élevée',
    status: 'En cours',
  },
  {
    id: 'transformation',
    title: 'Transformation BCVB',
    forWhat: 'Transformer un contenu brut en document BCVB structuré.',
    why: 'Valoriser les documents existants sans repartir de zéro.',
    forWhom: 'Admin.',
    how: 'Coller texte, importer PDF/image/docx, sélectionner standard et enrichissement.',
    evolution: 'Transformation par lot.',
    howToEvolve: 'Ajouter file queue, extraction OCR, scoring initial, reformattage automatique.',
    priority: 'Très haute',
    impact: 'Très fort',
    complexity: 'Élevée',
    status: 'À renforcer',
  },
  {
    id: 'prompts',
    title: 'Prompt ChatGPT / Claude',
    forWhat: 'Produire des prompts adaptés à chaque IA.',
    why: 'Obtenir un meilleur document sans multiplier les essais.',
    forWhom: 'Admin.',
    how: 'Boutons copier pour ChatGPT, copier pour Claude, fusionner réponses.',
    evolution: 'Prompt en plusieurs passes contrôlées.',
    howToEvolve: 'Générer prompts spécialisés : architecte, rédacteur, schémas, QA, fusion.',
    priority: 'Très haute',
    impact: 'Très fort',
    complexity: 'Moyenne',
    status: 'À renforcer',
  },
  {
    id: 'quality',
    title: 'Contrôle qualité',
    forWhat: 'Mesurer la conformité au standard BCVB.',
    why: 'Rendre la publication objective.',
    forWhom: 'Admin, dirigeants en consultation.',
    how: 'Score, écarts critiques, actions recommandées.',
    evolution: 'Score 100 avec correcteur massif.',
    howToEvolve: 'Passer d’un correcteur micro à une reconstruction éditoriale globale.',
    priority: 'Très haute',
    impact: 'Très fort',
    complexity: 'Élevée',
    status: 'À renforcer',
  },
  {
    id: 'export',
    title: 'Export',
    forWhat: 'Télécharger PDF, source Markdown, archive.',
    why: 'Rendre les documents exploitables hors plateforme.',
    forWhom: 'Admin, coachs selon droits.',
    how: 'Boutons visibles et jamais morts.',
    evolution: 'Export print pro avec variantes.',
    howToEvolve: 'Créer export HTML print, PDF serveur/client et fallback source.',
    priority: 'Haute',
    impact: 'Fort',
    complexity: 'Moyenne',
    status: 'À corriger',
  },
]
