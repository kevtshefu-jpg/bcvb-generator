import { strict as assert } from 'node:assert'
import { readdirSync } from 'node:fs'

// Pure parser. Never contacts Supabase or modifies a database.
// Fail closed if the CLI changes its tabular output format.
export function assertPreprodMigrationHistory(output, directory = 'supabase/migrations') {
  const files = readdirSync(directory).filter(f => /^\d{14}_[a-z0-9_]+\.sql$/.test(f)).sort()
  assert.equal(files.length, 53, 'Expected 53 audited migration files')
  const expectedLocal = files.map(f => f.slice(0, 14))
  const expectedRemote = expectedLocal.slice(0, 51)
  const rows = output.split(/\r?\n/).map(line => {
    const m = line.match(/^\s*(\d{14})?\s*\|\s*(\d{14})?\s*\|/)
    return m && (m[1] || m[2]) ? { local: m[1] ?? null, remote: m[2] ?? null } : null
  }).filter(Boolean)
  assert.ok(rows.length > 0, 'Unrecognized Supabase migration list format; STOP')
  assert.deepEqual(rows.map(r => r.local).filter(Boolean), expectedLocal,
    'Local migration list differs from the 53 audited files; STOP')
  assert.deepEqual(rows.map(r => r.remote).filter(Boolean), expectedRemote,
    'Preproduction remote migration history must contain exactly the first 51 versions; STOP')
  for (const row of rows) {
    assert.ok(!row.remote || row.remote === row.local,
      'Remote-only or misaligned migration version detected; STOP')
  }
  return { local: expectedLocal.length, remote: expectedRemote.length }
}

export function assertPreprodDryRun(output) {
  const expected = [
    '20261013161800_session_submit_duration_gate.sql',
    '20261013175500_session_publish_duration_gate.sql',
  ]
  const found = [...output.matchAll(/\b\d{14}_[a-z0-9_]+\.sql\b/g)].map(m => m[0])
  assert.deepEqual(found, expected,
    'Dry-run must list exactly two pending migrations in the expected order; STOP')
  return { pending: found.length, migrations: found }
}
