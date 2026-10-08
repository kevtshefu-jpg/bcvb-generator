import { assertPlayerBookScope, type PlayerBookSnapshot } from './playerBookAggregation'
// Sensitive monitoring is excluded from every downloadable audience until explicit, audited authorization exists.
export const canExportPlayerMonitoring=(_audience:PlayerBookAudience):boolean=>false
export const canExportBookObjectives=(audience:PlayerBookAudience):boolean=>audience==='staff'
export type PlayerBookAudience='joueur'|'staff'|'parent'
export type PlayerBookExportFormat='pdf'|'docx'|'xlsx'
export type PlayerBookExportModel={title:string;filenameBase:string;audience:PlayerBookAudience;format:PlayerBookExportFormat;sections:{id:string;title:string;available:boolean}[]}
const safe=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase()
export function buildPlayerBookExportModel(snapshot:PlayerBookSnapshot,audience:PlayerBookAudience,format:PlayerBookExportFormat):PlayerBookExportModel{
 assertPlayerBookScope(snapshot)
 if(!['joueur','staff','parent'].includes(audience))throw new Error('PLAYER_BOOK_AUDIENCE_UNSUPPORTED')
 if(!['pdf','xlsx','docx'].includes(format))throw new Error('PLAYER_BOOK_FORMAT_UNSUPPORTED')
 const name=`${snapshot.player.firstName} ${snapshot.player.lastName}`
 return{title:`BCVB — Player Book — ${name}`,filenameBase:`bcvb-player-book-${safe(name)}-${safe(snapshot.player.season)}-${audience}`,audience,format,sections:[
 {id:'profil',title:'Profil',available:true},
 {id:'evaluations-objectifs',title:'Évaluations et objectifs',available:snapshot.evaluationCount>0||snapshot.activeObjectiveCount>0},
 {id:'objectifs',title:'Objectifs pédagogiques',available:canExportBookObjectives(audience)&&Boolean(snapshot.objectives?.length)},
 {id:'tests',title:'Tests physiques',available:snapshot.tests.length>0},
 {id:'monitoring',title:'Suivi et charge',available:canExportPlayerMonitoring(audience)&&snapshot.monitoring.length>0},
 {id:'programmes',title:'Programmes',available:snapshot.programs.length>0},
 ]}
}
