import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { strict as assert } from 'node:assert'

const source = readFileSync('scripts/preprod-dry-run.mjs', 'utf8')
const allowed = "['db', 'push', '--dry-run', '--linked']"
assert.ok(source.includes(allowed), 'Remote push must always use --dry-run')
assert.ok(!source.includes("['db', 'push', '--linked']"), 'Unprotected push forbidden')
assert.ok(source.includes("linkedRef !== PREPROD_REF"), 'Persisted target check missing')
assert.ok(source.includes("rghbzbwmvvnoqwymqyjn"), 'Expected preproduction ref missing')

// The helper must deny execution before touching any CLI if credentials are absent.
const env = { ...process.env, SUPABASE_ACCESS_TOKEN: '', SUPABASE_DB_PASSWORD: '' }
const result = spawnSync(process.execPath, ['scripts/preprod-dry-run.mjs'], {
  env, encoding: 'utf8', timeout: 10000,
})
assert.notEqual(result.status, 0, 'Missing credentials must cause failure')
assert.match(result.stderr, /SUPABASE_ACCESS_TOKEN and SUPABASE_DB_PASSWORD/, 'Missing credential error expected')
console.log('P12.12 dry-run gate: static preview-only checks and no-credential fail-closed passed')
