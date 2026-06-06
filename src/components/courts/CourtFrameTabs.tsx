import type { SessionCourtFrame } from '../../modules/sessions/sessionModels'

type CourtFrameTabsProps = {
  frames: SessionCourtFrame[]
  activeFrameId: string
  onSelect: (frameId: string) => void
  onAdd: () => void
}

export function CourtFrameTabs({ frames, activeFrameId, onSelect, onAdd }: CourtFrameTabsProps) {
  return (
    <div className="court-frame-tabs" role="tablist" aria-label="Frames terrain">
      {frames.map((frame, index) => (
        <button
          type="button"
          role="tab"
          aria-selected={frame.id === activeFrameId}
          className={frame.id === activeFrameId ? 'is-active' : ''}
          onClick={() => onSelect(frame.id)}
          key={frame.id}
        >
          {index + 1}. {frame.title || 'Frame'}
        </button>
      ))}
      <button type="button" onClick={onAdd}>Ajouter une frame</button>
    </div>
  )
}
