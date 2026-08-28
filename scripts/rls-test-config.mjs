import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const fixtureFile = resolve(projectRoot, '.rls-test-fixtures.json')

function parseEnvFile(source) {
  const values = {}
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const separator = line.indexOf('=')
    if (separator < 1) continue
    const key = line.slice(0, separator).trim()
    let value = line.slice(separator + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    values[key] = value
  }
  return values
}

export async function loadLocalEnv() {
  let fileValues = {}
  try {
    fileValues = parseEnvFile(await readFile(resolve(projectRoot, '.env.local'), 'utf8'))
  } catch {
    // Les variables peuvent être fournies uniquement par le processus.
  }

  const value = (name) => process.env[name] || fileValues[name]
  return {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || fileValues.SUPABASE_URL || fileValues.VITE_SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || fileValues.SUPABASE_ANON_KEY || fileValues.VITE_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || fileValues.SUPABASE_SERVICE_ROLE_KEY,
    environment: value('RLS_TEST_ENVIRONMENT'),
    projectName: value('RLS_TEST_PROJECT_NAME'),
    expectedProjectRef: value('RLS_TEST_PROJECT_REF'),
    confirmedProjectRef: value('RLS_TEST_CONFIRM_PROJECT_REF'),
    productionProjectRef: value('RLS_TEST_PRODUCTION_PROJECT_REF'),
    productionConfirmation: value('RLS_TEST_ALLOW_PRODUCTION'),
  }
}

export function projectRefFromUrl(rawUrl) {
  const url = new URL(rawUrl)
  if (['localhost', '127.0.0.1', '::1'].includes(url.hostname)) return 'local'
  const match = url.hostname.match(/^([a-z0-9-]+)\.supabase\.co$/i)
  if (!match) throw new Error(`Hôte Supabase non reconnu : ${url.hostname}`)
  return match[1]
}

export function assertSafeTestEnvironment(config, { operation, requireServiceRole = false } = {}) {
  if (!config.url || !config.anonKey) throw new Error('URL et clé publique Supabase requises.')
  if (requireServiceRole && !config.serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY requise.')

  const allowedEnvironments = new Set(['local', 'preproduction', 'production'])
  if (!allowedEnvironments.has(config.environment)) {
    throw new Error('RLS_TEST_ENVIRONMENT doit être explicitement défini à local ou preproduction.')
  }
  if (!config.projectName) throw new Error('RLS_TEST_PROJECT_NAME est requis.')
  if (!config.expectedProjectRef) throw new Error('RLS_TEST_PROJECT_REF est requis.')

  const actualProjectRef = projectRefFromUrl(config.url)
  if (actualProjectRef !== config.expectedProjectRef) {
    throw new Error(`Cible refusée : URL=${actualProjectRef}, RLS_TEST_PROJECT_REF=${config.expectedProjectRef}.`)
  }
  if (config.confirmedProjectRef !== actualProjectRef) {
    throw new Error('RLS_TEST_CONFIRM_PROJECT_REF doit reproduire exactement le project ref ciblé.')
  }
  if (config.environment === 'local' && actualProjectRef !== 'local') {
    throw new Error('RLS_TEST_ENVIRONMENT=local ne peut cibler qu’une URL localhost.')
  }
  if (actualProjectRef !== 'local' && !config.productionProjectRef) {
    throw new Error('RLS_TEST_PRODUCTION_PROJECT_REF est requis pour toute cible distante.')
  }
  if (config.productionProjectRef && actualProjectRef === config.productionProjectRef) {
    if (config.environment !== 'production') {
      throw new Error('Cible refusée : ce project ref est déclaré comme production.')
    }
    if (config.productionConfirmation !== 'I_UNDERSTAND_THIS_WILL_MUTATE_PRODUCTION') {
      throw new Error('Production refusée sans confirmation forte RLS_TEST_ALLOW_PRODUCTION.')
    }
  }
  if (config.environment === 'production' && config.productionConfirmation !== 'I_UNDERSTAND_THIS_WILL_MUTATE_PRODUCTION') {
    throw new Error('Production refusée sans confirmation forte RLS_TEST_ALLOW_PRODUCTION.')
  }

  process.stdout.write([
    'Cible de validation autorisée',
    `  opération : ${operation || 'test Supabase'}`,
    `  environnement : ${config.environment}`,
    `  projet : ${config.projectName}`,
    `  URL : ${config.url}`,
    `  project ref : ${actualProjectRef}`,
  ].join('\n') + '\n')
  return actualProjectRef
}

export async function loadFixtureState() {
  try {
    return JSON.parse(await readFile(fixtureFile, 'utf8'))
  } catch {
    return null
  }
}
