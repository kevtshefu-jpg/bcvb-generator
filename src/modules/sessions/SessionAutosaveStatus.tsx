type SessionAutosaveStatusProps = {
  lastSavedAt: string | null
  restored: boolean
}

export function SessionAutosaveStatus({ lastSavedAt, restored }: SessionAutosaveStatusProps) {
  return (
    <div className="session-autosave">
      <span>{restored ? 'Brouillon restauré' : 'Autosave actif'}</span>
      <strong>{lastSavedAt ? `Sauvegardé ${new Date(lastSavedAt).toLocaleTimeString('fr-FR')}` : 'En attente de modification'}</strong>
    </div>
  )
}
