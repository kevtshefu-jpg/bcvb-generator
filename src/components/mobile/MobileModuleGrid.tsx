import { Link } from 'react-router-dom'

export type MobileModuleCard = {
  title: string
  description?: string
  to?: string
  icon?: string
  badge?: string
  meta?: string
  locked?: boolean
  onClick?: () => void
}

type MobileModuleGridProps = {
  title?: string
  cards: MobileModuleCard[]
  className?: string
}

export default function MobileModuleGrid({
  title,
  cards,
  className = '',
}: MobileModuleGridProps) {
  if (!cards.length) return null

  return (
    <section className={`mobile-module-section bcvb-card-safe ${className}`.trim()}>
      {title ? (
        <h2 className="mobile-module-section__title bcvb-text-clamp-2">
          {title}
        </h2>
      ) : null}

      <div className="mobile-module-grid bcvb-grid-safe">
        {cards.map((card) => {
          const cardClassName = `mobile-module-card bcvb-card-safe${card.locked ? ' mobile-module-card--locked' : ''}`

          const content = (
            <>
              <div className="mobile-module-card__top">
                {card.icon ? (
                  <span className="mobile-module-card__icon" aria-hidden="true">
                    {card.icon}
                  </span>
                ) : null}

                {card.badge ? (
                  <span className="mobile-module-card__badge bcvb-badge-safe">
                    {card.badge}
                  </span>
                ) : null}
              </div>

              <strong className="mobile-module-card__title bcvb-text-clamp-2">
                {card.title}
              </strong>

              {card.description ? (
                <p className="mobile-module-card__description bcvb-text-clamp-4">
                  {card.description}
                </p>
              ) : null}

              {card.meta ? (
                <small className="mobile-module-card__meta bcvb-text-safe">
                  {card.meta}
                </small>
              ) : null}
            </>
          )

          if (card.to && !card.locked) {
            return (
              <Link
                key={`${card.title}-${card.to}`}
                to={card.to}
                className={cardClassName}
              >
                {content}
              </Link>
            )
          }

          return (
            <button
              key={card.title}
              type="button"
              className={cardClassName}
              onClick={card.onClick}
              disabled={card.locked}
            >
              {content}
            </button>
          )
        })}
      </div>
    </section>
  )
}
