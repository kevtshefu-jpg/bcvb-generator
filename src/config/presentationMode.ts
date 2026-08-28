// Activation volontaire uniquement. Une variable absente, vide ou différente de
// "true" conserve toujours le comportement normal et sécurisé de l'application.
export const PRESENTATION_MODE = import.meta.env.VITE_ENABLE_PRESENTATION_MODE === 'true'

export const PRESENTATION_LABELS = {
  appTitle: 'BCVB Référentiel',
  appSubtitle: 'Plateforme technique, pédagogique et documentaire du club',
  studioTitle: 'Studio éditorial documentaire',
  studioSubtitle: 'Créer, transformer, contrôler et publier des documents BCVB structurés.',
  demoWarning: 'Mode présentation — certaines fonctions avancées sont en cours de consolidation.',
}
