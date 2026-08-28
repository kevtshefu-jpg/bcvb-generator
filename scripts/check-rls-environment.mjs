import { assertSafeTestEnvironment, loadLocalEnv } from './rls-test-config.mjs'

const config = await loadLocalEnv()
assertSafeTestEnvironment(config, { operation: 'contrôle de sécurité', requireServiceRole: true })
process.stdout.write('✓ Environnement autorisé. Aucune donnée n’a été lue ou modifiée.\n')
