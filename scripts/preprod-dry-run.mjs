#!/usr/bin/env node
// P12.11: Operator-run preview only. Never pushes migrations.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PREPROD_REF = 'rghbzbwmvvnoqwymqyjn'
const PROD_REF = 'leziahqmqyuewpzjmzxf'
const config = readFileSync(resolve('supabase/config.toml'), 'utf8')
if (!config.includes('project_id = "bcvb-generator"')) throw Error('Unexpected repository config')
if (process.argv.length !== 2) throw Error('No arguments accepted; preview-only mode')
if (!process.env.SUPABASE_ACCESS_TOKEN || !process.env.SUPABASE_DB_PASSWORD) {
  throw Error('Provide SUPABASE_ACCESS_TOKEN and SUPABASE_DB_PASSWORD securely (not in command line)')
}
function call(binary, args) {
  console.log('Checking:', binary, args.filter(a=>a!=='--password').join(' '))
  return execFileSync(binary, args, {
    env: process.env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000,
  })
}
try {
  call('node', ['scripts/preprod-migration-manifest.mjs'])
  call('node', ['scripts/check-october-migration-sequence.mjs'])
  call('supabase', ['link', '--project-ref', PREPROD_REF])
  // Verify the actual persisted CLI target, not the command's own arguments.
  const linkedRef = readFileSync(resolve('supabase/.temp/project-ref'), 'utf8').trim()
  if (linkedRef !== PREPROD_REF || linkedRef === PROD_REF) throw Error('STOP: linked Supabase target is not BCVB preproduction')
  const history = call('supabase', ['migration', 'list', '--linked'])
  console.log('Migration history checked (contents omitted to avoid leaking connection details).')
  if (!history.includes('Local')) throw Error('Unexpected migration-list output; inspect CLI version')
  const preview = call('supabase', ['db', 'push', '--dry-run', '--linked'])
  // Migration filenames only; never print environment variables or connection strings.
  console.log(preview)
  console.log('Completed PREVIEW ONLY for', PREPROD_REF, '- no migrations applied')
} catch (e) {
  console.error('STOP: preproduction preview failed:', e.message)
  process.exitCode = 1
}
