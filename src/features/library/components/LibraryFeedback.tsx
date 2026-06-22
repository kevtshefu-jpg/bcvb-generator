import ActionFeedback from '../../../components/feedback/ActionFeedback'

type LibraryFeedbackProps = {
  safeLoading: boolean
  hasTimedOut: boolean
  presentationMode: boolean
  error: string | null
  downloadError: string | null
  actionMessage: string | null
  exportLoadingId: string | null
  exportLoadingMessage?: string | null
  exportError?: string | null
  exportSuccess?: string | null
  onRetry: () => void
  onCloseDownloadError: () => void
  onCloseActionMessage: () => void
  onClearExportFeedback: () => void
}

export default function LibraryFeedback({
  safeLoading,
  hasTimedOut,
  presentationMode,
  error,
  downloadError,
  actionMessage,
  exportLoadingId,
  exportLoadingMessage,
  exportError,
  exportSuccess,
  onRetry,
  onCloseDownloadError,
  onCloseActionMessage,
  onClearExportFeedback,
}: LibraryFeedbackProps) {
  return (
    <>
      {safeLoading ? <p>Chargement de l’espace BCVB...</p> : null}

      {hasTimedOut && presentationMode ? (
        <div className="bcvb-demo-fallback">
          <p className="bcvb-eyebrow">Mode présentation</p>
          <h2>Bibliothèque prête à être présentée</h2>
          <p>
            Le chargement distant est temporairement indisponible. Les brouillons
            locaux restent affichables.
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="bcvb-demo-fallback">
          <p className="bcvb-eyebrow">Bibliothèque</p>
          <h2>Chargement temporairement indisponible</h2>
          <p>
            {presentationMode
              ? 'La bibliothèque reste disponible dès que la connexion aux données répond.'
              : error}
          </p>

          <button type="button" onClick={onRetry}>
            Réessayer
          </button>
        </div>
      ) : null}

      {downloadError ? (
        <ActionFeedback
          type="error"
          title="Action groupée"
          message={downloadError}
          onClose={onCloseDownloadError}
        />
      ) : null}

      {exportLoadingId && exportLoadingMessage ? (
        <ActionFeedback
          type="loading"
          title="Export documentaire"
          message={exportLoadingMessage}
        />
      ) : null}

      {exportError ? (
        <ActionFeedback
          type="error"
          title="Export impossible"
          message={exportError}
          onClose={onClearExportFeedback}
        />
      ) : null}

      {exportSuccess ? (
        <ActionFeedback
          type="success"
          title="Export terminé"
          message={exportSuccess}
          onClose={onClearExportFeedback}
        />
      ) : null}

      {actionMessage ? (
        <ActionFeedback
          type="success"
          title="Bibliothèque"
          message={actionMessage}
          onClose={onCloseActionMessage}
        />
      ) : null}
    </>
  )
}
