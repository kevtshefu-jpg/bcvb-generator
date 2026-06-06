import type { SessionCourtFrame } from '../../modules/sessions/sessionModels'
import { FibaCourtPro } from './FibaCourtPro'

export function FibaCourtHalf({ frame }: { frame: SessionCourtFrame }) {
  return (
    <FibaCourtPro
      frameId={frame.id}
      courtType={frame.courtType === 'half' ? 'half-right' : frame.courtType}
      theme="bcvb-editorial"
      showLogo={false}
      showLegend={false}
      objects={frame.objects}
      arrows={frame.arrows}
      zones={frame.zones}
      notes={frame.notes}
    />
  )
}
