import type {
	DocumentBlueprint,
	DocumentFamily,
	QuantitativeTargets,
} from './types';

const targets = (
	standard: QuantitativeTargets,
	premium: QuantitativeTargets,
	reference: QuantitativeTargets,
	publication: QuantitativeTargets,
) => ({
	standard,
	premium,
	'bcvb-reference': reference,
	'editorial-publication': publication,
});

export const DOCUMENT_BLUEPRINTS: Record<DocumentFamily, DocumentBlueprint> = {
	'category-technical-handbook': {
		id: 'category-technical-handbook',
		label: 'Cahier technique de catégorie',
		description:
			'Référentiel complet de formation pour une catégorie du BCVB.',
		defaultStrategy: 'multi-step-production',
		defaultDepth: 'bcvb-reference',
		requiredSections: [
			{ key: 'cover', label: 'Couverture éditoriale', description: '', required: true },
			{ key: 'toc', label: 'Sommaire détaillé', description: '', required: true },
			{ key: 'category-profile', label: 'Profil de la catégorie', description: '', required: true },
			{ key: 'bcvb-identity', label: 'Identité BCVB appliquée', description: '', required: true },
			{ key: 'annual-plan', label: 'Planification annuelle', description: '', required: true },
			{ key: 'session-model', label: 'Structure type de séance', description: '', required: true },
			{ key: 'situations', label: 'Banque de situations', description: '', required: true },
			{ key: 'diagrams', label: 'Schémas terrain', description: '', required: true },
			{ key: 'evaluation', label: 'Grilles d’évaluation', description: '', required: true },
			{ key: 'transition', label: 'Passerelle vers la catégorie suivante', description: '', required: true },
			{ key: 'annexes', label: 'Annexes et outils coach', description: '', required: true },
		],
		quantitativeTargets: targets(
			{ minTables: 8, minSituations: 8, minDiagrams: 8, minTypedBlocks: 12, minAnnexes: 1 },
			{ minTables: 12, minSituations: 14, minDiagrams: 14, minTypedBlocks: 18, minAnnexes: 2 },
			{ minTables: 15, minSituations: 18, minDiagrams: 18, minTypedBlocks: 24, minAnnexes: 3 },
			{ minTables: 18, minSituations: 22, minDiagrams: 24, minTypedBlocks: 30, minAnnexes: 4 },
		),
	},

	'category-coach-guide': {
		id: 'category-coach-guide',
		label: 'Guide coach de catégorie',
		description:
			'Guide complet pour coacher une catégorie précise au BCVB.',
		defaultStrategy: 'multi-step-production',
		defaultDepth: 'bcvb-reference',
		requiredSections: [
			{ key: 'cover', label: 'Couverture', description: '', required: true },
			{ key: 'identity', label: 'Identité de catégorie', description: '', required: true },
			{ key: 'coach-role', label: 'Rôle du coach', description: '', required: true },
			{ key: 'planning', label: 'Planification', description: '', required: true },
			{ key: 'situations', label: 'Situations pédagogiques', description: '', required: true },
			{ key: 'evaluation', label: 'Outils d’évaluation', description: '', required: true },
			{ key: 'parents', label: 'Relation familles / club', description: '', required: false },
		],
		quantitativeTargets: targets(
			{ minTables: 4, minSituations: 4, minDiagrams: 2, minTypedBlocks: 7, minAnnexes: 0 },
			{ minTables: 8, minSituations: 8, minDiagrams: 6, minTypedBlocks: 12, minAnnexes: 1 },
			{ minTables: 12, minSituations: 12, minDiagrams: 10, minTypedBlocks: 18, minAnnexes: 2 },
			{ minTables: 15, minSituations: 16, minDiagrams: 14, minTypedBlocks: 22, minAnnexes: 3 },
		),
	},

	'general-coach-guide': {
		id: 'general-coach-guide',
		label: 'Guide coach général',
		description:
			'Guide transversal à destination des entraîneurs et encadrants.',
		defaultStrategy: 'single-output',
		defaultDepth: 'premium',
		requiredSections: [
			{ key: 'purpose', label: 'Objectif du guide', description: '', required: true },
			{ key: 'principles', label: 'Principes d’action', description: '', required: true },
			{ key: 'tools', label: 'Outils coach', description: '', required: true },
		],
		quantitativeTargets: targets(
			{ minTables: 2, minSituations: 0, minDiagrams: 0, minTypedBlocks: 4, minAnnexes: 0 },
			{ minTables: 4, minSituations: 2, minDiagrams: 0, minTypedBlocks: 6, minAnnexes: 0 },
			{ minTables: 6, minSituations: 4, minDiagrams: 2, minTypedBlocks: 8, minAnnexes: 1 },
			{ minTables: 8, minSituations: 6, minDiagrams: 4, minTypedBlocks: 12, minAnnexes: 1 },
		),
	},

	'training-plan': {
		id: 'training-plan',
		label: 'Plan de formation',
		description: 'Document de progression interne ou de formation des coachs.',
		defaultStrategy: 'multi-step-production',
		defaultDepth: 'bcvb-reference',
		requiredSections: [
			{ key: 'objectives', label: 'Objectifs', description: '', required: true },
			{ key: 'calendar', label: 'Calendrier', description: '', required: true },
			{ key: 'modules', label: 'Modules', description: '', required: true },
			{ key: 'evaluation', label: 'Évaluation', description: '', required: true },
		],
		quantitativeTargets: targets(
			{ minTables: 4, minSituations: 0, minDiagrams: 0, minTypedBlocks: 6, minAnnexes: 0 },
			{ minTables: 8, minSituations: 2, minDiagrams: 0, minTypedBlocks: 10, minAnnexes: 1 },
			{ minTables: 12, minSituations: 4, minDiagrams: 2, minTypedBlocks: 15, minAnnexes: 2 },
			{ minTables: 15, minSituations: 6, minDiagrams: 4, minTypedBlocks: 20, minAnnexes: 3 },
		),
	},

	'pedagogical-ribbon': {
		id: 'pedagogical-ribbon',
		label: 'Ruban pédagogique',
		description:
			'Progression pédagogique complète avec séquences et séances.',
		defaultStrategy: 'multi-step-production',
		defaultDepth: 'bcvb-reference',
		requiredSections: [
			{ key: 'pedagogical-intent', label: 'Intention pédagogique', description: '', required: true },
			{ key: 'timeline', label: 'Ruban par semaines', description: '', required: true },
			{ key: 'sessions', label: 'Séances détaillées', description: '', required: true },
		],
		quantitativeTargets: targets(
			{ minTables: 6, minSituations: 4, minDiagrams: 2, minTypedBlocks: 8, minAnnexes: 0 },
			{ minTables: 10, minSituations: 8, minDiagrams: 4, minTypedBlocks: 12, minAnnexes: 1 },
			{ minTables: 14, minSituations: 12, minDiagrams: 8, minTypedBlocks: 18, minAnnexes: 2 },
			{ minTables: 18, minSituations: 16, minDiagrams: 12, minTypedBlocks: 24, minAnnexes: 3 },
		),
	},

	'full-session': {
		id: 'full-session',
		label: 'Séance complète',
		description:
			'Séance terrain très détaillée, prête à utiliser.',
		defaultStrategy: 'single-output',
		defaultDepth: 'premium',
		requiredSections: [
			{ key: 'objectives', label: 'Objectifs', description: '', required: true },
			{ key: 'timing', label: 'Déroulé minute par minute', description: '', required: true },
			{ key: 'situations', label: 'Situations', description: '', required: true },
		],
		quantitativeTargets: targets(
			{ minTables: 2, minSituations: 2, minDiagrams: 1, minTypedBlocks: 4, minAnnexes: 0 },
			{ minTables: 3, minSituations: 3, minDiagrams: 2, minTypedBlocks: 6, minAnnexes: 0 },
			{ minTables: 4, minSituations: 4, minDiagrams: 3, minTypedBlocks: 8, minAnnexes: 0 },
			{ minTables: 5, minSituations: 5, minDiagrams: 4, minTypedBlocks: 10, minAnnexes: 0 },
		),
	},

	'club-framework': {
		id: 'club-framework',
		label: 'Document cadre club',
		description:
			'Procédure, charte, guide interne ou cadre de fonctionnement.',
		defaultStrategy: 'single-output',
		defaultDepth: 'premium',
		requiredSections: [
			{ key: 'purpose', label: 'Finalité', description: '', required: true },
			{ key: 'rules', label: 'Règles et procédures', description: '', required: true },
			{ key: 'application', label: 'Applications pratiques', description: '', required: true },
		],
		quantitativeTargets: targets(
			{ minTables: 2, minSituations: 0, minDiagrams: 0, minTypedBlocks: 4, minAnnexes: 0 },
			{ minTables: 4, minSituations: 0, minDiagrams: 0, minTypedBlocks: 6, minAnnexes: 1 },
			{ minTables: 6, minSituations: 0, minDiagrams: 0, minTypedBlocks: 8, minAnnexes: 1 },
			{ minTables: 8, minSituations: 0, minDiagrams: 0, minTypedBlocks: 10, minAnnexes: 2 },
		),
	},

	'theme-sheet': {
		id: 'theme-sheet',
		label: 'Fiche thème',
		description:
			'Document court sur un thème technique ou organisationnel.',
		defaultStrategy: 'single-output',
		defaultDepth: 'standard',
		requiredSections: [
			{ key: 'definition', label: 'Définition', description: '', required: true },
			{ key: 'application', label: 'Application', description: '', required: true },
		],
		quantitativeTargets: targets(
			{ minTables: 1, minSituations: 0, minDiagrams: 0, minTypedBlocks: 2, minAnnexes: 0 },
			{ minTables: 2, minSituations: 1, minDiagrams: 0, minTypedBlocks: 4, minAnnexes: 0 },
			{ minTables: 3, minSituations: 2, minDiagrams: 1, minTypedBlocks: 5, minAnnexes: 0 },
			{ minTables: 4, minSituations: 3, minDiagrams: 2, minTypedBlocks: 7, minAnnexes: 1 },
		),
	},
};
