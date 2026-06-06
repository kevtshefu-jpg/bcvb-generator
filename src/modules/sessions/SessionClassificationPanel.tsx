import {
  sessionCategories,
  sessionStatusOptions,
  sessionSubThemes,
  sessionThemes,
  sessionVisibilityOptions,
  type SessionStatus,
  type SessionVisibility,
  type TeamLevel,
  type TrainingSessionV2,
} from './sessionModels'
import { listToText, textToList } from './sessionUtils'

type SessionClassificationPanelProps = {
  session: TrainingSessionV2
  onChange: (session: TrainingSessionV2) => void
  isAdmin?: boolean
}

const teamLevels: TeamLevel[] = ['débutant', 'intermédiaire', 'confirmé', 'région', 'performance']

export function SessionClassificationPanel({ session, onChange, isAdmin = false }: SessionClassificationPanelProps) {
  function patch(patchSession: Partial<TrainingSessionV2>) {
    onChange({ ...session, ...patchSession })
  }

  return (
    <section className="session-card session-classification">
      <header className="session-section-header">
        <p className="bcvb-eyebrow">Classement</p>
        <h2>Classification séance</h2>
      </header>
      <div className="session-form-grid">
        <label>
          <span>Catégorie</span>
          <select value={session.category} onChange={(event) => patch({ category: event.target.value as TrainingSessionV2['category'] })}>
            {sessionCategories.map((category) => <option value={category} key={category}>{category}</option>)}
          </select>
        </label>
        <label>
          <span>Niveau équipe</span>
          <select value={(session.tags.find((tag) => teamLevels.includes(tag as TeamLevel)) || '')} onChange={(event) => patch({ tags: [...session.tags.filter((tag) => !teamLevels.includes(tag as TeamLevel)), event.target.value].filter(Boolean) })}>
            <option value="">Non précisé</option>
            {teamLevels.map((level) => <option value={level} key={level}>{level}</option>)}
          </select>
        </label>
        <label>
          <span>Thème principal</span>
          <select value={session.theme} onChange={(event) => patch({ theme: event.target.value })}>
            <option value="">Non classé</option>
            {sessionThemes.map((theme) => <option value={theme} key={theme}>{theme}</option>)}
          </select>
        </label>
        <label>
          <span>Sous-thème</span>
          <select value={session.subTheme} onChange={(event) => patch({ subTheme: event.target.value })}>
            <option value="">Non classé</option>
            {sessionSubThemes.map((theme) => <option value={theme} key={theme}>{theme}</option>)}
          </select>
        </label>
        <label><span>Durée</span><input type="number" min="10" value={session.durationMinutes} onChange={(event) => patch({ durationMinutes: Number(event.target.value) })} /></label>
        <label><span>Joueurs</span><input type="number" min="0" value={session.expectedPlayers} onChange={(event) => patch({ expectedPlayers: Number(event.target.value) })} /></label>
        <label>
          <span>Visibilité</span>
          <select value={session.visibility} onChange={(event) => patch({ visibility: event.target.value as SessionVisibility })} disabled={!isAdmin && session.visibility === 'club_reference'}>
            {sessionVisibilityOptions.map((visibility) => <option value={visibility} key={visibility}>{visibility}</option>)}
          </select>
        </label>
        <label>
          <span>Statut</span>
          <select value={session.status} onChange={(event) => patch({ status: event.target.value as SessionStatus })} disabled={!isAdmin && session.status === 'published'}>
            {sessionStatusOptions.map((status) => <option value={status} key={status}>{status}</option>)}
          </select>
        </label>
      </div>
      <div className="session-form-grid session-form-grid--wide">
        <label><span>Objectif principal</span><textarea value={listToText(session.objectives)} onChange={(event) => patch({ objectives: textToList(event.target.value) })} /></label>
        <label><span>Tags</span><textarea value={listToText(session.tags)} onChange={(event) => patch({ tags: textToList(event.target.value) })} /></label>
      </div>
      {isAdmin && (
        <label className="session-full-field">
          <span>Notes admin</span>
          <textarea value={session.adminNotes} onChange={(event) => patch({ adminNotes: event.target.value })} />
        </label>
      )}
    </section>
  )
}
