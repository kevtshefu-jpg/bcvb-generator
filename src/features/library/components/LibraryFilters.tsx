import type { ReactNode } from 'react'

export type LibraryFiltersViewMode = 'grid' | 'list'

export type LibraryFilterState = {
  search: string
  family: string
  category: string
  subCategory: string
  theme: string
  sportCategory: string
  audience: string
  season: string
  status: string
  fileType: string
  publicationLevel: string
  tag: string
  lifecycle: string
  viewMode: LibraryFiltersViewMode
}

export type LibraryFilterOptions = {
  families: string[]
  categories: string[]
  subCategories: string[]
  themes: string[]
  sportCategories: string[]
  audiences: string[]
  seasons: string[]
  statuses: string[]
  fileTypes: string[]
  publicationLevels: string[]
  tags: string[]
}

type LibraryFiltersProps = {
  filters: LibraryFilterState
  filterOptions: LibraryFilterOptions
  activeFilterCount: number
  isAdmin: boolean
  selectionMode: boolean
  onPatchFilters: (patch: Partial<LibraryFilterState>) => void
  onResetFilters: () => void
  onReload: () => void
  onToggleSelectionMode?: () => void
  children: ReactNode
}

const selectConfig: Array<{
  label: string
  key: keyof LibraryFilterState
  optionKey: keyof LibraryFilterOptions
}> = [
  { label: 'Famille documentaire', key: 'family', optionKey: 'families' },
  { label: 'Catégorie principale', key: 'category', optionKey: 'categories' },
  { label: 'Sous-catégorie', key: 'subCategory', optionKey: 'subCategories' },
  { label: 'Thème', key: 'theme', optionKey: 'themes' },
  { label: 'Catégorie sportive', key: 'sportCategory', optionKey: 'sportCategories' },
  { label: 'Audience', key: 'audience', optionKey: 'audiences' },
  { label: 'Saison', key: 'season', optionKey: 'seasons' },
  { label: 'Statut', key: 'status', optionKey: 'statuses' },
  { label: 'Type de fichier', key: 'fileType', optionKey: 'fileTypes' },
  { label: 'Niveau publication', key: 'publicationLevel', optionKey: 'publicationLevels' },
  { label: 'Tags', key: 'tag', optionKey: 'tags' },
]

function getOptionLabel(value: string) {
  const labels: Record<string, string> = {
    all: 'Tous',
    active: 'Actifs',
    archived: 'Archivés',
    deleted: 'Supprimés',
  }

  return labels[value] || value
}

function FilterSelect({
  label,
  value,
  values,
  onChange,
}: {
  label: string
  value: string
  values: string[]
  onChange: (value: string) => void
}) {
  const cleanedValues = values.filter((item) => item !== 'all')

  return (
    <label className="library-filter">
      <span>{label}</span>

      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="all">Tous</option>

        {cleanedValues.map((item) => (
          <option value={item} key={item}>
            {getOptionLabel(item)}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function LibraryFilters({
  filters,
  filterOptions,
  activeFilterCount,
  isAdmin,
  selectionMode,
  onPatchFilters,
  onResetFilters,
  onReload,
  onToggleSelectionMode,
  children,
}: LibraryFiltersProps) {
  return (
    <>
      <section className="library-toolbar bcvb-premium-toolbar bcvb-toolbar-safe">
        <label className="library-search library-filters__search">
          <span>Recherche texte / sémantique simple</span>

          <input
            value={filters.search}
            onChange={(event) => onPatchFilters({ search: event.target.value })}
            placeholder="Titre, description, catégorie, tags, résumé, métadonnées..."
          />
        </label>

        <div className="library-toolbar__actions bcvb-premium-toolbar__secondary bcvb-action-row-safe">
          {isAdmin && onToggleSelectionMode ? (
            <button
              className="bcvb-premium-button bcvb-premium-button--secondary"
              type="button"
              onClick={onToggleSelectionMode}
            >
              {selectionMode ? 'Quitter sélection' : 'Sélection multiple'}
            </button>
          ) : null}

          <button
            className="bcvb-premium-button bcvb-premium-button--ghost"
            type="button"
            onClick={onResetFilters}
          >
            Réinitialiser filtres
          </button>

          <button
            className="bcvb-premium-button bcvb-premium-button--primary"
            type="button"
            onClick={onReload}
          >
            Recharger
          </button>
        </div>
      </section>

      {activeFilterCount > 0 ? (
        <p className="library-action-message">
          {activeFilterCount} filtre{activeFilterCount > 1 ? 's' : ''} actif
          {activeFilterCount > 1 ? 's' : ''}.
        </p>
      ) : null}

      <div className="library-layout">
        <aside className="library-filters bcvb-premium-card bcvb-premium-card--muted bcvb-card-safe">
          <h2>Classement</h2>

          {selectConfig.map((config) => (
            <FilterSelect
              key={config.key}
              label={config.label}
              value={String(filters[config.key] || 'all')}
              values={filterOptions[config.optionKey]}
              onChange={(value) =>
                onPatchFilters({ [config.key]: value } as Partial<LibraryFilterState>)
              }
            />
          ))}

          {isAdmin ? (
            <FilterSelect
              label="Cycle de vie"
              value={filters.lifecycle}
              values={['active', 'archived', 'deleted', 'all']}
              onChange={(value) => onPatchFilters({ lifecycle: value })}
            />
          ) : null}
        </aside>

        {children}
      </div>
    </>
  )
}
