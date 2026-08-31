import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { AttendanceStats, AttendanceTeamStats } from '../../types/attendance'
import { AttendanceHeader } from './AttendanceHeader'
import { AttendanceStatsPanel } from './AttendanceStatsPanel'
import { AttendanceTeamSummary } from './AttendanceTeamSummary'

const unavailableStats: AttendanceStats = {
  periodLabel: 'Séance courante',
  totalSessions: 1,
  presentCount: 0,
  absentExcusedCount: 0,
  absentUnexcusedCount: 0,
  lateCount: 0,
  injuredCount: 0,
  attendanceRate: null,
  punctualityRate: 0,
  reliabilityScore: 0,
  recordedCount: 0,
  missingRecords: 7,
  completionRate: 0,
}

const unavailableTeamStats: AttendanceTeamStats = {
  teamId: 'team-1',
  periodLabel: 'Séance courante',
  totalSessions: 1,
  playerCount: 7,
  presentCount: 0,
  absentExcusedCount: 0,
  absentUnexcusedCount: 0,
  lateCount: 0,
  injuredCount: 0,
  attendanceRate: null,
  unexcusedAbsenceRate: 0,
  alertCount: 0,
  recordedCount: 0,
  missingRecords: 7,
  completionRate: 0,
}

describe('présentation du taux de présence non observé', () => {
  it.each([
    ['bandeau', <AttendanceHeader stats={unavailableStats} />],
    ['statistiques séance', <AttendanceStatsPanel sessionSelected stats={unavailableStats} totalPlayers={7} />],
    ['bilan équipe', <AttendanceTeamSummary stats={unavailableTeamStats} />],
  ])('affiche un tiret accessible dans %s', (_label, component) => {
    const { container } = render(component)

    expect(screen.getByLabelText('Taux de présence non calculable : aucun relevé renseigné')).toHaveTextContent('—')
    expect(container).not.toHaveTextContent('null %')
    expect(container).not.toHaveTextContent('undefined %')
    expect(container).not.toHaveTextContent('NaN %')
  })

  it('conserve zéro pour un taux réellement observé', () => {
    render(<AttendanceStatsPanel sessionSelected stats={{ ...unavailableStats, attendanceRate: 0, recordedCount: 7, missingRecords: 0, completionRate: 100 }} totalPlayers={7} />)

    expect(screen.getByRole('heading', { name: 'Présence : 0%' })).toBeInTheDocument()
  })
})
