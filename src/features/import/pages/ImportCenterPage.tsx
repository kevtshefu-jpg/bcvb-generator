import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import { importTemplates, type ImportTemplateType } from '../data/importTemplates'
import { exportTemplateCsv, parseCsvFile } from '../utils/csvUtils'
import { exportTemplateExcel, parseExcelFile } from '../utils/excelUtils'
import { parsePdfFile } from '../utils/pdfUtils'
import {
  createImportBatch,
  finalizeImportBatch,
  insertImportRows,
} from '../services/importBatchService'
import type { NormalizedImportRow } from '../utils/normalizeImportRows'

export default function ImportCenterPage() {
  const { user } = useAuth()

  const [templateType, setTemplateType] = useState<ImportTemplateType>('joueurs')
  const [rows, setRows] = useState<NormalizedImportRow[]>([])
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const activeTemplate = useMemo(
    () => importTemplates.find((template) => template.type === templateType)!,
    [templateType]
  )

  async function handleFileChange(file: File | null) {
    if (!file) return

    try {
      setLoading(true)
      setError(null)
      setMessage(null)

      const lowerName = file.name.toLowerCase()
      let parsedRows: NormalizedImportRow[] = []

      if (lowerName.endsWith('.csv')) {
        parsedRows = await parseCsvFile(file)
      } else if (lowerName.endsWith('.xlsx')) {
        parsedRows = await parseExcelFile(file)
      } else if (lowerName.endsWith('.pdf')) {
        parsedRows = await parsePdfFile(file)
      } else {
        throw new Error('Format non pris en charge. Utilise CSV, XLSX ou PDF.')
      }

      setRows(parsedRows)
      setFileName(file.name)
    } catch (err) {
      setRows([])
      setFileName('')
      setError(err instanceof Error ? err.message : "Erreur pendant l'import")
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveBatch() {
    if (!fileName || rows.length === 0) return

    try {
      setSaving(true)
      setError(null)
      setMessage(null)

      const lowerName = fileName.toLowerCase()
      const sourceType = lowerName.endsWith('.csv')
        ? 'csv'
        : lowerName.endsWith('.xlsx')
        ? 'excel'
        : 'pdf'

      const batch = await createImportBatch(user?.id, sourceType, fileName)
      await insertImportRows(batch.id, rows)
      await finalizeImportBatch(batch.id)

      setMessage(`Batch enregistré avec succès : ${batch.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  function handleExportCsvTemplate() {
    exportTemplateCsv(activeTemplate)
  }

  async function handleExportExcelTemplate() {
    await exportTemplateExcel(activeTemplate)
  }

  const preview = rows.slice(0, 20)

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">Administration</p>
          <h2 className="dashboard-page__title">Centre import / export</h2>
          <p className="dashboard-page__text">
            Travaille avec plusieurs modèles type pour simplifier l’import et l’export
            de joueurs, inscriptions et progression.
          </p>
        </div>

        <div className="dashboard-page__badge">
          <span className="dashboard-page__badgeLabel">Formats</span>
          <strong>CSV · XLSX · PDF</strong>
        </div>
      </div>

      <article className="dashboard-panelCard">
        <h3 className="dashboard-panelCard__title">Choisir un modèle type</h3>

        <div className="bcvb-form-grid" style={{ marginTop: 16 }}>
          <label className="bcvb-label-block">
            <span>Modèle</span>
            <select
              className="bcvb-input"
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value as ImportTemplateType)}
            >
              {importTemplates.map((template) => (
                <option key={template.type} value={template.type}>
                  {template.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p style={{ marginTop: 12 }}>{activeTemplate.description}</p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
          <button className="bcvb-primary-btn" onClick={handleExportCsvTemplate}>
            Télécharger modèle CSV
          </button>
          <button className="bcvb-primary-btn" onClick={handleExportExcelTemplate}>
            Télécharger modèle Excel
          </button>
        </div>
      </article>

      <article className="dashboard-panelCard">
        <h3 className="dashboard-panelCard__title">Importer un fichier</h3>

        <div style={{ marginTop: 16 }}>
          <input
            type="file"
            accept=".csv,.xlsx,.pdf"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
        </div>

        {loading && <p style={{ marginTop: 12 }}>Analyse du fichier…</p>}
        {message && <p style={{ marginTop: 12 }}>{message}</p>}
        {error && <p style={{ marginTop: 12 }}>{error}</p>}
      </article>

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

            <div className="admin-page__tableWrap" style={{ marginTop: 16 }}>
              <table className="admin-page__table">
                <thead>
                  <tr>
                    <th>Prénom</th>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Année</th>
                    <th>Catégorie</th>
                    <th>Équipe</th>
                    <th>Licence</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, index) => (
                    <tr key={index}>
                      <td>{row.normalized_first_name || '—'}</td>
                      <td>{row.normalized_last_name || '—'}</td>
                      <td>{row.normalized_email || '—'}</td>
                      <td>{row.normalized_phone || '—'}</td>
                      <td>{row.normalized_birth_year || '—'}</td>
                      <td>{row.normalized_category_id || '—'}</td>
                      <td>{row.normalized_team || '—'}</td>
                      <td>{row.normalized_license_number || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 18 }}>
              <button className="bcvb-primary-btn" onClick={handleSaveBatch} disabled={saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer le batch'}
              </button>
            </div>
          </article>
        </>
      )}
    </section>
  )
}