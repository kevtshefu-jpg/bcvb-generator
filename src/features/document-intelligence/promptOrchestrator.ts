// src/features/document-intelligence/promptOrchestrator.ts

import {
  CATEGORY_KNOWLEDGE_PACKS,
} from './categoryKnowledgePacks';
import { DOCTRINE_PROFILES } from './doctrineProfiles';
import { DOCUMENT_BLUEPRINTS } from './documentBlueprints';

import type {
  DocumentProductionPlan,
  EditorialRequest,
  GenerationStrategy,
  PromptStep,
  QuantitativeTargets,
} from './types';

function chooseStrategy(
  request: EditorialRequest,
  defaultStrategy: GenerationStrategy,
): GenerationStrategy {
  if (request.generationStrategy) {
    return request.generationStrategy;
  }

  return defaultStrategy;
}

function buildDoctrineBlock(request: EditorialRequest): string {
  return request.selectedDoctrines
    .map((id) => DOCTRINE_PROFILES[id]?.promptInstruction)
    .filter(Boolean)
    .join('\n');
}

function buildCategoryBlock(request: EditorialRequest): string {
  const pack = CATEGORY_KNOWLEDGE_PACKS[request.category];

  return `
CATÉGORIE CIBLE
- Catégorie : ${pack.category}
- Repère de développement : ${pack.title}
- Stade : ${pack.learningStage}

PRIORITÉS À COUVRIR
${pack.majorPriorities.map((item) => `- ${item}`).join('\n')}

THÈMES COACHABLES À MOBILISER
${pack.coachableThemes.map((item) => `- ${item}`).join('\n')}

SECTIONS À NE PAS OUBLIER
${pack.requiredSections.map((item) => `- ${item}`).join('\n')}
`;
}

function buildTargetsBlock(targets: QuantitativeTargets): string {
  return `
EXIGENCES QUANTITATIVES MINIMALES
- Tableaux utiles : ${targets.minTables} minimum
- Situations pédagogiques : ${targets.minSituations} minimum
- Diagrammes terrain : ${targets.minDiagrams} minimum
- Blocs BCVB typés : ${targets.minTypedBlocks} minimum
- Annexes utiles : ${targets.minAnnexes} minimum
`;
}

