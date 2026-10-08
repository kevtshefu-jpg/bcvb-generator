import { normalizePlayerBookPdfText, registerPlayerBookPdfFonts } from './playerBookPdfFont'
import { objectiveStatusLabel, type PlayerBookSnapshot } from './playerBookAggregation'
import { buildPlayerBookExportModel, canExportPlayerMonitoring, type PlayerBookAudience } from './playerBookExportModel'

export function playerBookToText(snapshot:PlayerBookSnapshot,audience:PlayerBookAudience){
 const model=buildPlayerBookExportModel(snapshot,audience,'pdf')
 const lines=[model.title,`Équipe : ${snapshot.player.teamName}`,`Saison : ${snapshot.player.season}`,`Destinataire : ${audience}`]
 for(const section of model.sections){
  if(!section.available)continue
  lines.push('',section.title)
  if(section.id==='evaluations-objectifs')lines.push(`Évaluations : ${snapshot.evaluationCount}`,`Objectifs actifs : ${snapshot.activeObjectiveCount}`)
  if(section.id==='evaluations')lines.push(...(snapshot.evaluations??[]).map(e=>`${e.date} — ${e.period}${e.category?` — ${e.category}`:''}`))
  if(section.id==='objectifs')for(const o of snapshot.objectives??[]){lines.push(`${o.title} — ${o.domain} — ${objectiveStatusLabel(o.status)}`,`Objectif : ${o.targetDescription}`,`Critère observable : ${o.observableCriterion}`);if(o.quantifiableCriterion)lines.push(`Critère quantifiable : ${o.quantifiableCriterion}`);if(o.deadline)lines.push(`Échéance : ${o.deadline}`)}
  if(section.id==='tests')lines.push(...snapshot.tests.map(t=>`${t.testName} — ${t.value} ${t.unit} — ${t.measuredAt}`))
  if(section.id==='monitoring' && canExportPlayerMonitoring(audience))lines.push(...snapshot.monitoring.map(m=>`${m.monitoredOn} — disponibilité : ${m.availability}`))
  if(section.id==='programmes')lines.push(...snapshot.programs.map(p=>`${p.title} — ${p.startDate} au ${p.endDate} — niveau ${p.level}`))
 }
 return{model,text:lines.join('\n')}
}

export async function buildPlayerBookPdf(snapshot:PlayerBookSnapshot,audience:PlayerBookAudience){
 const {model,text}=playerBookToText(snapshot,audience)
 const {jsPDF}=await import('jspdf')
 const printableText=normalizePlayerBookPdfText(text)
 const pdf=new jsPDF({unit:'pt',format:'a4'})
 registerPlayerBookPdfFonts(pdf)
 const margin=48,width=pdf.internal.pageSize.getWidth(),height=pdf.internal.pageSize.getHeight(),maxWidth=width-2*margin,bottom=height-64
 pdf.setProperties({title:model.title,subject:'BCVB Performance System',creator:'BCVB Référentiel'})
 let y=margin
 const sectionTitles=new Set(model.sections.filter(s=>s.available).map(s=>s.title.normalize('NFC')))
 const objectiveTitles=new Set((snapshot.objectives??[]).map(o=>`${o.title} — ${o.domain} — ${objectiveStatusLabel(o.status)}`.normalize('NFC')))
 const nextPage=()=>{pdf.addPage();y=margin}
 const writeLine=(value:string,kind:'title'|'section'|'item'|'body')=>{
  const size=kind==='title'?18:kind==='section'?12:10
  const step=kind==='title'?24:kind==='section'?18:14
  pdf.setFont('BCVB',kind==='body'?'normal':'bold');pdf.setFontSize(size)
  const wrapped=pdf.splitTextToSize(value,maxWidth) as string[]
  // Keep a section heading with at least two following body lines.
  const required=wrapped.length*step+(kind==='section'||kind==='item'?28:0)
  if(y+required>bottom&&y>margin)nextPage()
  pdf.setTextColor(...(kind==='section'?[180,25,35]:[30,30,30]) as [number,number,number])
  for(const line of wrapped){if(y+step>bottom)nextPage();pdf.text(line,margin,y);y+=step}
  if(kind==='title')y+=8
 }
 for(const [index,line] of printableText.split('\n').entries()){
  if(!line){y+=10;continue}
  // The profile is already present in the document title/team/season fields.
  if(line==='Profil')continue
  if(objectiveTitles.has(line))y+=6
  writeLine(line,index===0?'title':sectionTitles.has(line)?'section':objectiveTitles.has(line)?'item':'body')
 }
 const total=pdf.getNumberOfPages()
 for(let page=1;page<=total;page++){
  pdf.setPage(page);pdf.setDrawColor(180,25,35);pdf.line(margin,height-46,width-margin,height-46)
  pdf.setFont('BCVB','normal');pdf.setFontSize(8);pdf.setTextColor(70,70,70)
  pdf.text(`BCVB - Player Book - ${audience==='staff'?'Usage interne':audience}`,margin,height-30)
  pdf.text(`${page} / ${total}`,width-margin,height-30,{align:'right'})
 }
 return {filename:`${model.filenameBase}.pdf`,pdf}
}
export async function exportPlayerBookPdf(snapshot:PlayerBookSnapshot,audience:PlayerBookAudience){
 const {filename,pdf}=await buildPlayerBookPdf(snapshot,audience)
 pdf.save(filename);return filename
}
