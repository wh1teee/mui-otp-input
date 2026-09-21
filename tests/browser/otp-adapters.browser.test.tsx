import React from 'react'
import axe from 'axe-core'
import { expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { OtpInput } from '../../src/base-ui'
import { MuiOtpInput } from '../../src/mui'
import '../../src/shadcn.css'

function dispatchPaste(input: HTMLInputElement, value: string) {
  // Firefox does not expose constructor-supplied clipboard data on untrusted
  // ClipboardEvent instances. A generic bubbling `paste` event with an own
  // clipboardData property exercises the same React/Base UI handler contract
  // consistently in Chromium, Firefox, and WebKit.
  const event = new Event('paste', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'clipboardData', {
    configurable: true,
    value: {
      getData(type: string) {
        return type === 'text/plain' ? value : ''
      }
    }
  })
  input.dispatchEvent(event)
}

test('Base UI paste, canonical completion, focus routing, and controlled reset', async () => {
  const completed = vi.fn()

  function Field() {
    const [value, setValue] = React.useState('')

    return (
      <>
        <OtpInput
          label="Verification code"
          length={4}
          onValueChange={setValue}
          onValueComplete={completed}
          pastePreprocess="digits-only"
          value={value}
        />
        <output data-testid="value">{value}</output>
        <button
          type="button"
          onClick={() => {
            return setValue('')
          }}
        >
          Reset
        </button>
      </>
    )
  }

  await render(<Field />)
  const inputs = page.getByRole('textbox').all()

  dispatchPaste(inputs[0].element() as HTMLInputElement, 'Your code is 12-34')
  await expect.element(page.getByTestId('value')).toHaveTextContent('1234')
  expect(completed).toHaveBeenLastCalledWith('1234', expect.anything())

  await page.getByRole('button', { name: 'Reset' }).click()
  await expect.element(page.getByTestId('value')).toHaveTextContent('')
  await inputs[3].click()
  await expect.element(inputs[0]).toHaveFocus()
})

test('native one-time-code autofill replacement distributes across all slots', async () => {
  function Field() {
    const [value, setValue] = React.useState('')

    return (
      <>
        <OtpInput
          label="Verification code"
          length={6}
          onValueChange={setValue}
          value={value}
        />
        <output data-testid="value">{value}</output>
      </>
    )
  }

  await render(<Field />)
  const first = page.getByRole('textbox', {
    name: 'Verification code',
    exact: true
  })
  const input = first.element() as HTMLInputElement
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value'
  )?.set
  setter?.call(input, '123456')
  input.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      data: '123456',
      inputType: 'insertReplacementText'
    })
  )
  input.dispatchEvent(new Event('change', { bubbles: true }))

  await expect.element(page.getByTestId('value')).toHaveTextContent('123456')
  expect(
    page
      .getByRole('textbox')
      .all()
      .map((locator) => {
        return (locator.element() as HTMLInputElement).value
      })
      .join('')
  ).toBe('123456')
})

test('keyboard navigation and deletion remain renderer-independent', async () => {
  await render(
    <OtpInput defaultValue="1234" label="Verification code" length={4} />
  )
  const inputs = page.getByRole('textbox').all()
  await inputs[2].click()
  await userEvent.keyboard('{ArrowLeft}')
  await expect.element(inputs[1]).toHaveFocus()
  await userEvent.keyboard('{Backspace}')
  expect(
    inputs
      .map((locator) => {
        return (locator.element() as HTMLInputElement).value
      })
      .join('')
  ).toBe('134')
  await expect.element(inputs[0]).toHaveFocus()
})

test('MUI adapter retains TextField semantics and fork transformations', async () => {
  const changed = vi.fn()
  await render(
    <MuiOtpInput
      ariaLabel="Operator verification code"
      onChange={changed}
      transformChar={(character) => {
        return character.toUpperCase()
      }}
      validationType="alphanumeric"
    />
  )
  const inputs = page.getByRole('textbox').all()
  await inputs[0].click()
  await userEvent.keyboard('a')
  expect(changed).toHaveBeenLastCalledWith('A')
  expect(inputs[0].element().closest('.MuiOtpInput-TextField')).not.toBeNull()
})

test('MUI auto-submit uses one native named value', async () => {
  const submitted = vi.fn()
  await render(
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submitted(Object.fromEntries(new FormData(event.currentTarget)))
      }}
    >
      <MuiOtpInput
        autoSubmit
        ariaLabel="Operator verification code"
        length={4}
        name="code"
        pastePreprocess="digits-only"
        validationType="numeric"
      />
    </form>
  )
  const first = page.getByRole('textbox', {
    name: 'Operator verification code 1/4'
  })
  dispatchPaste(first.element() as HTMLInputElement, 'Code: 12-34')
  await expect
    .poll(() => {
      return submitted.mock.calls.length
    })
    .toBe(1)
  expect(submitted).toHaveBeenLastCalledWith({ code: '1234' })
})

test('named field submits and native form reset restores its initial value', async () => {
  const submitted = vi.fn()
  await render(
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submitted(Object.fromEntries(new FormData(event.currentTarget)))
      }}
    >
      <OtpInput
        defaultValue="12"
        label="Verification code"
        length={4}
        name="code"
      />
      <button type="submit">Submit</button>
      <button type="reset">Reset</button>
    </form>
  )
  const inputs = page.getByRole('textbox').all()
  await inputs[2].click()
  await userEvent.keyboard('34')
  await page.getByRole('button', { name: 'Submit' }).click()
  expect(submitted).toHaveBeenLastCalledWith({ code: '1234' })
  await page.getByRole('button', { name: 'Reset' }).click()
  await expect
    .poll(() => {
      return inputs
        .map((locator) => {
          return (locator.element() as HTMLInputElement).value
        })
        .join('')
    })
    .toBe('12')
})

test('shadcn skin fits a narrow viewport and passes WCAG automated checks', async () => {
  await render(
    <main>
      <OtpInput
        error
        helperText="Enter the six-digit code"
        label="Verification code"
        length={6}
      />
    </main>
  )
  const inputs = page.getByRole('textbox').all()
  const firstBox = inputs[0].element().getBoundingClientRect()
  const lastBox = inputs.at(-1)!.element().getBoundingClientRect()
  expect(firstBox.height).toBeGreaterThanOrEqual(40)
  expect(lastBox.right).toBeLessThanOrEqual(
    document.documentElement.clientWidth
  )
  expect(inputs[0].element().getAttribute('autocomplete')).toBe('one-time-code')
  expect(
    inputs.slice(1).every((locator) => {
      return locator.element().getAttribute('autocomplete') === 'off'
    })
  ).toBe(true)

  const result = await axe.run(document.body, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']
    }
  })
  expect(
    result.violations.map(({ id, description }) => {
      return { id, description }
    })
  ).toEqual([])
})
