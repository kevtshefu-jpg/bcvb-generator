import {
  SITE_CATEGORIES,
  getVisibleSiteCategories,
  normalizeSiteRole,
  type SiteCategory,
  type SiteRole,
} from '../../../config/siteCategories.js'

export type StudioIntentId =
  | 'create'
  | 'import'
  | 'quality'
  | 'find'
  | 'coach'
  | 'pilot'
  | 'help'

export type StudioIntent = {
  id: StudioIntentId
  title: string
  question: string
  result: string
  categoryIds: string[]
  status: 'pret' | 'a_finaliser' | 'reserve_admin'
}

export type StudioProgressStep = {
  label: string
  detail: string
  state: 'done' | 'current' | 'next'
}

export type StudioExperience = {
  role: SiteRole
  headline: string
  subtitle: string
  intents: Array<StudioIntent & { categories: SiteCategory[] }>
  progress: StudioProgressStep[]
  priorities: Array<{
    label: string
    detail: string
    tone: 'red' | 'dark' | 'green' | 'blue'
  }>
}

const baseIntents: StudioIntent[] = [
  {
    id: 'create',
    title: 'Créer un document club',
    question: 'Je veux produire une ressource publiable.',
    result: 'Un document BCVB structuré, scoré, exportable et versionné.',
    categoryIds: ['editorial-studio', 'quality-exports', 'library'],
    status: 'reserve_admin',
  },
  {
    id: 'import',
    title: 'Importer une source',
    question: 'Je pars d’un PDF, scan, image, docx ou fichier brut.',
    result: 'Une source nettoyée puis transformable dans le Studio.',
    categoryIds: ['ocr-attachments', 'editorial-studio', 'quality-exports'],
    status: 'reserve_admin',
  },
  {
    id: 'quality',
    title: 'Corriger et exporter',
    question: 'Je veux savoir si le document est diffusable.',
    result: 'Score qualité, warnings, correction massive, PDF premium.',
    categoryIds: ['quality-exports', 'editorial-studio', 'library'],
    status: 'reserve_admin',
  },
  {
    id: 'find',
    title: 'Retrouver une ressource',
    question: 'Je cherche un document, un tutoriel ou une réponse.',
    result: 'Une ressource accessible selon mon rôle, ouvrable ou téléchargeable.',
    categoryIds: ['library', 'tutorials', 'faq'],
    status: 'pret',
  },
  {
    id: 'coach',
    title: 'Préparer le terrain',
    question: 'Je dois gérer séances, effectifs, présences ou évaluations.',
    result: 'Une action coach exploitable pour l’équipe et la saison.',
    categoryIds: ['sessions', 'planning', 'rosters', 'attendance', 'evaluations', 'teams-management'],
    status: 'pret',
  },
  {
    id: 'pilot',
    title: 'Piloter le club',
    question: 'Je veux une vue commission, équipes ou organisation.',
    result: 'Un espace de lecture et de suivi adapté aux dirigeants.',
    categoryIds: ['leaders', 'teams-management', 'library'],
    status: 'pret',
  },
  {
    id: 'help',
    title: 'Être guidé',
    question: 'Je ne sais pas où cliquer ou pourquoi un module bloque.',
    result: 'FAQ et tutoriels reliés aux erreurs, rôles et usages.',
    categoryIds: ['faq', 'tutorials'],
    status: 'pret',
  },
]

const roleCopy: Partial<Record<SiteRole, Pick<StudioExperience, 'headline' | 'subtitle'>>> = {
  admin: {
    headline: 'Studio documentaire BCVB',
    subtitle: 'Créer, transformer, contrôler, exporter et retrouver les documents club sans perdre la source.',
  },
  coach: {
    headline: 'Espace coach BCVB',
    subtitle: 'Préparer le terrain, suivre l’équipe et retrouver les ressources utiles à la saison.',
  },
  responsable_technique: {
    headline: 'Pilotage technique BCVB',
    subtitle: 'Suivre les équipes, soutenir les coachs et consulter les ressources structurantes.',
  },
  dirigeant: {
    headline: 'Espace dirigeants BCVB',
    subtitle: 'Consulter les documents cadres, suivre les équipes et préparer les décisions club.',
  },
  parent_referent: {
    headline: 'Espace parents référents',
    subtitle: 'Accéder aux informations logistiques, présences utiles, événements et aides d’organisation.',
  },
  team_staff: {
    headline: 'Espace équipe BCVB',
    subtitle: 'Retrouver les actions utiles à l’organisation quotidienne de l’équipe.',
  },
  parent: {
    headline: 'Espace famille BCVB',
    subtitle: 'Consulter les documents partagés et comprendre le fonctionnement du club.',
  },
  joueur: {
    headline: 'Espace joueur BCVB',
    subtitle: 'Retrouver les contenus utiles, la charte et les engagements club.',
  },
}

