import { useState } from 'react'

import {
  runRegistrationDiagnostics,
  type RegistrationDiagnosticResult,
} from '../services/registrationDiagnosticsService'
import './RegistrationDiagnosticsPanel.css'

function getStatusLabel(status: RegistrationDiagnosticResult['status']) {
  if (status === 'ok') return 'OK'
  if (status === 'warning') return 'À vérifier'
  return 'Erreur'
}

export default function RegistrationDiagnosticsPanel() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<RegistrationDiagnosticResult[]>([])
  const [error, setError] = useState<string | null>(null)

  async function runDiagnostics() {
    try {
      setLoading(true)
      setError(null)
      const rows = await runRegistrationDiagnostics()
      setResults(rows)
    } catch (err) {
      console.error('[RegistrationDiagnosticsPanel] diagnostic failed:', err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="registration-diagnostics-panel">
      <header className="registration-diagnostics-panel__header">
        <div>
          <p>Diagnostic technique</p>
          <h2>Tester le formulaire d’inscription</h2>
          <span>
            Vérifie les tables, l’insertion principale, les notifications et la fonction secondaire sans exposer ces détails au visiteur.
          </span>
        </div>
        <button type="button" onClick={runDiagnostics} disabled={loading}>
          {loading ? 'Test en cours…' : 'Tester le formulaire d’inscription'}
        </button>
      </header>

      {error ? (
        <p className="registration-diagnostics-panel__error">{error}</p>
      ) : null}

      {results.length > 0 ? (
        <div className="registration-diagnostics-panel__grid">
          {results.map((item) => (
            <article
              className={`registration-diagnostic-card registration-diagnostic-card--${item.status}`}
              key={item.key}
            >
              <span>{getStatusLabel(item.status)}</span>
              <strong>{item.label}</strong>
              <p>{item.message}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="registration-diagnostics-panel__empty">
          Lance le diagnostic si une demande publique échoue ou si une colonne Supabase manque.
        </p>
      )}
    </section>
  )
}
