import { EmptyState } from '../../../components/ui/PageShell'

type LibraryEmptyStateProps = {
  loading?: boolean
  hasDocuments: boolean
  onReset?: () => void
}

export default function LibraryEmptyState({
  loading = false,
  hasDocuments,
  onReset,
}: LibraryEmptyStateProps) {
  if (loading) return null

  return (
    <EmptyState
      cause={hasDocuments ? 'no_results' : 'no_data'}
      title={hasDocuments ? 'Aucun document trouvé' : 'Bibliothèque à alimenter'}
      description={hasDocuments
          ? 'Ajuste la recherche, change la catégorie ou efface les filtres pour élargir la sélection.'
          : 'Les documents apparaîtront ici dès qu’ils seront publiés pour votre rôle ou votre catégorie.'}
      action={hasDocuments && onReset ? <button type="button" onClick={onReset}>Réinitialiser les filtres</button> : undefined}
    />
  )
}
