const categoryCards = [
  {
    categorie: 'U7',
    finalite: 'Découvrir, jouer, manipuler, courir, s’orienter et aimer le basket.',
    priorites: ['Motricité générale', 'Rapport ballon / corps', 'Écoute et engagement'],
  },
  {
    categorie: 'U9',
    finalite: 'Structurer les premiers vrais repères du jeu en gardant une forte dimension ludique.',
    priorites: ['Prendre des informations', 'Se déplacer avec et sans ballon', '1c1 simple'],
  },
  {
    categorie: 'U11',
    finalite: 'Construire des bases techniques et de lecture plus stables.',
    priorites: ['Désaxation', 'Lecture du porteur', 'Aide / reprise simple'],
  },
  {
    categorie: 'U13',
    finalite: 'Faire progresser les joueurs vers un basket plus intense, plus lisible et plus transférable.',
    priorites: ['1c1 des 2 côtés', 'Transition', 'Jeu collectif simple'],
  },
  {
    categorie: 'U15',
    finalite: 'Élever les exigences techniques, physiques et tactiques dans un cadre compétitif.',
    priorites: ['Lecture et réaction', 'Défense sur homme', 'Vitesse d’exécution'],
  },
  {
    categorie: 'U18 / Seniors',
    finalite: 'Stabiliser l’identité de jeu BCVB en contexte de performance.',
    priorites: ['Efficacité', 'Responsabilité', 'Intensité compétitive'],
  },
];

export function ReferencePage() {
  return (
    <main className="app-shell">
      <header className="section-hero">
        <span className="eyebrow">Socle club</span>
        <h1>Référentiel BCVB</h1>
        <p>
          Une base commune pour harmoniser les contenus, le langage, les intentions et les
          exigences de formation du mini-basket jusqu’aux seniors.
        </p>
      </header>

      <section className="reference-grid">
        <article className="panel reference-block">
          <h2>Identité de jeu</h2>
          <ul className="clean-list">
            <li>Défendre fort</li>
            <li>Courir</li>
            <li>Partager la balle</li>
          </ul>
        </article>

        <article className="panel reference-block">
          <h2>Axes BCVB</h2>
          <ul className="clean-list">
            <li>Intensité</li>
            <li>Agressivité</li>
            <li>Maîtrise</li>
            <li>Jeu</li>
          </ul>
        </article>

        <article className="panel reference-block">
          <h2>Démarche pédagogique</h2>
          <ul className="clean-list">
            <li>Je découvre</li>
            <li>Je m’exerce</li>
            <li>Je retranscris</li>
            <li>Je régule</li>
          </ul>
        </article>

        <article className="panel reference-block">
          <h2>Posture coach BCVB</h2>
          <ul className="clean-list">
            <li>Cadre clair</li>
            <li>Exigence cohérente</li>
            <li>Langage commun</li>
            <li>Recherche de transfert match</li>
          </ul>
        </article>
      </section>

      <section className="category-section">
        <div className="panel-header">
          <h2>Progression par catégorie</h2>
          <p>Une lecture simple des finalités et des priorités de formation.</p>
        </div>

        <div className="category-cards">
          {categoryCards.map((card) => (
            <article key={card.categorie} className="panel category-card">
              <div className="category-card__top">
                <span className="category-badge">{card.categorie}</span>
              </div>

              <h3>{card.finalite}</h3>

              <div>
                <span className="field-title">Priorités</span>
                <ul className="clean-list">
                  {card.priorites.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
