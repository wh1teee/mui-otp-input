import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// One path for pull requests and releases: build the exact candidate tarball,
// then run every artifact verification the release publishes on. A release
// can then never be the first run to check a number.
// OTP_CANDIDATE_DIR keeps the candidate (the release workflow publishes it);
// OTP_REQUIRE_TAG=true asserts that the Git tag matches the version.

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const keep = process.env.OTP_CANDIDATE_DIR
const directory = keep
  ? resolve(root, keep)
  : await mkdtemp(join(tmpdir(), 'mui-otp-candidate-'))

function run(script, ...args) {
  const result = spawnSync('node', [join(root, 'scripts', script), ...args], {
    cwd: root,
    stdio: 'inherit'
  })
  if (result.error) throw result.error
  assert.equal(result.status, 0, `${script} failed`)
}

try {
  run(
    'create-release-candidate.mjs',
    `--output-dir=${directory}`,
    ...(process.env.OTP_REQUIRE_TAG === 'true' ? ['--require-tag'] : [])
  )
  const candidate = JSON.parse(
    await readFile(join(directory, 'candidate.json'), 'utf8')
  )
  const artifact = `--artifact=${join(directory, candidate.artifact.filename)}`

  for (const script of [
    'verify-release-artifact.mjs',
    'verify-entrypoint-bundles.mjs',
    'verify-packed-consumers.mjs',
    'verify-packed-next-consumer.mjs'
  ]) {
    run(script, artifact)
  }
} finally {
  if (!keep) await rm(directory, { force: true, recursive: true })
}
