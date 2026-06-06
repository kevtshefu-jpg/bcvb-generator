import { EDITORIAL_STANDARDS } from './editorialStandards'

export type DocumentFamily =
  | 'cahier_technique'
  | 'guide_coach'
  | 'plan_formation'
  | 'ruban_pedagogique'
  | 'seance_entrainement'
  | 'fiche_theme'

export type ProductionLevel =
  | 'brouillon'
  | 'standard_club'
  | 'reference_bcvb'
  | 'publication_club'
  | 'edition_premium'

export type DocumentIntent = {
  requestedTitle: string
  detectedFamily: DocumentFamily
  recommendedFamily: DocumentFamily
  category: string
  audience: string
  productionLevel: ProductionLevel
  expectedFormat: 'a4_portrait' | 'a4_landscape' | 'poster' | 'one_page' | 'web_premium'
  expectedDepth: 'short' | 'standard' | 'reference' | 'publication'
  layoutStrategy: string
  requiredBlocks: string[]
  minimumTargets: {
    tables: number
    situations: number
    diagrams: number
    bcvbBlocks: number
  }
  risks: string[]
  recommendations: string[]
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function detectFamily(title: string, sourceText = ''): DocumentFamily {
  const haystack = normalize(`${title} ${sourceText.slice(0, 1200)}`)

  if (/cahier technique/.test(haystack)) return 'cahier_technique'
  if (/guide complet du coach|guide coach|guide du coach/.test(haystack)) return 'guide_coach'
  if (/plan de formation|projet de formation/.test(haystack)) return 'plan_formation'
  if (/ruban pedagogique|ruban/.test(haystack)) return 'ruban_pedagogique'
  if (/seance|entrainement|training/.test(haystack)) return 'seance_entrainement'
  if (/theme|fiche|principe/.test(haystack)) return 'fiche_theme'

  return 'guide_coach'
}

function getExpectedFormat(family: DocumentFamily): DocumentIntent['expectedFormat'] {
  if (family === 'ruban_pedagogique') return 'a4_landscape'
  if (family === 'seance_entrainement') return 'one_page'
  return 'a4_portrait'
}

function getExpectedDepth(productionLevel: ProductionLevel): DocumentIntent['expectedDepth'] {
  if (productionLevel === 'edition_premium' || productionLevel === 'publication_club') return 'publication'
  if (productionLevel === 'reference_bcvb') return 'reference'
  if (productionLevel === 'brouillon') return 'short'
  return 'standard'
}

export function analyzeDocumentIntent(params: {
  title: string
  selectedFamily?: DocumentFamily
  category?: string
  audience?: string
  productionLevel?: ProductionLevel
  sourceText?: string
}): DocumentIntent {
  const detectedFamily = detectFamily(params.title, params.sourceText)
  const recommendedFamily = detectedFamily
  const selectedFamily = params.selectedFamily ?? detectedFamily
  const standard = EDITORIAL_STANDARDS[recommendedFamily]
  const risks: string[] = []

  if (selectedFamily !== recommendedFamily) {
    risks.push(`La famille sélectionnée (${selectedFamily}) semble moins cohérente que ${recommendedFamily}.`)
  }

  if (!params.title.trim()) risks.push('Titre absent : impossible de cadrer précisément le document.')
  if ((params.sourceText?.length ?? 0) > 0 && (params.sourceText?.length ?? 0) < 800) {
    risks.push('Source courte : risque de document sous-dimensionné.')
  }

  return {
    requestedTitle: params.title,
    detectedFamily,
    recommendedFamily,
    category: params.category || 'Général BCVB',
    audience: params.audience || 'Coachs',
    productionLevel: params.productionLevel || 'publication_club',
    expectedFormat: getExpectedFormat(recommendedFamily),
    expectedDepth: getExpectedDepth(params.productionLevel || 'publication_club'),
    layoutStrategy: standard.layout,
    requiredBlocks: [...standard.requiredSections],
    minimumTargets: standard.minimumTargets,
    risks,
    recommendations: [
      `Appliquer le standard ${standard.label}.`,
      standard.purpose,
      ...standard.qualityRules,
    ],
  }
}
