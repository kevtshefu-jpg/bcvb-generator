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

function getSummaryLabel(results: RegistrationDiagnosticResult[]) {
  if (results.some((item) => item.status === 'error')) {
    return 'Action requise'
  }

  if (results.some((item) => item.status === 'warning')) {
    return 'Opérationnel avec points à vérifier'
  }

  return 'Formulaire opérationnel'
}

function getSummaryStatus(results: RegistrationDiagnosticResult[]) {
  if (results.some((item) => item.status === 'error')) return 'error'
  if (results.some((item) => item.status === 'warning')) return 'warning'
  return 'ok'
}

function formatDiagnosticReport(results: RegistrationDiagnosticResult[], lastRunAt: string | null) {
  const dateLine = lastRunAt ? `Test lancé le ${lastRunAt}` : 'Test lancé récemment'
  const rows = results.map((item) => {
    const hint = item.hint ? `\n  Action conseillée: ${item.hint}` : ''
    return `- [${getStatusLabel(item.status)}] ${item.label}: ${item.message}${hint}`
  })

  return [
    'Diagnostic inscription BCVB',
    dateLine,
    `Synthèse: ${getSummaryLabel(results)}`,
    '',
    ...rows,
  ].join('\n')
}

export default function RegistrationDiagnosticsPanel() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<RegistrationDiagnosticResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [lastRunAt, setLastRunAt] = useState<string | null>(null)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  const okCount = results.filter((item) => item.status === 'ok').length
  const warningCount = results.filter((item) => item.status === 'warning').length
  const errorCount = results.filter((item) => item.status === 'error').length
  const summaryStatus = results.length > 0 ? getSummaryStatus(results) : 'warning'

  async function runDiagnostics() {
    try {
      setLoading(true)
      setError(null)
      setCopyFeedback(null)
      const rows = await runRegistrationDiagnostics()
      setResults(rows)
      setLastRunAt(new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'medium',
      }).format(new Date()))
    } catch (err) {
      console.error('[RegistrationDiagnosticsPanel] diagnostic failed:', err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  async function copyDiagnosticReport() {
    if (results.length === 0) return

    const report = formatDiagnosticReport(results, lastRunAt)

    try {
      await navigator.clipboard.writeText(report)
      setCopyFeedback('Rapport copié.')
    } catch (err) {
      console.error('[RegistrationDiagnosticsPanel] copy failed:', err)
      setCopyFeedback('Copie impossible depuis ce navigateur.')
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
        <>
          <div className={`registration-diagnostics-panel__summary registration-diagnostics-panel__summary--${summaryStatus}`}>
            <div>
              <span>{getSummaryLabel(results)}</span>
              <p>
                {okCount} OK · {warningCount} à vérifier · {errorCount} erreur
                {lastRunAt ? ` · dernier test ${lastRunAt}` : ''}
              </p>
            </div>
            <div className="registration-diagnostics-panel__actions">
              <button type="button" onClick={copyDiagnosticReport}>
                Copier le rapport
              </button>
              <code>docs/supabase-registration-notifications.sql</code>
            </div>
          </div>

          {copyFeedback ? (
            <p className="registration-diagnostics-panel__feedback">{copyFeedback}</p>
          ) : null}

          <div className="registration-diagnostics-panel__grid">
            {results.map((item) => (
              <article
                className={`registration-diagnostic-card registration-diagnostic-card--${item.status}`}
                key={item.key}
              >
                <span>{getStatusLabel(item.status)}</span>
                <strong>{item.label}</strong>
                <p>{item.message}</p>
                {item.hint ? (
                  <p className="registration-diagnostic-card__hint">
                    <strong>Action conseillée</strong>
                    {item.hint}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </>
      ) : (
        <p className="registration-diagnostics-panel__empty">
          Lance le diagnostic si une demande publique échoue ou si une colonne Supabase manque.
        </p>
      )}
    </section>
  )
}
