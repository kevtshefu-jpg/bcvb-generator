import { readdirSync, readFileSync } from 'node:fs'
import { strict as assert } from 'node:assert'
import { join } from 'node:path'

// Fail closed when the audited October production catch-up sequence changes.
// A new migration after this sequence is allowed. Existing migrations remain immutable.
const expected = [
  '20261007003000_player_progression_profile.sql',
  '20261007015500_player_evaluations.sql',
  '20261007020500_player_objectives.sql',
  '20261007022000_progression_summary.sql',
  '20261007104000_performance_test_results.sql',
  '20261007104100_performance_test_rpcs.sql',
  '20261007175500_player_monitoring.sql',
  '20261007210500_player_programs.sql',
  '20261008090000_monitoring_access_scope.sql',
  '20261008093000_monitoring_dashboard_summary.sql',
  '20261008100000_performance_rpc_fail_closed.sql',
  '20261008103000_performance_dashboard_summaries.sql',
  '20261008110000_evaluation_objective_read_scope.sql',
  '20261008120000_internal_player_book.sql',
  '20261008130000_internal_book_objectives.sql',
  '20261008140000_internal_book_evaluation_register.sql',
]
const dir = join(process.cwd(), 'supabase/migrations')
const files = readdirSync(dir).filter(f => /^\d{14}_.*\.sql$/.test(f)).sort()
const actual = files.filter(f => f >= expected[0] && f <= expected.at(-1))
assert.deepEqual(actual, expected, 'Audited October catch-up sequence changed')
for (const file of expected) {
  const body = readFileSync(join(dir, file), 'utf8')
  assert.ok(body.trim().length > 0, `Empty migration: ${file}`)
}
const guard = readFileSync(join(dir, '20261008090000_monitoring_access_scope.sql'), 'utf8')
for (const fragment of ['can_access_player_monitoring', 'can_manage_player_evaluation', 'can_manage_attendance_team', 'force row level security']) {
  assert.ok(guard.toLowerCase().includes(fragment), `Monitoring security guard missing: ${fragment}`)
}
console.log(`Migration sequence gate passed: ${expected.length} audited migrations, monitoring guards present`)
