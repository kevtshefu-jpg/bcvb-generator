import CourtDiagramPreview from './CourtDiagramPreview'

export default function CourtDiagramEditor() {
  return (
    <div className="session-court-editor">
      <CourtDiagramPreview mode="full" title="Terrain entier éditable" />
      <p>Éditeur terrain FastDraw-like : choisissez le terrain, puis ajoutez joueurs, flèches, zones et notes dans la situation.</p>
    </div>
  )
}
