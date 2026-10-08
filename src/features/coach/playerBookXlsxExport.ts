import ExcelJS from 'exceljs'
import { objectiveStatusLabel, type PlayerBookSnapshot } from './playerBookAggregation'
import { buildPlayerBookExportModel, canExportBookEvaluations, canExportBookObjectives, canExportPlayerMonitoring, type PlayerBookAudience } from './playerBookExportModel'

const sheetWidths:Record<string,number[]>={
 'Player Book':[26,64], 'Évaluations':[16,40,20],
 Objectifs:[32,18,48,48,30,24,18], Tests:[36,16,16,16,24],
 Programmes:[44,16,16,12,18], Suivi:[16,12,16,12,16,12,12,24],
}
function stylePlayerBookSheet(sheet:ExcelJS.Worksheet){
 const summary=sheet.name==='Player Book'
 const widths=sheetWidths[sheet.name]
 widths.forEach((width,index)=>{sheet.getColumn(index+1).width=width})
 sheet.properties.tabColor={argb:'FFB41923'}
 sheet.views=[{state:'frozen',ySplit:1,showGridLines:false}]
 if(summary)sheet.mergeCells('A1:B1')
 else sheet.autoFilter={from:{row:1,column:1},to:{row:sheet.rowCount,column:widths.length}}
 sheet.eachRow((row,index)=>{
  let lines=1
  row.eachCell({includeEmpty:true},(cell,column)=>{
   cell.font={name:'Calibri',size:11,color:{argb:'FF222222'}}
   cell.alignment={vertical:'top',wrapText:true}
   if(index>1&&index%2===0)cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF2F2F2'}}
   if(summary&&index>1&&column===1)cell.font={...cell.font,bold:true}
   const width=summary&&index===1?widths[0]+widths[1]:widths[column-1]
   const length=String(cell.value??'').split('\n').reduce((sum,line)=>sum+Math.max(1,Math.ceil(line.length/Math.max(1,width-3))),0)
   lines=Math.max(lines,length)
  })
  // Excel's maximum row height is 409 points; full values remain in the cells.
  row.height=Math.min(409,Math.max(24,lines*16+8))
 })
 const header=sheet.getRow(1)
 header.eachCell(cell=>{
  cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF242424'}}
  cell.font={name:'Calibri',size:summary?14:11,bold:true,color:{argb:'FFFFFFFF'}}
  cell.alignment={vertical:'middle',wrapText:true}
 })
 header.height=Math.max(header.height??24,summary?40:34)
}

export async function buildPlayerBookXlsx(snapshot:PlayerBookSnapshot,audience:PlayerBookAudience){
 const model=buildPlayerBookExportModel(snapshot,audience,'xlsx');const wb=new ExcelJS.Workbook();wb.creator='BCVB Référentiel'
 const summary=wb.addWorksheet('Player Book');summary.addRows([[model.title],['Équipe',snapshot.player.teamName],['Saison',snapshot.player.season],['Destinataire',audience],['Évaluations',snapshot.evaluationCount],['Objectifs actifs',snapshot.activeObjectiveCount]])
 if(canExportBookEvaluations(audience)&&snapshot.evaluations?.length){const s=wb.addWorksheet('Évaluations');s.addRow(['Date','Période','Catégorie']);snapshot.evaluations.forEach(e=>s.addRow([e.date,e.period,e.category]))}
 if(canExportBookObjectives(audience)&&snapshot.objectives?.length){const s=wb.addWorksheet('Objectifs');s.addRow(['Objectif','Domaine','Description','Critère observable','Critère quantifiable','Échéance','Statut']);snapshot.objectives.forEach(o=>s.addRow([o.title,o.domain,o.targetDescription,o.observableCriterion,o.quantifiableCriterion,o.deadline,objectiveStatusLabel(o.status)]))}
 if(snapshot.tests.length){const s=wb.addWorksheet('Tests');s.addRow(['Test','Valeur','Unité','Date','Protocole']);snapshot.tests.forEach(t=>s.addRow([t.testName,t.value,t.unit,t.measuredAt,t.protocolVersion]))}
 if(canExportPlayerMonitoring(audience) && snapshot.monitoring.length){const s=wb.addWorksheet('Suivi');s.addRow(['Date','RPE','Durée min','Fatigue','Courbatures','Sommeil','Douleur','Disponibilité']);snapshot.monitoring.forEach(m=>s.addRow([m.monitoredOn,m.sessionRpe,m.sessionDurationMinutes,m.fatigue,m.soreness,m.sleepQuality,m.pain,m.availability]))}
 if(snapshot.programs.length){const s=wb.addWorksheet('Programmes');s.addRow(['Programme','Début','Fin','Niveau','État']);snapshot.programs.forEach(p=>s.addRow([p.title,p.startDate,p.endDate,p.level,p.status]))}
 wb.worksheets.forEach(stylePlayerBookSheet)
 return{filename:`${model.filenameBase}.xlsx`,buffer:await wb.xlsx.writeBuffer()}
}
