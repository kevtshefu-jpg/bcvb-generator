export type QualityIssue = {
  key: string
  label: string
  severity: 'critical' | 'warning' | 'minor'
  current?: number
  expected?: number
  message: string
}

export type QualityBoostInput = {
  currentDocument: string
  family: string
  category: string
  audience: string
  season: string
  targetTitle: string
  qualityScore: number
  issues: QualityIssue[]
  editorialStandard: any
  sourceSummary?: string
  selectedReferentials?: string[]
}

function formatStandard(editorialStandard: any) {
  if (!editorialStandard) return '- Standard éditorial BCVB générique.'

  const mandatoryBlocks = Array.isArray(editorialStandard.mandatoryBlocks)
    ? editorialStandard.mandatoryBlocks
    : []
  const nonNegotiables = Array.isArray(editorialStandard.nonNegotiables)
    ? editorialStandard.nonNegotiables
    : []

  return [
    `- Nom : ${editorialStandard.label ?? editorialStandard.id ?? 'Standard BCVB'}`,
    `- Intention : ${editorialStandard.promptIntention ?? 'Document club premium, terrain et publiable.'}`,
    `- Format : ${editorialStandard.format ?? 'A4'}`,
    `- Volume : ${editorialStandard.volume ?? 'Adapté au document'}`,
    `- Public : ${editorialStandard.publicTarget ?? 'Coachs / staff BCVB'}`,
    `- Mise en page : ${editorialStandard.layout ?? 'Rendu éditorial BCVB premium'}`,
    `- Typographie : ${editorialStandard.typography ?? 'Hiérarchie claire et blocs lisibles'}`,
    `- Palette : ${editorialStandard.palette ?? 'Rouge BCVB, noir, blanc'}`,
    `- Seuils : ${editorialStandard.minTables ?? 0} tableaux, ${editorialStandard.minSituations ?? 0} situations, ${editorialStandard.minDiagrams ?? 0} schémas minimum`,
    mandatoryBlocks.length ? `- Blocs obligatoires : ${mandatoryBlocks.join(', ')}` : '',
    nonNegotiables.length ? `- Non négociables : ${nonNegotiables.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function formatIssues(issues: QualityIssue[]) {
  if (issues.length === 0) return '- Aucun écart formalisé : renforcer quand même la densité, la structure et le rendu.'

  return issues
    .map((issue) => {
      const count =
        typeof issue.current === 'number' && typeof issue.expected === 'number'
          ? ` (${issue.current}/${issue.expected})`
          : ''
      return `- [${issue.severity.toUpperCase()}] ${issue.label}${count} : ${issue.message}`
    })
    .join('\n')
}

function missingCount(issue: QualityIssue, fallback: number) {
  if (typeof issue.current !== 'number' || typeof issue.expected !== 'number') return fallback
  return Math.max(1, issue.expected - issue.current)
}

function buildIssueInstructions(
  issues: QualityIssue[],
  family: string,
  category: string
): string[] {
  const instructions: string[] = []

  for (const issue of issues) {
    if (issue.key === 'situations_missing') {
      const count = missingCount(issue, family.includes('coach') ? 4 : 2)
      instructions.push(`
Ajouter ${count} situation${count > 1 ? 's' : ''} pédagogique${count > 1 ? 's' : ''} complète${count > 1 ? 's' : ''}, adaptée${count > 1 ? 's' : ''} à ${category}.
Chaque situation doit contenir : numero, title, finalite, objectif, organisation, materiel, deroulement, consignes_joueurs, points_coach, criteres_reussite, variables_simplification, variables_complexification, evolution_1, evolution_2, transfert_match, erreurs_frequentes, corrections_possibles.
Chaque situation doit être directement utilisable par un coach sur le terrain.`.trim())
      continue
    }

    if (issue.key === 'diagrams_missing') {
      const count = missingCount(issue, 2)
      instructions.push(`
Ajouter au moins ${count} bloc${count > 1 ? 's' : ''} :::bcvb-diagram pour les situations sans schéma.
Chaque diagramme doit contenir : title, court: half ou full, intent, players, zones si besoin, ball si besoin, arrows, notes.
Les coordonnées doivent être en pourcentage de terrain entre 0 et 100.
Les schémas doivent représenter les étapes de l’exercice, pas seulement un terrain vide.
Choisir court: full pour transition, contre-attaque, repli, remontée de balle, 1c1 plein terrain, 3c2, 4c3, 5c4 ou récupération vers attaque rapide.
Choisir court: half pour spacing, shell drill, tir, closeout, aide placée ou attaque placée.
Produire au besoin step: 1 mise en place et step: 2 déroulement pour obtenir un schéma lisible façon FastDraw.`.trim())
      continue
    }

    if (issue.key === 'evaluation_missing') {
      instructions.push('Ajouter une grille d’évaluation joueur et une grille d’auto-évaluation coach dans des blocs :::bcvb-table ou :::bcvb-evaluation-grid typés.')
      continue
    }

    if (issue.key === 'planning_weak') {
      instructions.push(`
Renforcer la planification avec une planification annuelle, un cycle type 6 semaines, une progression par période, une séance type détaillée et des indicateurs de validation.
Les planifications doivent comporter des colonnes riches : période, thème dominant, objectifs prioritaires, contenus terrain, situations recommandées, critères de réussite, vigilance coach.`.trim())
      continue
    }

    if (issue.key === 'next_category_missing') {
      instructions.push(`Ajouter une section passerelle vers la catégorie suivante, adaptée à ${category}, avec attendus joueur, continuités pédagogiques et points de vigilance coach.`)
      continue
    }

    if (issue.key === 'raw_tables') {
      instructions.push('Convertir tous les tableaux en blocs :::bcvb-table typés. Aucun tableau markdown ne doit rester hors bloc typé.')
      continue
    }

    if (issue.key === 'editorial_style_weak') {
      instructions.push('Améliorer les titres, sous-titres, encarts, transitions, synthèses et respirations éditoriales sans ajouter de commentaire méta.')
      continue
    }

    if (issue.key === 'raw_blocks') {
      instructions.push('Nettoyer toutes les balises génériques, fermetures isolées et champs techniques visibles hors bloc. Aucun bloc vide ou ::: générique non typé ne doit rester.')
      continue
    }

    instructions.push(issue.message)
  }

  return Array.from(new Set(instructions))
}

export function buildQualityBoostPrompt(input: QualityBoostInput): string {
  const instructions = buildIssueInstructions(input.issues, input.family, input.category)

  return `
Tu es le comité éditorial technique du BCVB.

MISSION :
Améliorer le document ci-dessous pour le faire passer au niveau publication club / qualité éditeur.

Tu dois conserver ce qui est bon, corriger uniquement les manques, enrichir le document, respecter strictement le standard éditorial BCVB et produire une version complète prête à normaliser et publier.

DOCUMENT CIBLE :
- Famille : ${input.family}
- Catégorie : ${input.category}
- Audience : ${input.audience}
- Saison : ${input.season}
- Titre : ${input.targetTitle}
- Score qualité actuel : ${input.qualityScore}/100
- Objectif qualité éditeur : 92/100
- Référentiels mobilisés : ${input.selectedReferentials?.join(', ') || 'BCVB'}
${input.sourceSummary ? `- Source : ${input.sourceSummary}` : ''}

STANDARD À RESPECTER :
${formatStandard(input.editorialStandard)}

ÉCARTS QUALITÉ DÉTECTÉS :
${formatIssues(input.issues)}

CORRECTIONS OBLIGATOIRES :
${instructions.map((instruction) => `- ${instruction}`).join('\n')}

RÈGLES DE FORMAT :
- Répondre uniquement avec le document complet corrigé.
- Ne pas expliquer ce que tu fais.
- Ne pas utiliser de commentaires.
- Ne pas écrire “voici”.
- Utiliser uniquement les blocs BCVB typés.
- Ne jamais afficher de tableau markdown brut hors bcvb-table.
- Convertir les tableaux en blocs :::bcvb-table.
- Convertir les situations en blocs :::bcvb-situation.
- Chaque situation doit avoir son diagramme.
- Ajouter des blocs :::bcvb-diagram pour chaque situation.
- Chaque diagramme doit être exploitable par le moteur terrain.
- Court: full est obligatoire pour transition, repli, contre-attaque, 1c1 plein terrain, 3c2, 4c3, 5c4 et récupération vers attaque rapide.
- Court: half est réservé aux situations placées : tir, spacing, shell drill, closeout, aide défensive, attaque demi-terrain.
- Les diagrammes doivent être détaillés façon tableau tactique : joueurs, défenseurs, zones, couloirs, flèches différenciées et notes coachables.
- Renforcer les planifications faibles.
- Améliorer les grilles d’évaluation.
- Ajouter une passerelle catégorie suivante si absente.
- Aucune balise générique ::: non typée.
- Aucun bloc vide.
- Aucun champ technique visible hors bloc.
- Langage humain, terrain, précis, exploitable par un coach.

DOCUMENT ACTUEL :
---
${input.currentDocument.trim()}
---
`.trim()
}
