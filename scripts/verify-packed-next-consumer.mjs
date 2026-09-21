import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import {
  mkdtemp,
  mkdir,
  readFile,
  realpath,
  readdir,
  rm,
  writeFile
} from 'node:fs/promises'
import { dirname, join, parse, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const artifactRoot = join(root, '.artifacts')
await mkdir(artifactRoot, { recursive: true })
const temporaryRoot = await mkdtemp(join(artifactRoot, 'mui-otp-next-'))
const packDirectory = join(temporaryRoot, 'pack')
await mkdir(packDirectory)
const artifactArgument = process.argv.find((argument) =>
  argument.startsWith('--artifact=')
)

function run(command, args, cwd, environment = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', ...environment },
    maxBuffer: 30 * 1024 * 1024,
    timeout: 240_000
  })
  assert.equal(
    result.status,
    0,
    [command, ...args, result.stdout, result.stderr, result.error?.stack]
      .filter(Boolean)
      .join('\n')
  )
  return result.stdout
}

let tarball
if (artifactArgument) {
  tarball = resolve(root, artifactArgument.slice('--artifact='.length))
  assert(existsSync(tarball), `Package artifact does not exist: ${tarball}`)
} else {
  const [packed] = JSON.parse(
    run(
      'npm',
      [
        'pack',
        '--json',
        '--ignore-scripts',
        '--pack-destination',
        packDirectory
      ],
      root
    )
  )
  tarball = join(packDirectory, packed.filename)
}

const app = join(temporaryRoot, 'app')
await mkdir(join(app, 'app'), { recursive: true })
await writeFile(
  join(app, 'package.json'),
  JSON.stringify(
    {
      name: 'mui-otp-next-verification',
      private: true,
      packageManager: 'pnpm@12.4.2',
      type: 'module',
      scripts: { build: 'next build', start: 'next start' },
      dependencies: {
        '@base-ui/react': '1.8.0',
        '@wh1teee/mui-otp-input': `file:${tarball}`,
        '@types/node': '25.5.0',
        '@types/react': '19.3.0',
        '@types/react-dom': '19.3.0',
        next: '16.3.5',
        react: '19.3.0',
        'react-dom': '19.3.0',
        '@typescript/native': 'npm:typescript@7.0.2',
        typescript: 'npm:@typescript/typescript6@6.0.2'
      }
    },
    null,
    2
  ) + '\n'
)
await writeFile(
  join(app, 'pnpm-workspace.yaml'),
  ['packages:', '  - .', ''].join('\n')
)
await writeFile(
  join(app, '.npmrc'),
  [
    'auto-install-peers=false',
    'enable-global-virtual-store=false',
    'strict-peer-dependencies=true',
    'virtual-store-dir=.pnpm'
  ].join('\n') + '\n'
)
await writeFile(
  join(app, 'tsconfig.json'),
  JSON.stringify(
    {
      compilerOptions: {
        jsx: 'preserve',
        lib: ['dom', 'dom.iterable', 'esnext'],
        module: 'esnext',
        moduleResolution: 'bundler',
        noEmit: true,
        strict: true,
        target: 'ES2022'
      },
      include: ['next-env.d.ts', '.next/types/**/*.ts', '**/*.ts', '**/*.tsx']
    },
    null,
    2
  ) + '\n'
)
await writeFile(join(app, 'next-env.d.ts'), '/// <reference types="next" />\n')
await writeFile(
  join(app, 'app/layout.tsx'),
  `import '@wh1teee/mui-otp-input/shadcn.css'
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
`
)
await writeFile(
  join(app, 'app/code-field.tsx'),
  `'use client'
import { OtpInput } from '@wh1teee/mui-otp-input/shadcn'
export function CodeField() {
  return <OtpInput defaultValue="1234" label="Verification code" length={4} name="code" />
}
`
)
await writeFile(
  join(app, 'app/page.tsx'),
  `import { normalizeOtpValue } from '@wh1teee/mui-otp-input/headless'
import { CodeField } from './code-field'
export default function Page() {
  return <main><output data-testid="normalized">{normalizeOtpValue('1-2 3 4', { length: 4, validationType: 'numeric' })}</output><CodeField /></main>
}
`
)

try {
  run('pnpm', ['install', '--ignore-scripts', '--no-frozen-lockfile'], app)
  const appRoot = await realpath(app)
  const nextManifest = await realpath(
    run(
      'pnpm',
      ['exec', 'node', '-p', "require.resolve('next/package.json')"],
      app
    ).trim()
  )
  let turbopackRoot = appRoot
  while (
    nextManifest !== turbopackRoot &&
    !nextManifest.startsWith(`${turbopackRoot}/`)
  ) {
    const parent = dirname(turbopackRoot)
    assert.notEqual(
      parent,
      turbopackRoot,
      `Refusing filesystem root as Turbopack root: ${nextManifest}`
    )
    turbopackRoot = parent
  }
  assert.notEqual(turbopackRoot, parse(turbopackRoot).root)
  await writeFile(
    join(app, 'next.config.ts'),
    `import type { NextConfig } from 'next'
const config: NextConfig = {
  reactStrictMode: true,
  turbopack: { root: ${JSON.stringify(turbopackRoot)} },
}
export default config
`
  )
  for (const forbidden of [
    '@mui/material',
    '@emotion/react',
    '@emotion/styled'
  ]) {
    assert.equal(
      existsSync(join(app, 'node_modules', ...forbidden.split('/'))),
      false
    )
  }
  run('pnpm', ['build'], app)
  const staticRoot = join(app, '.next/static')
  const staticFiles = await readdir(staticRoot, { recursive: true })
  const javascript = (
    await Promise.all(
      staticFiles
        .filter((path) => path.endsWith('.js'))
        .map((path) => readFile(join(staticRoot, path), 'utf8'))
    )
  ).join('\n')
  assert.doesNotMatch(javascript, /@mui\/|MuiOtpInput|@emotion\//u)

  const port = 31_879
  const nextCli = join(dirname(nextManifest), 'dist', 'bin', 'next')
  const server = spawn(
    process.execPath,
    [nextCli, 'start', '-p', String(port)],
    {
      cwd: app,
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
      stdio: ['ignore', 'pipe', 'pipe']
    }
  )
  let output = ''
  server.stdout.on('data', (chunk) => {
    output += chunk
  })
  server.stderr.on('data', (chunk) => {
    output += chunk
  })
  try {
    let html
    for (let attempt = 0; attempt < 60; attempt += 1) {
      try {
        const response = await fetch(`http://127.0.0.1:${port}`)
        if (response.ok) {
          html = await response.text()
          break
        }
      } catch {}
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 250))
    }
    assert(html, `Next server did not become ready:\n${output}`)
    assert.match(html, />1234</u)
    assert.match(html, /Verification code/u)
    assert.match(html, /one-time-code/u)
  } finally {
    server.kill('SIGTERM')
    await new Promise((resolveExit) => {
      const timeout = setTimeout(() => {
        server.kill('SIGKILL')
        resolveExit()
      }, 5_000)
      server.once('exit', () => {
        clearTimeout(timeout)
        resolveExit()
      })
    })
  }

  const nextConfig = await readFile(join(app, 'next.config.ts'), 'utf8')
  assert.doesNotMatch(
    nextConfig,
    /transpilePackages|serverExternalPackages|optimizePackageImports/u
  )
  console.log(
    'Exact-tarball Next.js 16 App Router build and SSR passed without package-specific config.'
  )
} finally {
  await rm(temporaryRoot, { force: true, recursive: true })
}
