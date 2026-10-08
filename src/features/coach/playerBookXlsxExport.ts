import ExcelJS from 'exceljs'
import { objectiveStatusLabel, type PlayerBookSnapshot } from './playerBookAggregation'
import { buildPlayerBookExportModel, canExportBookEvaluations, canExportBookObjectives, canExportPlayerMonitoring, type PlayerBookAudience } from './playerBookExportModel'

export async function buildPlayerBookXlsx(snapshot:PlayerBookSnapshot,audience:PlayerBookAudience){
 const model=buildPlayerBookExportModel(snapshot,audience,'xlsx');const wb=new ExcelJS.Workbook();wb.creator='BCVB Référentiel'
 const summary=wb.addWorksheet('Player Book');summary.addRows([[model.title],['Équipe',snapshot.player.teamName],['Saison',snapshot.player.season],['Destinataire',audience],['Évaluations',snapshot.evaluationCount],['Objectifs actifs',snapshot.activeObjectiveCount]])
 if(canExportBookEvaluations(audience)&&snapshot.evaluations?.length){const s=wb.addWorksheet('Évaluations');s.addRow(['Date','Période','Catégorie']);snapshot.evaluations.forEach(e=>s.addRow([e.date,e.period,e.category]))}
 if(canExportBookObjectives(audience)&&snapshot.objectives?.length){const s=wb.addWorksheet('Objectifs');s.addRow(['Objectif','Domaine','Description','Critère observable','Critère quantifiable','Échéance','Statut']);snapshot.objectives.forEach(o=>s.addRow([o.title,o.domain,o.targetDescription,o.observableCriterion,o.quantifiableCriterion,o.deadline,objectiveStatusLabel(o.status)]))}
 if(snapshot.tests.length){const s=wb.addWorksheet('Tests');s.addRow(['Test','Valeur','Unité','Date','Protocole']);snapshot.tests.forEach(t=>s.addRow([t.testName,t.value,t.unit,t.measuredAt,t.protocolVersion]))}
 if(canExportPlayerMonitoring(audience) && snapshot.monitoring.length){const s=wb.addWorksheet('Suivi');s.addRow(['Date','RPE','Durée min','Fatigue','Courbatures','Sommeil','Douleur','Disponibilité']);snapshot.monitoring.forEach(m=>s.addRow([m.monitoredOn,m.sessionRpe,m.sessionDurationMinutes,m.fatigue,m.soreness,m.sleepQuality,m.pain,m.availability]))}
 if(snapshot.programs.length){const s=wb.addWorksheet('Programmes');s.addRow(['Programme','Début','Fin','Niveau','État']);snapshot.programs.forEach(p=>s.addRow([p.title,p.startDate,p.endDate,p.level,p.status]))}
 return{filename:`${model.filenameBase}.xlsx`,buffer:await wb.xlsx.writeBuffer()}
}
