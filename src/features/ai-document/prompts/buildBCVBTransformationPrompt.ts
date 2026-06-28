import {
  getDocumentStandard,
  resolveDocumentFamilyId,
  type DocumentFamilyId,
} from '../../documents/standards/documentFamilyStandards'

export type BCVBTransformationDocumentType =
  | 'Guide coach'
  | 'Cahier technique'
  | 'Séance'
  | 'Situation pédagogique'
  | 'Planification annuelle'
  | 'Document cadre'
  | 'Support de formation'
  | 'Newsletter'
  | 'Autre'

export type BCVBTransformationLevel =
  | 'Nettoyage simple'
  | 'Harmonisation BCVB'
  | 'Enrichissement technique'
  | 'Qualité éditeur'
  | 'Référence club'

export type BuildBCVBTransformationPromptInput = {
  sourceText: string
  sourceKind?: 'text' | 'attachment' | 'library'
  sourceFileName?: string
  targetDocumentType: BCVBTransformationDocumentType
  targetCategory: string
  targetAudience: string
  targetSeason: string
  transformationLevel: BCVBTransformationLevel
  family?: DocumentFamilyId
}

function getTargetStructure(documentType: BCVBTransformationDocumentType) {
  if (documentType === 'Séance') {
    return `
STRUCTURE CIBLE — SÉANCE
- :::bcvb-hero
- :::bcvb-identity
- :::bcvb-section : objectifs
- :::bcvb-table : déroulé minute par minute
- :::bcvb-situation pour chaque exercice
- :::bcvb-diagram immédiatement après chaque situation
- :::bcvb-table : critères de réussite
- :::bcvb-conclusion`
  }

  if (documentType === 'Planification annuelle') {
    return `
STRUCTURE CIBLE — PLANIFICATION
- :::bcvb-hero
- :::bcvb-identity
- :::bcvb-table : planification annuelle
- :::bcvb-table : progression par périodes
- :::bcvb-table : contenus prioritaires
- :::bcvb-table : critères d’évaluation
- :::bcvb-conclusion`
  }

  if (documentType === 'Document cadre') {
    return `
STRUCTURE CIBLE — DOCUMENT CADRE
- :::bcvb-hero
- :::bcvb-identity
- :::bcvb-section : contexte
- :::bcvb-section : principes
- :::bcvb-table : règles / attendus / responsabilités
- :::bcvb-section : application terrain
- :::bcvb-conclusion`
  }

  if (documentType === 'Guide coach' || documentType === 'Cahier technique') {
    return `
STRUCTURE CIBLE — GUIDE COACH / CAHIER TECHNIQUE
- :::bcvb-hero
- :::bcvb-identity
- :::bcvb-section : finalité
- :::bcvb-table : sommaire éditorial
- :::bcvb-section : rôle du coach
- :::bcvb-table : objectifs de formation
- :::bcvb-table : planification annuelle
- :::bcvb-table : progression opérationnelle
- :::bcvb-table : cycle type 6 semaines
- :::bcvb-table : séance type
- minimum 6 situations pédagogiques
- minimum 6 diagrammes
- :::bcvb-table : critères d’évaluation
- :::bcvb-section : relation familles / club si catégorie jeune
- :::bcvb-section : passerelle catégorie suivante
- :::bcvb-conclusion
- :::bcvb-poster-summary`
  }

  return `
STRUCTURE CIBLE — DOCUMENT BCVB
- :::bcvb-hero
- :::bcvb-identity
- :::bcvb-section : contexte et objectifs
- :::bcvb-table si un tableau clarifie le contenu
- :::bcvb-situation et :::bcvb-diagram si le contenu est terrain
- :::bcvb-conclusion`
}

