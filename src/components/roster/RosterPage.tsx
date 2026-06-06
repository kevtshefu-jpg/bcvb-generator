import { useMemo, useState } from "react";
import type {
  FamilyContact,
  Player,
  PlayerPassport,
  RosterImportResult,
  RosterImportRow,
  Team,
  TeamMembership,
} from "../../types/roster";
import { useAuth } from "../../features/auth/context/AuthContext";
import { allImportRows, buildRosterImportReport, remapRosterImportResult } from "../../lib/roster/rosterImport";
import { getRosterPermissions } from "../../lib/roster/rosterPermissions";
import { scoreRosterQuality } from "../../lib/roster/rosterScoring";
import { RosterDashboard } from "./RosterDashboard";
import { RosterImportPanel } from "./RosterImportPanel";
import { RosterMappingTable } from "./RosterMappingTable";
import { RosterPlayersTable } from "./RosterPlayersTable";
import { RosterDuplicatePanel } from "./RosterDuplicatePanel";
import { RosterTeamAssignment } from "./RosterTeamAssignment";
import { PlayerContactsPanel } from "./PlayerContactsPanel";
import { PlayerCard } from "./PlayerCard";
import { PlayerProfileDrawer } from "./PlayerProfileDrawer";
import { RosterQualityPanel } from "./RosterQualityPanel";
import { RosterExportPanel } from "./RosterExportPanel";
import "../../styles/roster.css";

const functionBlocks = [
  ["Très haute", "Import CSV / Excel", "Importer rapidement les listes de joueurs.", "Prévisualisation + mapping"],
  ["Haute", "Affectation équipe", "Rattacher chaque joueur à une équipe et une saison.", "Multi-équipes préparé"],
  ["Haute", "Contacts familles", "Centraliser responsables, emails, téléphones et parents référents.", "Visibilité par rôle"],
  ["Moyenne", "Doublons", "Identifier les joueurs déjà existants.", "Scoring + fusion assistée"],
  ["Haute", "Suivi joueur", "Relier présences, évaluations, séances, planifications et documents.", "Passeport BCVB"],
];

function rebuildResult(result: RosterImportResult, rows: RosterImportRow[]): RosterImportResult {
  return {
    ...result,
    rowCount: rows.length,
    validRows: rows.filter((row) => row.errors.length === 0 && !row.ignored),
    invalidRows: rows.filter((row) => row.errors.length > 0 && !row.ignored),
    warnings: rows.flatMap((row) => row.warnings),
  };
}

function buildContacts(rows: RosterImportRow[]): FamilyContact[] {
  return rows.flatMap((row) =>
    (row.contacts || []).map((contact, index) => ({
      id: contact.id || `${row.id}_contact_${index}`,
      playerId: row.id,
      relation: contact.relation || "responsable légal",
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      isPrimary: contact.isPrimary,
      isParentReferent: contact.isParentReferent,
      notes: contact.notes,
    }))
  );
}

function buildPlayer(row: RosterImportRow): Player {
  const now = new Date().toISOString();
  return {
    id: row.id,
    firstName: row.mapped?.firstName || "",
    lastName: row.mapped?.lastName || "",
    birthDate: row.mapped?.birthDate,
    gender: row.mapped?.gender || "Non renseigné",
    licenseNumber: row.mapped?.licenseNumber,
    email: row.mapped?.email,
    phone: row.mapped?.phone,
    status: row.mapped?.status || "actif",
    category: row.mapped?.category,
    notes: row.mapped?.notes,
    createdAt: now,
    updatedAt: now,
  };
}

function buildPassports(rows: RosterImportRow[], team: Partial<Team>): PlayerPassport[] {
  return rows.filter((row) => !row.ignored).map((row) => {
    const membership: TeamMembership = {
      id: `${row.id}_membership`,
      playerId: row.id,
      teamId: row.targetTeamName || team.name || "Équipe à affecter",
      season: team.season || "2026-2027",
      role: row.membershipRole || "joueur",
      isPrimaryTeam: true,
    };

    return {
      player: buildPlayer(row),
      contacts: buildContacts([row]),
      memberships: [membership],
      attendanceRate: row.errors.length ? 0 : 100,
      absencesCount: 0,
      evaluationSummary: "Évaluation à compléter",
      objectives: ["Présences", "Évaluations", "Progression individuelle"],
      documents: ["Documents BCVB à relier"],
      history: [`Import ligne ${row.sourceLine}`],
    };
  });
}

