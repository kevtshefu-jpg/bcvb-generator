export const AI_PROVIDER_PROFILES = {
  chatgpt: {
    label: 'Cadre rédactionnel',
    strengths: [
      'structuration stricte',
      'respect des blocs',
      'génération de contenus détaillés',
      'normalisation',
    ],
    promptStyle: 'direct_structured',
    bestFor: [
      'documents longs',
      'documents avec tableaux',
      'documents avec blocs typés',
      'normalisation BCVB',
    ],
  },
  claude: {
    label: 'Cadre approfondi',
    strengths: [
      'réécriture longue',
      'style naturel',
      'cohérence éditoriale',
      'lecture de documents longs',
    ],
    promptStyle: 'editorial_narrative',
    bestFor: [
      'enrichissement rédactionnel',
      'transformation de sources longues',
      'amélioration du style humain',
      'clarification pédagogique',
    ],
  },
} as const

export type EditorialAiProvider = keyof typeof AI_PROVIDER_PROFILES
