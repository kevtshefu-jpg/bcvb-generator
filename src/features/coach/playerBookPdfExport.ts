import { objectiveStatusLabel, type PlayerBookSnapshot } from './playerBookAggregation'
import { buildPlayerBookExportModel, canExportPlayerMonitoring, type PlayerBookAudience } from './playerBookExportModel'

export function playerBookToText(snapshot:PlayerBookSnapshot,audience:PlayerBookAudience){
 const model=buildPlayerBookExportModel(snapshot,audience,'pdf')
 const lines=[model.title,`Équipe : ${snapshot.player.teamName}`,`Saison : ${snapshot.player.season}`,`Destinataire : ${audience}`]
 for(const section of model.sections){
  if(!section.available)continue
  lines.push('',section.title)
  if(section.id==='evaluations-objectifs')lines.push(`Évaluations : ${snapshot.evaluationCount}`,`Objectifs actifs : ${snapshot.activeObjectiveCount}`)
  if(section.id==='objectifs')for(const o of snapshot.objectives??[]){lines.push(`${o.title} — ${o.domain} — ${objectiveStatusLabel(o.status)}`,`Objectif : ${o.targetDescription}`,`Critère observable : ${o.observableCriterion}`);if(o.quantifiableCriterion)lines.push(`Critère quantifiable : ${o.quantifiableCriterion}`);if(o.deadline)lines.push(`Échéance : ${o.deadline}`)}
  if(section.id==='tests')lines.push(...snapshot.tests.map(t=>`${t.testName} — ${t.value} ${t.unit} — ${t.measuredAt}`))
  if(section.id==='monitoring' && canExportPlayerMonitoring(audience))lines.push(...snapshot.monitoring.map(m=>`${m.monitoredOn} — disponibilité : ${m.availability}`))
  if(section.id==='programmes')lines.push(...snapshot.programs.map(p=>`${p.title} — ${p.startDate} → ${p.endDate} — niveau ${p.level}`))
 }
 return{model,text:lines.join('\n')}
}

export async function buildPlayerBookPdf(snapshot:PlayerBookSnapshot,audience:PlayerBookAudience){
 const {model,text}=playerBookToText(snapshot,audience)
 const {jsPDF}=await import('jspdf')
 const pdf=new jsPDF({unit:'pt',format:'a4'});const margin=48,maxWidth=pdf.internal.pageSize.getWidth()-96,pageHeight=pdf.internal.pageSize.getHeight()
 pdf.setProperties({title:model.title,subject:'BCVB Performance System',creator:'BCVB Référentiel'})
 pdf.setFont('helvetica','normal');pdf.setFontSize(10);let y=margin
 for(const line of pdf.splitTextToSize(text,maxWidth) as string[]){if(y>pageHeight-margin){pdf.addPage();y=margin}pdf.text(line,margin,y);y+=14}
 return {filename:`${model.filenameBase}.pdf`,pdf}
}
export async function exportPlayerBookPdf(snapshot:PlayerBookSnapshot,audience:PlayerBookAudience){
 const {filename,pdf}=await buildPlayerBookPdf(snapshot,audience)
 pdf.save(filename);return filename
}
