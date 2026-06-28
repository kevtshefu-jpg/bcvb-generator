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
      <h3>{hasDocuments ? 'Aucun document trouvé' : 'Bibliothèque à alimenter'}</h3>
      <p>
        {hasDocuments
          ? 'Ajuste la recherche, change la catégorie ou efface les filtres pour élargir la sélection.'
          : 'Les documents apparaîtront ici dès qu’ils seront publiés pour ton rôle ou ta catégorie.'}
      </p>
    </article>
  )
}
