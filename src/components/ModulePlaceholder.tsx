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
    <main className="bcvb-page">
      <section className="bcvb-dashboard-hero">
        <div>
          <p className="bcvb-eyebrow">BCVB Référentiel</p>
          <h1 className="bcvb-title-xl">{title}</h1>
          <p className="bcvb-subtitle">{description}</p>
        </div>
        <Link className="bcvb-button-secondary" to="/dashboard">
          Retour tableau de bord
        </Link>
      </section>
    </main>
  )
}
