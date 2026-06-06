import { useMemo, useState } from 'react'
import type { SessionSituation } from './sessionModels'
import { listSituationTemplates } from './sessionStorage'

type SessionLibraryPickerProps = {
  onInsert: (situation: SessionSituation) => void
}

export function SessionLibraryPicker({ onInsert }: SessionLibraryPickerProps) {
  const [query, setQuery] = useState('')
  const templates = useMemo(() => listSituationTemplates(), [])
  const filtered = templates.filter((template) => `${template.title} ${template.theme} ${template.objective}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <section className="session-card">
      <header className="session-section-header">
        <p className="bcvb-eyebrow">Bibliothèque de situations</p>
        <h2>Réutiliser une situation</h2>
      </header>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher par catégorie, thème, durée..." />
      <div className="session-library-list">
        {filtered.length === 0 && <p>Aucune situation sauvegardée pour l’instant.</p>}
        {filtered.map((template) => (
          <article key={template.id}>
            <h3>{template.title}</h3>
            <p>{template.theme} · {template.durationMinutes} min</p>
            <button type="button" onClick={() => onInsert(template)}>Insérer dans séance</button>
          </article>
        ))}
      </div>
    </section>
  )
}
