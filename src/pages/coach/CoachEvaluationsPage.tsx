import { MobileDetailCard, ResponsiveDataList } from '../../components/ui/ResponsiveDataView'

const criteria = [
  'Engagement',
  'Écoute',
  'Intensité',
  'Maîtrise technique',
  'Compréhension du jeu',
  'Défense',
  'Coopération',
  'Attitude',
  'Progression',
]

export default function CoachEvaluationsPage() {
  return (
    <main className="bcvb-page coach-tool-page">
      <section className="bcvb-dashboard-hero">
        <p className="bcvb-eyebrow">Espace coach</p>
        <h1 className="bcvb-title-xl">Évaluations joueurs</h1>
        <p className="bcvb-subtitle">Observer les comportements, fixer les priorités et construire un objectif individuel clair.</p>
      </section>

      <article className="bcvb-tool-card">
        <div className="responsive-data-table">
          <table className="bcvb-table-premium">
          <thead><tr><th>Critère</th><th>Note 1 à 5</th><th>Commentaire</th></tr></thead>
          <tbody>
            {criteria.map((criterion) => (
              <tr key={criterion}>
                <td>{criterion}</td>
                <td><input type="number" min="1" max="5" defaultValue="3" /></td>
                <td><input placeholder="Observation coach" /></td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
        <div className="responsive-data-mobile">
          <ResponsiveDataList>
            {criteria.map((criterion) => (
              <MobileDetailCard
                key={criterion}
                eyebrow="Critère"
                title={criterion}
                items={[
                  { label: 'Note 1 à 5', value: <input type="number" min="1" max="5" defaultValue="3" />, full: true },
                  { label: 'Commentaire', value: <input placeholder="Observation coach" />, full: true },
                ]}
              />
            ))}
          </ResponsiveDataList>
        </div>
        <label className="coach-full-field">
          <span>Objectif individuel pour la prochaine période</span>
          <textarea placeholder="Ex : améliorer la posture défensive et l’intensité sur les 1c1." />
        </label>
      </article>
    </main>
  )
}
