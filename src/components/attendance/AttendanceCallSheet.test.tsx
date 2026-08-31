import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { AttendancePlayer, AttendanceRecord } from '../../types/attendance'
import { AttendanceCallSheet } from './AttendanceCallSheet'

const player: AttendancePlayer = {
  id: 'player-1',
  firstName: 'Alice',
  lastName: 'Terrain',
  teamId: 'team-1',
  teamName: 'Équipe A',
  category: 'U15',
}

const record: AttendanceRecord = {
  id: 'record-1',
  sessionId: 'session-1',
  teamId: 'team-1',
  playerId: player.id,
  status: 'present',
  updatedAt: '2026-08-27T10:00:00.000Z',
}

function renderCallSheet({
  locked = false,
  canEdit = true,
  canViewNotes = true,
  onRecordsChange = vi.fn(),
  players = [player],
  records = [record],
  onCreateRecord = vi.fn(),
  onBulkStatus = vi.fn(),
  onLock = vi.fn(),
}: {
  locked?: boolean;
  canEdit?: boolean;
  canViewNotes?: boolean;
  onRecordsChange?: (records: AttendanceRecord[]) => void;
  players?: AttendancePlayer[];
  records?: AttendanceRecord[];
  onCreateRecord?: (playerId: string, status: AttendanceRecord['status']) => void;
  onBulkStatus?: (status: AttendanceRecord['status']) => void;
  onLock?: () => void;
} = {}) {
  render(
    <MemoryRouter>
      <AttendanceCallSheet
        players={players}
        records={records}
        locked={locked}
        canEdit={canEdit}
        canViewNotes={canViewNotes}
        onRecordsChange={onRecordsChange}
        onCreateRecord={onCreateRecord}
        onBulkStatus={onBulkStatus}
        onSave={vi.fn()}
        onReset={vi.fn()}
        onCopyPrevious={vi.fn()}
        onLock={onLock}
      />
    </MemoryRouter>,
  )
}

describe('AttendanceCallSheet terrain', () => {
  it('rend les cartes mobiles avec les cinq statuts prioritaires', () => {
    renderCallSheet()

    const mobileList = document.querySelector('.attendance-player-card-list.responsive-data-mobile')
    expect(mobileList).toBeInTheDocument()
    const card = within(mobileList as HTMLElement)

    for (const status of ['Présent', 'Absent excusé', 'Absent non excusé', 'Retard', 'Blessé']) {
      expect(card.getByRole('button', { name: status })).toBeInTheDocument()
    }
    const otherStatuses = card.getByLabelText('Autres statuts')
    for (const status of ['Dispensé', 'Observation', 'Sélection club', 'Sélection extérieure']) {
      expect(otherStatuses).toHaveTextContent(status)
    }
    expect(card.queryByText('Motif', { selector: 'label > span' })).not.toBeInTheDocument()
    expect(card.queryByText('Retard', { selector: 'label > span' })).not.toBeInTheDocument()
    expect(card.queryByText('Note blessure')).not.toBeInTheDocument()
  })

  it('conserve sauvegarde et validation comme actions principales', () => {
    renderCallSheet()

    expect(screen.getByRole('button', { name: 'Sauvegarder' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Valider appel coach' })).toBeEnabled()
    expect(screen.getByText('Actions secondaires')).toBeInTheDocument()
  })

  it('rend un appel verrouillé entièrement non éditable', () => {
    renderCallSheet({ locked: true })

    expect(screen.getByRole('button', { name: 'Sauvegarder' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Appel validé' })).toBeDisabled()
    for (const button of screen.getAllByRole('button', { name: 'Présent' })) {
      expect(button).toBeDisabled()
    }
  })

  it('masque toujours le commentaire sensible sans permission', async () => {
    const onRecordsChange = vi.fn()
    renderCallSheet({ canViewNotes: false, onRecordsChange })

    expect(screen.getAllByText('Masqué')).toHaveLength(2)
    const mobileList = document.querySelector('.attendance-player-card-list.responsive-data-mobile')
    const card = within(mobileList as HTMLElement)
    await userEvent.click(card.getByRole('button', { name: 'Absent excusé' }))
    expect(onRecordsChange).toHaveBeenCalledWith([
      expect.objectContaining({ status: 'absent_excused' }),
    ])
  })

  it('affiche un joueur sans record et ne le crée qu’après un statut explicite', async () => {
    const arthur = { ...player, id: 'player-2', firstName: 'Arthur' }
    const onCreateRecord = vi.fn()
    renderCallSheet({ players: [player, arthur], records: [record], onCreateRecord })

    expect(screen.getAllByText('Non renseigné').length).toBeGreaterThan(0)
    expect(onCreateRecord).not.toHaveBeenCalled()

    const mobileList = document.querySelector('.attendance-player-card-list.responsive-data-mobile')
    const arthurCard = within(mobileList as HTMLElement).getByText('Arthur Terrain').closest('article')
    await userEvent.click(within(arthurCard as HTMLElement).getByRole('button', { name: 'Absent excusé' }))

    expect(onCreateRecord).toHaveBeenCalledTimes(1)
    expect(onCreateRecord).toHaveBeenCalledWith(arthur.id, 'absent_excused')
    expect(onCreateRecord).not.toHaveBeenCalledWith(arthur.id, 'present')
  })

  it('ne remplit tout le monde présent qu’après le clic et ne valide pas', async () => {
    const onBulkStatus = vi.fn()
    const onLock = vi.fn()
    renderCallSheet({ records: [], onBulkStatus, onLock })

    expect(onBulkStatus).not.toHaveBeenCalled()
    expect(onLock).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Tout le monde présent' }))

    expect(onBulkStatus).toHaveBeenCalledWith('present')
    expect(onLock).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Valider appel coach' })).toBeEnabled()
  })
})
