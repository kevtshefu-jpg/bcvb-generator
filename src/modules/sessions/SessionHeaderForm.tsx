import { sessionCategories, sessionSubThemes, sessionThemes, type TrainingSessionV2 } from './sessionModels'
import { BCVB_TAGS, listToText, textToList } from './sessionUtils'

type SessionHeaderFormProps = {
  session: TrainingSessionV2
  onChange: (session: TrainingSessionV2) => void
}

export function SessionHeaderForm({ session, onChange }: SessionHeaderFormProps) {
  function patch(patchSession: Partial<TrainingSessionV2>) {
    onChange({ ...session, ...patchSession })
  }

  function toggleFocus(tag: string) {
    patch({
      keyFocus: session.keyFocus.includes(tag)
        ? session.keyFocus.filter((item) => item !== tag)
        : [...session.keyFocus, tag],
    })
  }

  return (
    <section className="session-card">
      <header className="session-section-header">
        <p className="bcvb-eyebrow">Informations générales</p>
        <h2>Cadre de séance</h2>
      </header>
      <div className="session-form-grid">
        <label><span>Titre séance</span><input value={session.title} onChange={(event) => patch({ title: event.target.value })} /></label>
        <label><span>Catégorie</span><select value={session.category} onChange={(event) => patch({ category: event.target.value as TrainingSessionV2['category'] })}>{sessionCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label><span>Équipe</span><input value={session.teamLabel} onChange={(event) => patch({ teamLabel: event.target.value })} /></label>
        <label><span>Coach</span><input value={session.coachName} onChange={(event) => patch({ coachName: event.target.value })} /></label>
        <label><span>Date</span><input type="date" value={session.date} onChange={(event) => patch({ date: event.target.value })} /></label>
        <label><span>Lieu</span><input value={session.location} onChange={(event) => patch({ location: event.target.value })} /></label>
        <label><span>Durée totale</span><input type="number" min="30" value={session.durationMinutes} onChange={(event) => patch({ durationMinutes: Number(event.target.value) })} /></label>
        <label><span>Thème</span><select value={session.theme} onChange={(event) => patch({ theme: event.target.value })}><option value="">À classer</option>{sessionThemes.map((theme) => <option key={theme} value={theme}>{theme}</option>)}</select></label>
        <label><span>Sous-thème</span><select value={session.subTheme} onChange={(event) => patch({ subTheme: event.target.value })}><option value="">À classer</option>{sessionSubThemes.map((theme) => <option key={theme} value={theme}>{theme}</option>)}</select></label>
        <label><span>Cycle</span><input value={session.cycle} onChange={(event) => patch({ cycle: event.target.value })} /></label>
        <label><span>Type</span><select value={session.sessionType} onChange={(event) => patch({ sessionType: event.target.value as TrainingSessionV2['sessionType'] })}><option value="development">Développement</option><option value="preparation-match">Préparation match</option><option value="evaluation">Évaluation</option><option value="tournament">Tournoi</option><option value="recovery">Récupération</option></select></label>
        <label><span>Intensité</span><select value={session.intensityLevel} onChange={(event) => patch({ intensityLevel: event.target.value as TrainingSessionV2['intensityLevel'] })}><option value="low">Basse</option><option value="medium">Moyenne</option><option value="high">Haute</option><option value="game">Match</option></select></label>
        <label><span>Effectif prévu</span><input type="number" min="0" value={session.expectedPlayers} onChange={(event) => patch({ expectedPlayers: Number(event.target.value) })} /></label>
      </div>
      <div className="session-form-grid session-form-grid--wide">
        <label><span>Objectifs</span><textarea value={listToText(session.objectives)} onChange={(event) => patch({ objectives: textToList(event.target.value) })} /></label>
        <label><span>Objectifs BCVB</span><textarea value={listToText(session.bcvbObjectives)} onChange={(event) => patch({ bcvbObjectives: textToList(event.target.value) })} /></label>
        <label><span>Matériel</span><textarea value={listToText(session.equipment)} onChange={(event) => patch({ equipment: textToList(event.target.value) })} /></label>
      </div>
      <div className="session-tags">
        {BCVB_TAGS.map((tag) => <button type="button" className={session.keyFocus.includes(tag) ? 'is-active' : ''} onClick={() => toggleFocus(tag)} key={tag}>{tag}</button>)}
      </div>
    </section>
  )
}
