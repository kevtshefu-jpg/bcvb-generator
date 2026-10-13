import { readFileSync } from 'node:fs'
import { strict as assert } from 'node:assert'

// Offline structural safety check only: never connects to a database or executes SQL.
// The local Supabase integration suite remains the authoritative behavioral check.
const gates = [
  {
    path: 'supabase/migrations/20261013161800_session_submit_duration_gate.sql',
    signature: /create or replace function public\.submit_session_for_review\s*\(/i,
    role: /public\.current_user_role\(\)\s*<>\s*'coach'/i,
    status: /current_row\.status\s*<>\s*'draft'/i,
    mutation: /update public\.sessions\s+set status\s*=\s*'to_review'/i,
    grant: /grant execute on function public\.submit_session_for_review\(uuid,bigint\) to authenticated,service_role/i,
  },
  {
    path: 'supabase/migrations/20261013175500_session_publish_duration_gate.sql',
    signature: /create or replace function public\.publish_session\s*\(/i,
    role: /public\.is_current_user_admin\(\)/i,
    status: /current_row\.status\s*<>\s*'to_review'/i,
    mutation: /update public\.sessions\s+set visibility\s*=\s*target_visibility/i,
    grant: /grant execute on function public\.publish_session\(uuid,bigint,text\) to authenticated,service_role/i,
  },
]
for (const gate of gates) {
  const sql = readFileSync(gate.path, 'utf8')
  const checks = [
    ['RPC signature', gate.signature],
    ['security definer', /security definer/i],
    ['role authorization', gate.role],
    ['optimistic concurrency', /current_row\.version\s*<>\s*expected_version/i],
    ['workflow status', gate.status],
    ['row lock', /for update/i],
    ['nonempty situations', /block_count\s*=\s*0/i],
    ['invalid situations', /invalid_blocks\s*>\s*0/i],
    ['exact total', /planned_minutes\s*<>\s*current_row\.duration_minutes/i],
    ['SQLSTATE 22023', /Durée de séance incohérente[^\n]*22023/i],
    ['authenticated grant', gate.grant],
    ['public/anon revoked', /revoke all on function public\.[\w]+\([^\n]*\) from public,anon/i],
    ['mutation', gate.mutation],
  ]
  for (const [name, regex] of checks) {
    assert.match(sql, regex, `${gate.path}: missing ${name}`)
  }
  const lock = sql.search(/for update/i)
  const total = sql.search(/planned_minutes\s*<>\s*current_row\.duration_minutes/i)
  const update = sql.search(gate.mutation)
  assert.ok(lock >= 0 && total > lock && update > total,
    `${gate.path}: row lock and duration check must precede status mutation`)
}
console.log('P12.40 offline RPC duration gates: submit and publish structure verified (not a remote deployment check)')
