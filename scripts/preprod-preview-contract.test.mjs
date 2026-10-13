import test from 'node:test'
import { strict as assert } from 'node:assert'
import { readdirSync } from 'node:fs'
import { assertPreprodMigrationHistory, assertPreprodDryRun } from './preprod-preview-contract.mjs'

const versions = readdirSync('supabase/migrations').filter(f => f.endsWith('.sql')).sort().map(f => f.slice(0, 14))
const history = (remote = versions.slice(0, 51), local = versions) =>
  [' Local | Remote | Time (UTC)', '-------|--------|-----------',
    ...local.map((v, i) => ` ${v} | ${remote[i] ?? ''} | 2026-10-13`)].join('\n')
const pending = ['20261013161800_session_submit_duration_gate.sql', '20261013175500_session_publish_duration_gate.sql']
const preview = files => `DRY RUN: Would push these migrations:\n${files.map(f => ' - '+f).join('\n')}`

test('51 remote and 53 local migrations accepted', () => {
  assert.deepEqual(assertPreprodMigrationHistory(history()), { local: 53, remote: 51 })
})
test('empty, drifted, or unexpected history rejected', () => {
  assert.throws(() => assertPreprodMigrationHistory('Local | Remote'), /STOP/)
  assert.throws(() => assertPreprodMigrationHistory(history(versions.slice(0, 50))), /STOP/)
  assert.throws(() => assertPreprodMigrationHistory(history(versions.slice(0, 52))), /STOP/)
  const swapped = [...versions]; [swapped[2], swapped[3]] = [swapped[3], swapped[2]]
  assert.throws(() => assertPreprodMigrationHistory(history(versions.slice(0, 51), swapped)), /STOP/)
})
test('only two exact pending migrations accepted in order', () => {
  assert.equal(assertPreprodDryRun(preview(pending)).pending, 2)
  assert.throws(() => assertPreprodDryRun(preview([])), /STOP/)
  assert.throws(() => assertPreprodDryRun(preview([...pending, '20261014000000_unexpected.sql'])), /STOP/)
  assert.throws(() => assertPreprodDryRun(preview([...pending].reverse())), /STOP/)
  assert.throws(() => assertPreprodDryRun('Dry run complete'), /STOP/)
})
