import { exportCourtFrameToPng, exportSessionToJson, exportSessionToMarkdown, printSessionPdf } from './sessionExport'
import type { TrainingSessionV2 } from './sessionModels'

export function SessionExportPanel({ session }: { session: TrainingSessionV2 }) {
  return (
    <section className="session-export-panel">
      <p className="bcvb-eyebrow">Export</p>
      <h3>Fiche séance terrain</h3>
      <button type="button" onClick={printSessionPdf}>Export PDF</button>
      <button type="button" onClick={() => exportSessionToJson(session)}>Télécharger source JSON</button>
      <button type="button" onClick={() => exportSessionToMarkdown(session)}>Télécharger source Markdown</button>
      <button type="button" onClick={() => session.situations.flatMap((situation) => situation.courtFrames).forEach(exportCourtFrameToPng)}>Télécharger terrains PNG</button>
    </section>
  )
}
