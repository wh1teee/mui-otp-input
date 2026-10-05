import axe from 'axe-core'
import { expect, type Page, test } from '@playwright/test'
import ts from 'typescript'

const WCAG_22_AA_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22a',
  'wcag22aa'
] as const

const PAGES = ['/', '/playground', '/migration'] as const

async function axeViolations(page: Page) {
  await page.addScriptTag({ content: axe.source })
  return page.evaluate(async (tags) => {
    const result = await window.axe.run(document, {
      runOnly: { type: 'tag', values: [...tags] }
    })
    return result.violations.map((violation) => ({
      id: violation.id,
      targets: violation.nodes.map((node) => node.target)
    }))
  }, WCAG_22_AA_TAGS)
}

declare global {
  interface Window {
    axe: typeof axe
  }
}

function expectValidGeneratedTsx(source: string) {
  const result = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2024
    },
    fileName: 'generated-otp-example.tsx',
    reportDiagnostics: true
  })
  const errors = (result.diagnostics ?? [])
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
    .map((diagnostic) =>
      ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
    )
  expect(errors).toEqual([])
}

test('landing demo keeps one value across typing, renderers, and paste', async ({
  context,
  page
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')

  const firstMuiSlot = page.getByRole('textbox', {
    name: 'Verification code 1/6'
  })
  await expect(firstMuiSlot).toBeInViewport()
  await firstMuiSlot.click()
  await page.keyboard.type('12a3')
  await expect(page.getByTestId('landing-otp-value')).toHaveText('123')
  await expect(
    page.getByRole('textbox', { name: 'Verification code 4/6' })
  ).toBeFocused()

  // The shadcn field receives the same value.
  await page.getByRole('button', { name: 'shadcn / Base UI' }).click()
  await expect(page.getByTestId('landing-shadcn-otp')).toBeVisible()
  await expect(page.getByTestId('landing-otp-value')).toHaveText('123')

  // A whole message pastes as its digits only.
  await page.getByRole('button', { name: 'Copy sample message' }).click()
  await page
    .getByRole('textbox', { name: 'Verification code', exact: true })
    .click()
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.press('ControlOrMeta+V')
  await expect(page.getByTestId('landing-otp-value')).toHaveText('482913')
  await expect(page.getByText('Complete', { exact: true })).toBeVisible()

  await expect(page.getByRole('link', { name: 'Get started' })).toHaveAttribute(
    'href',
    '#quick-start'
  )
})

for (const path of PAGES) {
  test(`${path} meets WCAG 2.2 AA in light and dark schemes`, async ({
    page
  }) => {
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme })
      await page.goto(path)
      expect(await axeViolations(page), `${path} ${colorScheme}`).toEqual([])
    }
  })

  test(`${path} fits a phone screen without horizontal scrolling`, async ({
    page
  }) => {
    await page.setViewportSize({ width: 360, height: 780 })
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth
      )
    ).toBe(true)
  })
}

test('playground configurator generates code that matches the preview', async ({
  page
}) => {
  await page.goto('/playground')
  const code = page.getByTestId('generated-code')

  await expect(code).toContainText(
    "import { MuiOtpInput } from '@wh1teee/mui-otp-input';"
  )
  await expect(code).toContainText('validationType="numeric"')
  expectValidGeneratedTsx((await code.locator('pre').textContent()) ?? '')

  await page.getByRole('button', { name: 'shadcn / Base UI' }).click()
  await expect(page.getByTestId('config-shadcn-otp')).toBeVisible()
  await expect(code).toContainText('<OtpInput')
  await expect(code).toContainText('separatorAfter={[2]}')
  // numeric is the Base UI default, so it is not repeated.
  await expect(code).not.toContainText('validationType')

  await page.getByLabel('Allowed characters').click()
  await page.getByRole('option', { name: 'Letters and digits' }).click()
  await page.getByLabel('Upper-case letters').check()
  await expect(code).toContainText('validationType="alphanumeric"')
  await expect(code).toContainText('transformChar=')
  expectValidGeneratedTsx((await code.locator('pre').textContent()) ?? '')

  // Base UI names the first slot by the visible label.
  await page
    .getByTestId('config-stage')
    .getByRole('textbox', { name: 'Verification code', exact: true })
    .click()
  await page.keyboard.type('ab-1')
  await expect(page.getByTestId('config-value')).toHaveText('AB1')
  await expect(page.getByTestId('config-rejected')).not.toHaveText('none')
})

test('playground form focuses the field on error and accepts the right code', async ({
  page
}) => {
  await page.goto('/playground')
  const form = page.locator('.playground-form')
  const firstSlot = form.getByRole('textbox', {
    name: 'Verification code',
    exact: true
  })

  await form.getByRole('button', { name: 'Verify' }).click()
  await expect(form.getByText('Enter all six digits.')).toBeVisible()
  await expect(firstSlot).toBeFocused()

  await page.keyboard.type('111111')
  await form.getByRole('button', { name: 'Verify' }).click()
  await expect(form.getByText('That code is not valid.')).toBeVisible()

  await firstSlot.click()
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.type('424242')
  await form.getByRole('button', { name: 'Verify' }).click()
  await expect(page.getByTestId('form-result')).toHaveText('Verified 424242')
})

test('headless helpers render on the server', async ({ page }) => {
  await page.goto('/playground')
  await expect(page.getByTestId('server-evidence')).toHaveText(
    '{"complete":true,"pasted":"482913","value":"482913"}'
  )
})
