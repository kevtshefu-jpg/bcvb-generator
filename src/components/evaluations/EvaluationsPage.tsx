import { useEffect, useMemo, useState } from "react";
import type {
  EvaluationPeriod,
  EvaluationPlayer,
  EvaluationScore,
  EvaluationTeam,
  IndividualObjective,
  PlayerEvaluation,
} from "../../types/evaluations";
import { useAuth } from "../../features/auth/context/AuthContext";
import { getEvaluationTemplateByCategory } from "../../lib/evaluations/evaluationTemplates";
import { computePlayerEvaluationSummary, suggestObjectiveFromSummary } from "../../lib/evaluations/evaluationScoring";
import { buildEvaluationsDashboardData, computeTeamEvaluationSummary } from "../../lib/evaluations/evaluationStats";
import { getEvaluationPermissions } from "../../lib/evaluations/evaluationPermissions";
import { EvaluationPlayerSelector } from "./EvaluationPlayerSelector";
import { EvaluationSummaryCard } from "./EvaluationSummaryCard";
import { EvaluationExportPanel } from "./EvaluationExportPanel";
import { EvaluationPlayerGrid } from "./EvaluationPlayerGrid";
import { EvaluationPlayerCard } from "./EvaluationPlayerCard";
import { EvaluationObjectivesPanel } from "./EvaluationObjectivesPanel";
import { EvaluationTeamSummary } from "./EvaluationTeamSummary";
import { EvaluationTemplateSelector } from "./EvaluationTemplateSelector";
import { EvaluationHistoryTimeline } from "./EvaluationHistoryTimeline";
import "../../styles/evaluations.css";

const teams: EvaluationTeam[] = [
  { id: "u13m1", name: "U13 Masculins 1", category: "U13", level: "Départemental" },
  { id: "u15f1", name: "U15 Féminines", category: "U15", level: "Région" },
  { id: "u18m", name: "U18 Masculins", category: "U18", level: "Pré-région" },
];

const players: EvaluationPlayer[] = [
  { id: "p1", firstName: "Noah", lastName: "Martin", category: "U13", teamId: "u13m1", teamName: "U13 Masculins 1", position: "Meneur", attendanceRate: 92, lastEvaluationDate: "2026-03-15" },
  { id: "p2", firstName: "Lina", lastName: "Bernard", category: "U13", teamId: "u13m1", teamName: "U13 Masculins 1", position: "Extérieure", attendanceRate: 81, lastEvaluationDate: "2026-02-28" },
  { id: "p3", firstName: "Adam", lastName: "Morel", category: "U13", teamId: "u13m1", teamName: "U13 Masculins 1", position: "Ailier", attendanceRate: 64 },
  { id: "p4", firstName: "Sofia", lastName: "Petit", category: "U15", teamId: "u15f1", teamName: "U15 Féminines", position: "Intérieure", attendanceRate: 88 },
  { id: "p5", firstName: "Maya", lastName: "Leroy", category: "U15", teamId: "u15f1", teamName: "U15 Féminines", position: "Meneuse", attendanceRate: 94 },
  { id: "p6", firstName: "Lucas", lastName: "Michel", category: "U18", teamId: "u18m", teamName: "U18 Masculins", position: "Arrière", attendanceRate: 76 },
];

function nowIso() {
  return new Date().toISOString();
}

