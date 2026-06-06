import FibaCourtCanvas from './FibaCourtCanvas.jsx'
import { normalizeMode } from './fibaCourtGeometry.js'
import './FibaCourtEditor.css'
import '../../styles/court-pro.css'

export default function FibaCourtEditor({
  mode = 'half-right',
  title = 'Terrain FIBA BCVB',
  showLogo = false,
  showGrid = false,
  objects = [],
  arrows = [],
  zones = [],
  selectedObjectId,
  onObjectMove,
  onSelectObject,
}) {
  const normalized = normalizeMode(mode)

  return (
    <figure className="bcvb-court-editor" aria-label={title}>
      <div className={`bcvb-court-stage court-stage ${normalized === 'full' ? 'full' : 'half'}`}>
        <FibaCourtCanvas
          mode={normalized}
          showLogo={showLogo}
          showGrid={showGrid}
          objects={objects}
          arrows={arrows}
          zones={zones}
          selectedObjectId={selectedObjectId}
          onObjectMove={onObjectMove}
          onSelectObject={onSelectObject}
        />
      </div>
      <figcaption className="court-stage__title">{title}</figcaption>
    </figure>
  )
}
