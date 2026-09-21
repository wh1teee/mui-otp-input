import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const temporaryRoot = await mkdtemp(join(tmpdir(), 'mui-otp-consumers-'))
const packDirectory = join(temporaryRoot, 'pack')
await mkdir(packDirectory)
const artifactArgument = process.argv.find((argument) =>
  argument.startsWith('--artifact=')
)

function run(command, args, cwd, environment = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...environment },
    maxBuffer: 20 * 1024 * 1024,
    timeout: 180_000
  })
  assert.equal(
    result.status,
    0,
    [
      `${command} ${args.join(' ')} failed in ${cwd}`,
      result.stdout,
      result.stderr,
      result.error?.stack
    ]
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
  const packResult = run(
    'npm',
    ['pack', '--json', '--ignore-scripts', '--pack-destination', packDirectory],
    root
  )
  const [packMetadata] = JSON.parse(packResult)
  tarball = join(packDirectory, packMetadata.filename)
}

const tsconfig = {
  compilerOptions: {
    esModuleInterop: true,
    forceConsistentCasingInFileNames: true,
    jsx: 'react-jsx',
    module: 'ESNext',
    moduleResolution: 'Bundler',
    noUncheckedIndexedAccess: true,
    outDir: 'dist',
    skipLibCheck: false,
    strict: true,
    target: 'ES2022'
  },
  include: ['index.ts', 'index.tsx']
}

const consumers = [
  {
    name: 'headless-only',
    dependencies: {},
    types: ['node'],
    sourceName: 'index.ts',
    source: `
import assert from 'node:assert/strict'
import { isOtpComplete, normalizeOtpValue } from '@wh1teee/mui-otp-input/headless'

const value = normalizeOtpValue('O-12 3', {
  length: 4,
  transformChar: character => character === 'O' ? '0' : character,
  validationType: 'numeric',
})
assert.equal(value, '0123')
assert.equal(isOtpComplete(value, 4), true)
`
  },
  {
    name: 'base-ui-react19',
    dependencies: {
      '@base-ui/react': '1.8.0',
      '@types/react': '19.3.0',
      '@types/react-dom': '19.3.0',
      react: '19.3.0',
      'react-dom': '19.3.0'
    },
    forbidden: ['@mui/material', '@emotion/react', '@emotion/styled'],
    types: ['node', 'react', 'react-dom'],
    sourceName: 'index.tsx',
    source: `
import assert from 'node:assert/strict'
import { renderToString } from 'react-dom/server'
import { OtpInput } from '@wh1teee/mui-otp-input/base-ui'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@wh1teee/mui-otp-input/shadcn'

const field = renderToString(
  <OtpInput defaultValue="1234" label="Verification code" length={4} name="code" />
)
const primitive = renderToString(
  <InputOTP defaultValue="12" length={2}>
    <InputOTPGroup>
      <InputOTPSlot index={0} />
      <InputOTPSlot index={1} aria-label="Second character" />
    </InputOTPGroup>
  </InputOTP>
)
assert.match(field, /one-time-code/)
assert.match(field, /name="code"/)
assert.match(primitive, /Second character/)
`
  },
  {
    name: 'base-ui-react18',
    dependencies: {
      '@base-ui/react': '1.8.0',
      '@types/react': '18.3.31',
      '@types/react-dom': '18.3.7',
      react: '18.3.1',
      'react-dom': '18.3.1'
    },
    forbidden: ['@mui/material', '@emotion/react', '@emotion/styled'],
    types: ['node', 'react', 'react-dom'],
    sourceName: 'index.tsx',
    source: `
import assert from 'node:assert/strict'
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@wh1teee/mui-otp-input/base-ui'

const ref = React.createRef<HTMLInputElement>()
const html = renderToString(
  <InputOTP defaultValue="12" length={2}>
    <InputOTPGroup>
      <InputOTPSlot index={0} ref={ref} />
      <InputOTPSlot index={1} aria-label="Second character" />
    </InputOTPGroup>
  </InputOTP>
)
assert.match(html, /one-time-code/)
assert.match(html, /Second character/)
`
  },
  {
    name: 'mui9-react19',
    dependencies: {
      '@emotion/react': '11.14.0',
      '@emotion/styled': '11.14.1',
      '@mui/material': '9.4.0',
      '@types/react': '19.3.0',
      '@types/react-dom': '19.3.0',
      react: '19.3.0',
      'react-dom': '19.3.0'
    },
    forbidden: ['@base-ui/react', 'react-hook-form'],
    types: ['node', 'react', 'react-dom'],
    sourceName: 'index.tsx',
    source: `
import assert from 'node:assert/strict'
import { renderToString } from 'react-dom/server'
import { MuiOtpInput } from '@wh1teee/mui-otp-input'
import { MuiOtpInput as ExplicitMuiOtpInput } from '@wh1teee/mui-otp-input/mui'

const root = renderToString(
  <MuiOtpInput ariaLabel="Verification code" defaultValue="1234" length={4} />
)
const explicit = renderToString(
  <ExplicitMuiOtpInput defaultValue="5678" length={4} />
)
assert.match(root, /MuiOtpInput-Box/)
assert.match(explicit, /MuiOtpInput-TextField-4/)
`
  },
  {
    name: 'mui7-react18',
    dependencies: {
      '@emotion/react': '11.14.0',
      '@emotion/styled': '11.14.1',
      '@mui/material': '7.3.11',
      '@types/react': '18.3.31',
      '@types/react-dom': '18.3.7',
      '@types/react-transition-group': '4.4.12',
      react: '18.3.1',
      'react-dom': '18.3.1'
    },
    forbidden: ['@base-ui/react', 'react-hook-form'],
    types: ['node', 'react', 'react-dom', 'react-transition-group'],
    sourceName: 'index.tsx',
    source: `
import assert from 'node:assert/strict'
import { renderToString } from 'react-dom/server'
import { MuiOtpInput } from '@wh1teee/mui-otp-input'

const html = renderToString(
  <MuiOtpInput defaultValue="1234" length={4} pastePreprocess="digits-only" />
)
assert.match(html, /MuiOtpInput-TextField-4/)
`
  },
  {
    name: 'mui-rhf',
    dependencies: {
      '@emotion/react': '11.14.0',
      '@emotion/styled': '11.14.1',
      '@mui/material': '9.4.0',
      '@types/react': '19.3.0',
      '@types/react-dom': '19.3.0',
      react: '19.3.0',
      'react-dom': '19.3.0',
      'react-hook-form': '7.88.0'
    },
    forbidden: ['@base-ui/react'],
    types: ['node', 'react', 'react-dom'],
    sourceName: 'index.tsx',
    source: `
import assert from 'node:assert/strict'
import { renderToString } from 'react-dom/server'
import { useForm } from 'react-hook-form'
import { MuiOtpInputController } from '@wh1teee/mui-otp-input/mui/react-hook-form'

type Values = { code: string }
function Form() {
  const { control } = useForm<Values>({ defaultValues: { code: '1234' } })
  return <MuiOtpInputController control={control} name="code" length={4} />
}
assert.match(renderToString(<Form />), /MuiOtpInput-Box/)
`
  },
  {
    name: 'base-ui-rhf',
    dependencies: {
      '@base-ui/react': '1.8.0',
      '@types/react': '19.3.0',
      '@types/react-dom': '19.3.0',
      react: '19.3.0',
      'react-dom': '19.3.0',
      'react-hook-form': '7.88.0'
    },
    forbidden: ['@mui/material', '@emotion/react', '@emotion/styled'],
    types: ['node', 'react', 'react-dom'],
    sourceName: 'index.tsx',
    source: `
import assert from 'node:assert/strict'
import { renderToString } from 'react-dom/server'
import { useForm } from 'react-hook-form'
import { OtpInputController } from '@wh1teee/mui-otp-input/base-ui/react-hook-form'

type Values = { code: string }
function Form() {
  const { control } = useForm<Values>({ defaultValues: { code: '1234' } })
  return <OtpInputController control={control} label="Code" length={4} name="code" />
}
assert.match(renderToString(<Form />), /one-time-code/)
`
  }
]

