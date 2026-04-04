const clubBlocks = [
  {
    title: "Vie sportive",
    lines: ["Plannings coachs", "Réservations gymnases", "Coordination week-end"]
  },
  {
    title: "Développement",
    lines: ["Suivi joueurs", "Détections", "Formation jeunes coachs"]
  },
  {
    title: "Communication",
    lines: ["Parents", "Bénévoles", "Informations terrain"]
  }
];

export default function ClubHubPage() {
  return (
    <div className="member-page-stack">
      <section className="page-intro-card dark">
        <h2>Pilotage club</h2>
        <p>
          Cette zone prépare une vraie brique structure : coordination, documents internes,
          routines et vision commune entre salariés, dirigeants et coachs.
        </p>
      </section>

      <section className="content-grid three">
        {clubBlocks.map((block) => (
          <article key={block.title} className="content-card">
            <h3>{block.title}</h3>
            <ul>
              {block.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
