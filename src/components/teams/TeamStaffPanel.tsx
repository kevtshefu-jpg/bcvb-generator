import type { TeamStaffMember, TeamStaffRole } from "../../types/teams";
import { getDefaultPermissionsForStaffRole } from "../../lib/teams/teamStaff";

export const staffRoleLabels: Record<TeamStaffRole, string> = {
  head_coach: "Coach principal",
  coach_principal: "Coach principal",
  assistant_coach: "Coach adjoint",
  aide_coach: "Aide coach",
  physical_trainer: "Préparateur physique",
  preparateur_physique: "Préparateur physique",
  parent_referent: "Parent référent",
  dirigeant_referent: "Dirigeant référent",
  technical_manager: "Responsable technique",
  responsable_technique: "Responsable technique",
  otm_referent: "OTM référent",
  arbitre_referent: "Arbitre référent",
  autre: "Autre",
  other: "Autre",
};

const roles = Object.keys(staffRoleLabels) as TeamStaffRole[];

export function TeamStaffPanel({
  teamId,
  staff,
  canManage,
  onChange,
}: {
  teamId: string;
  staff: TeamStaffMember[];
  canManage: boolean;
  onChange: (staff: TeamStaffMember[]) => void;
}) {
  function patch(memberId: string, patchMember: Partial<TeamStaffMember>) {
    onChange(staff.map((member) => member.id === memberId ? { ...member, ...patchMember } : member));
  }

  function addMember() {
    onChange([
      ...staff,
      {
        id: `staff-${teamId}-${Date.now()}`,
        teamId,
        name: "Nouveau membre staff",
        displayName: "Nouveau membre staff",
        role: "assistant_coach",
        isActive: true,
        permissions: getDefaultPermissionsForStaffRole("assistant_coach"),
        startDate: new Date().toISOString().slice(0, 10),
      },
    ]);
  }

  return (
    <section className="team-staff-panel">
      <div className="teams-section-title">
        <span>Staff équipe</span>
        <h2>Responsabilités et permissions</h2>
      </div>
      <div className="team-staff-list">
        {staff.map((member) => (
          <article key={member.id}>
            <input disabled={!canManage} value={member.name} onChange={(event) => patch(member.id, { name: event.target.value })} />
            <select disabled={!canManage} value={member.role} onChange={(event) => {
              const role = event.target.value as TeamStaffRole;
              patch(member.id, { role, permissions: getDefaultPermissionsForStaffRole(role) });
            }}>
              {roles.map((role) => <option key={role} value={role}>{staffRoleLabels[role]}</option>)}
            </select>
            <input disabled={!canManage} value={member.email || ""} onChange={(event) => patch(member.id, { email: event.target.value })} placeholder="Email" />
            <input disabled={!canManage} value={member.phone || ""} onChange={(event) => patch(member.id, { phone: event.target.value })} placeholder="Téléphone" />
            <input disabled={!canManage} type="date" value={member.startDate || ""} onChange={(event) => patch(member.id, { startDate: event.target.value })} />
            <button type="button" disabled={!canManage} onClick={() => patch(member.id, { isActive: !member.isActive })}>{member.isActive ? "Actif" : "Inactif"}</button>
            <small>{(member.permissions || ["view_team"]).join(" · ")}</small>
          </article>
        ))}
      </div>
      <div className="coach-actions">
        <button className="bcvb-button-secondary" type="button" disabled={!canManage} onClick={addMember}>Ajouter membre staff</button>
      </div>
    </section>
  );
}
