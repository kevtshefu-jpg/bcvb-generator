import { describe, expect, it } from 'vitest'
import { createCourtFrame, createSession, createSituation } from './sessionModels'
import { ensurePersistentSituationIds, mapBuilderSessionToWritePayload, syncStateAfterEdit } from './sessionBuilderServerAdapter'

describe('sessionBuilderServerAdapter', () => {
  it('préserve les valeurs du Builder sans inventer les champs métier absents', () => {
    const source = createSession({ title: '', theme: '', subTheme: '', objectives: [], equipment: [], qualityScore: 0, situations: [] })
    const payload = mapBuilderSessionToWritePayload(source)
    expect(payload.session).toMatchObject({ title: '', theme: '', sub_theme: '', quality_score: 0 })
    expect(payload.session.content_json).toMatchObject({ objectives: [], equipment: [] })
    expect(payload.situations).toEqual([])
  })


  it('transmet le score canonique et ses avertissements dans le payload serveur', () => {
    const source = createSession({
      qualityScore: 80,
      qualityWarnings: ['Durée à vérifier'],
    })
    const payload = mapBuilderSessionToWritePayload(source)

    expect(payload.session.quality_score).toBe(80)
    expect(payload.session.content_json).toMatchObject({
      qualityWarnings: ['Durée à vérifier'],
    })
  })

  it('attribue une seule fois des UUID persistables aux blocs locaux', () => {
    const source = createSession({ situations: [createSituation({ id: 'situation-locale' })] })
    const once = ensurePersistentSituationIds(source, () => '10000000-0000-4000-8000-000000000001')
    const twice = ensurePersistentSituationIds(once, () => '20000000-0000-4000-8000-000000000002')
    expect(twice.situations[0].id).toBe('10000000-0000-4000-8000-000000000001')
    expect(mapBuilderSessionToWritePayload(twice).situations[0].id).toBe(once.situations[0].id)
  })

  it('conserve le terrain BCVB vierge par défaut intact', () => {
    const frame = createCourtFrame()
    expect(frame.objects).toEqual([])
    expect(frame.arrows).toEqual([])
  })

  it('distingue brouillon local et modifications serveur non sauvegardées', () => {
    expect(syncStateAfterEdit('local_only')).toBe('local_only')
    expect(syncStateAfterEdit('saved')).toBe('dirty')
    expect(syncStateAfterEdit('conflict')).toBe('conflict')
  })
})
