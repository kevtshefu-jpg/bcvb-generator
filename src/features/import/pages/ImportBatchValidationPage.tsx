import { useEffect, useState } from 'react'
import { fetchImportBatches } from '../services/importValidationService'
import { useImportValidation } from '../hooks/useImportValidation'

type BatchRow = {
  id: string
  created_at: string
  source_type: string
  file_name: string
  status: string
}

export default function ImportBatchValidationPage() {
  const [batches, setBatches] = useState<BatchRow[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [batchesLoading, setBatchesLoading] = useState(false)
  const [batchesError, setBatchesError] = useState<string | null>(null)

  const {
    rows,
    loading,
    error,
    validateRow,
    unvalidateRow,
    importValidatedRow,
  } = useImportValidation(selectedBatchId || undefined)

  useEffect(() => {
    let active = true

    async function loadBatches() {
      try {
        setBatchesLoading(true)
        setBatchesError(null)
        const data = await fetchImportBatches()
        if (active) setBatches(data as BatchRow[])
      } catch (err) {
        if (active) {
          setBatchesError(err instanceof Error ? err.message : 'Erreur chargement batches')
        }
      } finally {
        if (active) setBatchesLoading(false)
      }
    }

    loadBatches()

    return () => {
      active = false
    }
  }, [])

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">Administration</p>
          <h2 className="dashboard-page__title">Validation des batches importés</h2>
          <p className="dashboard-page__text">
            Vérifie les lignes importées, valide-les, puis crée de vrais profils club
            à partir des données nettoyées.
          </p>
        </div>

        <div className="dashboard-page__badge">
          <span className="dashboard-page__badgeLabel">Mode</span>
          <strong>Validation manuelle</strong>
        </div>
      </div>

      <article className="dashboard-panelCard">
        <h3 className="dashboard-panelCard__title">Choisir un batch</h3>

        {batchesLoading && <p>Chargement des batches...</p>}
        {batchesError && <p>{batchesError}</p>}

        {!batchesLoading && !batchesError && (
          <div style={{ marginTop: 16 }}>
            <select
              className="bcvb-input"
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
            >
              <option value="">Sélectionner un batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.file_name} — {batch.source_type} — {batch.status}
                </option>
              ))}
            </select>
          </div>
        )}
      </article>

      {loading && <p>Chargement des lignes...</p>}
      {error && <p>{error}</p>}

      {rows.length > 0 && (
        <article className="dashboard-panelCard">
          <h3 className="dashboard-panelCard__title">Lignes du batch</h3>

          <div className="admin-page__tableWrap" style={{ marginTop: 16 }}>
            <table className="admin-page__table">
              <thead>
                <tr>
                  <th>Prénom</th>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Année</th>
                  <th>Catégorie</th>
                  <th>Validée</th>
                  <th>Statut</th>
                  <th>Profil créé</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.normalized_first_name || '—'}</td>
                    <td>{row.normalized_last_name || '—'}</td>
                    <td>{row.normalized_email || '—'}</td>
                    <td>{row.normalized_birth_year || '—'}</td>
                    <td>{row.normalized_category_id || '—'}</td>
                    <td>{row.validated ? 'Oui' : 'Non'}</td>
                    <td>{row.status}</td>
                    <td>{row.imported_profile_id || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {!row.validated ? (
                          <button
                            className="bcvb-primary-btn"
                            onClick={() => validateRow(row.id)}
                          >
                            Valider
                          </button>
                        ) : (
                          <button
                            className="bcvb-btn danger"
                            onClick={() => unvalidateRow(row.id)}
                          >
                            Dévalider
                          </button>
                        )}

                        {row.validated && !row.imported_profile_id && (
                          <button
                            className="bcvb-primary-btn"
                            onClick={() => importValidatedRow(row.id)}
                          >
                            Créer profil
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}
    </section>
  )
}