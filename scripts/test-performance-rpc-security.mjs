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
let checks=0
function check(value,label){assert.ok(value,label);checks++;console.log(`PASS ${label}`)}
for(const name of ['admin','technicalManager','coachA','coachSameTeam'])check(!(await clients[name].rpc('save_player_performance_test',input)).error,`${name}: test write allowed`)
for(const name of ['admin','technicalManager','coachA','coachSameTeam','teamStaff','parentReferent','coachParentOnly','coachTeamStaffOnly']){
 const tests=await clients[name].rpc('read_player_performance_tests',scope)
 check(!tests.error&&tests.data.some(r=>r.context_note===input.target_context_note),`${name}: scoped tests read allowed`)
 const programs=await clients[name].rpc('read_player_programs',scope)
 check(!programs.error&&programs.data.some(r=>r.title==='LOCAL_PRIVATE_PROGRAM'),`${name}: scoped programs read allowed`)
}
for(const name of ['coachB','dirigeant','member','inactive','authenticatedWithoutProfile']){
 for(const rpc of ['read_player_performance_tests','read_player_programs'])check((await clients[name].rpc(rpc,scope)).error?.code==='42501',`${name}: ${rpc} denied`)
 const helper=await clients[name].rpc('can_read_player_performance_scope',scope)
 check(!helper.error&&helper.data===false,`${name}: helper false`)
}
for(const name of ['coachB','dirigeant','member','inactive','authenticatedWithoutProfile','teamStaff','parentReferent'])check((await clients[name].rpc('save_player_performance_test',{...input,target_value:99})).error?.code==='42501',`${name}: test write denied`)
for(const rpc of ['read_player_performance_tests','read_player_programs','can_read_player_performance_scope'])check((await anon.rpc(rpc,scope)).error?.code==='42501',`anonymous: ${rpc} denied`)
check((await anon.rpc('save_player_performance_test',input)).error?.code==='42501','anonymous: test write denied')
for(const args of [{...scope,target_player_id:null},{...scope,target_team_id:null},{...scope,target_team_id:teamB},{...scope,target_player_id:playerB}]){
 for(const rpc of ['read_player_performance_tests','read_player_programs'])check((await clients.coachA.rpc(rpc,args)).error?.code==='42501',`${rpc}: missing/wrong scope denied`)
}
const membership=await clients.admin.rpc('add_or_reactivate_team_membership',{...scope,target_season:'2026-2027'});assert.equal(membership.error,null)
assert.equal((await clients.admin.rpc('deactivate_team_membership',{target_membership_id:membership.data[0].membership_id})).error,null)
try{
 for(const rpc of ['read_player_performance_tests','read_player_programs'])check((await clients.coachA.rpc(rpc,scope)).error?.code==='42501',`${rpc}: inactive membership denied`)
}finally{assert.equal((await clients.admin.rpc('add_or_reactivate_team_membership',{...scope,target_season:'2026-2027'})).error,null)}
const after=await clients.admin.rpc('read_player_performance_tests',scope)
check(!after.error&&after.data.find(r=>r.test_code===input.target_test_code)?.value===1,'denied writes leave test unchanged')
for(const signature of ['public.can_read_player_performance_scope(uuid,uuid)','public.read_player_performance_tests(uuid,uuid)','public.read_player_programs(uuid,uuid)','public.save_player_performance_test(uuid,uuid,text,text,text,date,numeric,text,text,text)']){
 check(sql(`select p.prosecdef and p.proowner=(select oid from pg_roles where rolname='postgres') and p.proconfig @> array['search_path=public, pg_temp'] and has_function_privilege('authenticated',p.oid,'EXECUTE') and not has_function_privilege('anon',p.oid,'EXECUTE') and not has_function_privilege('service_role',p.oid,'EXECUTE') and not exists(select 1 from aclexplode(p.proacl) a where a.grantee=0 and a.privilege_type='EXECUTE') from pg_proc p where p.oid='${signature}'::regprocedure`) === 't',`ACL/definer: ${signature}`)
}
console.log(`${checks} performance RPC security checks passed`)
