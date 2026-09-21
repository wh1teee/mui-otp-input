import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const directoryArgument = process.argv.find((argument) =>
  argument.startsWith('--directory=')
)
assert(directoryArgument, 'Pass --directory=<release-candidate-directory>.')
const candidateDirectory = resolve(
  root,
  directoryArgument.slice('--directory='.length)
)
const candidate = JSON.parse(
  await readFile(join(candidateDirectory, 'candidate.json'), 'utf8')
)
const specifier = `${candidate.package.name}@${candidate.package.version}`

function execute(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    timeout: 60_000,
    ...options
  })
}

async function retry(description, operation, attempts = 12) {
  let lastFailure
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const result = operation()
    if (result.status === 0) {
      return result.stdout
    }
    lastFailure = new Error(
      `${description} failed (${attempt}/${attempts}): ${result.stderr || result.stdout}`
    )
    if (attempt < attempts) {
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 10_000))
    }
  }
  throw lastFailure
}

function run(command, args, options = {}) {
  const result = execute(command, args, options)
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`
  )
  return result.stdout
}

function sha256(content) {
  return createHash('sha256').update(content).digest('hex')
}

const registryMetadata = JSON.parse(
  await retry(`npm view ${specifier}`, () =>
    execute('npm', ['view', specifier, '--json'])
  )
)
const distTags = JSON.parse(
  await retry(`npm view ${candidate.package.name} dist-tags`, () =>
    execute('npm', ['view', candidate.package.name, 'dist-tags', '--json'])
  )
)
assert.equal(registryMetadata.name, candidate.package.name)
assert.equal(registryMetadata.version, candidate.package.version)
assert.equal(
  distTags[candidate.publication.distTag],
  candidate.package.version,
  `The ${candidate.publication.distTag} dist-tag must point to the exact release.`
)
if (candidate.publication.prerelease) {
  assert.notEqual(
    distTags.latest,
    candidate.package.version,
    'Prerelease must not promote the latest dist-tag.'
  )
} else {
  assert.equal(distTags.latest, candidate.package.version)
  assert.match(distTags.next ?? '', /^8\.0\.0-next\.\d+$/u)
}

const temporaryRoot = await mkdtemp(join(tmpdir(), 'mui-otp-registry-'))
try {
  const packDirectory = join(temporaryRoot, 'pack')
  await mkdir(packDirectory)
  await retry(`npm pack ${specifier}`, () =>
    execute('npm', ['pack', specifier, '--pack-destination', packDirectory], {
      cwd: temporaryRoot
    })
  )
  const tarballs = (await readdir(packDirectory)).filter((file) =>
    file.endsWith('.tgz')
  )
  assert.equal(tarballs.length, 1)
  const downloadedSha256 = sha256(
    await readFile(join(packDirectory, tarballs[0]))
  )
  assert.equal(
    downloadedSha256,
    candidate.artifact.sha256,
    'Registry tarball must be byte-identical to the reviewed candidate.'
  )

  await writeFile(
    join(temporaryRoot, 'package.json'),
    `${JSON.stringify(
      {
        name: 'mui-otp-registry-verifier',
        private: true,
        type: 'module',
        dependencies: {
          [candidate.package.name]: candidate.package.version
        }
      },
      null,
      2
    )}\n`
  )
  run('npm', ['install', '--ignore-scripts', '--package-lock=true'], {
    cwd: temporaryRoot
  })
  const signatureAudit = JSON.parse(
    run('npm', ['audit', 'signatures', '--json', '--include-attestations'], {
      cwd: temporaryRoot
    })
  )
  const serializedAudit = JSON.stringify(signatureAudit)
  assert.match(serializedAudit, /verified/iu)
  assert.match(serializedAudit, /mui-otp-input/iu)
  assert.match(
    serializedAudit,
    new RegExp(candidate.package.version.replaceAll('.', '\\.'), 'u')
  )

  await writeFile(
    join(temporaryRoot, 'probe.mjs'),
    `import assert from 'node:assert/strict';
import { normalizeOtpValue } from '@wh1teee/mui-otp-input/headless';

assert.equal(normalizeOtpValue('12-34', { length: 4, validationType: 'numeric' }), '1234');
console.log('Registry headless import verified.');
`
  )
  run(process.execPath, ['probe.mjs'], { cwd: temporaryRoot })

  await writeFile(
    join(candidateDirectory, 'registry.json'),
    `${JSON.stringify({ distTags, version: registryMetadata }, null, 2)}\n`
  )
  await writeFile(
    join(candidateDirectory, 'provenance-audit.json'),
    `${JSON.stringify(signatureAudit, null, 2)}\n`
  )
  await writeFile(
    join(candidateDirectory, 'registry-tarball-sha256.txt'),
    `${downloadedSha256}  ${tarballs[0]}\n`
  )
} finally {
  await rm(temporaryRoot, { force: true, recursive: true })
}

console.log(
  `Registry release ${specifier} verified with provenance and exact artifact parity.`
)
