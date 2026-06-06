import type { SessionCourtFrame } from '../../modules/sessions/sessionModels'
import { FibaCourtPro } from './FibaCourtPro'

type FibaCourtFullProps = {
  frame: SessionCourtFrame
}

export function FibaCourtFull({ frame }: FibaCourtFullProps) {
  return (
    <FibaCourtPro
      frameId={frame.id}
      courtType="full"
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
