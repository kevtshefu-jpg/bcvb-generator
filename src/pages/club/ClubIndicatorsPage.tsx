const indicators = [
  ['Effectifs suivis', 'À consolider', 'Répartition par catégorie et équipe.'],
  ['Séances préparées', 'En cours', 'Traçabilité des contenus terrain.'],
  ['Assiduité', 'À mesurer', 'Présences, absences, retards et blessures.'],
  ['Documents club', 'Actif', 'Ressources publiées dans la bibliothèque.'],
]

export default function ClubIndicatorsPage() {
  return (
    <main className="bcvb-page coach-tool-page">
      <section className="bcvb-dashboard-hero">
        <p className="bcvb-eyebrow">Pilotage club</p>
        <h1 className="bcvb-title-xl">Indicateurs sportifs</h1>
        <p className="bcvb-subtitle">
          Suivre les signaux utiles pour piloter le projet sportif sans alourdir le quotidien des coachs.
        </p>
      </section>

      <section className="bcvb-grid-4">
        {indicators.map(([title, value, text]) => (
          <article className="bcvb-tool-card" key={title}>
            <span className="bcvb-status-pill">{value}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
