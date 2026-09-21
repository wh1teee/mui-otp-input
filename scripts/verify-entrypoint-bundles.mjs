import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { brotliCompressSync, gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'

import { build } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const artifactArgument = process.argv.find((argument) =>
  argument.startsWith('--artifact=')
)
const temporaryRoot = artifactArgument
  ? await mkdtemp(join(tmpdir(), 'mui-otp-bundles-'))
  : undefined
const packageRoot = temporaryRoot ? join(temporaryRoot, 'package') : root
const budget = JSON.parse(
  await readFile(
    join(root, 'docs/releases/stable-entrypoint-budgets.json'),
    'utf8'
  )
)
const rendererPeers = budget.measurement.external
const importPattern =
  /(?:import|export)\s+(?:[^'";]*?\s+from\s+)?["']([^"']+)["']/gu

function isExternal(specifier) {
  return rendererPeers.some(
    (peer) => specifier === peer || specifier.startsWith(`${peer}/`)
  )
}

async function collectExternalSpecifiers(entry) {
  const visited = new Set()
  const external = new Set()

  async function visit(filename) {
    const absolute = resolve(filename)
    if (visited.has(absolute)) return
    visited.add(absolute)
    const source = await readFile(absolute, 'utf8')
    for (const match of source.matchAll(importPattern)) {
      const specifier = match[1]
      if (!specifier.startsWith('.')) {
        external.add(specifier)
      } else {
        await visit(resolve(dirname(absolute), specifier))
      }
    }
  }

  await visit(entry)
  return external
}

function assertRendererClosure(profile, external) {
  const hasMui = [...external].some((value) =>
    value.startsWith('@mui/material')
  )
  const hasBaseUi = [...external].some((value) =>
    value.startsWith('@base-ui/react')
  )
  const hasRhf = external.has('react-hook-form')
  if (profile.renderer === 'headless') {
    assert.equal(external.size, 0)
    return
  }
  assert.equal(hasMui, profile.renderer.startsWith('mui'))
  assert.equal(hasBaseUi, profile.renderer.startsWith('base-ui'))
  assert.equal(hasRhf, profile.renderer.endsWith('-rhf'))
}

if (artifactArgument) {
  const artifact = resolve(root, artifactArgument.slice('--artifact='.length))
  execFileSync('tar', ['-xzf', artifact, '-C', temporaryRoot])
}

try {
  const measurements = []
  for (const [entryName, profile] of Object.entries(budget.profiles)) {
    const entry = join(packageRoot, 'dist', `${entryName}.js`)
    const external = await collectExternalSpecifiers(entry)
    assertRendererClosure(profile, external)
    const result = await build({
      configFile: false,
      logLevel: 'silent',
      build: {
        codeSplitting: false,
        lib: { entry, formats: ['es'] },
        minify: 'oxc',
        rolldownOptions: { external: isExternal },
        sourcemap: false,
        write: false
      }
    })
    const code = (Array.isArray(result) ? result : [result])
      .flatMap((output) => output.output ?? [])
      .filter((output) => output.type === 'chunk')
      .map((output) => output.code)
      .join('\n')
    const measurement = {
      entry: entryName,
      rawBytes: Buffer.byteLength(code),
      gzipBytes: gzipSync(code).byteLength,
      brotliBytes: brotliCompressSync(code).byteLength,
      sha256: createHash('sha256').update(code).digest('hex')
    }
    assert(
      measurement.gzipBytes <= profile.gzipLimit,
      `${entryName} gzip ${measurement.gzipBytes} exceeds ${profile.gzipLimit}`
    )
    assert(
      measurement.brotliBytes <= profile.brotliLimit,
      `${entryName} brotli ${measurement.brotliBytes} exceeds ${profile.brotliLimit}`
    )
    measurements.push(measurement)
  }
  console.log(JSON.stringify({ verified: true, measurements }, null, 2))
} finally {
  if (temporaryRoot) await rm(temporaryRoot, { force: true, recursive: true })
}
