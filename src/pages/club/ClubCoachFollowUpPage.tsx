const followUpRows = [
  ['Coach U7', 'Accueil / cadre', 'Besoin de situations courtes', 'Accompagnement terrain'],
  ['Coach U9', 'Progression dribble / passe', 'Harmoniser les critères', 'Partage séance type'],
  ['Coach U11', 'Jeu rapide', 'Renforcer évaluation', 'Point technique mensuel'],
]

export default function ClubCoachFollowUpPage() {
  return (
    <main className="bcvb-page coach-tool-page">
      <section className="bcvb-dashboard-hero">
        <p className="bcvb-eyebrow">Pilotage club</p>
        <h1 className="bcvb-title-xl">Suivi des coachs</h1>
        <p className="bcvb-subtitle">
          Accompagner les coachs, partager les repères BCVB et faire circuler les bonnes pratiques.
        </p>
      </section>

      <article className="bcvb-tool-card">
        <table className="bcvb-table-premium">
          <thead>
            <tr>
              <th>Coach</th>
              <th>Priorité actuelle</th>
              <th>Besoin identifié</th>
              <th>Action club</th>
            </tr>
          </thead>
          <tbody>
            {followUpRows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell) => <td key={cell}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </main>
  )
}