function buildStrictFormatBlock(): string {
  return `
FORMAT DE SORTIE STRICTEMENT OBLIGATOIRE

La réponse sera analysée par un parseur automatique strict.
Toute syntaxe non conforme sera considérée comme une erreur.

RÈGLES ABSOLUES
- Ne jamais utiliser un bloc générique \`:::\` seul.
- Toujours utiliser un bloc typé \`:::bcvb-*\`.
- Ne jamais écrire un bloc BCVB sur une seule ligne.
- MAUVAIS : \`:::bcvb-section title: Sommaire content: Texte :::\`
- BON :
\`\`\`md
:::bcvb-section
title: Sommaire
content: Texte
:::
\`\`\`
- Chaque champ doit être sur sa propre ligne.
- Chaque bloc doit commencer par \`:::bcvb-nom-du-bloc\`.
- Chaque bloc doit se fermer par \`:::\`.
- Ne jamais afficher de champs techniques hors bloc adapté.
- Ne jamais écrire \`players:\`, \`arrows:\`, \`notes:\` hors d’un bloc \`:::bcvb-diagram\`.
- Pour chaque situation pédagogique, produire immédiatement après 1 bloc \`:::bcvb-diagram\` associé.
- Chaque diagramme doit contenir obligatoirement : title, court, intent, players, arrows et notes.
- Chaque diagramme doit inclure au moins 2 joueurs ou 1 joueur + 1 plot/cible.
- Ajouter \`ball\` si la situation utilise le ballon.
- Chaque diagramme doit contenir au moins 1 flèche dans \`arrows\`.
- Interdiction : diagramme sans players, diagramme sans arrows, players sans tirets, arrows sans tirets, données sur une seule ligne.
- Tous les tableaux doivent être dans des blocs typés \`:::bcvb-table\`, \`:::bcvb-planning-table\`, \`:::bcvb-progression\`, \`:::bcvb-session-template\` ou \`:::bcvb-evaluation-grid\`.
- Format obligatoire :
  \`\`\`md
  :::bcvb-table
  title: Titre du tableau
  variant: planning
  table:
  | Colonne 1 | Colonne 2 | Colonne 3 | Colonne 4 |
  |---|---|---|---|
  | Ligne exploitable terrain | Contenu concret | Repère coach | Critère |
  :::
  \`\`\`
- Variants autorisés : planning, material, session, evaluation, summary, default.
- Aucun tableau brut hors bloc typé.
- RÈGLE ABSOLUE TABLEAUX :
  Aucun tableau Markdown ne doit être écrit hors d’un bloc typé.
  Interdit :
  \`\`\`md
  | Colonne | Colonne |
  |---|---|
  \`\`\`
  Obligatoire :
  \`\`\`md
  :::bcvb-table
  title: Organisation matérielle recommandée
  variant: material
  table:
  | Matériel | Quantité idéale | Utilisation | Vigilance |
  |---|---|---|---|
  | Ballons taille 3 ou 5 | 1 par enfant si possible | Manipulation, dribble, lancer | Adapter au gabarit |
  :::
  \`\`\`
  Si un tableau est nécessaire, il doit toujours être dans un bloc \`:::bcvb-table\`.
- Si le contenu est long, utilise des paragraphes dans \`content:\` sans casser la structure du bloc.
- PLANIFICATIONS OBLIGATOIRES :
  Les planifications doivent être riches, utiles terrain et directement coachables.
  Pour un guide de catégorie, produire obligatoirement :
  1. Planification annuelle avec colonnes obligatoires :
     | Période | Thème dominant | Objectifs prioritaires | Contenus terrain | Situations recommandées | Critères de réussite | Vigilance coach |
  2. Progression opérationnelle avec colonnes obligatoires :
     | Étape | Objectif joueur | Situation pivot | Ce que le coach observe | Régulation possible | Transfert match |
  3. Cycle type 6 semaines avec colonnes obligatoires :
     | Semaine | Thème | Objectif séance | Situation principale | Jeu de transfert | Critère de validation |
  4. Séance type détaillée avec colonnes obligatoires :
     | Temps | Bloc | Organisation | Intention pédagogique | Consignes clés | Vigilances |
  Interdiction : ne jamais produire un tableau à seulement 3 colonnes pour une planification ; ne jamais produire une planification générique ; chaque ligne doit être directement exploitable par un coach sur le terrain.
- Ne jamais écrire de commentaire méta ou expliquer la méthode.
- Produire directement le document final.
- Ne pas faire de résumé.
- Ne pas écrire “voici le document”.
- Ne pas générer de recommandations de mise en page dans le corps du document.

BLOCS AUTORISÉS
- :::bcvb-hero
- :::bcvb-identity
- :::bcvb-section
- :::bcvb-table
- :::bcvb-planning-table
- :::bcvb-progression
- :::bcvb-session-template
- :::bcvb-evaluation-grid
- :::bcvb-situation
- :::bcvb-diagram
- :::bcvb-annex
- :::bcvb-poster
- :::bcvb-conclusion
`;
}

function buildDiagramExample(): string {
  return `
EXEMPLE DE BLOC DIAGRAMME À RESPECTER STRICTEMENT

:::bcvb-diagram
title: Maisons de couleur — mise en place
court: half
intent: Visualiser les déplacements vers les zones
players:
  - id: J1
    team: offense
    x: 50
    y: 65
    label: 1
  - id: R
    team: cone
    x: 20
    y: 40
    label: Rouge
arrows:
  - type: move
    from: J1
    toX: 20
    toY: 40
    label: déplacement
notes:
  - Chaque maison est clairement identifiable.
:::

Respecte obligatoirement :
- les tirets \`-\` devant les éléments de liste ;
- l’indentation ;
- le nom exact des champs ;
- la fermeture du bloc.
`;
}

