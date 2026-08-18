import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { canManageOperationalPlanning, slotsConflict } from './operationalPlanningService'

const base={weekday:2,start_time:'18:00',end_time:'19:30',location_name:'Salle A',valid_from:'2026-09-01',valid_until:'2027-06-30'}
describe('conflits du planning opérationnel',()=>{
  it('détecte même salle, même jour, horaires et périodes superposés',()=>expect(slotsConflict(base,{...base,start_time:'19:00',end_time:'20:00'})).toBe(true))
  it('accepte deux créneaux successifs',()=>expect(slotsConflict(base,{...base,start_time:'19:30',end_time:'21:00'})).toBe(false))
  it('accepte le même horaire dans deux salles',()=>expect(slotsConflict(base,{...base,location_name:'Salle B'})).toBe(false))
  it('n’invente pas de conflit sans lieu',()=>expect(slotsConflict({...base,location_name:null},base)).toBe(false))
  it('utilise des cartes mobiles tactiles sans tableau compressé',async()=>{const [page,css]=await Promise.all([readFile(resolve(process.cwd(),'src/features/operational-planning/OperationalPlanningPage.tsx'),'utf8'),readFile(resolve(process.cwd(),'src/features/operational-planning/operationalPlanning.css'),'utf8')]);expect(page).not.toMatch(/<table/i);expect(css).toContain('@media(max-width:600px)');expect(css).toContain('min-height:44px')})
})

describe('capacités UI du planning opérationnel',()=>{
  it('donne à technical_manager les mêmes capacités qu’au responsable technique',()=>{
    expect(canManageOperationalPlanning('technical_manager')).toBe(true)
    expect(canManageOperationalPlanning('technical_manager')).toBe(canManageOperationalPlanning('responsable_technique'))
  })
  it('maintient coach et dirigeant en lecture seule',()=>{
    expect(canManageOperationalPlanning('coach')).toBe(false)
    expect(canManageOperationalPlanning('dirigeant')).toBe(false)
  })
})
