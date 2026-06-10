import type { ReactNode } from 'react'

type MobilePageHeroProps = {
  eyebrow?: string
  title: string
  description?: string
  icon?: ReactNode
  badge?: string
  actions?: ReactNode
  variant?: 'light' | 'dark' | 'red'
  className?: string
}

export default function MobilePageHero({
  eyebrow,
  title,
  description,
  icon,
  badge,
  actions,
  variant = 'light',
  className = '',
}: MobilePageHeroProps) {
  return (
    <header className={`mobile-page-hero mobile-page-hero--${variant} ${className}`.trim()}>
      <div className="mobile-page-hero__top">
        {icon ? <div className="mobile-page-hero__icon">{icon}</div> : null}

        {badge ? (
          <span className="mobile-page-hero__badge">
            {badge}
          </span>
        ) : null}
      </div>

      {eyebrow ? (
        <p className="mobile-page-hero__eyebrow">
          {eyebrow}
        </p>
      ) : null}

      <h1 className="mobile-page-hero__title">
        {title}
      </h1>

      {description ? (
        <p className="mobile-page-hero__description">
          {description}
        </p>
      ) : null}

      {actions ? (
        <div className="mobile-page-hero__actions">
          {actions}
        </div>
      ) : null}
    </header>
  )
}