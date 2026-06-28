import type {
  CreationAudience,
  CreationCategory,
  CreationContentMode,
  CreationDocumentType,
  CreationLevel,
  DocumentCreationDraft,
  DocumentCreationInput,
  DocumentTypeOption,
} from '../types/documentCreation.types'

export const documentTypeOptions: DocumentTypeOption[] = [
  {
    id: 'guide_coach',
    label: 'Guide coach',
    purpose: 'Donner un cadre clair à un coach pour une catégorie, un thème ou une période.',
    example: 'Guide coach U11 - Défendre fort et relancer vite.',
    detailLevel: 'Complet : intentions, repères terrain, situations, critères et points de vigilance.',
  },
  {
    id: 'cahier_technique',
    label: 'Cahier technique',
    purpose: 'Formaliser une méthode club sur un thème technique ou tactique.',
    example: 'Cahier technique - Défense Homme à Homme U13-U15.',
    detailLevel: 'Très détaillé : principes, progressions, situations, schémas, évaluations.',
  },
  {
    id: 'fiche_seance',
    label: 'Fiche séance',
    purpose: 'Préparer une séance directement utilisable au gymnase.',
    example: 'Séance U15 - Transition offensive et replacement défensif.',
    detailLevel: 'Opérationnel : durée, objectifs, matériel, consignes, variantes, bilan.',
  },
  {
    id: 'situation_pedagogique',
    label: 'Situation pédagogique',
    purpose: 'Décrire un exercice autonome, transférable dans une séance.',
    example: 'Situation - 1 contre 1 cadrer et orienter.',
    detailLevel: 'Ciblé : objectif, organisation, consignes, critères observables, évolutions.',
  },
  {
    id: 'outil_evaluation',
    label: 'Outil d’évaluation',
    purpose: 'Observer la progression d’un joueur ou d’un groupe avec des critères communs.',
    example: 'Grille U13 - Attitudes défensives et lecture de jeu.',
    detailLevel: 'Structuré : niveaux, indicateurs, commentaires, synthèse et suivi.',
  },
  {
    id: 'document_familles',
    label: 'Document familles',
    purpose: 'Expliquer une règle, une organisation ou un message club aux familles.',
    example: 'Guide parents référents - Organisation des plateaux.',
    detailLevel: 'Simple et rassurant : contexte, actions attendues, contacts, calendrier.',
  },
  {
    id: 'compte_rendu',
    label: 'Compte rendu',
    purpose: 'Synthétiser une réunion, commission, bilan sportif ou point d’étape.',
    example: 'Compte rendu commission sportive - Juin 2026.',
    detailLevel: 'Clair : décisions, responsables, échéances, points ouverts.',
  },
  {
    id: 'document_administratif',
    label: 'Document administratif',
    purpose: 'Produire un cadre de fonctionnement, une procédure ou une note interne.',
    example: 'Procédure club - Import effectifs et droits d’accès.',
    detailLevel: 'Précis : périmètre, règles, étapes, responsabilités et archivage.',
  },
]

export const creationCategories: CreationCategory[] = ['U7', 'U9', 'U11', 'U13', 'U15', 'U18', 'Seniors', 'Club']
export const creationAudiences: CreationAudience[] = ['coachs', 'joueurs', 'parents', 'dirigeants', 'bénévoles']
export const creationLevels: CreationLevel[] = ['découverte', 'formation', 'compétition', 'performance']

export const creationModeLabels: Record<CreationContentMode, string> = {
  prompt_libre: 'Brief libre',
  modele_guide: 'Modèle guidé',
  fichier_importe: 'Partir d’un fichier importé',
}

function getDocumentType(documentType: CreationDocumentType) {
  return documentTypeOptions.find((option) => option.id === documentType) ?? documentTypeOptions[0]
}

function buildTitle(input: DocumentCreationInput) {
  const option = getDocumentType(input.documentType)
  const objective = input.context.mainObjective.trim()
  return `${option.label} ${input.context.category}${objective ? ` - ${objective}` : ''}`
}

function sourceBlock(input: DocumentCreationInput) {
  if (input.source.mode === 'prompt_libre') {
    return input.source.freePrompt.trim() || 'Aucune précision libre fournie.'
  }

  if (input.source.mode === 'modele_guide') {
    return input.source.guidedNotes.trim() || 'Créer à partir du modèle guidé BCVB, sans source externe.'
  }

  return [
    input.source.importedFileName ? `Fichier importé : ${input.source.importedFileName}` : 'Aucun fichier importé.',
    input.source.importedText.trim() || 'Contenu du fichier à extraire ou à compléter depuis le module OCR.',
  ].join('\n')
}

