import { spawnSync } from 'node:child_process'

const requested = process.env.VITEST_BROWSER
const browsers = requested ? [requested] : ['chromium', 'firefox', 'webkit']

for (const [index, browser] of browsers.entries()) {
  const result = spawnSync(
    'pnpm',
    ['exec', 'vitest', 'run', '--config', 'vitest.browser.config.ts'],
    {
      env: {
        ...process.env,
        VITEST_BROWSER: browser,
        VITEST_BROWSER_PORT: String(63_410 + index)
      },
      stdio: 'inherit'
    }
  )
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
