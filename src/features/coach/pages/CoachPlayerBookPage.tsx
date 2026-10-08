import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { playerStaffBookService } from '../playerStaffBookService'
import type { PlayerBookSnapshot } from '../playerBookAggregation'

export default function CoachPlayerBookPage(){
 const {id=''}=useParams()
 const [book,setBook]=useState<PlayerBookSnapshot|null>(null)
 const [error,setError]=useState(false)
 const [exportError,setExportError]=useState(false)
 const [busy,setBusy]=useState(false)
 const generation=useRef(0)
 const currentId=useRef(id);currentId.current=id
 useEffect(()=>{
  const token=++generation.current
  setBook(null);setError(false);setExportError(false);setBusy(false)
  void playerStaffBookService.read(id).then(value=>{if(generation.current===token)setBook(value)}).catch(()=>{if(generation.current===token)setError(true)})
  return()=>{generation.current++}
 },[id])
 const ready=book?.player.id===id?book:null
 async function download(format:'pdf'|'xlsx'){
  if(!ready||busy)return
  const token=generation.current
  const valid=()=>generation.current===token&&currentId.current===id
  setBusy(true);setExportError(false)
  try{
   const fresh=await playerStaffBookService.read(id)
   if(!valid())return
   if(format==='pdf'){
    const {buildPlayerBookPdf}=await import('../playerBookPdfExport')
    if(!valid())return
    const result=await buildPlayerBookPdf(fresh,'staff')
    if(!valid())return
    result.pdf.save(result.filename)
   }else{
    const {buildPlayerBookXlsx}=await import('../playerBookXlsxExport')
    if(!valid())return
    const result=await buildPlayerBookXlsx(fresh,'staff')
    if(!valid())return
    const url=URL.createObjectURL(new Blob([new Uint8Array(result.buffer)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}))
    try{const link=document.createElement('a');link.href=url;link.download=result.filename;link.click()}finally{URL.revokeObjectURL(url)}
   }
   if(valid())setBook(fresh)
  }catch{if(valid())setExportError(true)}finally{if(valid())setBusy(false)}
 }
 return <main className="bcvb-page coach-tool-page" aria-busy={!ready&&!error}>
  <section className="bcvb-dashboard-hero"><div><p className="bcvb-eyebrow">Suivi interne</p><h1 className="bcvb-title-xl">Player Book{ready?` — ${ready.player.firstName} ${ready.player.lastName}`:''}</h1><p>Version coach/staff · usage interne BCVB. Le suivi de santé et de charge est exclu.</p></div></section>
  {!ready&&!error?<p role="status">Chargement du Player Book…</p>:null}
  {error?<section className="bcvb-tool-card" role="alert"><h2>Player Book indisponible</h2><p>Les données ou les droits nécessaires n’ont pas pu être vérifiés.</p></section>:null}
  {ready?<>
   <section className="bcvb-tool-card"><h2>{ready.player.teamName} · {ready.player.season}</h2><p>Évaluations : {ready.evaluationCount} · Objectifs actifs : {ready.activeObjectiveCount}</p>
    <div className="bcvb-actions"><button className="bcvb-button" disabled={busy} onClick={()=>void download('pdf')}>Exporter PDF</button><button className="bcvb-button-secondary" disabled={busy} onClick={()=>void download('xlsx')}>Exporter XLSX</button></div>
    {busy?<p role="status">Préparation de l’export…</p>:null}{exportError?<p role="alert">Export impossible. Les données ou les droits n’ont pas pu être confirmés.</p>:null}
   </section>
   <section className="bcvb-tool-card"><h2>Tests physiques</h2>{ready.tests.length?<ul>{ready.tests.map((t,i)=><li key={i}>{t.testName} — {t.value} {t.unit} · {t.measuredAt}</li>)}</ul>:<p>Aucun test enregistré pour cette saison.</p>}</section>
   <section className="bcvb-tool-card"><h2>Programmes</h2>{ready.programs.length?<ul>{ready.programs.map((p,i)=><li key={i}>{p.title} · {p.startDate} → {p.endDate} · Niveau {p.level}</li>)}</ul>:<p>Aucun programme enregistré pour cette saison.</p>}</section>
  </>:null}
  <Link className="bcvb-button-secondary" to="/dashboard">Retour au tableau de bord</Link>
 </main>
}
