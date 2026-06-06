import FibaCourt from './FibaCourt'

export default function CourtDiagramPreview({ mode = 'half', title }: { mode?: 'full' | 'half'; title?: string }) {
  return (
    <div className="court-preview-card">
      <FibaCourt mode={mode} title={title} />
      <div className="court-preview-card__legend">
        <span>Attaque : O</span>
        <span>Défense : X</span>
        <span>Ballon : ●</span>
      </div>
    </div>
  )
}
