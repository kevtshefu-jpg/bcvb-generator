export type DocumentFamilyId =
  | 'technical-book'
  | 'coach-guide'
  | 'training-plan'
  | 'pedagogical-ribbon'
  | 'practice-session'
  | 'theme-sheet'

export type DocumentStandard = {
  id: DocumentFamilyId
  label: string
  format: string
  volume: string
  publicTarget: string
  layout: string
  typography: string
  firstPage: string
  palette: string
  graphicElements: string
  nonNegotiables: string[]
  mandatoryBlocks: string[]
  qualityCriteria: string[]
  promptIntention: string
  cssClass: string
  pdfOrientation: 'portrait' | 'landscape'
  minTables: number
  minSituations: number
  minDiagrams: number
}

export const DOCUMENT_FAMILY_STANDARDS: Record<DocumentFamilyId, DocumentStandard> = {
  'technical-book': {
    id: 'technical-book',
    label: 'Cahier technique',
    format: 'A4 portrait',
    volume: '20 à 60 pages',
    publicTarget: 'Coachs, responsables techniques',
    layout: 'Double colonne texte / schéma pour les situations pédagogiques',
    typography: 'Titres massifs, situations numérotées, fiches terrain denses',
    firstPage: 'Couverture premium avec catégorie, saison, public et identité BCVB',
    palette: 'Rouge BCVB, noir, blanc, gris clair',
    graphicElements: 'Terrains visibles, tableaux techniques, pictogrammes coach',
    nonNegotiables: [
      'Terrain intégré dans chaque situation pédagogique',
      'Exercices autonomes numérotés',
      'Schéma terrain lisible et associé à chaque fiche',
    ],
    mandatoryBlocks: [
      'couverture',
      'identité catégorie',
      'principes de jeu BCVB',
      'objectifs de formation',
      'planification annuelle',
      'progression par cycle',
      'situations pédagogiques numérotées',
      'critères de réussite',
      'points de vigilance',
      'synthèse coach',
    ],
    qualityCriteria: [
      'Planification et progression présentes',
      'Chaque situation possède un diagramme',
      'Tableaux techniques exploitables terrain',
      'Aucune donnée technique brute visible',
    ],
    promptIntention:
      'Produire un cahier technique de référence, utilisé comme base de formation interne et de préparation terrain.',
    cssClass: 'document-layout--technical-book',
    pdfOrientation: 'portrait',
    minTables: 12,
    minSituations: 6,
    minDiagrams: 6,
  },
  'coach-guide': {
    id: 'coach-guide',
    label: 'Guide du coach',
    format: 'A4 portrait',
    volume: '25 à 80 pages',
    publicTarget: 'Coachs, aides-coachs, responsable technique',
    layout: 'Lecture profonde avec espaces blancs assumés et encarts latéraux',
    typography: 'Hiérarchie éditoriale forte, principes mis en exergue',
    firstPage: 'Couverture éditoriale avec rôle du coach et catégorie',
    palette: 'Rouge BCVB, noir, blanc, filet orange sur les principes importants',
    graphicElements: 'Sidebars, encarts clés, tableaux coachables, schémas de situations',
    nonNegotiables: [
      'Sidebar avec encarts clés',
      'Filet orange gauche sur les principes importants',
      'Séance type et relation familles clairement visibles',
    ],
    mandatoryBlocks: [
      'couverture',
      'finalité de catégorie',
      'rôle du coach',
      'posture attendue',
      'principes pédagogiques',
      'organisation annuelle',
      'séance type',
      'relation familles',
      'outils d’évaluation',
      'passerelle catégorie suivante',
      'annexes pratiques',
    ],
    qualityCriteria: [
      'Posture coach explicite',
      'Relation familles traitée',
      'Séance type et outils d’évaluation présents',
      'Encarts clés et respirations éditoriales',
    ],
    promptIntention:
      'Produire un guide de terrain complet, lisible en profondeur et directement utile au coach.',
    cssClass: 'document-layout--coach-guide',
    pdfOrientation: 'portrait',
    minTables: 6,
    minSituations: 6,
    minDiagrams: 6,
  },
  'training-plan': {
    id: 'training-plan',
    label: 'Plan de formation',
    format: 'A4 portrait',
    volume: '30 à 80 pages',
    publicTarget: 'Dirigeants, DTR, coachs référents',
    layout: 'Rapport institutionnel premium avec transitions pleine couleur',
    typography: 'Titres institutionnels, grands chiffres, matrices et tableaux de bord',
    firstPage: 'Page institutionnelle avec éditorial président / DTR',
    palette: 'Navy, orange, vert, fond clair',
    graphicElements: 'Timelines, matrices compétences, tableaux de bord, organigrammes',
    nonNegotiables: [
      'Pages de transition pleine couleur entre grands chapitres',
      'Parcours joueur U7 à senior',
      'Indicateurs de suivi lisibles',
    ],
    mandatoryBlocks: [
      'éditorial président / DTR',
      'philosophie et valeurs BCVB',
      'parcours joueur U7 à senior',
      'objectifs par catégorie',
      'indicateurs de suivi',
      'matrice compétences par âge',
      'calendrier de mise en œuvre',
      'organigramme staff',
      'tableaux de bord',
      'conclusion institutionnelle',
    ],
    qualityCriteria: [
      'Matrice compétences présente',
      'Timeline pluriannuelle ou calendrier de mise en œuvre',
      'Indicateurs et tableaux de bord',
      'Ton institutionnel stable',
    ],
    promptIntention:
      'Produire un document cadre premium qui structure la politique de formation du club.',
    cssClass: 'document-layout--training-plan',
    pdfOrientation: 'portrait',
    minTables: 10,
    minSituations: 0,
    minDiagrams: 0,
  },
  'pedagogical-ribbon': {
    id: 'pedagogical-ribbon',
    label: 'Ruban pédagogique',
    format: 'Paysage obligatoire',
    volume: 'Synthèse 1 à 6 pages',
    publicTarget: 'Coachs, formateurs, responsables techniques',
    layout: 'Lecture horizontale par temps et verticale par thèmes',
    typography: 'Typographie compacte 9–10 px acceptée',
    firstPage: 'Timeline horizontale directement visible',
    palette: 'Rouge BCVB, noir, blanc, gris très clair',
    graphicElements: 'Timeline horizontale, colonnes compactes, repères de charge',
    nonNegotiables: [
      'Timeline horizontale',
      'Format paysage',
      'Lecture par période et thème',
    ],
    mandatoryBlocks: [
      'période',
      'thème',
      'objectifs',
      'contenus',
      'situations',
      'critères de réussite',
      'régulations',
      'charge / complexité',
      'transfert match',
    ],
    qualityCriteria: [
      'Lecture horizontale claire',
      'Critères et régulations présents',
      'Compacité maîtrisée',
    ],
    promptIntention:
      'Produire une synthèse de progression compacte, utilisable pour piloter une saison ou un cycle.',
    cssClass: 'document-layout--pedagogical-ribbon',
    pdfOrientation: 'landscape',
    minTables: 3,
    minSituations: 3,
    minDiagrams: 0,
  },
  'practice-session': {
    id: 'practice-session',
    label: 'Séance d’entraînement',
    format: '1 page prioritaire',
    volume: '1 à 2 pages',
    publicTarget: 'Coach terrain',
    layout: 'Lecture en 30 secondes avec terrain visible immédiatement',
    typography: 'Titres courts, consignes directes, blocs très opérationnels',
    firstPage: 'Objectifs, durée, matériel et terrain visibles au premier regard',
    palette: 'Rouge BCVB, noir, blanc, gris clair',
    graphicElements: 'Terrain large, déroulé chronologique, bilan rapide',
    nonNegotiables: [
      'Terrain visible immédiatement',
      'Déroulé chronologique obligatoire',
      'Document utilisable au gymnase',
    ],
    mandatoryBlocks: [
      'thème',
      'objectifs',
      'durée',
      'matériel',
      'déroulé chronologique',
      'situation principale',
      'schéma terrain',
      'consignes joueurs',
      'points coach',
      'critères de réussite',
      'variantes',
      'bilan rapide',
    ],
    qualityCriteria: [
      'Objectifs visibles en haut',
      'Terrain présent',
      'Déroulé temps / bloc / consignes',
      'Longs paragraphes évités',
    ],
    promptIntention:
      'Produire une fiche séance courte, immédiatement exploitable sur le terrain.',
    cssClass: 'document-layout--practice-session',
    pdfOrientation: 'portrait',
    minTables: 2,
    minSituations: 1,
    minDiagrams: 1,
  },
  'theme-sheet': {
    id: 'theme-sheet',
    label: 'Fiche à thème',
    format: 'A4 portrait ou recto-verso',
    volume: '1 à 4 pages',
    publicTarget: 'Coachs',
    layout: 'Flexible, bannière colorée selon thème',
    typography: 'Blocs courts, repères visuels, forte lisibilité',
    firstPage: 'Bannière thématique et définition immédiatement visibles',
    palette:
      'Tactique navy, technique rouge BCVB, physique vert, mental orange, arbitrage violet, organisation gris/noir',
    graphicElements: 'Bannière thématique, encadrés repères, situations courtes',
    nonNegotiables: ['Bannière colorée selon thème', 'Transfert match explicite'],
    mandatoryBlocks: [
      'définition',
      'pourquoi c’est important',
      'repères coach',
      'erreurs fréquentes',
      'situations d’apprentissage',
      'variantes',
      'critères d’évaluation',
      'transfert match',
    ],
    qualityCriteria: [
      'Définition claire',
      'Erreurs fréquentes et critères',
      'Au moins une situation d’apprentissage',
      'Transfert match présent',
    ],
    promptIntention:
      'Produire une fiche opérationnelle centrée sur un thème, claire et réutilisable.',
    cssClass: 'document-layout--theme-sheet',
    pdfOrientation: 'portrait',
    minTables: 2,
    minSituations: 1,
    minDiagrams: 1,
  },
}

export function getDocumentStandard(family: DocumentFamilyId): DocumentStandard {
  return DOCUMENT_FAMILY_STANDARDS[family]
}

export function resolveDocumentFamilyId(value?: string | null): DocumentFamilyId {
  const normalized = (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (/category-technical-handbook|cahier technique|technical-book/.test(normalized)) {
    return 'technical-book'
  }
  if (/category-coach-guide|general-coach-guide|guide coach|guide du coach|coach-guide/.test(normalized)) {
    return 'coach-guide'
  }
  if (/training-plan|plan de formation|support de formation|document cadre|club-framework/.test(normalized)) {
    return 'training-plan'
  }
  if (/pedagogical-ribbon|ruban pedagogique/.test(normalized)) {
    return 'pedagogical-ribbon'
  }
  if (/full-session|seance|entrainement|practice-session/.test(normalized)) {
    return 'practice-session'
  }
  if (/theme-sheet|fiche theme|fiche a theme|situation pedagogique|newsletter|communication/.test(normalized)) {
    return 'theme-sheet'
  }

  return 'coach-guide'
}
