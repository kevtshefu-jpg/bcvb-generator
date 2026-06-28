import { useMemo, useState } from 'react'
import { MobileDetailCard, ResponsiveDataList } from '../../components/ui/ResponsiveDataView'

const players = ['Joueur 1', 'Joueur 2', 'Joueur 3', 'Joueur 4', 'Joueur 5']
const statuses = ['Présent', 'Absent excusé', 'Absent non excusé', 'Retard', 'Blessé']

export default function CoachAttendancePage() {
  const [attendance, setAttendance] = useState<Record<string, string>>(
    Object.fromEntries(players.map((player) => [player, 'Présent']))
  )
  const summary = useMemo(() => {
    return statuses.reduce<Record<string, number>>((acc, status) => {
      acc[status] = Object.values(attendance).filter((value) => value === status).length
      return acc
    }, {})
  }, [attendance])

  return (
    <main className="bcvb-page coach-tool-page">
      <section className="bcvb-dashboard-hero">
        <p className="bcvb-eyebrow">Espace coach</p>
        <h1 className="bcvb-title-xl">Présences / absences</h1>
        <p className="bcvb-subtitle">Suivre l’assiduité, les retards, les blessures et les notes utiles au coach.</p>
      </section>

      <section className="bcvb-grid-4">
        {statuses.map((status) => (
          <article className="bcvb-tool-card" key={status}>
            <span className="bcvb-status-pill">{status}</span>
            <h3>{summary[status] ?? 0}</h3>
          </article>
        ))}
      </section>

      <article className="bcvb-tool-card">
        <div className="responsive-data-table">
          <table className="bcvb-table-premium">
          <thead><tr><th>Joueur</th><th>Statut</th><th>Note coach</th></tr></thead>
          <tbody>
            {players.map((player) => (
              <tr key={player}>
                <td>{player}</td>
                <td>
                  <select value={attendance[player]} onChange={(event) => setAttendance((current) => ({ ...current, [player]: event.target.value }))}>
                    {statuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </td>
                <td><input placeholder="Note" /></td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
        <div className="responsive-data-mobile">
          <ResponsiveDataList>
            {players.map((player) => (
              <MobileDetailCard
                key={player}
                eyebrow="Joueur"
                title={player}
                badge={<span className="bcvb-status-pill">{attendance[player]}</span>}
                items={[
                  {
                    label: 'Statut',
                    value: (
                      <select value={attendance[player]} onChange={(event) => setAttendance((current) => ({ ...current, [player]: event.target.value }))}>
                        {statuses.map((status) => <option key={status}>{status}</option>)}
                      </select>
                    ),
                    full: true,
                  },
                  { label: 'Note coach', value: <input placeholder="Note" />, full: true },
                ]}
              />
            ))}
          </ResponsiveDataList>
        </div>
      </article>
    </main>
  )
}
