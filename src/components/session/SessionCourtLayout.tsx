import SessionCourtPanel from './SessionCourtPanel'
import type { SessionCourtChoice } from '../../types/session'

export default function SessionCourtLayout({
  selected,
  onSelect,
}: {
  selected: SessionCourtChoice
  onSelect: (choice: SessionCourtChoice) => void
}) {
  return <SessionCourtPanel selected={selected} onSelect={onSelect} />
}
