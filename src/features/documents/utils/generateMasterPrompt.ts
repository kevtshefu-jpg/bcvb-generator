import {
  buildDocumentProductionPlan,
  type CategoryCode,
  type DoctrineId,
  type DocumentFamily,
  type ProductionDepth,
} from '../../document-intelligence'

export type GenerateMasterPromptInput = {
  family: DocumentFamily
  depth: ProductionDepth
  category: CategoryCode
  title: string
  userIntent?: string
  selectedDoctrines: DoctrineId[]
  selectedSourceDocuments?: string[]
}

export function generateMasterPrompt(input: GenerateMasterPromptInput) {
  const plan = buildDocumentProductionPlan({
    family: input.family,
    depth: input.depth,
    category: input.category,
    title: input.title,
    userIntent:
      input.userIntent ||
      'Produire un document BCVB premium complet, directement exploitable dans le lecteur web, le contrôle qualité et l’export PDF.',
    selectedDoctrines: input.selectedDoctrines,
    selectedSourceDocuments: input.selectedSourceDocuments,
    generationStrategy: 'single-output',
  })

  const basePrompt = plan.prompts[0]?.prompt ?? ''

  return `
CADRE MAÎTRE QUALITÉ ÉDITEUR — BCVB RÉFÉRENTIEL

Objectif : produire en une seule réponse un document final complet, premium, structuré et directement collable dans le site BCVB.

FORMAT STRICT OBLIGATOIRE :
- Utiliser uniquement des blocs typés \`:::bcvb-*\`.
- Ne jamais utiliser de bloc générique \`:::\`.
- Ne jamais écrire les blocs BCVB sur une seule ligne.
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
- Ne jamais afficher de champs techniques hors bloc.
- Chaque situation doit être dans \`:::bcvb-situation\`.
- Chaque diagramme doit être dans \`:::bcvb-diagram\`.
- Pour chaque situation pédagogique, produire immédiatement après 1 bloc \`:::bcvb-diagram\` associé.
- Chaque diagramme doit contenir obligatoirement : title, court, intent, players, arrows et notes.
- Chaque diagramme doit inclure au moins 2 joueurs ou 1 joueur + 1 plot/cible.
- Ajouter \`ball\` si la situation utilise le ballon.
- Chaque diagramme doit contenir au moins 1 flèche dans \`arrows\`.
- Les listes \`players\`, \`arrows\`, \`notes\` doivent respecter l’indentation YAML avec des tirets \`-\`.
- Interdiction : diagramme sans players, diagramme sans arrows, players sans tirets, arrows sans tirets, données sur une seule ligne.
- Tous les tableaux doivent être placés dans des blocs typés \`:::bcvb-table\`, \`:::bcvb-planning-table\`, \`:::bcvb-progression\`, \`:::bcvb-session-template\` ou \`:::bcvb-evaluation-grid\`.
- Format obligatoire pour un tableau :
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

RÈGLE ABSOLUE TABLEAUX :
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
- Si le contenu est long, utilise des paragraphes dans \`content:\` mais ne casse jamais la structure du bloc.
- Ne pas ajouter de commentaires méta.
- Ne pas écrire “voici le document”.
- Produire uniquement le contenu final.

ÉLÉMENTS PREMIUM À PRODUIRE :
- 1 couverture premium \`:::bcvb-hero\`.
- 1 bloc identité \`:::bcvb-identity\`.
- 1 sommaire détaillé.
- 1 planification annuelle ou planification adaptée au document.
- 1 progression opérationnelle.
- 1 séance type si pertinent.
- des tableaux Markdown utiles et propres.
- des situations pédagogiques détaillées.
- des diagrammes terrain correctement indentés.
- des grilles d’évaluation.
- une conclusion premium \`:::bcvb-conclusion\`.
- des annexes si le type de document le justifie.

QUANTITÉ MINIMALE POUR UN GUIDE COACH DE CATÉGORIE :
- 1 hero.
- 1 identity.
- 1 sommaire éditorial.
- 1 profil développemental.
- 1 rôle du coach.
- 1 planification annuelle.
- 1 progression opérationnelle.
- 1 cycle 6 semaines.
- 1 séance type.
- minimum 8 situations pédagogiques.
- minimum 8 diagrammes.
- 1 grille évaluation joueur.
- 1 grille auto-évaluation coach.
- 1 relation familles.
- 1 passerelle catégorie suivante.
- 1 conclusion.
- 1 poster synthèse.

INTERDICTIONS DE RENDU :
- aucun tableau brut hors bloc typé ;
- aucun champ diagramme visible hors bloc ;
- aucun \`players:\` visible hors bloc \`:::bcvb-diagram\` ;
- aucun pipe \`|\` visible comme texte final hors table Markdown ;
- aucun “Bloc BCVB” générique ;
- aucune section pauvre de moins de 5 lignes pour un guide complet.

PLANIFICATIONS OBLIGATOIRES

Les planifications doivent être riches, utiles terrain et directement coachables.

Pour un guide de catégorie, produire obligatoirement :

1. Planification annuelle
Colonnes obligatoires :
| Période | Thème dominant | Objectifs prioritaires | Contenus terrain | Situations recommandées | Critères de réussite | Vigilance coach |

2. Progression opérationnelle
Colonnes obligatoires :
| Étape | Objectif joueur | Situation pivot | Ce que le coach observe | Régulation possible | Transfert match |

3. Cycle type 6 semaines
Colonnes obligatoires :
| Semaine | Thème | Objectif séance | Situation principale | Jeu de transfert | Critère de validation |

4. Séance type détaillée
Colonnes obligatoires :
| Temps | Bloc | Organisation | Intention pédagogique | Consignes clés | Vigilances |

Interdiction :
Ne jamais produire un tableau à seulement 3 colonnes pour une planification.
Ne jamais produire une planification générique.
Chaque ligne doit être directement exploitable par un coach sur le terrain.

${basePrompt}
`.trim()
}
