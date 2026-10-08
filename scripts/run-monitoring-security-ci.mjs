import { execFileSync } from 'node:child_process'
// Local-only keys are captured in memory and are never printed or persisted.
const status = execFileSync('supabase', ['status', '-o', 'env'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] })
const values = Object.fromEntries(status.split(/\r?\n/).filter(l => /^[A-Z_]+=/.test(l)).map(l => {
  const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]
}))
const env = { ...process.env, SUPABASE_URL: values.API_URL, SUPABASE_ANON_KEY: values.ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: values.SERVICE_ROLE_KEY, RLS_TEST_ENVIRONMENT: 'local',
  RLS_TEST_PROJECT_NAME: 'bcvb-generator', RLS_TEST_PROJECT_REF: 'local', RLS_TEST_CONFIRM_PROJECT_REF: 'local' }
for (const script of ['scripts/create-test-users.mjs', 'scripts/test-player-monitoring-security.mjs']) {
  execFileSync(process.execPath, [script], { env, stdio: 'inherit' })
}
