import {describe,it,expect,vi} from 'vitest'
import {createPlayerStaffBookService,mapStaffBook} from './playerStaffBookService'
export const book={player:{id:'p1',teamId:'t1',firstName:'Alice',lastName:'Test',teamName:'U15F',season:'2026-2027'},evaluationCount:2,activeObjectiveCount:1,generatedAt:'2026-10-08T00:00:00Z',tests:[{playerId:'p1',teamId:'t1',season:'2026-2027',testName:'Sprint',value:2,unit:'s',measuredAt:'2026-10-08',protocolVersion:'v1',contextNote:'PRIVATE'}],programs:[],monitoring:[]}
describe('internal book service',()=>{
 it('uses only the staff RPC and strips private fields',async()=>{
  const rpc=vi.fn().mockResolvedValue({data:book,error:null});const result=await createPlayerStaffBookService({rpc} as never).read('p1')
  expect(rpc).toHaveBeenCalledExactlyOnceWith('read_player_staff_book',{target_player_id:'p1'})
  expect(JSON.stringify(result)).not.toContain('PRIVATE');expect(result.tests[0].value).toBe(2)
 })
 it.each([null,[],{}, {...book,monitoring:[{}]}, {...book,evaluationCount:-1}, {...book,tests:null}, {...book,tests:[{...book.tests[0],teamId:'other'}]}, {...book,tests:[{...book.tests[0],value:'2'}]}])('refuses malformed or mixed content %j',value=>{expect(()=>mapStaffBook(value,'p1')).toThrow()})
 it('rejects another player',()=>expect(()=>mapStaffBook(book,'p2')).toThrow())
 it('does not fall back after denial',async()=>{const error={code:'42501'};const rpc=vi.fn().mockResolvedValue({data:null,error});await expect(createPlayerStaffBookService({rpc} as never).read('p1')).rejects.toBe(error);expect(rpc).toHaveBeenCalledTimes(1)})
})