export function RosterPage() {
  const { profile } = useAuth();
  const permissions = getRosterPermissions(profile?.role);
  const [result, setResult] = useState<RosterImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState("");
  const [selectedPassportId, setSelectedPassportId] = useState<string | null>(null);
  const [team, setTeam] = useState<Partial<Team>>({
    id: "team-draft",
    name: "",
    category: "U13",
    level: "Départemental",
    season: "2026-2027",
    coachIds: [],
    trainingFrequencyPerWeek: 2,
    heterogeneityLevel: "moyen",
    objectives: ["Défendre fort", "Courir", "Partager la balle"],
  });

  const rows = useMemo(() => allImportRows(result), [result]);
  const importReport = useMemo(() => buildRosterImportReport(result), [result]);
  const quality = useMemo(() => scoreRosterQuality(result), [result]);
  const contacts = useMemo(() => buildContacts(rows), [rows]);
  const passports = useMemo(() => buildPassports(rows, team), [rows, team]);
  const selectedPassport = passports.find((passport) => passport.player.id === selectedPassportId) || passports[0] || null;

  function patchRow(rowId: string, patch: Partial<RosterImportRow>) {
    if (!result || permissions.readOnly) return;
    const patchedRows = rows.map((row) => row.id === rowId ? { ...row, ...patch } : row);
    setResult(rebuildResult(result, patchedRows));
  }

  function patchAllRows(patch: Partial<RosterImportRow>) {
    if (!result || permissions.readOnly) return;
    setResult(rebuildResult(result, rows.map((row) => ({ ...row, ...patch }))));
  }

  function validateImport() {
    if (!permissions.canValidateImport) return;
    setReport(`${importReport.validRows} joueur(s) prêts à importer. ${importReport.possibleDuplicates} doublon(s) possible(s) à arbitrer.`);
  }

  return (
    <main className="bcvb-page roster-page">
      <section className="bcvb-dashboard-hero roster-hero">
        <div>
          <p className="bcvb-eyebrow">Effectifs & équipes</p>
          <h1 className="bcvb-title-xl">Gestion sportive des effectifs BCVB</h1>
          <p className="bcvb-subtitle">Importer, contrôler, affecter, suivre et préparer les données qui alimenteront les présences, évaluations, séances et planifications sportives.</p>
        </div>
        <div className="roster-hero-status">
          <strong>{quality.score}%</strong>
          <span>qualité effectif</span>
        </div>
      </section>

      <section className="roster-block-grid">
        {functionBlocks.map(([priority, title, purpose, status]) => (
          <article className="roster-block-card" key={title}>
            <span>{priority}</span>
            <h2>{title}</h2>
            <p>{purpose}</p>
            <strong>{status}</strong>
          </article>
        ))}
      </section>

      <RosterDashboard result={result} quality={quality} />

      <section className="roster-admin-actions">
        <button className="bcvb-button-primary" type="button" disabled={!permissions.canValidateImport || !result} onClick={validateImport}>Valider l’import</button>
        <button className="bcvb-button-secondary" type="button" disabled={!permissions.canMergeDuplicates}>Fusionner doublons</button>
        <button className="bcvb-button-secondary" type="button" disabled={!permissions.canAssignTeams || !result} onClick={() => patchAllRows({ targetTeamName: team.name || "Équipe BCVB" })}>Affecter à une équipe</button>
        <button className="bcvb-button-secondary" type="button" disabled={!permissions.canCreateTeam}>Créer équipe</button>
        {report && <span className="bcvb-success-text">{report}</span>}
        {error && <span className="bcvb-error-text">{error}</span>}
      </section>

      <section className="roster-import-report">
        <article><span>Total lignes</span><strong>{importReport.totalRows}</strong></article>
        <article><span>Valides</span><strong>{importReport.validRows}</strong></article>
        <article><span>Alertes</span><strong>{importReport.warningRows}</strong></article>
        <article><span>Erreurs</span><strong>{importReport.errorRows}</strong></article>
        <article><span>Doublons</span><strong>{importReport.possibleDuplicates}</strong></article>
      </section>

      <section className="roster-shell-layout">
        <div className="roster-main-column">
          <RosterImportPanel result={result} canImport={permissions.canImport} onImported={setResult} onError={setError} />
          <RosterMappingTable
            result={result}
            onChange={(mapping) => result && setResult(remapRosterImportResult(result, mapping))}
          />
          <RosterTeamAssignment rows={rows} team={team} permissions={permissions} onTeamChange={setTeam} onPatchRows={patchAllRows} />
          <RosterPlayersTable
            rows={rows}
            permissions={permissions}
            onPatchRow={patchRow}
            onSelectRow={(row) => setSelectedPassportId(row.id)}
          />
          <section className="bcvb-tool-card roster-section">
            <div className="roster-section-header">
              <div>
                <span>Fiches joueurs</span>
                <h2>Passeports BCVB générés</h2>
              </div>
              <strong>{passports.length} fiches</strong>
            </div>
            <div className="roster-player-grid">
              {passports.slice(0, 8).map((passport) => (
                <PlayerCard key={passport.player.id} passport={passport} onSelect={(item) => setSelectedPassportId(item.player.id)} />
              ))}
              {passports.length === 0 && <p>Importe un effectif pour créer les fiches joueurs.</p>}
            </div>
          </section>
          <PlayerContactsPanel contacts={contacts} permissions={permissions} />
          <RosterDuplicatePanel rows={rows} permissions={permissions} />
        </div>

        <aside className="roster-right-column">
          <RosterQualityPanel quality={quality} />
          <RosterExportPanel
            result={result}
            contacts={contacts}
            passports={passports}
            selectedPassport={selectedPassport}
            team={team}
            permissions={permissions}
          />
          <PlayerProfileDrawer passport={selectedPassport} permissions={permissions} />
        </aside>
      </section>
    </main>
  );
}

export default RosterPage;
