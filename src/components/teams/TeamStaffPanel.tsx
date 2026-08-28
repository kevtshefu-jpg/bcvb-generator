import { useMemo, useState } from 'react'
import { assignStaff, removeStaff, type StaffAssignment, type StaffAssignmentRole, type StaffProfile, type TeamDetail } from '../../features/teams/teamManagementService'

export const staffRoleLabels: Record<StaffAssignmentRole, string> = { head_coach: 'Coach principal', assistant_coach: 'Assistant', team_staff: 'Autre affectation staff', parent_referent: 'Parent référent' }
const roles = Object.keys(staffRoleLabels) as StaffAssignmentRole[]

export function TeamStaffPanel({ team, profiles, canManage, actorId, onSaved }: { team: TeamDetail; profiles: StaffProfile[]; canManage: boolean; actorId?: string; onSaved: () => Promise<void> }) {
  const [role, setRole] = useState<StaffAssignmentRole>('head_coach')
  const [profileId, setProfileId] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const grouped = useMemo(() => Object.fromEntries(roles.map((item) => [item, team.staff.filter((assignment) => assignment.assignment_role === item)])) as Record<StaffAssignmentRole, StaffAssignment[]>, [team.staff])
  const candidates = profiles.filter((profile) => !team.staff.some((assignment) => assignment.profile_id === profile.id && assignment.assignment_role === role && assignment.is_active))

  async function save() {
    if (!profileId) return setMessage({ type: 'error', text: 'Sélectionnez un profil actif.' })
    setBusy(true); setMessage(null)
    try { await assignStaff({ teamId: team.id, profileId, role, currentAssignments: team.staff, actorId }); await onSaved(); setProfileId(''); setMessage({ type: 'success', text: role === 'head_coach' && grouped.head_coach.length ? 'Coach principal remplacé et écriture confirmée.' : 'Affectation confirmée par le serveur.' }) }
    catch (cause) { setMessage({ type: 'error', text: cause instanceof Error ? cause.message : 'Écriture impossible.' }) }
    finally { setBusy(false) }
  }
  async function retire(assignment: StaffAssignment) {
    if (!window.confirm(`Retirer ${assignment.profile?.full_name || 'ce profil'} du rôle « ${staffRoleLabels[assignment.assignment_role]} » ? L’affectation sera conservée comme inactive.`)) return
    setBusy(true); setMessage(null)
    try { await removeStaff({ teamId: team.id, assignment, currentAssignments: team.staff }); await onSaved(); setMessage({ type: 'success', text: 'Retrait confirmé par le serveur. L’affectation est conservée comme inactive.' }) }
    catch (cause) { setMessage({ type: 'error', text: cause instanceof Error ? cause.message : 'Retrait impossible.' }) }
    finally { setBusy(false) }
  }
  return <section className="team-staff-panel">
    <div className="teams-section-title"><span>Encadrement</span><h2>Affectations actives</h2></div>
    <div className="team-staff-sections">{roles.map((item) => <section key={item} className="team-staff-role"><div><h3>{staffRoleLabels[item]}</h3><span>{grouped[item].length ? `${grouped[item].length} renseigné${grouped[item].length > 1 ? 's' : ''}` : 'Non renseigné'}</span></div>{grouped[item].map((assignment) => <article key={assignment.id}><div><strong>{assignment.profile?.full_name || assignment.profile?.email || 'Profil indisponible'}</strong><small>{assignment.profile?.email}</small></div>{canManage && <button className="bcvb-button-secondary team-touch-action" type="button" disabled={busy} onClick={() => retire(assignment)}>Retirer</button>}</article>)}</section>)}</div>
    {canManage && <div className="team-staff-editor"><h3>Gérer une affectation</h3><label>Rôle<select value={role} onChange={(event) => { setRole(event.target.value as StaffAssignmentRole); setProfileId('') }}>{roles.map((item) => <option key={item} value={item}>{staffRoleLabels[item]}</option>)}</select></label><label>Profil actif<select value={profileId} onChange={(event) => setProfileId(event.target.value)}><option value="">Sélectionner un profil</option>{candidates.map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name || profile.email} — {profile.role}</option>)}</select></label><button className="bcvb-button-primary team-touch-action" type="button" disabled={busy || !profileId} onClick={save}>{busy ? 'Confirmation…' : role === 'head_coach' && grouped.head_coach.length ? 'Remplacer le coach principal' : 'Confirmer l’affectation'}</button></div>}
    {message && <p className={`team-operation-message team-operation-message--${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</p>}
  </section>
}
