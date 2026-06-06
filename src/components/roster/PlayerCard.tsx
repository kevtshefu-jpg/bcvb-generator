import type { PlayerPassport } from "../../types/roster";

export function PlayerCard({
  passport,
  onSelect,
}: {
  passport: PlayerPassport;
  onSelect: (passport: PlayerPassport) => void;
}) {
  return (
    <article className="roster-player-card">
      <span>{passport.player.category || "À classer"}</span>
      <h3>{passport.player.firstName} {passport.player.lastName}</h3>
      <p>{passport.memberships[0]?.season || "Saison à définir"} · {passport.player.status}</p>
      <div>
        <strong>{passport.attendanceRate ?? 0}% présence</strong>
        <strong>{passport.evaluationSummary || "Évaluation à créer"}</strong>
      </div>
      <button type="button" onClick={() => onSelect(passport)}>Ouvrir fiche</button>
    </article>
  );
}

