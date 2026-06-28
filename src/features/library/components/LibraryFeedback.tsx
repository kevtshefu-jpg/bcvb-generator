import ActionFeedback from '../../../components/feedback/ActionFeedback'
import { ErrorState, LoadingState } from '../../../components/ui/PageShell'

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
      {safeLoading ? (
        <LoadingState
          title="Chargement de la bibliothèque"
          description="Nous préparons les documents disponibles pour votre profil."
        />
      ) : null}

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
        <ErrorState
          title="Bibliothèque temporairement indisponible"
          description={
            presentationMode
              ? 'La bibliothèque sera disponible dès que les données répondent.'
              : 'Les documents n’ont pas pu être chargés. Réessayez dans un instant.'
          }
          action={<button type="button" onClick={onRetry}>Réessayer</button>}
        />
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
