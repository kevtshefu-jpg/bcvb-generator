import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CourtToolbar } from './CourtToolbar'

function createProps() {
  return {
  mode: 'half-right' as const,
  activeTool: null,
  curvedMode: false,
  showCenterLogo: false,
  onModeChange: vi.fn(),
  onLogoChange: vi.fn(),
  onSelectObjectTool: vi.fn(),
  onSelectMotionTool: vi.fn(),
  onSelectZoneTool: vi.fn(),
  onCurvedModeChange: vi.fn(),
  onClearTool: vi.fn(),
  onExportSvg: vi.fn(),
  onExportPng: vi.fn(),
  onDuplicate: vi.fn(),
  }
}

describe('CourtToolbar', () => {
  it('garde les groupes secondaires repliés par défaut', () => {
    const props = createProps()
    render(<CourtToolbar {...props} />)

    expect(screen.getByLabelText(/Réglages du terrain/i).closest('details')).not.toHaveAttribute('open')
    expect(screen.getByLabelText('Outils objets').closest('details')).not.toHaveAttribute('open')
    expect(screen.getByLabelText(/déplacement et zones/i).closest('details')).not.toHaveAttribute('open')
    expect(screen.getByLabelText(/export du terrain/i).closest('details')).not.toHaveAttribute('open')
  })

  it('conserve les actions tactiques après ouverture du groupe', () => {
    const props = createProps()
    render(<CourtToolbar {...props} />)

    const objects = screen.getByLabelText('Outils objets')
    fireEvent.click(objects)

    fireEvent.click(screen.getByRole('button', { name: 'Défense' }))
    expect(props.onSelectObjectTool).toHaveBeenCalledWith('defender')
  })

  it('conserve les actions export et duplication', () => {
    const props = createProps()
    render(<CourtToolbar {...props} />)

    fireEvent.click(screen.getByLabelText(/export du terrain/i))
    fireEvent.click(screen.getByRole('button', { name: 'Dupliquer' }))
    fireEvent.click(screen.getByRole('button', { name: 'SVG' }))
    fireEvent.click(screen.getByRole('button', { name: 'PNG' }))

    expect(props.onDuplicate).toHaveBeenCalled()
    expect(props.onExportSvg).toHaveBeenCalled()
    expect(props.onExportPng).toHaveBeenCalled()
  })
})
