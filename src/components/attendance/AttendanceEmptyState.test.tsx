import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { AttendanceRecord, AttendanceStats } from '../../types/attendance'
import { computeAttendanceQualityScore } from '../../lib/attendance/attendanceScoring'
import { computeSessionStats } from '../../lib/attendance/attendanceStats'
import { AttendanceQualityPanel } from './AttendanceQualityPanel'
import { AttendanceStatsPanel } from './AttendanceStatsPanel'

const neutralStats: AttendanceStats = {
  periodLabel: 'Aucune séance sélectionnée',
  totalSessions: 0,
  presentCount: 0,
  absentExcusedCount: 0,
  absentUnexcusedCount: 0,
  lateCount: 0,
  injuredCount: 0,
  attendanceRate: null,
  punctualityRate: 0,
  reliabilityScore: 0,
  recordedCount: 0,
  missingRecords: 0,
  completionRate: 0,
}

const session = {
  id: 'session-1', teamId: 'team-1', title: 'Séance réelle', date: '2026-09-02',
  type: 'entrainement' as const, createdBy: 'coach-1', createdAt: '', updatedAt: '',
}

function record(playerId: string, status: AttendanceRecord['status']): AttendanceRecord {
  return { id: `record-${playerId}`, sessionId: session.id, teamId: session.teamId, playerId, status, updatedAt: '' }
}

describe('distinction entre absence de séance et séance vide', () => {
  it('neutralise qualité et statistiques lorsqu’aucune séance n’est sélectionnée', () => {
    const { container } = render(
      <>
        <AttendanceQualityPanel quality={null} stats={neutralStats} totalPlayers={7} />
        <AttendanceStatsPanel sessionSelected={false} stats={neutralStats} totalPlayers={7} />
      </>,
    )

    expect(screen.getAllByText('Aucune séance sélectionnée')).toHaveLength(2)
    expect(container).not.toHaveTextContent('0/100')
    expect(container).not.toHaveTextContent('insuffisant')
    expect(container).not.toHaveTextContent('à compléter')
    expect(container).not.toHaveTextContent('Relevés')
    expect(container).not.toHaveTextContent('Non renseignés')
  })

  it('conserve le contrat métier d’une vraie séance sans observation', () => {
    const stats = computeSessionStats([], 7)
    const quality = computeAttendanceQualityScore([session], [], 7)
    const { container } = render(
      <>
        <AttendanceQualityPanel quality={quality} stats={stats} totalPlayers={7} />
        <AttendanceStatsPanel sessionSelected stats={stats} totalPlayers={7} />
      </>,
    )

    expect(container).toHaveTextContent('0/100')
    expect(container).toHaveTextContent('insuffisant')
    expect(screen.getByLabelText('Taux de présence non calculable : aucun relevé renseigné')).toHaveTextContent('—')
    expect(screen.getByText('Relevés', { selector: 'span' })).toHaveTextContent('0')
    expect(screen.getByText('Non renseignés', { selector: 'span' })).toHaveTextContent('7')
    expect(screen.getAllByText('Complétude', { selector: 'span' })).toHaveLength(2)
    expect(screen.getAllByText('Complétude', { selector: 'span' }).every((item) => item.textContent?.includes('0%'))).toBe(true)
    expect(stats.presentCount).toBe(0)
    expect(stats.absentExcusedCount + stats.absentUnexcusedCount).toBe(0)
  })

  it.each([
    ['partielle', [record('alice', 'present')], 50, 100],
    ['complète', [record('alice', 'present'), record('arthur', 'present')], 100, 100],
  ])('préserve les métriques d’une séance %s', (_label, records, completionRate, attendanceRate) => {
    const stats = computeSessionStats(records as AttendanceRecord[], 2)
    const quality = computeAttendanceQualityScore([session], records as AttendanceRecord[], 2)

    expect(stats).toMatchObject({ completionRate, attendanceRate })
    expect(quality.completionRate).toBe(completionRate)
  })
})
