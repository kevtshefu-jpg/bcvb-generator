import type { TrainingSession } from '../types/session'

export function exportSessionPdf(session: TrainingSession, compact = false) {
  // Le rendu PDF actuel s'appuie sur l'impression navigateur pour conserver les SVG terrains sans coupe.
  document.body.dataset.sessionExport = compact ? 'compact' : 'complete'
  document.title = `${session.title || 'Fiche séance BCVB'}`
  window.print()
  delete document.body.dataset.sessionExport
}