function buildSituationExample(): string {
  return `
EXEMPLE DE SITUATION PÉDAGOGIQUE À RESPECTER

:::bcvb-situation
numero: Situation 1
title: Maisons de couleur
finalite: Développer la réactivité et la prise d’information.
objectif: Rejoindre la bonne zone au signal sans collision.
organisation: Demi-terrain partagé en plusieurs zones.
materiel: Cerceaux, plots, cartes de couleur.
deroulement: Les enfants se déplacent librement puis rejoignent la zone annoncée.
consignes_joueurs: Écoute, regarde autour de toi, va dans la bonne maison sans pousser.
points_coach: Varier les modes de déplacement, sécuriser les trajectoires.
criteres_reussite: L’enfant rejoint la bonne zone rapidement et s’arrête avec maîtrise.
variables_simplification: Réduire le nombre de zones.
variables_complexification: Ajouter un ballon à porter ou à dribbler.
evolution_1: Introduire une maison interdite.
evolution_2: Annoncer deux couleurs successives.
transfert_match: Améliorer le replacement et la réaction à un changement de situation.
erreurs_frequentes: Partir sans écouter, pousser, se tromper de zone.
corrections_possibles: Répéter calmement, réduire la distance, reformuler.
:::
`;
}

function buildBlueprintBlock(request: EditorialRequest): string {
  const blueprint = DOCUMENT_BLUEPRINTS[request.family];

  return `
FAMILLE DOCUMENTAIRE
- Type : ${blueprint.label}
- Objectif : ${blueprint.description}

SECTIONS STRUCTURANTES À PRODUIRE
${blueprint.requiredSections
  .map(
    (section) =>
      `- ${section.required ? '[OBLIGATOIRE]' : '[RECOMMANDÉ]'} ${section.label}`,
  )
  .join('\n')}
`;
}

function baseEditorialContext(request: EditorialRequest): string {
  return `
RÔLE
Tu es un comité éditorial basket de très haut niveau travaillant pour le BCVB.
Tu produis des documents de qualité éditeur, directement exploitables par des coachs, responsables techniques et dirigeants.

TITRE / DEMANDE
${request.title}

INTENTION PRÉCISE DE L’ADMIN
${request.userIntent}

${buildBlueprintBlock(request)}
${buildCategoryBlock(request)}
${buildDoctrineBlock(request)}
`;
}

function buildSingleOutputPrompt(
  request: EditorialRequest,
  targets: QuantitativeTargets,
): string {
  return `
${baseEditorialContext(request)}

${buildTargetsBlock(targets)}

${buildStrictFormatBlock()}

${buildSituationExample()}

${buildDiagramExample()}

MISSION
Produis directement le document final complet.
Le document doit être éditorialisé, dense, cohérent, très opérationnel et supérieur à une simple réponse de chatbot.
Il doit pouvoir être enregistré immédiatement dans une bibliothèque documentaire club.
`;
}