function createEvaluation(
  player: EvaluationPlayer,
  team: EvaluationTeam,
  period: EvaluationPeriod,
  season: string,
  level: string,
  createdBy: string
): PlayerEvaluation {
  const criteria = getEvaluationTemplateByCategory(player.category || team.category, level);
  return {
    id: `evaluation-${player.id}-${period}-${season}`,
    playerId: player.id,
    teamId: team.id,
    category: player.category || team.category,
    period,
    date: nowIso().slice(0, 10),
    season,
    createdBy,
    criteria,
    scores: criteria.map((criterion) => ({
      criterionId: criterion.id,
      score: 3 as EvaluationScore,
      comment: "",
      observableEvidence: "",
    })),
    strengths: [],
    priorities: [],
    priorityAxis: "",
    monthlyChallenge: "",
    nextStep: "",
    globalComment: "",
    coachComment: "",
    visibleToPlayer: false,
    visibleToFamily: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

function draftKey(playerId: string, period: EvaluationPeriod, season: string) {
  return `bcvb.evaluations.draft.${playerId}.${period}.${season}`;
}

export function EvaluationsPage() {
  const { profile } = useAuth();
  const role = profile?.role;
  const [season, setSeason] = useState("2026-2027");
  const [teamId, setTeamId] = useState("u13m1");
  const currentTeam = teams.find((team) => team.id === teamId) || teams[0];
  const teamPlayers = players.filter((player) => player.teamId === teamId);
  const [playerId, setPlayerId] = useState(teamPlayers[0]?.id || players[0].id);
  const selectedPlayer = players.find((player) => player.id === playerId) || teamPlayers[0] || players[0];
  const [category, setCategory] = useState(selectedPlayer.category);
  const [period, setPeriod] = useState<EvaluationPeriod>("trimestre_2");
  const [level, setLevel] = useState(currentTeam.level);
  const [coachFilter, setCoachFilter] = useState("");
  const [evaluationStatus, setEvaluationStatus] = useState("all");
  const permissions = getEvaluationPermissions(role, teamId);
  const criteria = useMemo(() => getEvaluationTemplateByCategory(category, level), [category, level]);
  const [evaluations, setEvaluations] = useState<PlayerEvaluation[]>(() => [
    createEvaluation(players[0], teams[0], "trimestre_2", "2026-2027", teams[0].level, "BCVB"),
    createEvaluation(players[1], teams[0], "trimestre_2", "2026-2027", teams[0].level, "BCVB"),
    createEvaluation(players[2], teams[0], "trimestre_2", "2026-2027", teams[0].level, "BCVB"),
  ]);

  const currentEvaluation = useMemo(() => {
    return evaluations.find((evaluation) =>
      evaluation.playerId === selectedPlayer.id &&
      evaluation.period === period &&
      evaluation.season === season
    ) || createEvaluation(selectedPlayer, currentTeam, period, season, level, profile?.id || "BCVB");
  }, [currentTeam, evaluations, level, period, profile?.id, season, selectedPlayer]);

  const summary = useMemo(() => computePlayerEvaluationSummary(currentEvaluation, criteria), [criteria, currentEvaluation]);
  const teamSummary = useMemo(
    () => computeTeamEvaluationSummary(evaluations, criteria, currentTeam, period, season),
    [criteria, currentTeam, evaluations, period, season]
  );
  const dashboardData = useMemo(
    () => buildEvaluationsDashboardData(evaluations, players, teams, criteria, period, season),
    [criteria, evaluations, period, season]
  );
  const playerHistory = evaluations.filter((evaluation) => evaluation.playerId === selectedPlayer.id);
  const canEdit = permissions.canEdit && !permissions.aggregateOnly;

  useEffect(() => {
    const stored = window.localStorage.getItem(draftKey(selectedPlayer.id, period, season));
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PlayerEvaluation;
        setEvaluations((current) => {
          const exists = current.some((evaluation) => evaluation.id === parsed.id);
          return exists ? current.map((evaluation) => evaluation.id === parsed.id ? parsed : evaluation) : [...current, parsed];
        });
      } catch {
        window.localStorage.removeItem(draftKey(selectedPlayer.id, period, season));
      }
    }
  }, [period, season, selectedPlayer.id]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      window.localStorage.setItem(draftKey(selectedPlayer.id, period, season), JSON.stringify(currentEvaluation));
    }, 2500);
    return () => window.clearInterval(interval);
  }, [currentEvaluation, period, season, selectedPlayer.id]);

  function upsertEvaluation(nextEvaluation: PlayerEvaluation) {
    if (!canEdit) return;
    setEvaluations((current) => {
      const exists = current.some((evaluation) => evaluation.id === nextEvaluation.id);
      return exists
        ? current.map((evaluation) => evaluation.id === nextEvaluation.id ? nextEvaluation : evaluation)
        : [...current, nextEvaluation];
    });
  }

  function updateFilters(patch: Partial<{ season: string; category: string; teamId: string; playerId: string; period: EvaluationPeriod; level: string }>) {
    if (patch.teamId && patch.teamId !== teamId) {
      const nextTeam = teams.find((team) => team.id === patch.teamId) || currentTeam;
      const nextPlayer = players.find((player) => player.teamId === nextTeam.id) || selectedPlayer;
      setTeamId(nextTeam.id);
      setPlayerId(nextPlayer.id);
      setCategory(nextPlayer.category || nextTeam.category);
      setLevel(nextTeam.level);
      return;
    }

    if (patch.playerId) {
      const nextPlayer = players.find((player) => player.id === patch.playerId);
      if (nextPlayer) {
        setPlayerId(nextPlayer.id);
        setCategory(nextPlayer.category);
      }
    }

    if (patch.season) setSeason(patch.season);
    if (patch.category) setCategory(patch.category);
    if (patch.period) setPeriod(patch.period);
    if (patch.level) setLevel(patch.level);
  }

  function updateObjective(objective: IndividualObjective) {
    upsertEvaluation({
      ...currentEvaluation,
      individualObjective: objective,
      updatedAt: nowIso(),
    });
  }

  function loadTemplateForCurrentPlayer() {
    const nextScores = criteria.map((criterion) => {
      const previous = currentEvaluation.scores.find((score) => score.criterionId === criterion.id);
      return previous || {
        criterionId: criterion.id,
        score: 3 as EvaluationScore,
        comment: "",
        observableEvidence: "",
      };
    });

    upsertEvaluation({
      ...currentEvaluation,
      category,
      criteria,
      scores: nextScores,
      updatedAt: nowIso(),
    });
  }

  function createSuggestedObjective() {
    const suggestion = suggestObjectiveFromSummary(summary);
    updateObjective({
      id: `objective-${selectedPlayer.id}-${Date.now()}`,
      playerId: selectedPlayer.id,
      title: suggestion.title,
      domain: suggestion.domain,
      targetDescription: suggestion.targetDescription,
      observableCriterion: suggestion.observableCriterion,
      quantifiableCriterion: suggestion.quantifiableCriterion,
      deadline: "4 semaines",
      linkedSessions: ["coach/seances"],
      status: "a_travailler",
    });
  }

  if (!permissions.canView) {
    return (
      <main className="evaluations-page">
        <section className="bcvb-dashboard-hero">
          <div>
            <p className="bcvb-eyebrow">Évaluations joueurs</p>
            <h1 className="bcvb-title-xl">Accès réservé</h1>
            <p className="bcvb-subtitle">Les évaluations techniques sont réservées aux coachs, responsables techniques, dirigeants autorisés et admins.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="evaluations-page">
      <section className="bcvb-dashboard-hero evaluations-hero">
        <div>
          <p className="bcvb-eyebrow">Évaluations joueurs</p>
          <h1 className="bcvb-title-xl">Objectiver la progression BCVB</h1>
          <p className="bcvb-subtitle">Relier les observations aux axes BCVB, construire les objectifs individuels et alimenter les prochains cycles.</p>
        </div>
        <div className="evaluations-hero-score">
          <strong>{summary.globalScore}/5</strong>
          <span>joueur</span>
        </div>
      </section>

      <section className="evaluations-metrics">
        <article><span>Évaluations réalisées</span><strong>{dashboardData.completedEvaluations}</strong></article>
        <article><span>Évaluations manquantes</span><strong>{dashboardData.missingEvaluations}</strong></article>
        <article><span>Objectifs ouverts</span><strong>{dashboardData.openIndividualObjectives}</strong></article>
        <article><span>Joueurs sans bilan récent</span><strong>{dashboardData.playersWithoutRecentReport.length}</strong></article>
      </section>

      <section className="evaluations-layout">
        <div className="evaluations-main">
          <EvaluationPlayerSelector
            season={season}
            category={category}
            teamId={teamId}
            playerId={selectedPlayer.id}
            period={period}
            level={level}
            teams={teams}
            players={players}
            disabled={permissions.aggregateOnly}
            onChange={updateFilters}
          />

          <section className="evaluation-card evaluation-filters">
            <div className="evaluations-section-title">
              <span>Filtres avancés</span>
              <h2>Coach, joueur et statut</h2>
            </div>
            <div className="evaluation-selector-grid">
              <label>
                Coach
                <input disabled={permissions.aggregateOnly} value={coachFilter} onChange={(event) => setCoachFilter(event.target.value)} placeholder="Coach référent" />
              </label>
              <label>
                Statut d’évaluation
                <select disabled={permissions.aggregateOnly} value={evaluationStatus} onChange={(event) => setEvaluationStatus(event.target.value)}>
                  <option value="all">Tous statuts</option>
                  <option value="not_started">Non démarrée</option>
                  <option value="in_progress">En cours</option>
                  <option value="validated">Validée</option>
                  <option value="to_share">À partager</option>
                </select>
              </label>
              <label>
                Recherche joueur
                <input disabled={permissions.aggregateOnly} value={`${selectedPlayer.firstName} ${selectedPlayer.lastName}`} readOnly />
              </label>
            </div>
          </section>

          <EvaluationTemplateSelector
            category={category}
            level={level}
            disabled={permissions.aggregateOnly}
            onChange={updateFilters}
            onLoadTemplate={loadTemplateForCurrentPlayer}
          />

          <section className="evaluation-card evaluation-player-list">
            <div className="evaluations-section-title">
              <span>Joueurs de l’équipe</span>
              <h2>Score global, points forts et axes</h2>
            </div>
            <div className="evaluation-player-list__grid">
              {teamPlayers.map((player) => {
                const evaluation = evaluations.find((item) => item.playerId === player.id && item.period === period && item.season === season);
                return (
                  <EvaluationPlayerCard
                    key={player.id}
                    player={player}
                    evaluation={evaluation}
                    criteria={criteria}
                    selected={player.id === selectedPlayer.id}
                    onSelect={() => updateFilters({ playerId: player.id })}
                  />
                );
              })}
            </div>
          </section>

          {!permissions.aggregateOnly && (
            <>
              <EvaluationPlayerGrid criteria={criteria} evaluation={currentEvaluation} disabled={!canEdit} onChange={upsertEvaluation} />
              <EvaluationObjectivesPanel objective={currentEvaluation.individualObjective} playerId={selectedPlayer.id} disabled={!canEdit} onChange={updateObjective} />
              <section className="evaluation-card evaluations-actions">
                <button className="bcvb-button-primary" type="button" disabled={!canEdit} onClick={() => upsertEvaluation(currentEvaluation)}>Sauvegarder l’évaluation</button>
                <button className="bcvb-button-secondary" type="button" disabled={!canEdit} onClick={createSuggestedObjective}>Créer objectif proposé</button>
                <a className="bcvb-button-secondary" href="/coach/seances">Relier à une séance</a>
                <a className="bcvb-button-secondary" href="/coach/planifications">Relier à une planification</a>
              </section>
            </>
          )}

          <EvaluationTeamSummary summary={teamSummary} players={players} />
        </div>

        <aside className="evaluations-sidebar">
          <section className="evaluation-card evaluation-sidebar-stats">
            <div className="evaluations-section-title">
              <span>Suivi équipe</span>
              <h2>{teamSummary.teamGlobalScore}/5</h2>
            </div>
            <dl>
              <div><dt>Joueurs évalués</dt><dd>{teamSummary.playersCount}</dd></div>
              <div><dt>Non évalués</dt><dd>{dashboardData.missingEvaluations}</dd></div>
              <div><dt>Domaine fort</dt><dd>{teamSummary.teamStrengths[0] || "À définir"}</dd></div>
              <div><dt>Axe prioritaire</dt><dd>{teamSummary.teamPriorities[0] || "Aucun critique"}</dd></div>
              <div><dt>Objectifs actifs</dt><dd>{dashboardData.activeIndividualObjectives || dashboardData.openIndividualObjectives}</dd></div>
            </dl>
            <p>{teamSummary.planningRecommendations[0]}</p>
          </section>
          {!permissions.aggregateOnly && (
            <EvaluationSummaryCard
              player={selectedPlayer}
              evaluation={currentEvaluation}
              summary={summary}
              canViewComments={permissions.canViewSensitiveCoachComments}
              onCommentChange={(coachComment) => upsertEvaluation({ ...currentEvaluation, coachComment, updatedAt: nowIso() })}
            />
          )}
          <EvaluationExportPanel
            evaluation={currentEvaluation}
            evaluations={evaluations}
            player={selectedPlayer}
            team={currentTeam}
            players={players}
            criteria={criteria}
            teamSummary={teamSummary}
            canExport={permissions.canExport}
          />
          {!permissions.aggregateOnly && <EvaluationHistoryTimeline evaluations={playerHistory} criteria={criteria} />}
        </aside>
      </section>
    </main>
  );
}

export default EvaluationsPage;
