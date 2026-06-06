import FibaCourt from '../court/FibaCourt'
import type { SessionCourtChoice } from '../../types/session'

type SessionCourtPanelProps = {
  selected: SessionCourtChoice
  onSelect: (choice: SessionCourtChoice) => void
}

const courts: Array<{ id: SessionCourtChoice; label: string; mode: 'full' | 'half' }> = [
  { id: 'full-1', label: 'Terrain entier 1', mode: 'full' },
  { id: 'full-2', label: 'Terrain entier 2', mode: 'full' },
  { id: 'half-1', label: 'Demi-terrain 1', mode: 'half' },
  { id: 'half-2', label: 'Demi-terrain 2', mode: 'half' },
  { id: 'half-3', label: 'Demi-terrain 3', mode: 'half' },
]

export default function SessionCourtPanel({ selected, onSelect }: SessionCourtPanelProps) {
  return (
    <div className="session-court-layout">
      {courts.map((court) => (
        <button
          className={`session-court-layout__item${selected === court.id ? ' session-court-layout__item--active' : ''}`}
          key={court.id}
          type="button"
          onClick={() => onSelect(court.id)}
        >
          <FibaCourt mode={court.mode} title={court.label} />
        </button>
      ))}
    </div>
  )
}
