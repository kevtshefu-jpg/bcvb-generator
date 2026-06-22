import type { ReactNode } from 'react'

type EditorialStudioPreviewProps = {
  title?: string
  content?: string
  loading?: boolean
  error?: string
  emptyMessage?: string
  children?: ReactNode
}

export function EditorialStudioPreview({
  title = 'Document final',
  content = '',
  loading = false,
  error = '',
  emptyMessage = 'Colle ou génère une réponse finale pour activer la prévisualisation.',
  children,
}: EditorialStudioPreviewProps) {
  const hasContent = Boolean(content.trim())

  return (
    <section className="editorial-panel editorial-step-card editorial-preview" id="studio-preview">
      <header>
        <p className="bcvb-eyebrow">Aperçu / Export</p>
        <h2>{title}</h2>
      </header>
      {loading ? (
        <div className="editorial-preview__loading">Prévisualisation en préparation...</div>
      ) : error ? (
        <div className="editorial-preview__empty editorial-preview__empty--error">{error}</div>
      ) : hasContent ? (
        <pre className="editorial-preview__content">{content}</pre>
      ) : (
        <div className="editorial-empty-preview editorial-preview__empty">
          {emptyMessage}
        </div>
      )}
      {hasContent ? children : null}
    </section>
  )
}
