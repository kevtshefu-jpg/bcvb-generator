import FibaCourtEditor from './FibaCourtEditor.jsx'

type FibaCourtProps = {
  mode?: 'full' | 'half' | 'half-right' | 'half-left'
  title?: string
  showLogo?: boolean
}

export default function FibaCourt({ mode = 'half-right', title, showLogo = false }: FibaCourtProps) {
  const resolvedMode = mode === 'half' ? 'half-right' : mode
  return <FibaCourtEditor mode={resolvedMode} title={title || (resolvedMode === 'full' ? 'Terrain entier' : 'Demi-terrain')} showLogo={showLogo} />
}
