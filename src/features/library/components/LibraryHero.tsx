type LibraryHeroProps = {
  totalCount: number
  visibleCount: number
  loading?: boolean
  presentationMode?: boolean
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
}

export default function LibraryHero({
  totalCount,
  visibleCount,
  loading = false,
  presentationMode = false,
  viewMode,
  onViewModeChange,
}: LibraryHeroProps) {
  const hasActiveView = totalCount !== visibleCount

  return (
    <section className="library-hero bcvb-premium-hero">
      <div>
        <p className="library-hero__eyebrow bcvb-eyebrow bcvb-premium-hero__eyebrow">
          {presentationMode ? 'Mode présentation' : 'Bibliothèque documentaire'}
        </p>

        <h1 className="library-hero__title bcvb-premium-hero__title">
          Bibliothèque documentaire
        </h1>

        <p className="library-hero__text bcvb-premium-hero__text">
          Retrouvez les documents club validés, prêts à consulter, partager ou exporter selon votre rôle.
        </p>
      </div>

      <div className="library-hero__side">
        <div className="library-hero__badge">
          <span>{loading ? 'Chargement' : hasActiveView ? 'Visibles' : 'Documents'}</span>
          <strong>{visibleCount}</strong>
          {hasActiveView ? <small>sur {totalCount}</small> : null}
        </div>

        <div className="library-view-toggle bcvb-premium-actions bcvb-scroll-row bcvb-tabs-safe">
          <button
            type="button"
            className={`bcvb-premium-button ${
              viewMode === 'grid'
                ? 'is-active bcvb-premium-button--primary'
                : 'bcvb-premium-button--ghost'
            }`}
            onClick={() => onViewModeChange('grid')}
          >
            Grille
          </button>

          <button
            type="button"
            className={`bcvb-premium-button ${
              viewMode === 'list'
                ? 'is-active bcvb-premium-button--primary'
                : 'bcvb-premium-button--ghost'
            }`}
            onClick={() => onViewModeChange('list')}
          >
            Liste
          </button>
        </div>
      </div>
    </section>
  )
}
