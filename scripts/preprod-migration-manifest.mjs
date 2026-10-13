import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { strict as assert } from 'node:assert'

// Safe, offline manifest checker: NO Supabase connection or SQL execution.
// Usage: node scripts/preprod-migration-manifest.mjs
//        node scripts/preprod-migration-manifest.mjs --expected-empty
const dir = resolve('supabase/migrations')
const files = readdirSync(dir).filter(name => name.endsWith('.sql')).sort()
assert.ok(files.length > 0, 'No SQL migrations found')
for (const file of files) assert.match(file, /^\d{14}_[a-z0-9_]+\.sql$/, `Invalid filename: ${file}`)
const versions = files.map(file => file.slice(0, 14))
assert.equal(new Set(versions).size, versions.length, 'Duplicate migration version')
assert.equal(files[0], '20260604072700_sessions_studio.sql', 'Unexpected first migration')
assert.equal(files[50], '20261008140000_internal_book_evaluation_register.sql', 'Audited 51-migration baseline must remain unchanged')
assert.equal(files[51], '20261013161800_session_submit_duration_gate.sql', 'Submission duration gate must remain in sequence')
assert.equal(files.at(-1), '20261013175500_session_publish_duration_gate.sql', 'Unexpected final appended migration')
assert.equal(files.length, 53, 'Expected 51 audited migrations plus two duration gate migrations')
const oct = versions.filter(version => version >= '20261007000000')
assert.equal(oct.length, 18, 'Expected 16 audited October migrations plus two duration gates')
const result = { mode: 'offline-read-only', project: 'NOT_CONNECTED', migration_count: files.length,
  first: files[0], last: files.at(-1), pending_october_baseline: oct.length,
  note: 'Does not verify remote database or execute SQL' }
console.log(JSON.stringify(result, null, 2))
