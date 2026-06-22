import type { ReactNode } from 'react'

type EditorialStudioHeroProps = {
  title?: string
  subtitle?: string
  children?: ReactNode
}

export function EditorialStudioHero({
  title = 'Studio documentaire BCVB',
  subtitle = 'Créez, améliorez, contrôlez et exportez vos documents club dans un parcours structuré.',
  children,
}: EditorialStudioHeroProps) {
  return (
    <section className="editorial-studio-hero bcvb-premium-hero">
      <div>
        <p className="editorial-studio-hero__eyebrow bcvb-eyebrow bcvb-premium-hero__eyebrow">
          Studio éditorial documentaire
        </p>
        <h1 className="editorial-studio-hero__title bcvb-premium-hero__title">{title}</h1>
        <p className="editorial-studio-hero__text bcvb-premium-hero__text">{subtitle}</p>
        <span className="editorial-studio-hero__badge">
          De l’idée au document final : créer, vérifier, exporter.
        </span>
      </div>
      {children ? (
        <div className="editorial-studio-hero__actions bcvb-premium-actions">
          {children}
        </div>
      ) : null}
    </section>
  )
}
