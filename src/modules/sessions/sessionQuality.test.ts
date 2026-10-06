import { describe, expect, it } from 'vitest'
import { analyzeSessionQuality } from './sessionQuality'
import { createCourtFrame, createSession, createSituation } from './sessionModels'

function buildCompleteSituation(order: number, durationMinutes: number) {
  return createSituation({
    order,
    title: `Situation ${order}`,
    durationMinutes,
    objective: 'Créer un avantage puis le convertir en tir ouvert.',
    organization: 'Deux files, un ballon, rotation après chaque passage.',
    instructions: 'Jouer avec intensité, lire le défenseur et finir équilibré.',
    coachCues: ['Appuis actifs', 'Regarder avant de décider'],
    evolution: 'Ajouter une aide défensive après la première fixation.',
    regression: 'Retirer l’aide et agrandir l’espace disponible.',
    observableCriteria: ['Avantage créé sans perdre le contrôle'],
    measurableCriteria: ['7 réussites sur 10 passages'],
    courtFrames: [createCourtFrame({ intent: 'Mise en place de la situation' })],
  })
}

describe('analyzeSessionQuality', () => {
  it('classe une séance complète comme excellente', () => {
    const session = createSession({
      title: 'Séance transition et partage',
      category: 'U13',
      durationMinutes: 20,
      expectedPlayers: 12,
      objectives: ['Créer un avantage en transition et partager la balle.'],
      situations: [
        buildCompleteSituation(1, 10),
        buildCompleteSituation(2, 10),
      ],
    })

    const report = analyzeSessionQuality(session)

    expect(report.score).toBe(100)
    expect(report.status).toBe('excellent')
    expect(report.missing).toEqual([])
  })

  it('signale une séance vide comme brouillon', () => {
    const session = createSession({
      title: '',
      durationMinutes: 90,
      expectedPlayers: 0,
      objectives: [],
      situations: [],
    })

    const report = analyzeSessionQuality(session)

    expect(report.status).toBe('brouillon')
    expect(report.score).toBeLessThan(70)
    expect(report.missing).toContain('infos générales complètes')
    expect(report.missing).toContain('terrain exploitable avec au moins 1 frame par situation')
    expect(report.warnings).toContain('Aucune situation pédagogique n’est créée.')
  })

  it('détecte un déroulé qui dépasse fortement la durée prévue', () => {
    const session = createSession({
      title: 'Séance surcharge',
      durationMinutes: 20,
      expectedPlayers: 12,
      objectives: ['Maintenir une intention collective claire.'],
      situations: [
        buildCompleteSituation(1, 20),
        buildCompleteSituation(2, 20),
      ],
    })

    const report = analyzeSessionQuality(session)

    expect(report.missing).toContain('déroulé cohérent')
    expect(report.warnings).toContain('Le déroulé dépasse fortement la durée prévue.')
  })
})
