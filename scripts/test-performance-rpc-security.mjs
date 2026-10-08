import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'
import { loadLocalEnv, loadFixtureState, assertSafeTestEnvironment, projectRefFromUrl } from './rls-test-config.mjs'
const config=await loadLocalEnv()
assert.equal(projectRefFromUrl(config.url),'local')
assertSafeTestEnvironment(config,{operation:'performance RPC security integration',requireServiceRole:true})
const state=await loadFixtureState();assert.ok(state)
const options={auth:{persistSession:false,autoRefreshToken:false}}
const clients={}
for(const [name,account] of Object.entries(state.accounts)){
 const client=createClient(config.url,config.anonKey,options)
 assert.equal((await client.auth.signInWithPassword({email:account.email,password:account.password})).error,null)
 clients[name]=client
}
const anon=createClient(config.url,config.anonKey,options)
const {playerA,teamA,teamB,playerB}=state.fixtures
const scope={target_player_id:playerA,target_team_id:teamA}
const input={...scope,target_season:'2026-2027',target_test_code:'LOCAL_SECURITY_TEST',target_test_name:'Local security fixture',target_measured_at:'2026-10-08',target_value:1,target_unit:'s',target_protocol_version:'local-v1',target_context_note:'LOCAL_PRIVATE_CONTEXT'}
const container=execFileSync('docker',['ps','--filter','name=supabase_db_','--format','{{.Names}}'],{encoding:'utf8'}).trim().split('\n').find(n=>n.includes('bcvb-generator'))
assert.ok(container)
const sql=query=>execFileSync('docker',['exec',container,'psql','-U','postgres','-d','postgres','-X','-A','-t','-v','ON_ERROR_STOP=1','-c',query],{encoding:'utf8'}).trim()
for(const id of [playerA,teamA,state.accounts.admin.id])assert.match(id,/^[0-9a-f-]{36}$/)
// Synthetic local program only; no program save RPC exists in the current foundation.
sql(`insert into public.player_programs(player_id,team_id,season,title,start_date,end_date,level,status,safety_state,created_by,updated_by) values('${playerA}','${teamA}','2026-2027','LOCAL_PRIVATE_PROGRAM','2026-10-08','2026-10-15',1,'active','rouge','${state.accounts.admin.id}','${state.accounts.admin.id}')`)
sql(`insert into public.player_programs(player_id,team_id,season,title,start_date,end_date,level,status,safety_state,created_by,updated_by) select '${playerA}','${teamA}','2026-2027','LOCAL_PRIVATE_PROGRAM_OTHER','2026-10-08','2026-10-15',1,s,'vert','${state.accounts.admin.id}','${state.accounts.admin.id}' from unnest(array['draft','completed','cancelled']) s`)
const readRpcs=['read_player_performance_tests','read_player_programs','read_player_performance_test_summary','read_player_program_summary','read_player_evaluations','read_player_objectives']
const evaluation=await clients.admin.rpc('save_player_evaluation',{...scope,target_season:'2026-2027',target_period:'LOCAL_READ_SCOPE',target_category:'U13',target_evaluation_date:'2026-10-08',target_content_json:{marker:'LOCAL_PRIVATE_EVALUATION'}})
assert.equal(evaluation.error,null)
const objective=await clients.admin.rpc('save_player_objective',{...scope,target_objective_id:null,target_season:'2026-2027',target_title:'LOCAL_PRIVATE_OBJECTIVE',target_domain:'skills',target_description:'Local fixture',target_observable_criterion:'Local fixture',target_quantifiable_criterion:null,target_deadline:null,target_status:'a_travailler',target_linked_session_ids:[]})
assert.equal(objective.error,null)
let checks=0
function check(value,label){assert.ok(value,label);checks++;console.log(`PASS ${label}`)}
for(const name of ['admin','technicalManager','coachA','coachSameTeam'])check(!(await clients[name].rpc('save_player_performance_test',input)).error,`${name}: test write allowed`)
for(const name of ['admin','technicalManager','coachA','coachSameTeam','teamStaff','parentReferent','coachParentOnly','coachTeamStaffOnly']){
 const tests=await clients[name].rpc('read_player_performance_tests',scope)
 check(!tests.error&&tests.data.some(r=>r.context_note===input.target_context_note),`${name}: scoped tests read allowed`)
 const programs=await clients[name].rpc('read_player_programs',scope)
 check(!programs.error&&programs.data.some(r=>r.title==='LOCAL_PRIVATE_PROGRAM'),`${name}: scoped programs read allowed`)
 const testSummary=await clients[name].rpc('read_player_performance_test_summary',scope)
 check(!testSummary.error&&JSON.stringify(testSummary.data)===JSON.stringify([{test_count:1,last_measured_at:'2026-10-08'}]),`${name}: tests summary contains only count/date`)
 const programSummary=await clients[name].rpc('read_player_program_summary',scope)
 check(!programSummary.error&&JSON.stringify(programSummary.data)===JSON.stringify([{program_count:4,active_program_count:1}]),`${name}: programs summary contains only counts`)
 const evaluations=await clients[name].rpc('read_player_evaluations',scope)
 check(!evaluations.error&&evaluations.data.some(r=>r.evaluation_id===evaluation.data&&r.player_id===playerA&&r.team_id===teamA&&r.content_json.marker==='LOCAL_PRIVATE_EVALUATION'),`${name}: scoped evaluation content allowed`)
 const objectives=await clients[name].rpc('read_player_objectives',scope)
 check(!objectives.error&&objectives.data.some(r=>r.objective_id===objective.data&&r.player_id===playerA&&r.team_id===teamA&&r.title==='LOCAL_PRIVATE_OBJECTIVE'),`${name}: scoped objective content allowed`)
}
const emptyScope={target_player_id:playerB,target_team_id:teamB}
const emptyTests=await clients.coachB.rpc('read_player_performance_test_summary',emptyScope)
check(!emptyTests.error&&JSON.stringify(emptyTests.data)===JSON.stringify([{test_count:0,last_measured_at:null}]),'authorized empty test scope returns zero/null')
const emptyPrograms=await clients.coachB.rpc('read_player_program_summary',emptyScope)
check(!emptyPrograms.error&&JSON.stringify(emptyPrograms.data)===JSON.stringify([{program_count:0,active_program_count:0}]),'authorized empty program scope returns zeros')
for(const rpc of ['read_player_evaluations','read_player_objectives']){
 const empty=await clients.coachB.rpc(rpc,emptyScope)
 check(!empty.error&&Array.isArray(empty.data)&&empty.data.length===0,`${rpc}: authorized empty scope returns an empty list`)
 check((await clients.coachA.rpc(rpc,{target_player_id:playerA})).error?.code==='42501',`${rpc}: omitted team denied`)
}
for(const name of ['coachB','dirigeant','member','inactive','authenticatedWithoutProfile']){
 for(const rpc of readRpcs)check((await clients[name].rpc(rpc,scope)).error?.code==='42501',`${name}: ${rpc} denied`)
 const helper=await clients[name].rpc('can_read_player_performance_scope',scope)
 check(!helper.error&&helper.data===false,`${name}: helper false`)
}
for(const name of ['coachB','dirigeant','member','inactive','authenticatedWithoutProfile','teamStaff','parentReferent'])check((await clients[name].rpc('save_player_performance_test',{...input,target_value:99})).error?.code==='42501',`${name}: test write denied`)
const noProfile=clients.authenticatedWithoutProfile
const writer=await noProfile.rpc('can_manage_player_evaluation',scope)
check(!writer.error&&writer.data===false,'profileless: shared writer permission is false, never NULL')
check((await noProfile.rpc('save_player_evaluation',{...scope,target_season:'2026-2027',target_period:'LOCAL_SECURITY',target_category:'U13',target_evaluation_date:'2026-10-08',target_content_json:{local:true}})).error?.code==='42501','profileless: evaluation write denied')
check((await noProfile.rpc('save_player_objective',{...scope,target_objective_id:null,target_season:'2026-2027',target_title:'Local security',target_domain:'skills',target_description:'Local security',target_observable_criterion:'Local security',target_quantifiable_criterion:null,target_deadline:null,target_status:'a_travailler',target_linked_session_ids:[]})).error?.code==='42501','profileless: objective write denied')
for(const rpc of [...readRpcs,'can_read_player_performance_scope'])check((await anon.rpc(rpc,scope)).error?.code==='42501',`anonymous: ${rpc} denied`)
check((await anon.rpc('save_player_performance_test',input)).error?.code==='42501','anonymous: test write denied')
for(const args of [{...scope,target_player_id:null},{...scope,target_team_id:null},{...scope,target_team_id:teamB},{...scope,target_player_id:playerB}]){
 for(const rpc of readRpcs)check((await clients.coachA.rpc(rpc,args)).error?.code==='42501',`${rpc}: missing/wrong scope denied`)
}
const membership=await clients.admin.rpc('add_or_reactivate_team_membership',{...scope,target_season:'2026-2027'});assert.equal(membership.error,null)
assert.equal((await clients.admin.rpc('deactivate_team_membership',{target_membership_id:membership.data[0].membership_id})).error,null)
try{
 for(const rpc of readRpcs)check((await clients.coachA.rpc(rpc,scope)).error?.code==='42501',`${rpc}: inactive membership denied`)
}finally{assert.equal((await clients.admin.rpc('add_or_reactivate_team_membership',{...scope,target_season:'2026-2027'})).error,null)}
const after=await clients.admin.rpc('read_player_performance_tests',scope)
check(!after.error&&after.data.find(r=>r.test_code===input.target_test_code)?.value===1,'denied writes leave test unchanged')
// Internal book is a distinct, minimized endpoint, restricted to staff roles.
assert.equal((await clients.admin.rpc('save_player_performance_test',{...input,target_season:'2025-2026',target_measured_at:'2025-10-08',target_test_name:'OLD_SEASON_TEST'})).error,null)
for(const name of ['admin','technicalManager','coachA','coachSameTeam','teamStaff','coachParentOnly','coachTeamStaffOnly']){
 const book=await clients[name].rpc('read_player_staff_book',{target_player_id:playerA})
 check(!book.error&&book.data.player.id===playerA&&book.data.player.teamId===teamA&&book.data.player.season==='2026-2027'&&book.data.tests.length===1&&book.data.programs.length===4&&book.data.evaluationCount===1&&book.data.activeObjectiveCount===1,`${name}: internal book canonical season allowed`)
 const serialized=JSON.stringify(book.data)
 check(book.data.monitoring.length===0&&!serialized.includes('contextNote')&&!serialized.includes('safetyState')&&!serialized.includes('weeks')&&!serialized.includes('LOCAL_PRIVATE_CONTEXT')&&!serialized.includes('LOCAL_PRIVATE_EVALUATION')&&!serialized.includes('OLD_SEASON_TEST'),`${name}: internal book minimizes private content`)
}
for(const name of ['coachB','dirigeant','member','inactive','authenticatedWithoutProfile','parentReferent'])check((await clients[name].rpc('read_player_staff_book',{target_player_id:playerA})).error?.code==='42501',`${name}: internal book denied`)
check((await anon.rpc('read_player_staff_book',{target_player_id:playerA})).error?.code==='42501','anonymous: internal book denied')
check((await clients.coachA.rpc('read_player_staff_book',{target_player_id:null})).error?.code==='42501','internal book: missing player denied')
const emptyBook=await clients.coachB.rpc('read_player_staff_book',{target_player_id:playerB})
check(!emptyBook.error&&emptyBook.data.tests.length===0&&emptyBook.data.programs.length===0,'internal book: authorized empty player allowed')
assert.equal((await clients.admin.rpc('deactivate_team_membership',{target_membership_id:membership.data[0].membership_id})).error,null)
try{check((await clients.coachA.rpc('read_player_staff_book',{target_player_id:playerA})).error?.code==='42501','internal book: inactive membership denied')}
finally{assert.equal((await clients.admin.rpc('add_or_reactivate_team_membership',{...scope,target_season:'2026-2027'})).error,null)}
for(const signature of ['public.read_player_staff_book(uuid)','public.can_manage_player_evaluation(uuid,uuid)','public.can_read_player_performance_scope(uuid,uuid)','public.read_player_performance_tests(uuid,uuid)','public.read_player_programs(uuid,uuid)','public.read_player_performance_test_summary(uuid,uuid)','public.read_player_program_summary(uuid,uuid)','public.read_player_evaluations(uuid,uuid)','public.read_player_objectives(uuid,uuid)','public.save_player_performance_test(uuid,uuid,text,text,text,date,numeric,text,text,text)']){
 check(sql(`select p.prosecdef and p.proowner=(select oid from pg_roles where rolname='postgres') and p.proconfig @> array['search_path=public, pg_temp'] and has_function_privilege('authenticated',p.oid,'EXECUTE') and not has_function_privilege('anon',p.oid,'EXECUTE') and not has_function_privilege('service_role',p.oid,'EXECUTE') and not exists(select 1 from aclexplode(p.proacl) a where a.grantee=0 and a.privilege_type='EXECUTE') from pg_proc p where p.oid='${signature}'::regprocedure`) === 't',`ACL/definer: ${signature}`)
}
console.log(`${checks} performance RPC security checks passed`)