try {
  for (const consumer of consumers) {
    const consumerEnvironment = {
      PNPM_CONFIG_ENABLE_GLOBAL_VIRTUAL_STORE: 'false'
    }
    const directory = join(temporaryRoot, consumer.name)
    await mkdir(directory)
    await writeFile(
      join(directory, 'package.json'),
      JSON.stringify(
        {
          name: `otp-consumer-${consumer.name}`,
          private: true,
          type: 'module',
          dependencies: {
            '@wh1teee/mui-otp-input': `file:${tarball}`,
            '@types/node': '25.5.0',
            ...consumer.dependencies,
            typescript: '6.0.3'
          }
        },
        null,
        2
      ) + '\n'
    )
    const consumerTsconfig = structuredClone(tsconfig)
    consumerTsconfig.compilerOptions.types = consumer.types
    await writeFile(
      join(directory, 'tsconfig.json'),
      JSON.stringify(consumerTsconfig, null, 2) + '\n'
    )
    await writeFile(
      join(directory, consumer.sourceName),
      consumer.source.trimStart()
    )
    await writeFile(
      join(directory, '.npmrc'),
      [
        'auto-install-peers=false',
        'enable-global-virtual-store=false',
        'strict-peer-dependencies=true',
        'virtual-store-dir=.pnpm'
      ].join('\n') + '\n'
    )

    run(
      'pnpm',
      ['install', '--ignore-scripts', '--no-frozen-lockfile'],
      directory,
      consumerEnvironment
    )
    for (const forbidden of consumer.forbidden ?? []) {
      assert(
        !existsSync(join(directory, 'node_modules', ...forbidden.split('/'))),
        `${consumer.name} unexpectedly installed ${forbidden}`
      )
    }
    run('pnpm', ['exec', 'tsc'], directory, consumerEnvironment)
    run('node', ['dist/index.js'], directory)
    console.log(`Verified packed consumer: ${consumer.name}`)
  }

  console.log(
    `All ${consumers.length} exact-tarball consumers passed strict declarations and SSR/runtime execution for ${manifest.version}.`
  )
} finally {
  await rm(temporaryRoot, { force: true, recursive: true })
}
