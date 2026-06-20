import { Link } from 'react-router-dom'

type ModulePlaceholderProps = {
  title?: string
  description?: string
}

export default function ModulePlaceholder({
  title = 'Module en préparation',
  description = 'Ce module est en cours de construction. Il sera prochainement disponible pour votre rôle.',
}: ModulePlaceholderProps) {
  return (
    <main className="bcvb-page bcvb-premium-page">
      <section className="bcvb-dashboard-hero bcvb-premium-hero bcvb-card-safe">
        <div>
          <p className="bcvb-eyebrow bcvb-premium-hero__eyebrow bcvb-text-safe">BCVB Référentiel</p>
          <h1 className="bcvb-title-xl bcvb-premium-hero__title bcvb-text-clamp-2">{title}</h1>
          <p className="bcvb-subtitle bcvb-premium-hero__text bcvb-text-clamp-4">{description}</p>
        </div>
        <Link
          className="bcvb-button-secondary bcvb-premium-button bcvb-premium-button--ghost bcvb-action-button-safe"
          to="/dashboard"
        >
          Retour tableau de bord
        </Link>
      </section>
    </main>
  )
}
