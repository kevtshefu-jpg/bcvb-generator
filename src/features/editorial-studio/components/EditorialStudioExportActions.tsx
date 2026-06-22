type EditorialStudioExportActionsProps = {
  canExport: boolean
  exporting?: boolean
  onExportPdf?: () => void
  onExportMarkdown?: () => void
  onSaveToLibrary?: () => void
  onCopy?: () => void
}

export function EditorialStudioExportActions({
  canExport,
  exporting = false,
  onExportPdf,
  onExportMarkdown,
  onSaveToLibrary,
  onCopy,
}: EditorialStudioExportActionsProps) {
  return (
    <div className="editorial-export-actions editorial-actions editorial-actions--export" id="studio-export">
      <button
        className="editorial-export-actions__button editorial-export-actions__button--primary"
        type="button"
        disabled={!canExport || exporting}
        onClick={onExportPdf}
      >
        {exporting ? 'Export en cours...' : 'Export PDF'}
      </button>
      <button
        className="editorial-export-actions__button"
        type="button"
        disabled={!canExport || exporting}
        onClick={onExportMarkdown}
      >
        Télécharger source
      </button>
      <button
        className="editorial-export-actions__button"
        type="button"
        disabled={!canExport || exporting}
        onClick={onSaveToLibrary}
      >
        Enregistrer bibliothèque
      </button>
      {onCopy ? (
        <button
          className="editorial-export-actions__button"
          type="button"
          disabled={!canExport || exporting}
          onClick={onCopy}
        >
          Copier le contenu
        </button>
      ) : null}
    </div>
  )
}
