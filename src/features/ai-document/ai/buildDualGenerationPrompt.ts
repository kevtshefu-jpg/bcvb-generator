export function buildOpenAiProductionPrompt(basePrompt: string): string {
  return `
VERSION 1 — PRIORITÉ STRUCTURE ET CONFORMITÉ TECHNIQUE

Objectif : produire la version la plus propre techniquement pour le moteur BCVB.
- Respect strict des blocs :::bcvb-*.
- Tableaux uniquement dans :::bcvb-table ou blocs table spécialisés.
- Diagrammes complets et parsables.
- Cohérence de structure, quotas, titres et métadonnées.
- Aucun commentaire méta.

${basePrompt}
`.trim()
}

export function buildClaudeProductionPrompt(basePrompt: string): string {
  return `
VERSION 2 — PRIORITÉ STYLE, PROFONDEUR ET LECTURE ÉDITORIALE

Objectif : produire la version la plus humaine, dense et coachable, sans casser le format BCVB.
- Écriture fluide et professionnelle.
- Transitions éditoriales naturelles.
- Situations pédagogiques concrètes et exploitables.
- Richesse des planifications, encarts, critères et synthèses.
- Respect strict des blocs :::bcvb-*.
- Aucun commentaire méta.

${basePrompt}
`.trim()
}

export function buildFusionPrompt(openAiText: string, claudeText: string, standard: any): string {
  return `
Tu es le comité éditorial technique du BCVB.

MISSION :
Fusionner les deux versions ci-dessous en une seule version finale premium.

RÈGLES DE FUSION :
- Conserver la structure BCVB la plus propre.
- Conserver le style éditorial le plus humain.
- Supprimer les doublons.
- Convertir tous les tableaux en blocs :::bcvb-table.
- Vérifier que chaque situation a un diagramme.
- Corriger les blocs, titres, champs et diagrammes non conformes.
- Produire une seule version finale.
- Atteindre le standard qualité éditeur.
- Répondre uniquement avec le document final complet.

STANDARD :
${JSON.stringify(standard ?? {}, null, 2)}

VERSION 1 :
---
${openAiText}
---

VERSION 2 :
---
${claudeText}
---
`.trim()
}
