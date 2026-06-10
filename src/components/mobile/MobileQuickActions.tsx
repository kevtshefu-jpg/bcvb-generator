import { Link } from 'react-router-dom'

export type MobileQuickAction = {
  label: string
  to?: string
  icon?: string
  variant?: 'primary' | 'secondary' | 'dark' | 'ghost'
  onClick?: () => void
}

type MobileQuickActionsProps = {
  actions: MobileQuickAction[]
  className?: string
}

export default function MobileQuickActions({
  actions,
  className = '',
}: MobileQuickActionsProps) {
  if (!actions.length) return null

  return (
    <nav
      className={`mobile-quick-actions ${className}`.trim()}
      aria-label="Actions rapides"
    >
      {actions.map((action) => {
        const className = `mobile-quick-action mobile-quick-action--${action.variant ?? 'secondary'}`

        const content = (
          <>
            {action.icon ? (
              <span className="mobile-quick-action__icon" aria-hidden="true">
                {action.icon}
              </span>
            ) : null}

            <span>{action.label}</span>
          </>
        )

        if (action.to) {
          return (
            <Link
              key={`${action.label}-${action.to}`}
              to={action.to}
              className={className}
            >
              {content}
            </Link>
          )
        }

        return (
          <button
            key={action.label}
            type="button"
            className={className}
            onClick={action.onClick}
          >
            {content}
          </button>
        )
      })}
    </nav>
  )
}