const progressByRole: Partial<Record<SiteRole, StudioProgressStep[]>> = {
  admin: [
    { label: 'Source', detail: 'Import, OCR ou saisie manuelle.', state: 'done' },
    { label: 'Transformation', detail: 'Document BCVB Rich Markdown.', state: 'current' },
    { label: 'Qualité', detail: 'Score, warnings et correction.', state: 'next' },
    { label: 'Export', detail: 'PDF et source versionnée.', state: 'next' },
  ],
  coach: [
    { label: 'Préparer', detail: 'Séance ou planification.', state: 'current' },
    { label: 'Suivre', detail: 'Présences et effectifs.', state: 'next' },
    { label: 'Évaluer', detail: 'Progression joueur.', state: 'next' },
    { label: 'Retrouver', detail: 'Bibliothèque et tutoriels.', state: 'next' },
  ],
  dirigeant: [
    { label: 'Lire', detail: 'Documents cadres.', state: 'current' },
    { label: 'Suivre', detail: 'Équipes et alertes.', state: 'next' },
    { label: 'Décider', detail: 'Indicateurs club.', state: 'next' },
    { label: 'Partager', detail: 'Ressources validées.', state: 'next' },
  ],
}

function fallbackProgress(): StudioProgressStep[] {
  return [
    { label: 'Comprendre', detail: 'Lire les ressources accessibles.', state: 'current' },
    { label: 'Retrouver', detail: 'Bibliothèque, tutoriels, FAQ.', state: 'next' },
    { label: 'Agir', detail: 'Suivre les actions autorisées.', state: 'next' },
    { label: 'Demander', detail: 'Solliciter un admin si besoin.', state: 'next' },
  ]
}

function buildPriorities(role: SiteRole): StudioExperience['priorities'] {
  if (role === 'admin') {
    return [
      { label: 'Qualité à surveiller', detail: 'Relire les documents non publiables avant export.', tone: 'red' },
      { label: 'Sources à préserver', detail: 'Chaque correction doit créer une version.', tone: 'dark' },
      { label: 'Publication prête', detail: 'Exporter seulement la zone document, sans UI.', tone: 'green' },
    ]
  }

  if (role === 'coach' || role === 'responsable_technique') {
    return [
      { label: 'Terrain', detail: 'Créer ou reprendre une séance exploitable.', tone: 'red' },
      { label: 'Effectifs', detail: 'Vérifier imports, doublons et affectations.', tone: 'blue' },
      { label: 'Suivi', detail: 'Compléter présences et évaluations.', tone: 'green' },
    ]
  }

  if (role === 'dirigeant') {
    return [
      { label: 'Commission', detail: 'Ouvrir l’espace dirigeants et les indicateurs.', tone: 'dark' },
      { label: 'Documents cadres', detail: 'Consulter les ressources validées.', tone: 'blue' },
      { label: 'Équipes', detail: 'Repérer les alertes sportives.', tone: 'red' },
    ]
  }

  return [
    { label: 'Accès utile', detail: 'La navigation affiche uniquement les rubriques autorisées.', tone: 'green' },
    { label: 'Aide', detail: 'FAQ et tutoriels expliquent les actions et les droits.', tone: 'blue' },
    { label: 'Ressources', detail: 'La bibliothèque centralise les documents disponibles.', tone: 'dark' },
  ]
}

export function buildStudioExperience(role?: string | null): StudioExperience {
  const normalizedRole = normalizeSiteRole(role)
  const visibleCategories = getVisibleSiteCategories(normalizedRole)
  const visibleById = new Map(visibleCategories.map((category) => [category.id, category]))
  const copy = roleCopy[normalizedRole] ?? {
    headline: 'Studio documentaire BCVB',
    subtitle: 'Choisir une action, comprendre le résultat attendu et avancer sans se perdre.',
  }

  const intents = baseIntents
    .map((intent) => ({
      ...intent,
      categories: intent.categoryIds
        .map((categoryId) => visibleById.get(categoryId))
        .filter((category): category is SiteCategory => Boolean(category)),
    }))
    .filter((intent) => intent.categories.length > 0)

  return {
    role: normalizedRole,
    headline: copy.headline,
    subtitle: copy.subtitle,
    intents,
    progress: progressByRole[normalizedRole] ?? fallbackProgress(),
    priorities: buildPriorities(normalizedRole),
  }
}

function cleanPath(path: string) {
  return path.split('?')[0].replace(/^\/+/, '').replace(/\/+$/, '')
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function pathMatchesModule(pathname: string, category: SiteCategory) {
  const current = cleanPath(pathname)
  const mainPath = cleanPath(category.path)

  if (!current && !mainPath) return true
  if (current === mainPath || current.startsWith(`${mainPath}/`)) return true

  return category.subModules.some((subModule) => {
    const dynamicPath = cleanPath(subModule).replace(/:\w+/g, '__PARAM__')
    const modulePath = escapeRegExp(dynamicPath).replace(/__PARAM__/g, '[^/]+')
    return new RegExp(`^${modulePath}(/|$)`).test(current)
  })
}

export function resolveStudioCategory(pathname: string, role?: string | null): SiteCategory | null {
  const normalizedRole = normalizeSiteRole(role)
  const visibleCategories = getVisibleSiteCategories(normalizedRole)
  const visibleMatch = visibleCategories.find((category) => pathMatchesModule(pathname, category))

  if (visibleMatch) return visibleMatch
  if (normalizedRole !== 'admin') return null

  return SITE_CATEGORIES.find((category) => pathMatchesModule(pathname, category)) ?? null
}
