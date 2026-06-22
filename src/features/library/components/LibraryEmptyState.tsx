type LibraryEmptyStateProps = {
  loading?: boolean
  hasDocuments: boolean
}

export default function LibraryEmptyState({
  loading = false,
  hasDocuments,
}: LibraryEmptyStateProps) {
  if (loading) return null

  return (
    <article className="library-empty">
      <h3>{hasDocuments ? 'Aucun résultat' : 'Aucun document visible'}</h3>
      <p>
        {hasDocuments
          ? 'Aucun document ne correspond aux filtres actuels.'
          : 'Aucun document ne correspond aux filtres ou aux droits du profil connecté.'}
      </p>
    </article>
  )
}
