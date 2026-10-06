import type { KeyboardEvent } from 'react'
import type { SessionCourtFrame } from '../../modules/sessions/sessionModels'

type CourtFrameTabsProps = {
  frames: SessionCourtFrame[]
  activeFrameId: string
  onSelect: (frameId: string) => void
  onAdd: () => void
}

export function CourtFrameTabs({ frames, activeFrameId, onSelect, onAdd }: CourtFrameTabsProps) {
  function selectAndFocus(index: number) {
    const frame = frames[index]
    if (!frame) return
    onSelect(frame.id)
    window.requestAnimationFrame(() => {
      document.getElementById(`court-frame-tab-${frame.id}`)?.focus()
    })
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!frames.length) return
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      selectAndFocus((index + 1) % frames.length)
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      selectAndFocus((index - 1 + frames.length) % frames.length)
    }
    if (event.key === 'Home') {
      event.preventDefault()
      selectAndFocus(0)
    }
    if (event.key === 'End') {
      event.preventDefault()
      selectAndFocus(frames.length - 1)
    }
  }

  return (
    <div className="court-frame-tabs" role="tablist" aria-label="Frames terrain">
      {frames.map((frame, index) => (
        <button
          type="button"
          role="tab"
          aria-selected={frame.id === activeFrameId}
          aria-controls={`court-frame-panel-${frame.id}`}
          id={`court-frame-tab-${frame.id}`}
          tabIndex={frame.id === activeFrameId ? 0 : -1}
          className={frame.id === activeFrameId ? 'is-active' : ''}
          onClick={() => onSelect(frame.id)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          key={frame.id}
        >
          <span className="court-frame-tabs__index">{index + 1}</span>
          <span className="court-frame-tabs__title">{frame.title || 'Frame'}</span>
        </button>
      ))}
      <button type="button" className="court-frame-tabs__add" aria-label="Ajouter une frame" onClick={onAdd}>+</button>
    </div>
  )
}
