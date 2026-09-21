import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveReleaseChannel } from './release-channel.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputArgument = process.argv.find((argument) =>
  argument.startsWith('--output-dir=')
)
assert(outputArgument, 'Pass --output-dir=<release-candidate-directory>.')
const outputDirectory = resolve(
  root,
  outputArgument.slice('--output-dir='.length)
)
const requireTag = process.argv.includes('--require-tag')

const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const releaseChannel = resolveReleaseChannel(manifest.version)
assert.deepEqual(manifest.publishConfig, { access: 'public', provenance: true })

if (requireTag) {
  assert.equal(
    process.env.GITHUB_REF_NAME,
    `v${manifest.version}`,
    'Git tag must exactly match package.json version.'
  )
}

await rm(outputDirectory, { force: true, recursive: true })
await mkdir(outputDirectory, { recursive: true })

const pack = spawnSync(
  'npm',
  ['pack', '--json', '--ignore-scripts', '--pack-destination', outputDirectory],
  { cwd: root, encoding: 'utf8' }
)
assert.equal(pack.status, 0, pack.stderr || pack.stdout)
const [metadata] = JSON.parse(pack.stdout)
const artifactPath = join(outputDirectory, metadata.filename)
const artifactContent = await readFile(artifactPath)
const sha256 = createHash('sha256').update(artifactContent).digest('hex')

const candidate = {
  publication: {
    access: 'public',
    distTag: releaseChannel.distTag,
    prerelease: releaseChannel.prerelease,
    provenance: true,
    releaseTag: releaseChannel.releaseTag,
    workflow: '.github/workflows/release.yml'
  },
  package: {
    name: manifest.name,
    version: manifest.version
  },
  artifact: {
    filename: metadata.filename,
    integrity: metadata.integrity,
    sha256,
    shasum: metadata.shasum,
    size: metadata.size,
    unpackedSize: metadata.unpackedSize,
    entryCount: metadata.entryCount
  },
  git: {
    ref: process.env.GITHUB_REF_NAME ?? null,
    sha: process.env.GITHUB_SHA ?? null
  }
}

await writeFile(
  join(outputDirectory, 'candidate.json'),
  `${JSON.stringify(candidate, null, 2)}\n`
)
await writeFile(
  join(outputDirectory, 'candidate-tarball-sha256.txt'),
  `${sha256}  ${basename(artifactPath)}\n`
)

const releaseNotesPath = join(
  root,
  'docs',
  'releases',
  `${manifest.version}.md`
)
const releaseNotes = await readFile(releaseNotesPath, 'utf8')
await writeFile(join(outputDirectory, 'RELEASE_NOTES.md'), releaseNotes)
if (!releaseChannel.prerelease) {
  const rollback = await readFile(
    join(root, 'docs', 'releases', `rollback-${manifest.version}.md`),
    'utf8'
  )
  await writeFile(join(outputDirectory, 'ROLLBACK.md'), rollback)
}

console.log(
  `Created ${metadata.filename}: ${metadata.size} packed bytes, SHA-256 ${sha256}.`
)
