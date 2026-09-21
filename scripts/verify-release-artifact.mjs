import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const artifactArgument = process.argv.find((argument) =>
  argument.startsWith('--artifact=')
)
assert(artifactArgument, 'Pass --artifact=<package-tarball>.')
const artifact = resolve(root, artifactArgument.slice('--artifact='.length))
assert((await stat(artifact)).isFile())

const temporaryRoot = await mkdtemp(join(tmpdir(), 'mui-otp-artifact-'))
try {
  const extracted = spawnSync('tar', ['-xzf', artifact, '-C', temporaryRoot], {
    encoding: 'utf8'
  })
  assert.equal(extracted.status, 0, extracted.stderr || extracted.stdout)
  const packageRoot = join(temporaryRoot, 'package')
  const manifest = JSON.parse(
    await readFile(join(packageRoot, 'package.json'), 'utf8')
  )
  assert.equal(manifest.name, '@wh1teee/mui-otp-input')
  assert.match(manifest.version, /^8\.0\.0(?:-next\.\d+)?$/u)
  assert.deepEqual(manifest.publishConfig, {
    access: 'public',
    provenance: true
  })

  const expectedExports = [
    '.',
    './mui',
    './mui/react-hook-form',
    './headless',
    './base-ui',
    './shadcn',
    './react-hook-form',
    './base-ui/react-hook-form',
    './shadcn/react-hook-form',
    './shadcn.css',
    './package.json'
  ]
  assert.deepEqual(Object.keys(manifest.exports), expectedExports)
  for (const definition of Object.values(manifest.exports)) {
    const targets =
      typeof definition === 'string' ? [definition] : Object.values(definition)
    for (const target of new Set(targets)) {
      assert((await stat(join(packageRoot, target))).isFile(), target)
    }
  }

  const importPattern =
    /(?:import|export)\s+(?:[^'";]*?\s+from\s+)?["']([^"']+)["']/gu
  async function collectClosure(entry) {
    const files = new Set()
    const externals = new Set()

    async function visit(relativePath) {
      if (files.has(relativePath)) {
        return
      }
      files.add(relativePath)
      const source = await readFile(join(packageRoot, relativePath), 'utf8')
      for (const match of source.matchAll(importPattern)) {
        const specifier = match[1]
        if (!specifier.startsWith('.')) {
          externals.add(specifier)
        } else {
          const child = resolve(
            dirname(join(packageRoot, relativePath)),
            specifier
          ).slice(packageRoot.length + 1)
          await visit(child)
        }
      }
    }

    await visit(entry)
    return externals
  }

  const mui = await collectClosure('dist/index.js')
  assert([...mui].some((value) => value.startsWith('@mui/material')))
  assert(![...mui].some((value) => value.startsWith('@base-ui/react')))
  const base = await collectClosure('dist/base-ui.js')
  assert([...base].some((value) => value.startsWith('@base-ui/react')))
  assert(![...base].some((value) => value.startsWith('@mui/material')))
  assert.equal((await collectClosure('dist/headless.js')).size, 0)

  const css = await readFile(join(packageRoot, 'dist/shadcn.css'), 'utf8')
  assert.doesNotMatch(css, /@import|url\s*\(/u)
  assert.doesNotMatch(css, /(^|[},]\s*)(?:html|body|\*)\s*[{,]/mu)

  for (const file of ['README.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md']) {
    assert((await stat(join(packageRoot, file))).isFile())
  }

  const sha256 = createHash('sha256')
    .update(await readFile(artifact))
    .digest('hex')
  console.log(
    `Verified exact release artifact ${manifest.name}@${manifest.version}, SHA-256 ${sha256}.`
  )
} finally {
  await rm(temporaryRoot, { force: true, recursive: true })
}
