const STORAGE_KEY = 'bcvb-editorial-studio-state-v2'

export const defaultEditorialStudioState = {
  targetDocument: 'Guide complet du coach U13 BCVB',
  family: 'coach-guide',
  category: 'U13',
  audience: 'Coachs',
  productionLevel: 'Publication club',
  sourceText: '',
  editorialPlan: '',
  activeMode: 'chatgpt',
  activePrompt: '',
  chatGptResponse: '',
  claudeResponse: '',
  analyzedResponse: '',
  finalDocument: '',
  qualityScore: 72,
  recommendedAction: 'Renforcer le plan éditorial puis préparer un cadre de rédaction spécialisé.',
  sourceDocumentId: null,
  transformedFromTitle: null,
  transformationDate: null,
  transformationMode: null,
  parentDocumentId: null,
  createdFromDocumentId: null,
  isLatestVersion: true,
  steps: {
    framing: 'en cours',
    sources: 'non démarré',
    plan: 'non démarré',
    production: 'non démarré',
    quality: 'non démarré',
    export: 'non démarré',
  },
  updatedAt: null,
}

export function saveEditorialStudioState(state) {
  const nextState = {
    ...state,
    updatedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
  return nextState
}

export function loadEditorialStudioState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return {
      ...defaultEditorialStudioState,
      ...JSON.parse(raw),
    }
  } catch {
    return null
  }
}

export function resetEditorialStudioState() {
  window.localStorage.removeItem(STORAGE_KEY)
  return defaultEditorialStudioState
}

function buildContext(state) {
  return `
Document ciblé : ${state.targetDocument}
Famille : ${state.family}
Catégorie : ${state.category}
Public : ${state.audience}
Niveau attendu : ${state.productionLevel}
Plan éditorial actuel :
${state.editorialPlan || 'À construire.'}

Sources :
${state.sourceText || 'Aucune source fournie. Construire un document complet à partir du cadre BCVB.'}
`.trim()
}

function buildNonNegotiables() {
  return `
Contraintes BCVB non négociables :
- produire un document de qualité publication club / éditeur sportif ;
- minimum 18 situations pédagogiques si cahier technique ou guide coach ;
- minimum 18 schémas terrain associés si cahier technique ou guide coach ;
- tableaux convertis en blocs visuels, jamais en tableaux bruts non interprétés ;
- planification détaillée ;
- grilles d’évaluation exploitables ;
- relation familles explicite quand le document touche une catégorie jeune ;
- export propre, lisible, structuré ;
- aucun bloc générique vide ;
- aucun schéma sans players, arrows, ball ou zones ;
- situations autonomes, observables, transférables en séance ;
- titres puissants, hiérarchie claire, encarts clés, synthèses actionnables.
`.trim()
}

function buildFamilyRequirements(state) {
  return `
Contraintes de famille documentaire :
- Cahier technique : double colonne texte / schéma non négociable, situations autonomes numérotées, terrain intégré à chaque situation.
- Guide coach : lecture profonde, espaces blancs assumés, sidebar avec encarts clés, filet orange ou rouge gauche sur les principes importants.
- Plan de formation : rendu institutionnel, pages de transition pleine couleur, graphiques de progression.
- Ruban pédagogique : format paysage obligatoire, lecture horizontale par temps et verticale par thèmes.
- Séance d’entraînement : une page opérationnelle, 2 terrains entiers et 3 demi-terrains, cases titre, temps, description, consignes, évolution, évaluation, critères observables et quantifiables.
- Fiche à thème : bannière colorée selon thème, format flexible mais très lisible.

Famille sélectionnée : ${state.family}
`.trim()
}

function buildBasePrompt(state, providerInstruction, mission) {
  return `
Tu es un directeur éditorial sportif, expert basket jeune, architecture documentaire, pédagogie terrain et référentiel club.

Mission :
${mission}

${providerInstruction}

${buildContext(state)}

${buildNonNegotiables()}

${buildFamilyRequirements(state)}

Méthode obligatoire :
1. Auditer l’intention du document.
2. Construire ou renforcer le plan.
3. Produire une version complète, publiable, structurée en sections.
4. Transformer les tableaux en blocs visuels et encarts éditoriaux.
5. Ajouter situations, schémas, planification, évaluations et relation familles quand nécessaire.
6. Terminer par une checklist de publication BCVB.

Réponse attendue :
- produire directement le document final ;
- ne pas expliquer ta méthode hors document ;
- ne pas livrer de squelette vide ;
- ne pas utiliser de contenu générique ;
- écrire en français professionnel, précis, sportif et exploitable.
`.trim()
}

export function buildChatGPTPrompt(state) {
  return buildBasePrompt(
    state,
    'Mode cadre rédactionnel : privilégie une structure stricte, des blocs bien hiérarchisés, des listes actionnables et une cohérence de format impeccable.',
    'Créer ou transformer le document BCVB en version publiable, avec architecture robuste et consignes opérationnelles.'
  )
}

export function buildClaudePrompt(state) {
  return buildBasePrompt(
    state,
    'Mode cadre approfondi : privilégie profondeur éditoriale, transitions naturelles, finesse pédagogique, nuance, cohérence humaine et densité rédactionnelle.',
    'Créer ou transformer le document BCVB en version longue, fluide, exigeante, lisible et directement exploitable par un club.'
  )
}

export function buildFusionPrompt(state) {
  return `
Tu es un éditeur en chef BCVB. Fusionne les deux réponses ci-dessous pour produire une version finale supérieure aux deux.

Objectif :
- conserver la structure robuste de la première version ;
- conserver la profondeur éditoriale de la deuxième version ;
- supprimer doublons, contradictions, zones faibles ;
- atteindre le niveau publication club ;
- respecter toutes les contraintes BCVB.

${buildContext(state)}

${buildNonNegotiables()}

Proposition 1 :
${state.chatGptResponse || 'À coller.'}

Proposition 2 :
${state.claudeResponse || 'À coller.'}

Produit uniquement la version finale fusionnée, publiable, sans commentaire extérieur.
`.trim()
}

export function buildMassiveCorrectionPrompt(state) {
  return `
Tu es correcteur éditorial BCVB. Corrige massivement le document ci-dessous.

Objectif :
- transformer les faiblesses en blocs publiables ;
- convertir les tableaux bruts en blocs visuels ;
- corriger tous les blocs génériques vides ;
- ajouter les critères observables, grilles, schémas et planifications manquants ;
- préserver l’intention et améliorer la lisibilité.

${buildContext(state)}

${buildNonNegotiables()}

Document à corriger :
${state.finalDocument || state.analyzedResponse || state.sourceText || 'Document absent : reconstruire depuis le cadrage.'}

Produit uniquement le document corrigé.
`.trim()
}

export function buildPublicationReconstructionPrompt(state) {
  return `
Tu es une cellule éditoriale complète : architecte documentaire, responsable technique basket, designer print et contrôleur qualité BCVB.

Mission :
Reconstruire globalement le document pour atteindre une qualité publication club, sans te limiter à une correction phrase par phrase.

${buildContext(state)}

${buildNonNegotiables()}

${buildFamilyRequirements(state)}

Document ou source à reconstruire :
${state.finalDocument || state.analyzedResponse || state.sourceText || 'Aucune source : créer depuis le cadrage.'}

Livrable :
- document final complet ;
- mise en page éditoriale décrite par blocs ;
- situations et schémas complets si requis ;
- planification et évaluations ;
- version prête à exporter PDF.

Ne réponds pas par un plan. Réponds par le document final reconstruit.
`.trim()
}
