type AdminSaveBarProps = {
  dirty: boolean
  lastSavedAt: string | null
  onSave: () => void
  onReset: () => void
}

function formatLastSavedAt(lastSavedAt: string | null) {
  if (!lastSavedAt) {
    return 'Aucune sauvegarde locale encore créée'
  }

  const date = new Date(lastSavedAt)

  if (Number.isNaN(date.getTime())) {
    return 'Dernière sauvegarde locale indisponible'
  }

  return `Dernière sauvegarde locale : ${date.toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })}`
}

export default function AdminSaveBar({
  dirty,
  lastSavedAt,
  onSave,
  onReset,
}: AdminSaveBarProps) {
  return (
    <section
      className={[
        'admin-save-bar',
        'local-save-panel',
        dirty ? 'admin-save-bar--dirty' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-live="polite"
    >
      <div className="admin-save-bar__content">
        <h3 className="admin-save-bar__status">
          {dirty ? 'Modifications non enregistrées' : 'Configuration synchronisée'}
        </h3>

        <p className="admin-save-bar__message">
          {formatLastSavedAt(lastSavedAt)}
        </p>
      </div>

      <div className="admin-save-bar__actions local-save-panel__actions">
        <button
          type="button"
          className="admin-save-bar__secondary"
          onClick={onReset}
          disabled={!dirty}
        >
          Réinitialiser
        </button>

        <button
          type="button"
          className="admin-save-bar__primary"
          onClick={onSave}
          disabled={!dirty}
        >
          Enregistrer
        </button>
      </div>
    </section>
  )
}