export function buildInternalCreationPrompt(input: DocumentCreationInput) {
  const option = getDocumentType(input.documentType)

  return `
Tu es directeur éditorial BCVB, expert basket, pédagogie terrain et documents club.

Mission :
Créer un document "${option.label}" au format BCVB Rich Markdown.

Contexte :
- Catégorie : ${input.context.category}
- Public cible : ${input.context.audience}
- Niveau : ${input.context.level}
- Objectif principal : ${input.context.mainObjective || 'À préciser clairement dans le document'}
- Contraintes : ${input.context.constraints || 'Aucune contrainte spécifique'}

Identité BCVB obligatoire :
- Défendre Fort, Courir et Partager la Balle ;
- défense Homme à Homme ;
- valeurs : intensité, agressivité maîtrisée, maîtrise, jeu ;
- pédagogie : je découvre / je m’exerce / je retranscris en match / je régule.

Niveau de détail attendu :
${option.detailLevel}

Source utilisateur :
${sourceBlock(input)}

Livrable attendu :
- produire directement le document final ;
- utiliser des titres Markdown propres ;
- ajouter des blocs BCVB Rich Markdown utiles ;
- inclure des critères observables et actions concrètes ;
- finir par une checklist de publication ;
- ne pas exposer le cadre de rédaction interne dans le document final.
`.trim()
}

function familySpecificSection(input: DocumentCreationInput) {
  if (input.documentType === 'fiche_seance') {
    return `
## Déroulé de séance
| Temps | Situation | Organisation | Consignes | Critères |
| --- | --- | --- | --- | --- |
| Échauffement | Activation avec ballon | Groupes de 3 | Courir, parler, passer vite | Intensité progressive |
| Corps de séance | Situation principale | Demi-terrain ou terrain entier | Défendre fort, orienter, relancer | Critères observables |
| Retour au calme | Bilan joueur | Cercle équipe | Je retiens un repère | Verbalisation claire |
`.trim()
  }

  if (input.documentType === 'outil_evaluation') {
    return `
## Grille d’évaluation
| Critère | Découverte | Formation | Compétition | Commentaire |
| --- | --- | --- | --- | --- |
| Attitude défensive | Se place | Contient | Oriente et communique | À observer en match |
| Lecture de jeu | Réagit | Anticipe | Choisit vite | Relier à une situation |
| Engagement collectif | Participe | Encourage | Tire le groupe | Attitude BCVB |
`.trim()
  }

  if (input.documentType === 'document_familles') {
    return `
## Message aux familles
- Ce document sert à clarifier l’organisation et les attentes du club.
- Les actions demandées doivent rester simples, datées et compréhensibles.
- Le parent référent aide à fluidifier la communication, sans remplacer le coach.
`.trim()
  }

  if (input.documentType === 'compte_rendu') {
    return `
## Décisions et suivi
| Sujet | Décision | Responsable | Échéance |
| --- | --- | --- | --- |
| Point sportif | À valider | Commission sportive | Prochaine réunion |
| Communication | À diffuser | Référent désigné | Cette semaine |
`.trim()
  }

  return `
## Situation pédagogique type
:::bcvb-situation
title: Situation à adapter
objectif: Relier l’objectif principal à une action observable.
organisation: Définir espace, joueurs, matériel et rotations.
consignes_joueurs: Défendre Fort, Courir, Partager la Balle.
criteres_reussite: Critères simples, mesurables et visibles.
evolution_1: Simplifier ou complexifier selon le niveau.
:::
`.trim()
}

export function generateBcvbRichMarkdownDraft(input: DocumentCreationInput): DocumentCreationDraft {
  const option = getDocumentType(input.documentType)
  const title = buildTitle(input)
  const internalPrompt = buildInternalCreationPrompt(input)
  const source = sourceBlock(input)
  const richMarkdown = `
# ${title}

:::bcvb-identity
title: Identité BCVB
content: Défendre Fort, Courir et Partager la Balle. Défense Homme à Homme, intensité, agressivité maîtrisée, maîtrise et jeu collectif.
:::

## Pourquoi ce document
${option.purpose}

## Contexte
- Catégorie : ${input.context.category}
- Public cible : ${input.context.audience}
- Niveau : ${input.context.level}
- Objectif principal : ${input.context.mainObjective || 'À préciser'}
- Contraintes : ${input.context.constraints || 'Aucune contrainte spécifique'}

## Source de travail
${source}

## Structure BCVB proposée
- Intention et résultat attendu.
- Repères terrain ou organisationnels.
- Progression : je découvre, je m’exerce, je retranscris en match, je régule.
- Critères observables.
- Points de vigilance pour le coach, le dirigeant ou le référent.

${familySpecificSection(input)}

## Checklist publication
- Le document répond au besoin du public cible.
- Les termes BCVB sont cohérents.
- Les actions sont concrètes et datées si nécessaire.
- Le score qualité est contrôlé avant export.
- La source est conservée et versionnée.
`.trim()

  return { title, internalPrompt, richMarkdown }
}
