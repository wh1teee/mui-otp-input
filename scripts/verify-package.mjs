import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))

assert.equal(manifest.name, '@wh1teee/mui-otp-input')
assert.match(manifest.version, /^8\.0\.0-next\.\d+$/u)
assert.equal(manifest.publishConfig?.tag, 'next')
assert.equal(manifest.publishConfig?.provenance, true)
assert.equal(manifest.sideEffects?.length, 1)
assert.equal(manifest.sideEffects[0], './dist/shadcn.css')

const expectedExports = [
  '.',
  './mui',
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

for (const [name, definition] of Object.entries(manifest.exports)) {
  const targets =
    typeof definition === 'string' ? [definition] : Object.values(definition)
  for (const target of new Set(targets)) {
    const path = join(root, target)
    assert((await stat(path)).isFile(), `${name} export is missing ${target}`)
  }
}

for (const optionalPeer of [
  '@base-ui/react',
  '@emotion/react',
  '@emotion/styled',
  '@mui/material',
  '@types/react',
  'react-hook-form'
]) {
  assert.equal(
    manifest.peerDependenciesMeta?.[optionalPeer]?.optional,
    true,
    `${optionalPeer} must stay optional`
  )
}

const importPattern =
  /(?:import|export)\s+(?:[^'";]*?\s+from\s+)?["']([^"']+)["']/gu

async function collectClosure(entry) {
  const files = new Set()
  const externals = new Set()

  async function visit(relativePath) {
    if (files.has(relativePath)) return
    files.add(relativePath)
    const source = await readFile(join(root, relativePath), 'utf8')
    for (const match of source.matchAll(importPattern)) {
      const specifier = match[1]
      if (!specifier.startsWith('.')) {
        externals.add(specifier)
        continue
      }
      const resolvedPath = resolve(dirname(join(root, relativePath)), specifier)
      const child = resolvedPath.slice(root.length + 1)
      await visit(child)
    }
  }

  await visit(entry)
  return { externals, files }
}

const muiClosure = await collectClosure('dist/index.js')
assert(
  [...muiClosure.externals].some((value) => value.startsWith('@mui/material'))
)
assert(
  ![...muiClosure.externals].some((value) => value.startsWith('@base-ui/react'))
)
assert(!muiClosure.externals.has('react-hook-form'))

const baseClosure = await collectClosure('dist/base-ui.js')
assert(
  [...baseClosure.externals].some((value) => value.startsWith('@base-ui/react'))
)
assert(
  ![...baseClosure.externals].some((value) => value.startsWith('@mui/material'))
)
assert(
  ![...baseClosure.externals].some((value) => value.startsWith('@emotion/'))
)
assert(!baseClosure.externals.has('react-hook-form'))

const headlessClosure = await collectClosure('dist/headless.js')
assert.equal(headlessClosure.externals.size, 0)

const muiFormClosure = await collectClosure('dist/react-hook-form.js')
assert(muiFormClosure.externals.has('react-hook-form'))
assert(
  [...muiFormClosure.externals].some((value) =>
    value.startsWith('@mui/material')
  )
)
assert(
  ![...muiFormClosure.externals].some((value) =>
    value.startsWith('@base-ui/react')
  )
)

const baseFormClosure = await collectClosure('dist/base-ui/react-hook-form.js')
assert(baseFormClosure.externals.has('react-hook-form'))
assert(
  [...baseFormClosure.externals].some((value) =>
    value.startsWith('@base-ui/react')
  )
)
assert(
  ![...baseFormClosure.externals].some((value) =>
    value.startsWith('@mui/material')
  )
)

for (const clientEntry of [
  'dist/index.js',
  'dist/base-ui.js',
  'dist/shadcn.js',
  'dist/react-hook-form.js',
  'dist/base-ui/react-hook-form.js'
]) {
  assert.match(
    await readFile(join(root, clientEntry), 'utf8'),
    /^"use client";/u
  )
}
assert.doesNotMatch(
  await readFile(join(root, 'dist/headless.js'), 'utf8'),
  /use client/u
)

const rootDeclarations = await readFile(join(root, 'dist/index.d.ts'), 'utf8')
assert.doesNotMatch(rootDeclarations, /@base-ui\/react/u)
const headlessDeclarations = await readFile(
  join(root, 'dist/headless.d.ts'),
  'utf8'
)
assert.doesNotMatch(headlessDeclarations, /(?:react|@mui|@base-ui)/u)

const css = await readFile(join(root, 'dist/shadcn.css'), 'utf8')
assert.doesNotMatch(css, /@import|url\s*\(/u)
assert.doesNotMatch(css, /(^|[},]\s*)(?:html|body|\*)\s*[{,]/mu)
assert.match(css, /\[data-slot=['"]input-otp-slot['"]\]/u)

for (const requiredFile of ['README.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md']) {
  assert((await stat(join(root, requiredFile))).isFile())
}

const packDirectory = await mkdtemp(join(tmpdir(), 'mui-otp-input-pack-'))
try {
  const packed = spawnSync(
    'npm',
    ['pack', '--json', '--ignore-scripts', '--pack-destination', packDirectory],
    { cwd: root, encoding: 'utf8' }
  )
  assert.equal(packed.status, 0, packed.stderr || packed.stdout)
  const [metadata] = JSON.parse(packed.stdout)
  assert.equal(metadata.name, manifest.name)
  assert.equal(metadata.version, manifest.version)
  assert(
    metadata.unpackedSize < 300_000,
    `unpacked package is ${metadata.unpackedSize} bytes`
  )
  const packedPaths = new Set(metadata.files.map((file) => file.path))
  for (const path of [
    'package.json',
    'README.md',
    'LICENSE',
    'THIRD_PARTY_NOTICES.md',
    'dist/index.js',
    'dist/base-ui.js',
    'dist/headless.js',
    'dist/shadcn.css'
  ]) {
    assert(packedPaths.has(path), `tarball is missing ${path}`)
  }
  assert(
    ![...packedPaths].some((path) =>
      /(?:^|\/)(?:src|tests|coverage)\//u.test(path)
    )
  )
  console.log(
    `Verified ${metadata.filename}: ${metadata.size} packed bytes, ${metadata.unpackedSize} unpacked bytes, ${metadata.entryCount} files.`
  )
} finally {
  await rm(packDirectory, { force: true, recursive: true })
}

console.log(
  'Package exports, renderer isolation, declarations, CSS scope, and tarball passed.'
)
