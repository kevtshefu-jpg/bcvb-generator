export type QualityIssue = {
  id: string
  label: string
  severity: 'critical' | 'major' | 'minor'
  message: string
  correctionInstruction: string
}

export type QualityReport = {
  score: number
  targetScore: number
  family: string
  category: string
  tables: number
  situations: number
  diagrams: number
  bcvbBlocks: number
  rawTables: number
  isolatedClosures: number
  missingSections: string[]
  issues: QualityIssue[]
}

export type EditorialStandard = {
  family: string
  minScore: number
  minTables: number
  minSituations: number
  minDiagrams: number
  requiredSections: string[]
  layoutRule: string
  editorialRule: string
}

export const EDITORIAL_STANDARDS: Record<string, EditorialStandard> = {
  cahier_technique: {
    family: 'Cahier technique',
    minScore: 96,
    minTables: 12,
    minSituations: 12,
    minDiagrams: 12,
    requiredSections: [
      'Couverture',
      'Identité BCVB',
      'Finalité de catégorie',
      'Profil du joueur',
      'Objectifs de formation',
      'Planification annuelle',
      'Progression opérationnelle',
      'Situations pédagogiques',
      'Schémas terrain',
      'Critères de réussite',
      'Outils d’évaluation',
      'Passerelle catégorie suivante',
      'Annexes pratiques'
    ],
    layoutRule:
      'Double colonne texte/schéma obligatoire pour les situations. Exercices autonomes, numérotés, directement utilisables sur le terrain.',
    editorialRule:
      'Document durable de référence, dense, structuré, avec une logique de cahier technique club.'
  },

  guide_coach: {
    family: 'Guide du coach',
    minScore: 95,
    minTables: 8,
    minSituations: 8,
    minDiagrams: 8,
    requiredSections: [
      'Couverture',
      'Rôle du coach',
      'Posture attendue',
      'Principes pédagogiques',
      'Organisation annuelle',
      'Séance type',
      'Situations pédagogiques',
      'Relation familles',
      'Outils d’évaluation',
      'Synthèse coach'
    ],
    layoutRule:
      'Lecture profonde, espace blanc assumé, sidebar avec encarts clés, filet orange ou rouge gauche sur les principes importants.',
    editorialRule:
      'Document de formation coach lisible, humain, exigeant et opérationnel.'
  },

  plan_formation: {
    family: 'Plan de formation',
    minScore: 97,
    minTables: 14,
    minSituations: 6,
    minDiagrams: 8,
    requiredSections: [
      'Édito',
      'Philosophie BCVB',
      'Parcours joueur',
      'Objectifs par catégorie',
      'Timeline pluriannuelle',
      'Matrice compétences',
      'Indicateurs de suivi',
      'Calendrier de mise en œuvre',
      'Outils de pilotage'
    ],
    layoutRule:
      'Document institutionnel, pages de transition pleine couleur, tableaux de bord, diagrammes de progression.',
    editorialRule:
      'Niveau rapport annuel de club professionnel.'
  },

  ruban_pedagogique: {
    family: 'Ruban pédagogique',
    minScore: 94,
    minTables: 10,
    minSituations: 8,
    minDiagrams: 4,
    requiredSections: [
      'Objectif général',
      'Progression temporelle',
      'Séances',
      'Objectifs par cycle',
      'Contenus terrain',
      'Critères d’évaluation',
      'Régulations'
    ],
    layoutRule:
      'Format paysage obligatoire, lecture horizontale par le temps et verticale par les thèmes.',
    editorialRule:
      'Document compact de synthèse, lisible en réunion technique.'
  },

  seance: {
    family: 'Séance d’entraînement',
    minScore: 93,
    minTables: 3,
    minSituations: 3,
    minDiagrams: 3,
    requiredSections: [
      'Objectif de séance',
      'Matériel',
      'Déroulé minute par minute',
      'Situations',
      'Schémas terrain',
      'Critères de réussite',
      'Régulations coach',
      'Bilan rapide'
    ],
    layoutRule:
      'Une page ou deux maximum, lecture en 30 secondes, terrain visible immédiatement.',
    editorialRule:
      'Document terrain utilisable avec les mains dans les filets.'
  },

  fiche_theme: {
    family: 'Fiche à thème',
    minScore: 94,
    minTables: 5,
    minSituations: 4,
    minDiagrams: 4,
    requiredSections: [
      'Définition du thème',
      'Pourquoi le travailler',
      'Repères coach',
      'Situations pédagogiques',
      'Erreurs fréquentes',
      'Critères de réussite',
      'Transfert match'
    ],
    layoutRule:
      'Bannière colorée selon le thème : tactique, physique, mental, technique ou collectif.',
    editorialRule:
      'Format flexible, clair, exploitable rapidement.'
  }
}