function buildMultiStepPrompts(
  request: EditorialRequest,
  targets: QuantitativeTargets,
): PromptStep[] {
  const shared = `
${baseEditorialContext(request)}

${buildTargetsBlock(targets)}

${buildStrictFormatBlock()}
`;

  return [
    {
      id: 'step-1-blueprint',
      title: 'Étape 1 — Architecture éditoriale',
      objective:
        'Créer la structure complète du document, le sommaire et la logique de production.',
      prompt: `
${shared}

MISSION — ÉTAPE 1
Produis uniquement :
1. Le bloc :::bcvb-hero
2. Le bloc :::bcvb-identity
3. Un sommaire éditorial détaillé
4. La liste des grandes parties
5. La liste des tableaux à produire
6. La liste des situations pédagogiques à produire
7. La liste des diagrammes à produire
8. La liste des annexes prévues

Ne rédige pas encore le document complet.
L’objectif est de figer l’architecture d’un document de niveau éditeur.
`,
    },

    {
      id: 'step-2-foundations',
      title: 'Étape 2 — Fondations, cadre et planification',
      objective:
        'Rédiger les parties de fond, l’identité et les grandes planifications.',
      prompt: `
${shared}

MISSION — ÉTAPE 2
À partir de l’architecture définie précédemment, rédige :
- les fondations éditoriales ;
- la finalité ;
- le profil de catégorie ;
- les principes ;
- la planification annuelle ;
- la progression par périodes ;
- la structure type de séance ;
- les tableaux essentiels correspondants.

Ne produis pas encore la banque complète de situations.
`,
    },

    {
      id: 'step-3-situations',
      title: 'Étape 3 — Banque de situations pédagogiques',
      objective:
        'Produire les situations de terrain détaillées.',
      prompt: `
${shared}

${buildSituationExample()}

MISSION — ÉTAPE 3
Produis uniquement la banque de situations pédagogiques.
Chaque situation doit être dans un bloc :::bcvb-situation.
Respecte le quota minimum de ${targets.minSituations} situations.
Chaque situation doit être concrète, coachable et adaptée à la catégorie ${request.category}.
`,
    },

    {
      id: 'step-4-diagrams',
      title: 'Étape 4 — Diagrammes et schémas terrain',
      objective:
        'Produire les diagrammes associés aux situations.',
      prompt: `
${shared}

${buildDiagramExample()}

MISSION — ÉTAPE 4
Produis uniquement les blocs :::bcvb-diagram.
Respecte le quota minimum de ${targets.minDiagrams} diagrammes.
Associe clairement les diagrammes aux situations produites précédemment.
`,
    },

    {
      id: 'step-5-tools-annexes',
      title: 'Étape 5 — Outils coach, annexes et synthèse',
      objective:
        'Finaliser les grilles, annexes, communication et synthèse éditoriale.',
      prompt: `
${shared}

MISSION — ÉTAPE 5
Produis :
- les grilles d’évaluation ;
- les outils coach ;
- les annexes ;
- les contenus familles / communication si pertinents ;
- la passerelle vers la catégorie suivante ;
- le bloc :::bcvb-conclusion.

Le ton doit être celui d’un document club publiable.
`,
    },

    {
      id: 'step-6-harmonization',
      title: 'Étape 6 — Harmonisation finale',
      objective:
        'Relire, harmoniser et renforcer la qualité globale du document.',
      prompt: `
${shared}

MISSION — ÉTAPE 6
À partir de toutes les parties produites précédemment :
- supprime les répétitions ;
- vérifie la cohérence éditoriale ;
- vérifie la présence des éléments BCVB ;
- vérifie que les référentiels sélectionnés sont réellement intégrés ;
- vérifie que toutes les balises sont conformes ;
- renforce la conclusion ;
- produis une version consolidée prête à coller dans le site.
`,
    },
  ];
}

export function buildDocumentProductionPlan(
  request: EditorialRequest,
): DocumentProductionPlan {
  const blueprint = DOCUMENT_BLUEPRINTS[request.family];
  const categoryPack = CATEGORY_KNOWLEDGE_PACKS[request.category];
  const selectedDoctrines = request.selectedDoctrines.map(
    (id) => DOCTRINE_PROFILES[id],
  );

  const targets = blueprint.quantitativeTargets[request.depth];
  const strategy = chooseStrategy(request, blueprint.defaultStrategy);

  const prompts =
    strategy === 'single-output'
      ? [
          {
            id: 'single-output',
            title: 'Prompt unique',
            objective: 'Produire directement le document final.',
            prompt: buildSingleOutputPrompt(request, targets),
          },
        ]
      : buildMultiStepPrompts(request, targets);

  return {
    strategy,
    recommended: blueprint.defaultStrategy === strategy,
    warning:
      strategy === 'single-output' &&
      blueprint.defaultStrategy === 'multi-step-production'
        ? 'Ce type de document atteint plus facilement un niveau éditeur en génération multi-étapes.'
        : undefined,
    blueprint,
    categoryPack,
    selectedDoctrines,
    targets,
    prompts,
  };
}
