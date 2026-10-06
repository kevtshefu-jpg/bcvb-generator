import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CourtToolbar } from './CourtToolbar'

const baseProps = {
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

describe('CourtToolbar', () => {
  it('garde les groupes secondaires repliés par défaut', () => {
    render(<CourtToolbar {...baseProps} />)

    expect(screen.getByLabelText(/Réglages du terrain/i).closest('details')).not.toHaveAttribute('open')
    expect(screen.getByLabelText('Outils objets').closest('details')).not.toHaveAttribute('open')
    expect(screen.getByLabelText(/déplacement et zones/i).closest('details')).not.toHaveAttribute('open')
    expect(screen.getByLabelText(/export du terrain/i).closest('details')).not.toHaveAttribute('open')
  })

  it('conserve les actions tactiques après ouverture du groupe', () => {
    render(<CourtToolbar {...baseProps} />)

    const objects = screen.getByLabelText('Outils objets')
    fireEvent.click(objects)

    fireEvent.click(screen.getByRole('button', { name: 'Défense' }))
    expect(baseProps.onSelectObjectTool).toHaveBeenCalledWith('defender')
  })

  it('conserve les actions export et duplication', () => {
    render(<CourtToolbar {...baseProps} />)

    fireEvent.click(screen.getByLabelText(/export du terrain/i))
    fireEvent.click(screen.getByRole('button', { name: 'Dupliquer' }))
    fireEvent.click(screen.getByRole('button', { name: 'SVG' }))
    fireEvent.click(screen.getByRole('button', { name: 'PNG' }))

    expect(baseProps.onDuplicate).toHaveBeenCalled()
    expect(baseProps.onExportSvg).toHaveBeenCalled()
    expect(baseProps.onExportPng).toHaveBeenCalled()
  })
})
