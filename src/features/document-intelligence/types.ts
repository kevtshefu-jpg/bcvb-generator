
export type DoctrineId =
	| 'bcvb'
	| 'ffbb'
	| 'fiba'
	| 'europe'
	| 'usa'
	| 'canada'
	| 'custom';

export type DocumentFamily =
	| 'category-technical-handbook'
	| 'category-coach-guide'
	| 'general-coach-guide'
	| 'training-plan'
	| 'pedagogical-ribbon'
	| 'full-session'
	| 'club-framework'
	| 'theme-sheet';

export type ProductionDepth =
	| 'standard'
	| 'premium'
	| 'bcvb-reference'
	| 'editorial-publication';

export type GenerationStrategy =
	| 'single-output'
	| 'multi-step-production';

export type CategoryCode =
	| 'U7'
	| 'U9'
	| 'U11'
	| 'U13'
	| 'U15'
	| 'U18'
	| 'U21'
	| 'Seniors'
	| 'General';

export interface DoctrineProfile {
	id: DoctrineId;
	label: string;
	description: string;
	promptInstruction: string;
	recommendedFor: CategoryCode[];
}

export interface CategoryKnowledgePack {
	category: CategoryCode;
	title: string;
	learningStage: string;
	majorPriorities: string[];
	coachableThemes: string[];
	requiredSections: string[];
	recommendedDoctrines: DoctrineId[];
}

export interface BlueprintRequirement {
	key: string;
	label: string;
	description: string;
	required: boolean;
}

export interface QuantitativeTargets {
	minTables: number;
	minSituations: number;
	minDiagrams: number;
	minTypedBlocks: number;
	minAnnexes: number;
}

export interface DocumentBlueprint {
	id: DocumentFamily;
	label: string;
	description: string;
	defaultStrategy: GenerationStrategy;
	defaultDepth: ProductionDepth;
	requiredSections: BlueprintRequirement[];
	quantitativeTargets: Record<ProductionDepth, QuantitativeTargets>;
}

export interface EditorialRequest {
	family: DocumentFamily;
	depth: ProductionDepth;
	category: CategoryCode;
	title: string;
	userIntent: string;
	selectedDoctrines: DoctrineId[];
	selectedSourceDocuments?: string[];
	generationStrategy?: GenerationStrategy;
}

export interface PromptStep {
	id: string;
	title: string;
	objective: string;
	prompt: string;
}

export interface DocumentProductionPlan {
	strategy: GenerationStrategy;
	recommended: boolean;
	warning?: string;
	blueprint: DocumentBlueprint;
	categoryPack: CategoryKnowledgePack;
	selectedDoctrines: DoctrineProfile[];
	targets: QuantitativeTargets;
	prompts: PromptStep[];
}
