import { AdvancedFibaCourt } from '../../components/courts/AdvancedFibaCourt'
import type { SessionSituation } from './sessionModels'
import { getPhaseLabel, listToText, patchBcvbLink, textToList } from './sessionUtils'
import { SituationMetricsEditor } from './SituationMetricsEditor'

type SessionSituationEditorProps = {
  situation: SessionSituation
  onChange: (situation: SessionSituation) => void
}

export function SessionSituationEditor({ situation, onChange }: SessionSituationEditorProps) {
  function patch(patchSituation: Partial<SessionSituation>) {
    onChange({ ...situation, ...patchSituation })
  }

  return (
    <div className="session-situation-editor">
      <div className="session-form-grid">
        <label><span>Titre</span><input value={situation.title} onChange={(event) => patch({ title: event.target.value })} /></label>
        <label><span>Temps</span><input type="number" min="1" value={situation.durationMinutes} onChange={(event) => patch({ durationMinutes: Number(event.target.value) })} /></label>
        <label><span>Thème</span><input value={situation.theme} onChange={(event) => patch({ theme: event.target.value })} /></label>
        <label><span>Sous-thème</span><input value={situation.subTheme} onChange={(event) => patch({ subTheme: event.target.value })} /></label>
        <label><span>Catégorie</span><input value={situation.category} onChange={(event) => patch({ category: event.target.value })} /></label>
        <label><span>Intensité</span><select value={situation.intensityLevel} onChange={(event) => patch({ intensityLevel: event.target.value as SessionSituation['intensityLevel'] })}><option value="low">Basse</option><option value="medium">Moyenne</option><option value="high">Haute</option><option value="game">Match</option></select></label>
        <label><span>Phase</span><select value={situation.pedagogicalPhase} onChange={(event) => patch({ pedagogicalPhase: event.target.value as SessionSituation['pedagogicalPhase'] })}><option value="je-decouvre">{getPhaseLabel('je-decouvre')}</option><option value="je-m-exerce">{getPhaseLabel('je-m-exerce')}</option><option value="je-retranscris">{getPhaseLabel('je-retranscris')}</option><option value="je-regule">{getPhaseLabel('je-regule')}</option></select></label>
      </div>
      <div className="session-situation-grid">
        <label><span>Objectif</span><textarea value={situation.objective} onChange={(event) => patch({ objective: event.target.value })} /></label>
        <label><span>Objectif technique</span><textarea value={situation.technicalObjective} onChange={(event) => patch({ technicalObjective: event.target.value })} /></label>
        <label><span>Objectif tactique</span><textarea value={situation.tacticalObjective} onChange={(event) => patch({ tacticalObjective: event.target.value })} /></label>
        <label><span>Objectif mental</span><textarea value={situation.mentalObjective} onChange={(event) => patch({ mentalObjective: event.target.value })} /></label>
        <label><span>Objectif BCVB</span><textarea value={situation.bcvbObjective} onChange={(event) => patch({ bcvbObjective: event.target.value })} /></label>
        <label><span>Lien avec le match</span><textarea value={situation.expectedSuccessCriteria} onChange={(event) => patch({ expectedSuccessCriteria: event.target.value })} /></label>
        <label><span>Organisation</span><textarea value={situation.organization} onChange={(event) => patch({ organization: event.target.value })} /></label>
        <label><span>Espace</span><textarea value={situation.space} onChange={(event) => patch({ space: event.target.value })} /></label>
        <label><span>Nombre de joueurs</span><textarea value={situation.playerCount} onChange={(event) => patch({ playerCount: event.target.value })} /></label>
        <label><span>Matériel</span><textarea value={listToText(situation.equipment)} onChange={(event) => patch({ equipment: textToList(event.target.value) })} /></label>
        <label><span>Rotations</span><textarea value={situation.rotation} onChange={(event) => patch({ rotation: event.target.value })} /></label>
        <label><span>Sécurité</span><textarea value={situation.security} onChange={(event) => patch({ security: event.target.value })} /></label>
        <label><span>Description</span><textarea value={situation.description} onChange={(event) => patch({ description: event.target.value })} /></label>
        <label><span>Consignes</span><textarea value={situation.instructions} onChange={(event) => patch({ instructions: event.target.value })} /></label>
        <label><span>Consignes coach</span><textarea value={listToText(situation.coachCues)} onChange={(event) => patch({ coachCues: textToList(event.target.value) })} /></label>
        <label><span>Timing</span><textarea value={situation.timing} onChange={(event) => patch({ timing: event.target.value })} /></label>
        <label><span>Temps de pratique / rythme</span><textarea value={situation.coachingPoints} onChange={(event) => patch({ coachingPoints: event.target.value })} /></label>
        <label><span>Régression</span><textarea value={situation.regression} onChange={(event) => patch({ regression: event.target.value, regressions: textToList(event.target.value) })} /></label>
        <label><span>Version standard</span><textarea value={situation.adaptationsByLevel.standard} onChange={(event) => patch({ adaptationsByLevel: { ...situation.adaptationsByLevel, standard: event.target.value } })} /></label>
        <label><span>Évolution</span><textarea value={situation.evolution} onChange={(event) => patch({ evolution: event.target.value, evolutions: textToList(event.target.value) })} /></label>
        <label><span>Contraintes supplémentaires</span><textarea value={listToText(situation.variables)} onChange={(event) => patch({ variables: textToList(event.target.value) })} /></label>
        <label><span>Critères observables</span><textarea value={listToText(situation.observableCriteria)} onChange={(event) => patch({ observableCriteria: textToList(event.target.value) })} /></label>
        <label><span>Critères quantifiables</span><textarea value={listToText(situation.measurableCriteria)} onChange={(event) => patch({ measurableCriteria: textToList(event.target.value) })} /></label>
        <label><span>Réussite attendue</span><textarea value={listToText(situation.successIndicators)} onChange={(event) => patch({ successIndicators: textToList(event.target.value) })} /></label>
        <label><span>Seuil de réussite</span><textarea value={situation.successThreshold} onChange={(event) => patch({ successThreshold: event.target.value })} /></label>
        <label><span>Méthode d’observation</span><textarea value={situation.evaluationMethod} onChange={(event) => patch({ evaluationMethod: event.target.value })} /></label>
        <label><span>Erreurs fréquentes</span><textarea value={listToText(situation.commonMistakes)} onChange={(event) => patch({ commonMistakes: textToList(event.target.value) })} /></label>
        <label><span>Corrections coach</span><textarea value={listToText(situation.coachCorrections)} onChange={(event) => patch({ coachCorrections: textToList(event.target.value) })} /></label>
      </div>
      <div className="session-card session-identity-card">
        <header className="session-subheader">
          <h4>Identité BCVB</h4>
        </header>
        <div className="session-situation-grid">
          <label><span>Défendre Fort</span><textarea value={situation.bcvbLinks.defendreFort} onChange={(event) => patch({ bcvbLinks: patchBcvbLink(situation.bcvbLinks, 'defendreFort', event.target.value) })} /></label>
          <label><span>Courir</span><textarea value={situation.bcvbLinks.courir} onChange={(event) => patch({ bcvbLinks: patchBcvbLink(situation.bcvbLinks, 'courir', event.target.value) })} /></label>
          <label><span>Partager</span><textarea value={situation.bcvbLinks.partager} onChange={(event) => patch({ bcvbLinks: patchBcvbLink(situation.bcvbLinks, 'partager', event.target.value) })} /></label>
          <label><span>Homme à Homme</span><textarea value={situation.bcvbLinks.hommeHomme} onChange={(event) => patch({ bcvbLinks: patchBcvbLink(situation.bcvbLinks, 'hommeHomme', event.target.value) })} /></label>
          <label><span>Intensité</span><textarea value={situation.bcvbLinks.intensite} onChange={(event) => patch({ bcvbLinks: patchBcvbLink(situation.bcvbLinks, 'intensite', event.target.value) })} /></label>
          <label><span>Agressivité maîtrisée</span><textarea value={situation.bcvbLinks.agressiviteMaitrisee} onChange={(event) => patch({ bcvbLinks: patchBcvbLink(situation.bcvbLinks, 'agressiviteMaitrisee', event.target.value) })} /></label>
          <label><span>Maîtrise</span><textarea value={situation.bcvbLinks.maitrise} onChange={(event) => patch({ bcvbLinks: patchBcvbLink(situation.bcvbLinks, 'maitrise', event.target.value) })} /></label>
          <label><span>Jeu</span><textarea value={situation.bcvbLinks.jeu} onChange={(event) => patch({ bcvbLinks: patchBcvbLink(situation.bcvbLinks, 'jeu', event.target.value) })} /></label>
        </div>
      </div>
      <SituationMetricsEditor metrics={situation.metrics} onChange={(metrics) => patch({ metrics })} />
      <AdvancedFibaCourt frames={situation.courtFrames} onChange={(courtFrames) => patch({ courtFrames })} />
    </div>
  )
}
