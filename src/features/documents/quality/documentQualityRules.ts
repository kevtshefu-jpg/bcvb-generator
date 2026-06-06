import type { DocumentFamilyId } from '../standards/documentFamilyStandards'

export type DocumentQualityFamilyRule = {
  family: DocumentFamilyId
  minimumPublicationScore: number
  requiredElements: string[]
  minimumTables: number
  minimumSituations: number
  minimumDiagrams: number
  penalties: string[]
  bonuses: string[]
}

export const DOCUMENT_QUALITY_RULES: Record<DocumentFamilyId, DocumentQualityFamilyRule> = {
  'technical-book': {
    family: 'technical-book',
    minimumPublicationScore: 85,
    requiredElements: [
      'planification',
      'progression',
      'situations',
      'critères de réussite',
      'points de vigilance',
      'synthèse coach',
    ],
    minimumTables: 12,
    minimumSituations: 6,
    minimumDiagrams: 6,
    penalties: [
      'Moins d’un diagramme par situation',
      'Planification absente',
      'Progression absente',
      'Tableaux bruts visibles',
    ],
    bonuses: ['Double colonne situation / schéma', 'Tous les exercices numérotés'],
  },
  'coach-guide': {
    family: 'coach-guide',
    minimumPublicationScore: 85,
    requiredElements: [
      'rôle du coach',
      'posture coach',
      'principes pédagogiques',
      'séance type',
      'relation familles',
      'outils d’évaluation',
      'passerelle catégorie suivante',
    ],
    minimumTables: 6,
    minimumSituations: 6,
    minimumDiagrams: 6,
    penalties: [
      'Relation familles absente',
      'Posture coach absente',
      'Séance type absente',
      'Encarts clés absents',
    ],
    bonuses: ['Sidebars pédagogiques', 'Filet orange sur principes clés'],
  },
  'training-plan': {
    family: 'training-plan',
    minimumPublicationScore: 88,
    requiredElements: [
      'philosophie',
      'parcours joueur',
      'matrice compétences',
      'indicateurs',
      'calendrier',
      'organigramme',
    ],
    minimumTables: 10,
    minimumSituations: 0,
    minimumDiagrams: 0,
    penalties: [
      'Matrice compétences absente',
      'Timeline pluriannuelle absente',
      'Indicateurs de suivi absents',
    ],
    bonuses: ['Pages de transition', 'Tableaux de bord institutionnels'],
  },
  'pedagogical-ribbon': {
    family: 'pedagogical-ribbon',
    minimumPublicationScore: 82,
    requiredElements: [
      'période',
      'thème',
      'objectifs',
      'contenus',
      'situations',
      'régulations',
      'transfert match',
    ],
    minimumTables: 3,
    minimumSituations: 3,
    minimumDiagrams: 0,
    penalties: [
      'Timeline horizontale absente',
      'Lecture par période absente',
      'Format trop narratif',
    ],
    bonuses: ['Tableau horizontal compact', 'Charge / complexité visibles'],
  },
  'practice-session': {
    family: 'practice-session',
    minimumPublicationScore: 82,
    requiredElements: [
      'thème',
      'objectifs',
      'durée',
      'matériel',
      'déroulé',
      'schéma terrain',
      'critères de réussite',
      'bilan',
    ],
    minimumTables: 2,
    minimumSituations: 1,
    minimumDiagrams: 1,
    penalties: [
      'Terrain absent',
      'Déroulé chronologique absent',
      'Longs paragraphes incompatibles gymnase',
    ],
    bonuses: ['Lecture en 30 secondes', 'Bilan rapide intégré'],
  },
  'theme-sheet': {
    family: 'theme-sheet',
    minimumPublicationScore: 80,
    requiredElements: [
      'définition',
      'importance',
      'repères coach',
      'erreurs fréquentes',
      'situations',
      'critères',
      'transfert match',
    ],
    minimumTables: 2,
    minimumSituations: 1,
    minimumDiagrams: 1,
    penalties: [
      'Définition absente',
      'Transfert match absent',
      'Situations d’apprentissage absentes',
    ],
    bonuses: ['Bannière thématique', 'Repères visuels courts'],
  },
}

export function getDocumentQualityRules(family: DocumentFamilyId): DocumentQualityFamilyRule {
  return DOCUMENT_QUALITY_RULES[family]
}
