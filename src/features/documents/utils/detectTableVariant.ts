export type BCVBTableVariant =
  | 'default'
  | 'planning'
  | 'material'
  | 'evaluation'
  | 'session'
  | 'matrix'
  | 'dashboard'
  | 'compact'
  | 'summary'

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function hasEvery(headers: string, words: string[]) {
  return words.every((word) => headers.includes(word))
}

function hasSome(headers: string, words: string[]) {
  return words.some((word) => headers.includes(word))
}

export function detectTableVariant(headers: string[]): BCVBTableVariant {
  const joined = normalize(headers.join(' '))

  if (
    hasSome(joined, ['periode', 'phase']) &&
    hasSome(joined, ['objectif', 'objectifs']) &&
    hasSome(joined, ['contenu', 'contenus', 'situation', 'situations'])
  ) {
    return 'planning'
  }

  if (hasEvery(joined, ['materiel', 'quantite']) || hasEvery(joined, ['materiel', 'utilisation'])) {
    return 'material'
  }

  if (hasSome(joined, ['temps', 'duree']) && hasSome(joined, ['bloc']) && hasSome(joined, ['organisation'])) {
    return 'session'
  }

  if (hasSome(joined, ['attendu', 'observable', 'critere']) && hasSome(joined, ['regulation', 'coach', 'terrain'])) {
    return 'evaluation'
  }

  if (
    hasSome(joined, ['competence', 'competences', 'domaine']) &&
    hasSome(joined, ['age', 'categorie', 'niveau', 'u7', 'u9', 'u11', 'u13', 'u15'])
  ) {
    return 'matrix'
  }

  if (
    hasSome(joined, ['indicateur', 'indicateurs', 'suivi', 'tableau de bord']) &&
    hasSome(joined, ['objectif', 'statut', 'echeance', 'responsable'])
  ) {
    return 'dashboard'
  }

  if (
    headers.length >= 6 ||
    (hasSome(joined, ['periode', 'theme']) &&
      hasSome(joined, ['regulation', 'charge', 'complexite', 'transfert']))
  ) {
    return 'compact'
  }

  if (hasSome(joined, ['partie', 'section', 'chapitre']) && hasSome(joined, ['contenu']) && hasSome(joined, ['utilite', 'terrain'])) {
    return 'summary'
  }

  return 'default'
}
