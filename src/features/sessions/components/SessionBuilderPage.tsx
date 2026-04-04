const sessionBlocks = [
  {
    title: "Avant séance",
    description: "Objectif du jour, public visé, contraintes d’effectif, logique pédagogique."
  },
  {
    title: "Corps de séance",
    description: "Progression des blocs, intensité, coaching points et formes jouées."
  },
  {
    title: "Après séance",
    description: "Régulation, transfert match, trace écrite et points de vigilance."
  }
];

export function SessionBuilderPage() {
  return (
    <div className="member-page-stack">
      <section className="page-intro-card">
        <h2>Construction de séance</h2>
        <p>
          Cette zone prépare le prochain niveau du produit : composer des séances complètes à partir
          du générateur, du référentiel et des situations sauvegardées.
        </p>
      </section>

      <section className="content-grid three">
        {sessionBlocks.map((block) => (
          <article key={block.title} className="content-card">
            <h3>{block.title}</h3>
            <p>{block.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
