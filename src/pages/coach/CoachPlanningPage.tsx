import { useState } from 'react'
import { MobileDetailCard, ResponsiveDataList } from '../../components/ui/ResponsiveDataView'

const defaultRows = [
  ['Semaine 1', 'Accueil / cadre', 'Manipulation', 'Occupation espace', 'Coordination', 'Confiance', 'Jeux de repères', 'Engagement'],
  ['Semaine 2', 'Avancer', 'Dribble', 'Se démarquer', 'Appuis', 'Oser', 'Relais ballon', 'Continuité'],
]

export default function CoachPlanningPage() {
  const [team, setTeam] = useState('')
  const [period, setPeriod] = useState('Cycle 1')

  return (
    <main className="bcvb-page coach-tool-page">
      <section className="bcvb-dashboard-hero">
        <p className="bcvb-eyebrow">Espace coach</p>
        <h1 className="bcvb-title-xl">Mes planifications</h1>
        <p className="bcvb-subtitle">Choisir une période, définir les objectifs et suivre la progression semaine après semaine.</p>
      </section>

      <article className="bcvb-tool-card">
        <div className="coach-form-grid coach-form-grid--compact">
          <input value={team} onChange={(event) => setTeam(event.target.value)} placeholder="Équipe" />
          <input value={period} onChange={(event) => setPeriod(event.target.value)} placeholder="Période" />
        </div>
        <div className="responsive-data-table">
          <table className="bcvb-table-premium">
          <thead>
            <tr>
              {['Semaine', 'Thème', 'Objectif technique', 'Objectif tactique', 'Objectif physique', 'Objectif mental', 'Situation référence', 'Critères'].map((header) => <th key={header}>{header}</th>)}
            </tr>
          </thead>
          <tbody>
            {defaultRows.map((row) => (
              <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>
            ))}
          </tbody>
          </table>
        </div>
        <div className="responsive-data-mobile">
          <ResponsiveDataList>
            {defaultRows.map((row) => (
              <MobileDetailCard
                key={row[0]}
                eyebrow={row[0]}
                title={row[1]}
                items={[
                  { label: 'Technique', value: row[2] },
                  { label: 'Tactique', value: row[3] },
                  { label: 'Physique', value: row[4] },
                  { label: 'Mental', value: row[5] },
                  { label: 'Situation', value: row[6], full: true },
                  { label: 'Critères', value: row[7], full: true },
                ]}
              />
            ))}
          </ResponsiveDataList>
        </div>
      </article>
    </main>
  )
}
