import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import {
  createImportBatch,
  finalizeImportBatch,
  insertImportRows,
  type ImportRowInsert,
} from '../services/importService'
import { parseImportFile } from '../utils/importParsers'
import { EmptyState, MobileDetailCard, ResponsiveDataList } from '../../../components/ui/ResponsiveDataView'
import { formatUserFacingError, getTechnicalErrorDetail } from '../../../lib/userFacingError'

export default function ImportPlayersPage() {
  const { user } = useAuth()

  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<ImportRowInsert[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [technicalError, setTechnicalError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleFileChange(file: File | null) {
    if (!file) return

    try {
      setLoading(true)
      setError(null)
      setTechnicalError(null)
      setSuccess(null)

      const parsedRows = await parseImportFile(file)
      setRows(parsedRows)
      setFileName(file.name)
    } catch (err) {
      setError(formatUserFacingError(err, 'Le fichier joueurs n’a pas pu être lu. Vérifie le format et les colonnes attendues.'))
      setTechnicalError(getTechnicalErrorDetail(err))
      setRows([])
      setFileName('')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveBatch() {
    if (!fileName || rows.length === 0) return

    try {
      setSaving(true)
      setError(null)
      setTechnicalError(null)
      setSuccess(null)

      const sourceType = fileName.toLowerCase().endsWith('.csv') ? 'csv' : 'excel'

      const batch = await createImportBatch(user?.id, sourceType, fileName)
      await insertImportRows(batch.id, rows)
      await finalizeImportBatch(batch.id)

      setSuccess(`Import enregistré avec succès. Batch : ${batch.id}`)
    } catch (err) {
      setError(formatUserFacingError(err, 'L’import n’a pas pu être enregistré. Vérifie ta connexion puis réessaie.'))
      setTechnicalError(getTechnicalErrorDetail(err))
    } finally {
      setSaving(false)
    }
  }

  const previewRows = useMemo(() => rows.slice(0, 20), [rows])

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">Administration</p>
          <h2 className="dashboard-page__title">Import joueurs CSV / Excel</h2>
          <p className="dashboard-page__text">
            Importe un fichier Kalisport, FBI ou export club au format CSV / XLSX,
            prévisualise les données puis enregistre le batch pour traitement.
          </p>
        </div>

        <div className="dashboard-page__badge">
          <span className="dashboard-page__badgeLabel">Formats</span>
          <strong>CSV · XLSX · XLS</strong>
        </div>
      </div>

      <article className="dashboard-panelCard">
        <h3 className="dashboard-panelCard__title">Choisir un fichier</h3>

        <div style={{ marginTop: 16 }}>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
        </div>

        {loading && <p style={{ marginTop: 12 }}>Analyse du fichier...</p>}
        {error && (
          <div className="responsive-empty-state" style={{ marginTop: 12 }}>
            <strong>Import joueurs interrompu</strong>
            <p>{error}</p>
            {technicalError && (
              <details>
                <summary>Détail technique admin</summary>
                <pre>{technicalError}</pre>
              </details>
            )}
          </div>
        )}
        {success && <p style={{ marginTop: 12 }}>{success}</p>}
      </article>

      {!loading && rows.length === 0 && !error && (
        <EmptyState
          title="Aucun fichier joueur chargé"
          description="Importe un fichier CSV, XLSX ou XLS pour prévisualiser les joueurs avant validation."
        />
      )}

      {rows.length > 0 && (
        <>
          <div className="dashboard-page__grid">
            <article className="dashboard-actionCard">
              <h3 className="dashboard-actionCard__title">Fichier</h3>
              <p className="dashboard-actionCard__text">{fileName}</p>
            </article>

            <article className="dashboard-actionCard">
              <h3 className="dashboard-actionCard__title">Lignes détectées</h3>
              <p className="dashboard-actionCard__text">{rows.length}</p>
            </article>
          </div>

          <article className="dashboard-panelCard">
            <h3 className="dashboard-panelCard__title">Prévisualisation</h3>

            <div className="admin-page__tableWrap responsive-data-table" style={{ marginTop: 16 }}>
              <table className="admin-page__table">
                <thead>
                  <tr>
                    <th>Prénom</th>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Année</th>
                    <th>Catégorie</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, index) => (
                    <tr key={index}>
                      <td>{row.normalized_first_name || '—'}</td>
                      <td>{row.normalized_last_name || '—'}</td>
                      <td>{row.normalized_email || '—'}</td>
                      <td>{row.normalized_phone || '—'}</td>
                      <td>{row.normalized_birth_year || '—'}</td>
                      <td>{row.normalized_category_id || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="responsive-data-mobile" style={{ marginTop: 16 }}>
              <ResponsiveDataList>
                {previewRows.map((row, index) => (
                  <MobileDetailCard
                    key={index}
                    eyebrow={`Ligne ${index + 1}`}
                    title={`${row.normalized_first_name || 'Prénom manquant'} ${row.normalized_last_name || 'Nom manquant'}`}
                    items={[
                      { label: 'Email', value: row.normalized_email || '—', full: true },
                      { label: 'Téléphone', value: row.normalized_phone || '—' },
                      { label: 'Année', value: row.normalized_birth_year || '—' },
                      { label: 'Catégorie', value: row.normalized_category_id || '—' },
                    ]}
                  />
                ))}
              </ResponsiveDataList>
            </div>

            <div style={{ marginTop: 18 }}>
              <button className="bcvb-primary-btn" onClick={handleSaveBatch} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer le batch'}
              </button>
            </div>
          </article>
        </>
      )}
    </section>
  )
}
