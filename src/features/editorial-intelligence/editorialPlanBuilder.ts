import type { DocumentFamily, DocumentIntent, ProductionLevel } from './documentIntentEngine'

export type EditorialPlan = {
  title: string
  family: DocumentFamily
  category: string
  audience: string
  format: string
  productionLevel: ProductionLevel
  chapters: {
    id: string
    title: string
    intent: string
    expectedBlocks: string[]
    requiredTables: number
    requiredSituations: number
    requiredDiagrams: number
    priority: 'essential' | 'important' | 'optional'
  }[]
  globalTargets: {
    tables: number
    situations: number
    diagrams: number
    bcvbBlocks: number
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildEditorialPlan(intent: DocumentIntent): EditorialPlan {
  const sections = intent.requiredBlocks
  const chapterCount = Math.max(1, sections.length)

  return {
    title: intent.requestedTitle,
    family: intent.recommendedFamily,
    category: intent.category,
    audience: intent.audience,
    format: intent.expectedFormat,
    productionLevel: intent.productionLevel,
    chapters: sections.map((section, index) => {
      const isSituationSection = /situation|terrain|diagramme|schéma/i.test(section)
      const isTableSection = /progression|planification|outil|évaluation|critère|objectif|tableau/i.test(section)

      return {
        id: `${String(index + 1).padStart(2, '0')}-${slugify(section)}`,
        title: section,
        intent: `Construire la partie "${section}" avec un niveau ${intent.expectedDepth} et un usage terrain clair.`,
        expectedBlocks: [
          index === 0 ? 'bcvb-hero' : 'bcvb-section',
          isTableSection ? 'bcvb-table' : '',
          isSituationSection ? 'bcvb-situation' : '',
          isSituationSection ? 'bcvb-diagram' : '',
        ].filter(Boolean),
        requiredTables: isTableSection ? Math.max(1, Math.ceil(intent.minimumTargets.tables / chapterCount)) : 0,
        requiredSituations: isSituationSection ? Math.max(1, Math.ceil(intent.minimumTargets.situations / 2)) : 0,
        requiredDiagrams: isSituationSection ? Math.max(1, Math.ceil(intent.minimumTargets.diagrams / 2)) : 0,
        priority: index < 5 ? 'essential' : index < 10 ? 'important' : 'optional',
      }
    }),
    globalTargets: intent.minimumTargets,
  }
}
