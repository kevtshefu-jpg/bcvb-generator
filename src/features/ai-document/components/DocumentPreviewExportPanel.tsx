import { useRef, useState } from 'react'
import { exportNodeToPdf } from '../../../utils/exportPdf'
import type { DocumentQualityReport } from '../../../utils/documentQuality'
import { BCVBRichDocumentRenderer } from '../../documents/components/BCVBRichDocumentRenderer'
import { getPdfExportOptions } from '../../documents/utils/getPdfExportOptions'
import type { DocumentStandard } from '../../documents/standards/documentFamilyStandards'
import type { DocumentProductionSettings } from './DocumentFramingPanel'

type DocumentPreviewExportPanelProps = {
  content: string
  settings: DocumentProductionSettings
  standard: DocumentStandard | null
  report: DocumentQualityReport | null
  onSave: () => Promise<void> | void
}

function hasBlockingIssues(report: DocumentQualityReport | null) {
  if (!report) return true
  return (
    report.score < 85 ||
    report.counts.rawTechnicalFieldsVisible > 0 ||
    report.counts.tablesNotRendered > 0 ||
    report.counts.genericBlocksDetected > 0
  )
}

export function DocumentPreviewExportPanel({
  content,
  settings,
  standard,
  report,
  onSave,
}: DocumentPreviewExportPanelProps) {
  const previewRef = useRef<HTMLDivElement | null>(null)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const missingBasics = !settings.targetTitle.trim() || !settings.family || !settings.category
  const blocked = missingBasics || hasBlockingIssues(report)
  const publicationState =
    !report || report.score < 85 ? 'Non' : report.score < (report.scoreTarget ?? 92) ? 'Presque' : 'Oui'

  async function downloadPdf() {
    if (!previewRef.current || !standard) return
    setExporting(true)
    try {
      await exportNodeToPdf(
        previewRef.current,
        `${settings.targetTitle || 'document-bcvb'}.pdf`,
        getPdfExportOptions(standard.id)
      )
    } finally {
      setExporting(false)
    }
  }

  function downloadSource() {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${settings.targetTitle || 'document-bcvb'}.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function save() {
    setSaving(true)
    try {
      await onSave()
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="ai-studio-card">
      <div className="ai-studio-card__header">
        <p className="ai-studio-kicker">Contrôle & export</p>
        <h2>Prévisualisation et publication</h2>
        <p>Aperçu lecture premium, source, PDF et sauvegarde bibliothèque.</p>
      </div>

      {blocked && (
        <p className="ai-studio-alert ai-studio-alert--blocked">
          Document non publiable : corriger les points bloquants avant sauvegarde.
        </p>
      )}

      <div className="ai-source-summary">
        <span><strong>Document prêt publication</strong>{publicationState}</span>
        <span><strong>Score potentiel</strong>{report?.estimatedPotentialScore ?? '--'}/100</span>
        <span><strong>Gain estimé</strong>{report ? `+${Math.max(0, report.estimatedPotentialScore - report.score)}` : '--'}</span>
        <span><strong>Action recommandée</strong>{report?.improvementActions[0]?.label ?? 'Contrôle qualité à lancer'}</span>
      </div>

      <div className="ai-preview-tabs" aria-label="Modes d’aperçu">
        <span>Aperçu lecture premium</span>
        <span>Aperçu PDF</span>
        <span>Aperçu mobile</span>
      </div>

      <div className="ai-preview-shell" ref={previewRef}>
        {content.trim() ? (
          <BCVBRichDocumentRenderer
            content={content}
            document={{
              title: settings.targetTitle || 'Document BCVB',
              document_type: standard?.label || 'Document BCVB',
              category_code: settings.category,
              theme_code: settings.productionLevel,
              audience: settings.audience,
              season: settings.season,
            }}
          />
        ) : (
          <p>Aucun contenu à prévisualiser pour le moment.</p>
        )}
      </div>

      <div className="ai-studio-actions">
        <button type="button" className="ai-studio-secondary" onClick={downloadPdf} disabled={!content.trim() || exporting}>
          {exporting ? 'Export PDF...' : 'Exporter PDF'}
        </button>
        <button type="button" className="ai-studio-secondary" onClick={downloadSource} disabled={!content.trim()}>
          Télécharger source
        </button>
        <button type="button" className="ai-studio-primary" onClick={save} disabled={blocked || saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer bibliothèque'}
        </button>
        <button type="button" className="ai-studio-secondary" onClick={save} disabled={missingBasics || saving || !content.trim()}>
          Enregistrer malgré avertissement
        </button>
      </div>
    </section>
  )
}
