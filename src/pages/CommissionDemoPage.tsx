import { Link } from 'react-router-dom'
import { PRESENTATION_LABELS } from '../config/presentationMode'

const demoCards = [
  {
    title: 'Bibliothèque documentaire',
    text: 'Centraliser les cahiers techniques, guides coachs, séances, rubans pédagogiques et fiches à thème du BCVB.',
  },
  {
    title: 'Studio éditorial',
    text: 'Créer ou transformer un document brut en ressource BCVB structurée, conforme à l’identité du club.',
  },
  {
    title: 'Contrôle qualité',
    text: 'Vérifier la présence des blocs essentiels : titre, planification, tableaux, situations pédagogiques, schémas, critères de réussite.',
  },
  {
    title: 'Export & diffusion',
    text: 'Préparer les documents pour la lecture en ligne, le téléchargement PDF et le partage aux coachs.',
  },
]

const visionItems = [
  'Défendre Fort',
  'Courir',
  'Partager la Balle',
  'Défense Homme à Homme',
  'Intensité',
  'Agressivité maîtrisée',
  'Maîtrise',
  'Jeu',
  'Je découvre / Je m’exerce / Je retranscris en match / Je régule',
]

export default function CommissionDemoPage() {
  return (
    <main className="bcvb-page commission-demo-page">
      <section className="bcvb-dashboard-hero">
        <p className="bcvb-eyebrow">Démo commission sportive</p>
        <h1 className="bcvb-title-xl">{PRESENTATION_LABELS.appTitle}</h1>
        <p className="bcvb-subtitle">{PRESENTATION_LABELS.appSubtitle}</p>
        <div className="commission-demo-actions">
          <Link className="bcvb-button-primary" to="/connexion">
            Se connecter pour ouvrir le studio
          </Link>
          <Link className="bcvb-button-secondary" to="/bibliotheque">
            Voir la bibliothèque
          </Link>
        </div>
      </section>

      <section className="bcvb-grid-4">
        {demoCards.map((card) => (
          <article className="bcvb-card" key={card.title}>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </article>
        ))}
      </section>

      <section className="bcvb-card commission-demo-impact">
        <p className="bcvb-eyebrow">Ce que le site apporte au club</p>
        <h2>Un référentiel commun, utile et transmissible</h2>
        <p>
          Le BCVB Référentiel permet de centraliser les contenus techniques du club,
          d’harmoniser les pratiques des coachs, de produire des documents conformes
          à l’identité BCVB et de gagner du temps sur la formation interne.
        </p>
      </section>

      <section className="bcvb-card">
        <p className="bcvb-eyebrow">Vision BCVB</p>
        <div className="commission-demo-pills">
          {visionItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>
    </main>
  )
}
