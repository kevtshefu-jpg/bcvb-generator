import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

type Metric = {
  label: string
  value: string
  detail?: string
}

type Action = {
  label: string
  path: string
  text: string
}

type Panel = {
  title: string
  text: string
  items?: string[]
}

type FunctionalModulePageProps = {
  eyebrow: string
  title: string
  subtitle: string
  badge?: string
  metrics?: Metric[]
  actions?: Action[]
  panels: Panel[]
  children?: ReactNode
}

export function FunctionalModulePage({
  eyebrow,
  title,
  subtitle,
  badge,
  metrics = [],
  actions = [],
  panels,
  children,
}: FunctionalModulePageProps) {
  return (
    <main className="bcvb-page">
      <section className="bcvb-dashboard-hero bcvb-module-hero">
        <div>
          <p className="bcvb-eyebrow">{eyebrow}</p>
          <h1 className="bcvb-title-xl">{title}</h1>
          <p className="bcvb-subtitle">{subtitle}</p>
        </div>
        {badge && <span className="bcvb-status-pill">{badge}</span>}
      </section>

      {metrics.length > 0 && (
        <section className="bcvb-grid-4 bcvb-module-metrics">
          {metrics.map((metric) => (
            <article className="bcvb-tool-card" key={metric.label}>
              <span className="bcvb-status-pill">{metric.label}</span>
              <h3>{metric.value}</h3>
              {metric.detail && <p>{metric.detail}</p>}
            </article>
          ))}
        </section>
      )}

      {actions.length > 0 && (
        <section className="bcvb-module-actions">
          {actions.map((action) => (
            <Link className="bcvb-card bcvb-module-action" to={action.path} key={action.path}>
              <h3>{action.label}</h3>
              <p>{action.text}</p>
            </Link>
          ))}
        </section>
      )}

      <section className="bcvb-grid-3">
        {panels.map((panel) => (
          <article className="bcvb-tool-card bcvb-module-panel" key={panel.title}>
            <h2>{panel.title}</h2>
            <p>{panel.text}</p>
            {panel.items && (
              <ul className="bcvb-module-list">
                {panel.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </section>

      {children}
    </main>
  )
}
