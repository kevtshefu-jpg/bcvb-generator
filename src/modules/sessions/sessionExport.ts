import type { SessionCourtFrame, SessionSituation, TrainingSessionV2 } from './sessionModels'
import { exportCourtPng, exportCourtSvg } from '../../components/courts/courtExport'
import { getPhaseLabel, getTotalSituationDuration } from './sessionUtils'

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'seance-bcvb'
}

function download(content: BlobPart, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function exportSessionToJson(session: TrainingSessionV2) {
  download(JSON.stringify(session, null, 2), `${slugify(session.title)}.json`, 'application/json;charset=utf-8')
}

export function exportSessionToMarkdown(session: TrainingSessionV2) {
  const markdown = [
    `# ${session.title}`,
    '',
    `- Catégorie : ${session.category}`,
    `- Date : ${session.date || 'Non renseignée'}`,
    `- Durée : ${session.durationMinutes} minutes`,
    `- Thème : ${session.theme}`,
    `- Sous-thème : ${session.subTheme || 'Non classé'}`,
    `- Visibilité : ${session.visibility}`,
    `- Statut : ${session.status}`,
    `- Total déroulé : ${getTotalSituationDuration(session)} minutes`,
    '',
    '## Objectifs',
    ...session.objectives.map((item) => `- ${item}`),
    '',
    '## Déroulé',
    ...session.situations.map((situation) => [
      `### ${situation.order}. ${situation.title} - ${situation.durationMinutes} min`,
      `Phase : ${getPhaseLabel(situation.pedagogicalPhase)}`,
      `Objectif : ${situation.objective}`,
      `Objectif BCVB : ${situation.bcvbObjective}`,
      `Organisation : ${situation.organization}`,
      `Consignes : ${situation.instructions}`,
      `Évolution : ${situation.evolution}`,
      `Régression : ${situation.regression}`,
      `Critères observables : ${situation.observableCriteria.join(', ')}`,
      `Critères quantifiables : ${situation.measurableCriteria.join(', ')}`,
      `Lien BCVB : ${Object.values(situation.bcvbLinks).filter(Boolean).join(' · ')}`,
      '',
    ].join('\n')),
    '## Bilan coach',
    session.observations.whatWorked,
    session.observations.toRepeat,
    session.observations.nextSessionLink,
  ].join('\n')

  download(markdown, `${slugify(session.title)}.md`, 'text/markdown;charset=utf-8')
}

export function exportSituationToMarkdown(situation: SessionSituation) {
  const markdown = [
    `# ${situation.title}`,
    '',
    `- Catégorie : ${situation.category || 'Non renseignée'}`,
    `- Thème : ${situation.theme || 'Non renseigné'}`,
    `- Sous-thème : ${situation.subTheme || 'Non renseigné'}`,
    `- Durée : ${situation.durationMinutes} minutes`,
    `- Effectif : ${situation.playerCount || 'Non renseigné'}`,
    '',
    '## Objectif',
    situation.objective,
    '',
    '## Organisation',
    situation.organization,
    '',
    '## Consignes',
    situation.instructions,
    '',
    '## Adaptations',
    `- Régression : ${situation.regression}`,
    `- Évolution : ${situation.evolution}`,
    '',
    '## Critères',
    `- Observables : ${situation.observableCriteria.join(', ')}`,
    `- Quantifiables : ${situation.measurableCriteria.join(', ')}`,
    '',
    '## Identité BCVB',
    Object.values(situation.bcvbLinks).filter(Boolean).join(' · '),
  ].join('\n')

  download(markdown, `${slugify(situation.title)}.md`, 'text/markdown;charset=utf-8')
}

export function printSessionPdf() {
  window.print()
}

export function exportCourtFrameToSvg(frame: SessionCourtFrame) {
  if (exportCourtSvg(frame)) return
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><rect width="100" height="60" fill="#f7e2bd"/><rect x="4" y="4" width="92" height="52" fill="none" stroke="#1f2937" stroke-width="1"/><text x="8" y="12" font-size="4">${frame.title}</text></svg>`
  download(svg, `${slugify(frame.title)}.svg`, 'image/svg+xml;charset=utf-8')
}

export function exportCourtFrameToPng(frame: SessionCourtFrame) {
  exportCourtPng(frame).then((exported) => {
    if (!exported) exportCourtFrameToSvg(frame)
  }).catch(() => exportCourtFrameToSvg(frame))
}
