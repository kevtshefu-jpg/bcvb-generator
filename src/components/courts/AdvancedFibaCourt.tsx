import { useEffect, useState } from 'react'
import { createCourtFrame, type CourtType, type SessionCourtFrame } from '../../modules/sessions/sessionModels'
import { CourtFrameTabs } from './CourtFrameTabs'
import { CourtFrameEditor } from './CourtFrameEditor'

type AdvancedFibaCourtProps = {
  frames: SessionCourtFrame[]
  onChange: (frames: SessionCourtFrame[]) => void
}

const framePresets = [
  'Frame 1 - mise en place',
  'Frame 2 - déclenchement',
  'Frame 3 - évolution',
  'Frame 4 - option ou rotation',
]

export function AdvancedFibaCourt({ frames, onChange }: AdvancedFibaCourtProps) {
  const safeFrames = frames.length ? frames : [createCourtFrame({ title: framePresets[0], intent: 'Mise en place' })]
  const [activeFrameId, setActiveFrameId] = useState(safeFrames[0]?.id || '')
  const activeFrame = safeFrames.find((frame) => frame.id === activeFrameId) || safeFrames[0]

  useEffect(() => {
    if (!safeFrames.some((frame) => frame.id === activeFrameId)) {
      setActiveFrameId(safeFrames[0]?.id || '')
    }
  }, [activeFrameId, safeFrames])

  function updateFrame(frameId: string, nextFrame: SessionCourtFrame) {
    onChange(safeFrames.map((frame) => frame.id === frameId ? nextFrame : frame))
  }

  function duplicateFrame(frame: SessionCourtFrame) {
    onChange([
      ...safeFrames,
      createCourtFrame({
        ...frame,
        title: `${frame.title} - copie`,
      }),
    ])
  }

  function deleteFrame(frameId: string) {
    if (safeFrames.length <= 1) {
      onChange([createCourtFrame({ title: framePresets[0], intent: 'Mise en place' })])
      return
    }
    onChange(safeFrames.filter((frame) => frame.id !== frameId))
  }

  function addFrame() {
    const title = framePresets[Math.min(safeFrames.length, framePresets.length - 1)]
    const nextFrame = createCourtFrame({ title, intent: title.replace(/^Frame \d+ - /, '') })
    onChange([...safeFrames, nextFrame])
    setActiveFrameId(nextFrame.id)
  }

  function resetFrame(frameId: string) {
    onChange(safeFrames.map((frame) => frame.id === frameId ? createCourtFrame({ title: frame.title, courtType: frame.courtType, intent: frame.intent }) : frame))
  }

  function transformCourtType(frameId: string, courtType: CourtType) {
    onChange(safeFrames.map((frame) => frame.id === frameId ? { ...frame, courtType } : frame))
  }

  function renameFrame(frame: SessionCourtFrame) {
    const title = window.prompt('Renommer frame', frame.title)
    if (!title) return
    updateFrame(frame.id, { ...frame, title })
  }

  return (
    <div className="advanced-court">
      <div className="session-subheader">
        <h4>Terrain FIBA</h4>
        <span>{safeFrames.length} frame{safeFrames.length > 1 ? 's' : ''}</span>
      </div>
      <CourtFrameTabs frames={safeFrames} activeFrameId={activeFrame.id} onSelect={setActiveFrameId} onAdd={addFrame} />
      {activeFrame && (
        <article className="advanced-court__frame" key={activeFrame.id}>
          <div className="advanced-court__actions">
            <button type="button" onClick={addFrame}>Ajouter frame</button>
            <button type="button" onClick={() => duplicateFrame(activeFrame)}>Dupliquer frame</button>
            <button type="button" onClick={() => renameFrame(activeFrame)}>Renommer frame</button>
            <button type="button" onClick={() => transformCourtType(activeFrame.id, 'half-right')}>Attaque droite</button>
            <button type="button" onClick={() => transformCourtType(activeFrame.id, 'half-left')}>Attaque gauche</button>
            <button type="button" onClick={() => transformCourtType(activeFrame.id, 'full')}>Transformer en terrain entier</button>
            <button type="button" onClick={() => resetFrame(activeFrame.id)}>Réinitialiser terrain</button>
            <button type="button" onClick={() => deleteFrame(activeFrame.id)}>Supprimer frame</button>
          </div>
          <CourtFrameEditor
            frame={activeFrame}
            onChange={(nextFrame) => updateFrame(activeFrame.id, nextFrame)}
            onDuplicate={() => duplicateFrame(activeFrame)}
          />
        </article>
      )}
    </div>
  )
}