export function getEditorialStandard(familyKey: string): EditorialStandard {
  return EDITORIAL_STANDARDS[familyKey] || EDITORIAL_STANDARDS.guide_coach
}

export function getNextTargetScore(currentScore: number, familyTarget: number) {
  if (currentScore < 70) return Math.min(85, familyTarget)
  if (currentScore < 85) return Math.min(92, familyTarget)
  if (currentScore < familyTarget) return familyTarget
  return Math.min(100, currentScore + 1)
}

export function buildQualityReport(params: {
  familyKey: string
  category: string
  score: number
  tables: number
  situations: number
  diagrams: number
  bcvbBlocks: number
  rawTables: number
  isolatedClosures: number
  detectedSections: string[]
}): QualityReport {
  const standard = getEditorialStandard(params.familyKey)
  const targetScore = getNextTargetScore(params.score, standard.minScore)

  const missingSections = standard.requiredSections.filter(
    section => !params.detectedSections.some(s => normalizeText(s).includes(normalizeText(section)))
  )

  const issues: QualityIssue[] = []

  if (params.score < standard.minScore) {
    issues.push({
      id: 'score_gap',
      label: 'Score insuffisant',
      severity: params.score < 85 ? 'critical' : 'major',
      message: `Score ${params.score}/100, prochain objectif ${targetScore}/100.`,
      correctionInstruction:
        'Reconstruire le document en mode publication club, pas en correction légère. Viser directement le score cible.'
    })
  }

  if (params.tables < standard.minTables) {
    issues.push({
      id: 'tables_missing',
      label: 'Tableaux insuffisants',
      severity: 'major',
      message: `${params.tables} tableaux détectés, minimum attendu ${standard.minTables}.`,
      correctionInstruction:
        'Ajouter des tableaux éditoriaux structurés : objectifs, progression, critères, erreurs, régulations, planning et synthèse.'
    })
  }

  if (params.situations < standard.minSituations) {
    issues.push({
      id: 'situations_missing',
      label: 'Situations pédagogiques insuffisantes',
      severity: 'critical',
      message: `${params.situations} situations détectées, minimum attendu ${standard.minSituations}.`,
      correctionInstruction:
        'Ajouter des situations pédagogiques complètes, numérotées, avec objectif, organisation, matériel, déroulement, consignes, variables, critères et transfert match.'
    })
  }

  if (params.diagrams < standard.minDiagrams) {
    issues.push({
      id: 'diagrams_missing',
      label: 'Schémas terrain insuffisants',
      severity: 'critical',
      message: `${params.diagrams} schémas détectés, minimum attendu ${standard.minDiagrams}.`,
      correctionInstruction:
        'Créer un schéma terrain pour chaque situation. Chaque diagramme doit contenir players, ball, arrows, zones et notes.'
    })
  }

  if (params.rawTables > 0) {
    issues.push({
      id: 'raw_tables',
      label: 'Tableaux bruts',
      severity: 'major',
      message: `${params.rawTables} tableaux ou lignes avec séparateurs bruts détectés.`,
      correctionInstruction:
        'Convertir tous les tableaux bruts en vrais blocs bcvb-table avec colonnes propres et données lisibles.'
    })
  }

  if (missingSections.length > 0) {
    issues.push({
      id: 'missing_sections',
      label: 'Sections obligatoires manquantes',
      severity: 'major',
      message: `${missingSections.length} sections obligatoires manquantes.`,
      correctionInstruction:
        `Ajouter les sections suivantes : ${missingSections.join(', ')}.`
    })
  }

  if (params.isolatedClosures > 0) {
    issues.push({
      id: 'isolated_closures',
      label: 'Syntaxe de blocs instable',
      severity: 'major',
      message: `${params.isolatedClosures} fermetures isolées détectées.`,
      correctionInstruction:
        'Nettoyer toutes les fermetures isolées ::: et reconstruire les blocs en syntaxe BCVB Rich Markdown stricte.'
    })
  }

  return {
    score: params.score,
    targetScore,
    family: standard.family,
    category: params.category,
    tables: params.tables,
    situations: params.situations,
    diagrams: params.diagrams,
    bcvbBlocks: params.bcvbBlocks,
    rawTables: params.rawTables,
    isolatedClosures: params.isolatedClosures,
    missingSections,
    issues
  }
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
