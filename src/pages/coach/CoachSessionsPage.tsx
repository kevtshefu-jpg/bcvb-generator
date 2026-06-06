import { useState } from 'react'

type CoachSession = {
  title: string
  team: string
  category: string
  date: string
  objective: string
  duration: string
  material: string
  content: string
  situations: string
  review: string
}

const emptySession: CoachSession = {
  title: '',
  team: '',
  category: 'U7',
  date: '',
  objective: '',
  duration: '75 min',
  material: '',
  content: '',
  situations: '',
  review: '',
}

export default function CoachSessionsPage() {
  const [session, setSession] = useState<CoachSession>(emptySession)
  const [sessions, setSessions] = useState<CoachSession[]>([])

  function update<K extends keyof CoachSession>(key: K, value: CoachSession[K]) {
    setSession((current) => ({ ...current, [key]: value }))
  }

  function saveSession() {
    if (!session.title.trim()) return
    setSessions((current) => [session, ...current])
    setSession(emptySession)
  }

  function exportPdf() {
    window.print()
  }

  return (
    <main className="bcvb-page coach-tool-page">
      <section className="bcvb-dashboard-hero">
        <p className="bcvb-eyebrow">Espace coach</p>
        <h1 className="bcvb-title-xl">Mes séances</h1>
        <p className="bcvb-subtitle">Préparer ton entraînement, garder une trace et exporter une fiche terrain.</p>
      </section>

      <section className="bcvb-tool-card coach-form-card">
        <h3>Créer une séance</h3>
        <div className="coach-form-grid">
          <input value={session.title} onChange={(event) => update('title', event.target.value)} placeholder="Titre" />
          <input value={session.team} onChange={(event) => update('team', event.target.value)} placeholder="Équipe" />
          <input value={session.category} onChange={(event) => update('category', event.target.value)} placeholder="Catégorie" />
          <input type="date" value={session.date} onChange={(event) => update('date', event.target.value)} />
          <input value={session.objective} onChange={(event) => update('objective', event.target.value)} placeholder="Objectif principal" />
          <input value={session.duration} onChange={(event) => update('duration', event.target.value)} placeholder="Durée" />
          <input value={session.material} onChange={(event) => update('material', event.target.value)} placeholder="Matériel" />
          <textarea value={session.content} onChange={(event) => update('content', event.target.value)} placeholder="Contenu" />
          <textarea value={session.situations} onChange={(event) => update('situations', event.target.value)} placeholder="Situations" />
          <textarea value={session.review} onChange={(event) => update('review', event.target.value)} placeholder="Bilan coach" />
        </div>
        <div className="coach-actions">
          <button className="bcvb-button-primary" type="button" onClick={saveSession}>Créer une séance</button>
          <button className="bcvb-button-secondary" type="button" onClick={exportPdf}>Exporter PDF</button>
        </div>
      </section>

      {sessions.length === 0 ? (
        <article className="bcvb-tool-card">
          <h3>Aucune séance créée</h3>
          <p>Aucune séance créée pour le moment. Crée ta première séance pour préparer ton entraînement et garder une trace de ton travail.</p>
        </article>
      ) : (
        <section className="coach-list">
          {sessions.map((item, index) => (
            <article className="bcvb-tool-card" key={`${item.title}-${index}`}>
              <span className="bcvb-status-pill">{item.category}</span>
              <h3>{item.title}</h3>
              <p>{item.objective}</p>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}
