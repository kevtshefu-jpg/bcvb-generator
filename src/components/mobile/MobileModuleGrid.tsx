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
    <section className={`mobile-module-section ${className}`.trim()}>
      {title ? (
        <h2 className="mobile-module-section__title">
          {title}
        </h2>
      ) : null}

      <div className="mobile-module-grid">
        {cards.map((card) => {
          const className = `mobile-module-card${card.locked ? ' mobile-module-card--locked' : ''}`

          const content = (
            <>
              <div className="mobile-module-card__top">
                {card.icon ? (
                  <span className="mobile-module-card__icon" aria-hidden="true">
                    {card.icon}
                  </span>
                ) : null}

                {card.badge ? (
                  <span className="mobile-module-card__badge">
                    {card.badge}
                  </span>
                ) : null}
              </div>

              <strong className="mobile-module-card__title">
                {card.title}
              </strong>

              {card.description ? (
                <p className="mobile-module-card__description">
                  {card.description}
                </p>
              ) : null}

              {card.meta ? (
                <small className="mobile-module-card__meta">
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
                className={className}
              >
                {content}
              </Link>
            )
          }

          return (
            <button
              key={card.title}
              type="button"
              className={className}
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