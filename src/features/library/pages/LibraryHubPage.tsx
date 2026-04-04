const librarySections = [
  {
    title: "Cahiers techniques",
    description: "Mini-basket, jeune joueur, identité BCVB, cadre coach et méthodologie.",
    items: ["U7", "U9", "U11", "U15", "SF1"]
  },
  {
    title: "Banque de situations",
    description: "Situations filtrables, repères terrain, variations et critères de réussite.",
    items: ["1c1", "Tir", "Jeu rapide", "Défense", "Lecture du jeu"]
  },
  {
    title: "Ressources club",
    description: "Documents cadres, routines de match, communication et organisation.",
    items: ["Protocoles", "WhatsApp", "Tables", "Arbitrage", "Logistique"]
  }
];

export function LibraryHubPage() {
  return (
    <div className="member-page-stack">
      <section className="page-intro-card">
        <h2>Bibliothèque BCVB</h2>
        <p>
          Un hub unique pour rassembler les contenus club, les documents de formation,
          les ressources coach et les trames prêtes à l’emploi.
        </p>
      </section>

      <section className="content-grid three">
        {librarySections.map((section) => (
          <article key={section.title} className="content-card">
            <h3>{section.title}</h3>
            <p>{section.description}</p>
            <div className="tag-row">
              {section.items.map((item) => (
                <span key={item} className="soft-tag">{item}</span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
