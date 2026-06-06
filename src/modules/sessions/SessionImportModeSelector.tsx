export type SessionImportMode = 'full-session' | 'single-situation'

type SessionImportModeSelectorProps = {
  mode: SessionImportMode
  onChange: (mode: SessionImportMode) => void
}

export function SessionImportModeSelector({ mode, onChange }: SessionImportModeSelectorProps) {
  return (
    <div className="session-import-mode">
      <button type="button" className={mode === 'full-session' ? 'is-active' : ''} onClick={() => onChange('full-session')}>
        Importer une séance complète
      </button>
      <button type="button" className={mode === 'single-situation' ? 'is-active' : ''} onClick={() => onChange('single-situation')}>
        Importer une situation pédagogique
      </button>
    </div>
  )
}
