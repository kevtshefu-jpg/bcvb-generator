import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'

const sql = readFileSync('scripts/preprod-readonly-preflight.sql', 'utf8')
const withoutComments = sql.split('\n').filter(line => !line.trimStart().startsWith('--')).join('\n')
assert.match(withoutComments, /^\s*with\s+migration_state\s+as\s*\(/i)
assert.match(withoutComments, /supabase_migrations\.schema_migrations/)
assert.match(withoutComments, /pg_get_functiondef/)
assert.match(withoutComments, /has_function_privilege/)
assert.match(withoutComments, /public_can_execute/)
assert.match(withoutComments, /has_duration_gate/)
assert.match(withoutComments, /security_definer/)
const sqlWithoutLiterals = withoutComments.replace(/'(?:''|[^'])*'/g, "''")
assert.doesNotMatch(sqlWithoutLiterals, /\b(insert|update|delete|truncate|alter|drop|create|grant|revoke|call|execute|do|copy)\b/i,
  'Preflight must contain no SQL mutation or dynamic execution commands')
console.log('P12.42 preproduction SQL preflight is read-only by static contract')