export function buildBCVBTransformationPrompt({
  sourceText,
  sourceKind = 'text',
  sourceFileName,
  targetDocumentType,
  targetCategory,
  targetAudience,
  targetSeason,
  transformationLevel,
  family,
}: BuildBCVBTransformationPromptInput) {
  const resolvedFamily = family ?? resolveDocumentFamilyId(targetDocumentType)
  const standard = getDocumentStandard(resolvedFamily)

  return `
CADRE DE TRANSFORMATION BCVB — DOCUMENT ÉDITEUR

Mission :
Transformer le document source ci-dessous en document BCVB structuré, enrichi, professionnel et directement collable dans le site BCVB Référentiel.

Paramètres cibles :
- Type de document : ${targetDocumentType}
- Catégorie : ${targetCategory || 'Général BCVB'}
- Audience : ${targetAudience || 'Interne club'}
- Saison : ${targetSeason || 'Générique / intemporel'}
- Niveau d’enrichissement : ${transformationLevel}
- Source : ${sourceKind === 'attachment' ? `pièce jointe${sourceFileName ? ` (${sourceFileName})` : ''}` : sourceKind === 'library' ? 'document bibliothèque' : 'texte collé'}

STANDARD FAMILLE DOCUMENTAIRE À APPLIQUER
- Famille : ${standard.label}
- Intention : ${standard.promptIntention}
- Format : ${standard.format}
- Volume attendu : ${standard.volume}
- Public cible : ${standard.publicTarget}
- Mise en page : ${standard.layout}
- Typographie : ${standard.typography}
- Première page attendue : ${standard.firstPage}
- Palette : ${standard.palette}
- Éléments graphiques : ${standard.graphicElements}
- Tableaux minimum : ${standard.minTables}
- Situations minimum : ${standard.minSituations}
- Diagrammes minimum : ${standard.minDiagrams}
- Règles non négociables :
${standard.nonNegotiables.map((item) => `  - ${item}`).join('\n')}
- Blocs obligatoires :
${standard.mandatoryBlocks.map((item) => `  - ${item}`).join('\n')}

${sourceKind === 'attachment'
  ? `NOTE SOURCE PIÈCE JOINTE
Le contenu ci-dessous provient d’une pièce jointe. Il peut contenir des erreurs d’extraction, des coupures ou des pertes de mise en page. Tu dois le restructurer proprement, corriger les erreurs d’extraction, reconstruire les tableaux, ne pas recopier le document brut et produire une vraie version BCVB éditorialisée.`
  : ''}

OBJECTIFS DE TRANSFORMATION
1. Conserver l’intention utile du document source.
2. Corriger les maladresses, incohérences et formulations floues.
3. Supprimer les répétitions inutiles.
4. Enrichir le fond avec des contenus opérationnels.
5. Adapter le vocabulaire à l’identité BCVB.
6. Intégrer naturellement la philosophie : “Défendre Fort, Courir et Partager la Balle”.
7. Intégrer l’identité défensive : défense Homme à Homme.
8. Intégrer les axes : intensité, agressivité, maîtrise, jeu.
9. Utiliser la démarche pédagogique : je découvre / je m’exerce / je retranscris en match / je régule.
10. Produire uniquement un document final structuré en blocs BCVB typés.
11. Ajouter des tableaux propres lorsque cela améliore la lisibilité.
12. Ajouter des situations pédagogiques si le type s’y prête.
13. Ajouter des diagrammes terrain si le type s’y prête.
14. Ajouter une planification si le document est un guide, cahier technique ou planification.
15. Ajouter des critères de réussite et points de vigilance.
16. Terminer par une conclusion opérationnelle.
17. Ne jamais recopier le document brut tel quel : le transformer, le restructurer et l’éditorialiser.
18. Corriger les ruptures de lignes, artefacts d’extraction, numéros de pages et tableaux abîmés.

FORMAT STRICT DE SORTIE
- Utiliser uniquement des blocs typés \`:::bcvb-*\`.
- Blocs attendus selon le contenu : \`:::bcvb-hero\`, \`:::bcvb-identity\`, \`:::bcvb-chapter\`, \`:::bcvb-table\`, \`:::bcvb-planning-table\`, \`:::bcvb-progression\`, \`:::bcvb-situation\`, \`:::bcvb-diagram\`, \`:::bcvb-callout\`, \`:::bcvb-evaluation-grid\`, \`:::bcvb-conclusion\`.
- Ne jamais utiliser de bloc générique \`:::\`.
- Ne jamais afficher de champ technique hors bloc.
- Ne jamais écrire de titre important hors bloc typé.
- Chaque tableau doit être dans un bloc \`:::bcvb-table\`.
- Chaque situation doit être dans \`:::bcvb-situation\`.
- Chaque diagramme doit être dans \`:::bcvb-diagram\`.
- Chaque situation pédagogique doit être suivie immédiatement d’un diagramme.
- Ne jamais laisser les champs \`players\`, \`arrows\`, \`zones\`, \`ball\` visibles hors bloc diagramme.
- Ne jamais produire de tableau brut hors bloc.
- Ne jamais afficher de mention d’outil, d’automatisation ou de génération dans le contenu public.
- Produire uniquement le contenu final, sans phrase d’introduction.
- Pour un guide coach : minimum 8 à 12 blocs BCVB typés, planification annuelle, progression opérationnelle, séance type, critères d’évaluation, outils coach, relation familles et passerelle catégorie suivante.
- Pour un cahier de catégorie : minimum 6 situations pédagogiques.
- Pour chaque grande situation : produire au minimum 2 diagrammes si cela aide à comprendre la mise en place et l’évolution.
- Interdiction : bloc \`:::bcvb-diagram\` sans players, zones ou arrows lorsque le schéma décrit une organisation terrain.

RÈGLE ABSOLUE TABLEAUX
Aucun tableau Markdown ne doit être écrit hors d’un bloc typé.
Si un tableau est nécessaire, il doit toujours être dans un bloc \`:::bcvb-table\`.

Exemple obligatoire :
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

FORMAT DIAGRAMME OBLIGATOIRE
\`\`\`md
:::bcvb-diagram
title: Exemple de schéma terrain
court: half
intent: Visualiser l’organisation de départ et l’intention coach.
players:
  - id: J1
    team: offense
    x: 50
    y: 65
    label: 1
  - id: P1
    team: cone
    x: 25
    y: 42
    label: Plot
ball:
  x: 50
  y: 65
arrows:
  - type: dribble
    from: J1
    toX: 25
    toY: 42
    label: action
notes:
  - Le coach sécurise les espaces et corrige les appuis.
:::
\`\`\`

${getTargetStructure(targetDocumentType)}

DOCUMENT SOURCE À TRANSFORMER
---
${sourceText.trim() || '[Coller ici le document source à transformer]'}
---
`.trim()
}
