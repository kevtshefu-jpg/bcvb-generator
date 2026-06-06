export function buildFusionPrompt(params: {
  title: string
  family: string
  category: string
  chatgptResponse: string
  claudeResponse: string
}) {
  return `
Tu es le directeur éditorial technique du BCVB.

Tu dois fusionner deux réponses IA pour produire UNE version finale supérieure aux deux.

Objectif :
- conserver la précision opérationnelle de ChatGPT ;
- conserver la profondeur éditoriale de Claude ;
- supprimer les répétitions ;
- renforcer la structure ;
- produire un document BCVB Rich Markdown strict ;
- augmenter le score qualité final.

Titre : ${params.title}
Famille : ${params.family}
Catégorie : ${params.category}

Règles :
- Ne garde que le meilleur des deux réponses.
- Supprime les contenus faibles, génériques ou redondants.
- Convertis tous les tableaux en blocs :::bcvb-table.
- Associe chaque situation à un bloc :::bcvb-diagram.
- Renforce les titres, sous-titres, transitions et encarts.
- Garde l’identité BCVB partout.
- Ne produis aucun commentaire hors document.

Réponse ChatGPT :
${params.chatgptResponse}

Réponse Claude :
${params.claudeResponse}

Produis maintenant la version fusionnée finale en BCVB Rich Markdown strict.
Commence directement par :::bcvb-hero.
`.trim()
}
