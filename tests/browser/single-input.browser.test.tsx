import React from 'react'
import axe from 'axe-core'
import { expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import {
  InputOTP,
  InputOTPGroup,
  type InputOTPHandle,
  type InputOTPProps,
  InputOTPSeparator,
  InputOTPSlot,
  OtpInput
} from '../../src/shadcn'
import '../../src/shadcn.css'

function setNativeValue(input: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value'
  )?.set?.call(input, value)
}

/** One-time-code autofill sets the whole value in a single input event. */
function autofill(input: HTMLInputElement, value: string) {
  setNativeValue(input, value)
  input.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      data: value,
      inputType: 'insertReplacementText'
    })
  )
}

function dispatchPaste(input: HTMLInputElement, value: string) {
  const event = new Event('paste', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'clipboardData', {
    value: {
      getData(type: string) {
        return type === 'text/plain' ? value : ''
      }
    }
  })
  input.dispatchEvent(event)
}

function cells() {
  return [
    ...document.querySelectorAll<HTMLElement>('[data-slot="input-otp-slot"]')
  ]
}

function activeCells() {
  return cells().flatMap((cell, index) => {
    return cell.hasAttribute('data-active') ? [index] : []
  })
}

/** Clicks the input where the given cell is drawn. */
async function clickCell(index: number) {
  const input = codeInput().getBoundingClientRect()
  const cell = cells()[index].getBoundingClientRect()
  await code().click({
    position: {
      x: cell.left - input.left + cell.width / 2,
      y: cell.top - input.top + cell.height / 2
    }
  })
}

function code() {
  return page.getByRole('textbox', { name: 'Verification code' })
}

function codeInput() {
  return code().element() as HTMLInputElement
}

function settle(milliseconds = 150) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

function Field({
  handle,
  length = 6,
  onValue,
  setter,
  ...props
}: Partial<InputOTPProps> & {
  handle?: React.Ref<InputOTPHandle>
  onValue?: (value: string) => void
  setter?: { current: ((value: string) => void) | null }
}) {
  const [value, setValue] = React.useState(props.value ?? '')

  if (setter) {
    setter.current = setValue
  }

  return (
    <>
      <OtpInput
        label="Verification code"
        length={length}
        separatorAfter={[2]}
        {...props}
        ref={handle}
        value={value}
        onValueChange={(next, details) => {
          props.onValueChange?.(next, details)

          if (!details.isCanceled) {
            setValue(next)
            onValue?.(next)
          }
        }}
      />
      <output data-testid="value">{value}</output>
      <button
        type="button"
        onClick={() => {
          return setValue('424242')
        }}
      >
        Fill
      </button>
    </>
  )
}

test('renders exactly one labelled input over cells hidden from assistive technology', async () => {
  await render(
    <OtpInput
      autoComplete="one-time-code"
      enterKeyHint="done"
      helperText="Six digits"
      label="Verification code"
      length={6}
      name="code"
      required
    />
  )

  expect(document.querySelectorAll('input')).toHaveLength(1)
  const input = codeInput()
  expect(input.type).toBe('text')
  expect(input.inputMode).toBe('numeric')
  // Firefox reflects an empty string from the IDL property for this token; the attribute is what autofill reads.
  expect(input.getAttribute('autocomplete')).toBe('one-time-code')
  // The value pipeline enforces the length; a native maxlength would cut a
  // whole code inserted into a partly filled field.
  expect(input.hasAttribute('maxlength')).toBe(false)
  expect(input.pattern).toBe('[0-9]*')
  expect(input.enterKeyHint).toBe('done')
  expect(input.name).toBe('code')
  expect(input.required).toBe(true)
  await expect.element(code()).toHaveAccessibleDescription('Six digits')
  expect(cells()).toHaveLength(6)

  for (const cell of cells()) {
    expect(cell.getAttribute('aria-hidden')).toBe('true')
  }

  expect(page.getByRole('separator').elements()).toHaveLength(0)
})

test('typing fills cells, the active cell follows the caret, and the empty active cell draws a caret', async () => {
  await render(<Field />)
  await code().click()
  expect(activeCells()).toEqual([0])
  expect(cells()[0].hasAttribute('data-fake-caret')).toBe(true)

  await userEvent.keyboard('12a3')
  await expect.element(page.getByTestId('value')).toHaveTextContent('123')
  expect(
    cells().map((cell) => {
      return cell.textContent
    })
  ).toEqual(['1', '2', '3', '', '', ''])
  expect(activeCells()).toEqual([3])
  expect(cells()[2].hasAttribute('data-filled')).toBe(true)
  expect(cells()[3].hasAttribute('data-fake-caret')).toBe(true)
})

test('arrow keys, Home, End and Backspace move through the cells', async () => {
  await render(<Field value="123456" />)
  await userEvent.tab()
  // Focusing a full value selects the last cell.
  expect(activeCells()).toEqual([5])

  await userEvent.keyboard('{ArrowLeft}')
  expect(activeCells()).toEqual([4])
  await userEvent.keyboard('{Home}')
  expect(activeCells()).toEqual([0])
  await userEvent.keyboard('{ArrowRight}')
  expect(activeCells()).toEqual([1])

  // Typing over a selected cell replaces it and moves on.
  await userEvent.keyboard('9')
  await expect.element(page.getByTestId('value')).toHaveTextContent('193456')
  expect(activeCells()).toEqual([2])

  await userEvent.keyboard('{End}')
  expect(activeCells()).toEqual([5])
  await userEvent.keyboard('{Backspace}')
  await expect.element(page.getByTestId('value')).toHaveTextContent('19345')
  expect(activeCells()).toEqual([5])
  await userEvent.keyboard('{Backspace}')
  await expect.element(page.getByTestId('value')).toHaveTextContent('1934')
  expect(activeCells()).toEqual([4])
})

test('select-all then typing replaces the code', async () => {
  await render(<Field value="123456" />)
  await code().click()
  await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}')
  expect(activeCells()).toEqual([0, 1, 2, 3, 4, 5])
  await userEvent.keyboard('7')
  await expect.element(page.getByTestId('value')).toHaveTextContent('7')
  expect(activeCells()).toEqual([1])
})

test('a selected range highlights every selected cell', async () => {
  await render(<Field value="123456" />)
  await code().click()
  codeInput().setSelectionRange(1, 4)
  await expect.poll(activeCells).toEqual([1, 2, 3])
})

test('clicking a cell puts the caret there, clamped to the value', async () => {
  await render(<Field value="1234" />)
  await clickCell(1)
  await expect.element(code()).toHaveFocus()
  expect(activeCells()).toEqual([1])
  expect([codeInput().selectionStart, codeInput().selectionEnd]).toEqual([1, 2])

  // A click past the value lands on the first empty cell.
  await clickCell(5)
  expect(activeCells()).toEqual([4])
  expect([codeInput().selectionStart, codeInput().selectionEnd]).toEqual([4, 4])
})

test('one-time-code autofill completes once from a single input event', async () => {
  const onComplete = vi.fn()
  const onValue = vi.fn()
  await render(<Field onComplete={onComplete} onValue={onValue} />)
  await code().click()

  autofill(codeInput(), '123456')

  await expect.element(page.getByTestId('value')).toHaveTextContent('123456')
  expect(onValue).toHaveBeenCalledTimes(1)
  expect(onComplete).toHaveBeenCalledTimes(1)
  expect(onComplete).toHaveBeenCalledWith('123456')
})

test('a pasted code with spaces and dashes fills the field wherever the caret is', async () => {
  await render(<Field value="98" />)
  await code().click()

  dispatchPaste(codeInput(), ' 123-456 ')
  await expect.element(page.getByTestId('value')).toHaveTextContent('123456')

  // A partial paste goes in at the caret.
  await userEvent.keyboard('{Backspace}{Backspace}')
  dispatchPaste(codeInput(), '7 8')
  await expect.element(page.getByTestId('value')).toHaveTextContent('123478')
})

test('onComplete fires once per completed value and again after re-entry', async () => {
  const onComplete = vi.fn()
  await render(<Field length={4} onComplete={onComplete} />)
  await code().click()

  await userEvent.keyboard('1234')
  await expect.element(page.getByTestId('value')).toHaveTextContent('1234')
  expect(onComplete).toHaveBeenCalledTimes(1)

  // Pasting the same complete code again is not a new completion, now or
  // after the next render.
  dispatchPaste(codeInput(), '1234')
  await settle()
  expect(onComplete).toHaveBeenCalledTimes(1)

  // Clearing passes through an incomplete value; the same code completes again.
  await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}{Backspace}')
  await expect.element(page.getByTestId('value')).toHaveTextContent('')
  await userEvent.keyboard('1234')
  await expect.element(page.getByTestId('value')).toHaveTextContent('1234')
  expect(onComplete).toHaveBeenCalledTimes(2)
  expect(onComplete).toHaveBeenLastCalledWith('1234')
})

test('a complete initial value does not report completion on mount', async () => {
  const onComplete = vi.fn()
  await render(
    <OtpInput
      defaultValue="1234"
      label="Verification code"
      length={4}
      onComplete={onComplete}
    />
  )
  await code().click()
  await userEvent.keyboard('{Backspace}5')
  await expect
    .poll(() => {
      return onComplete.mock.calls
    })
    .toEqual([['1235']])
})

test('a controlled value set from outside (WebOTP) completes once', async () => {
  const onComplete = vi.fn()
  await render(<Field onComplete={onComplete} />)
  await page.getByRole('button', { name: 'Fill' }).click()
  await expect.element(page.getByTestId('value')).toHaveTextContent('424242')
  expect(
    cells()
      .map((cell) => {
        return cell.textContent
      })
      .join('')
  ).toBe('424242')
  expect(onComplete.mock.calls).toEqual([['424242']])
})

test('clear({ focus: true }) empties the value and puts the caret in the first cell', async () => {
  const handle = React.createRef<InputOTPHandle>()
  const onComplete = vi.fn()
  await render(
    <>
      <Field handle={handle} length={4} onComplete={onComplete} />
      <button type="button">Elsewhere</button>
    </>
  )
  await code().click()
  await userEvent.keyboard('1234')
  await page.getByRole('button', { name: 'Elsewhere' }).click()

  handle.current?.clear({ focus: true })

  await expect.element(page.getByTestId('value')).toHaveTextContent('')
  await expect.element(code()).toHaveFocus()
  expect(activeCells()).toEqual([0])
  expect([codeInput().selectionStart, codeInput().selectionEnd]).toEqual([0, 0])
  expect(handle.current?.input).toBe(codeInput())
  expect(handle.current?.root?.getAttribute('data-slot')).toBe('input-otp')

  await userEvent.keyboard('1234')
  expect(onComplete).toHaveBeenCalledTimes(2)
})

test('autoSubmit submits the owning form with requestSubmit once per code', async () => {
  const onSubmit = vi.fn((event: React.SyntheticEvent) => {
    return event.preventDefault()
  })
  await render(
    <form onSubmit={onSubmit}>
      <OtpInput autoSubmit label="Verification code" length={4} name="code" />
    </form>
  )
  await code().click()
  await userEvent.keyboard('1234')
  await expect
    .poll(() => {
      return onSubmit.mock.calls.length
    })
    .toBe(1)
  await settle(300)
  expect(onSubmit).toHaveBeenCalledTimes(1)
  const form = codeInput().form as HTMLFormElement
  expect(new FormData(form).get('code')).toBe('1234')
})

test('transformChar runs once per entered character, at its real index', async () => {
  const transformChar = vi.fn((character: string) => {
    return character.toUpperCase()
  })
  await render(
    <Field
      length={4}
      transformChar={transformChar}
      validationType="alphanumeric"
    />
  )
  await code().click()
  await userEvent.keyboard('ab')
  await expect.element(page.getByTestId('value')).toHaveTextContent('AB')
  expect(transformChar.mock.calls).toEqual([
    ['a', 0],
    ['b', 1]
  ])
})

test('IME composition commits once it ends', async () => {
  const onValue = vi.fn()
  await render(<Field length={2} onValue={onValue} validationType="none" />)
  await code().click()
  const input = codeInput()

  input.dispatchEvent(
    new CompositionEvent('compositionstart', { bubbles: true })
  )

  for (const text of ['n', 'に']) {
    setNativeValue(input, text)
    input.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        data: text,
        inputType: 'insertCompositionText',
        isComposing: true
      })
    )
  }

  input.dispatchEvent(
    new CompositionEvent('compositionend', { bubbles: true, data: 'に' })
  )

  await expect.element(page.getByTestId('value')).toHaveTextContent('に')
  expect(onValue).toHaveBeenCalledTimes(1)
  expect(activeCells()).toEqual([1])
})

test('digits stay left to right on a right-to-left page', async () => {
  await render(
    <div dir="rtl">
      <OtpInput defaultValue="12" label="Verification code" length={4} />
    </div>
  )
  const [first, second] = cells()
  expect(first.getBoundingClientRect().left).toBeLessThan(
    second.getBoundingClientRect().left
  )
  expect(getComputedStyle(codeInput()).direction).toBe('ltr')
})

test('the documented primitives example has no accessibility violations', async () => {
  // Mirrors the README and site example: a visible label names the input.
  await render(
    <>
      <label htmlFor="code">Verification code</label>
      <InputOTP id="code" length={6}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
    </>
  )

  await code().click()
  await userEvent.keyboard('12')
  const result = await axe.run(document.body, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']
    }
  })
  expect(
    result.violations.map((violation) => {
      return violation.id
    })
  ).toEqual([])
  await expect.element(code()).toBeVisible()
})

test('a controlled complete value on mount neither completes nor submits, also in StrictMode', async () => {
  const onComplete = vi.fn()
  const onSubmit = vi.fn((event: React.SyntheticEvent) => {
    event.preventDefault()
  })
  await render(
    <React.StrictMode>
      <form onSubmit={onSubmit}>
        <Field autoSubmit onComplete={onComplete} value="123456" />
      </form>
    </React.StrictMode>
  )
  await settle(300)
  expect(onComplete).not.toHaveBeenCalled()
  expect(onSubmit).not.toHaveBeenCalled()

  // A change after mount is an edge.
  await userEvent.tab()
  await userEvent.keyboard('{Backspace}7')
  await expect.element(page.getByTestId('value')).toHaveTextContent('123457')
  await settle()
  expect(onComplete.mock.calls).toEqual([['123457']])
  expect(onSubmit).toHaveBeenCalledTimes(1)
})

test('a form reset to a complete default neither completes nor submits', async () => {
  const onComplete = vi.fn()
  const onSubmit = vi.fn((event: React.SyntheticEvent) => {
    event.preventDefault()
  })
  await render(
    <form onSubmit={onSubmit}>
      <OtpInput
        autoSubmit
        defaultValue="1234"
        label="Verification code"
        length={4}
        onComplete={onComplete}
      />
    </form>
  )
  await userEvent.tab()
  await userEvent.keyboard('{Backspace}')
  await expect
    .poll(() => {
      return codeInput().value
    })
    .toBe('123')

  codeInput().form?.reset()

  await expect
    .poll(() => {
      return codeInput().value
    })
    .toBe('1234')
  await settle(300)
  expect(onComplete).not.toHaveBeenCalled()
  expect(onSubmit).not.toHaveBeenCalled()
})

test('an over-length value set by script keeps the first length characters', async () => {
  const errors: unknown[] = []

  const onError = (event: ErrorEvent) => {
    errors.push(event.error)
  }

  window.addEventListener('error', onError)

  try {
    await render(<Field value="123456" />)
    await userEvent.tab()
    autofill(codeInput(), '1234567')
    await settle()
    expect(errors).toEqual([])
    await expect.element(page.getByTestId('value')).toHaveTextContent('123456')
    expect(codeInput().value).toBe('123456')
  } finally {
    window.removeEventListener('error', onError)
  }
})

test('a longer code inserted in one event into a partial field keeps its first length characters', async () => {
  await render(<Field value="12" />)
  await userEvent.tab()
  // `12345678` inserted after the existing `12` in one event.
  autofill(codeInput(), '1212345678')
  await expect.element(page.getByTestId('value')).toHaveTextContent('123456')
})

test('a whole code inserted in one event into a partly filled field replaces it', async () => {
  const onComplete = vi.fn()
  await render(<Field onComplete={onComplete} value="99" />)
  await userEvent.tab()
  // A keyboard suggestion (Gboard, iOS QuickType) inserts the whole code at
  // the caret in one native insertText edit.
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- the only API that performs a trusted native insertText edit
  document.execCommand('insertText', false, '123456')
  await expect.element(page.getByTestId('value')).toHaveTextContent('123456')
  expect(onComplete.mock.calls).toEqual([['123456']])
  expect(codeInput().hasAttribute('maxlength')).toBe(false)
})

test('a space typed over a selected cell changes nothing', async () => {
  const onValue = vi.fn()
  await render(<Field onValue={onValue} value="1234" />)
  await userEvent.tab()
  codeInput().setSelectionRange(1, 2)
  await expect.poll(activeCells).toEqual([1])
  await userEvent.keyboard(' ')
  await settle()
  expect(onValue).not.toHaveBeenCalled()
  expect(codeInput().value).toBe('1234')
})

test('Delete keeps the active cell where the deleted character was', async () => {
  await render(<Field value="1234" />)
  await userEvent.tab()
  codeInput().setSelectionRange(1, 2)
  await expect.poll(activeCells).toEqual([1])
  await userEvent.keyboard('{Delete}')
  await expect.element(page.getByTestId('value')).toHaveTextContent('134')
  expect(activeCells()).toEqual([1])
})

function compose(input: HTMLInputElement, steps: string[]) {
  input.dispatchEvent(
    new CompositionEvent('compositionstart', { bubbles: true })
  )

  for (const text of steps) {
    setNativeValue(input, text)
    input.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        data: text,
        inputType: 'insertCompositionText',
        isComposing: true
      })
    )
  }
}

test('the host onCompositionEnd runs after the internal commit', async () => {
  const order: string[] = []
  await render(
    <Field
      length={2}
      validationType="none"
      onCompositionEnd={() => {
        order.push(`host:${codeInput().value}`)
      }}
      onValue={(value) => {
        order.push(`value:${value}`)
      }}
    />
  )
  await userEvent.tab()
  compose(codeInput(), ['に'])
  codeInput().dispatchEvent(
    new CompositionEvent('compositionend', { bubbles: true, data: 'に' })
  )
  await expect.element(page.getByTestId('value')).toHaveTextContent('に')
  expect(order).toEqual(['value:に', 'host:に'])
})

test('the selection is left alone while an IME composes', async () => {
  await render(<Field length={2} validationType="none" />)
  await userEvent.tab()
  const input = codeInput()
  const setSelectionRange = vi.spyOn(input, 'setSelectionRange')

  // The composed text reaches the full length before the IME commits.
  compose(input, ['か', 'かな'])
  document.dispatchEvent(new Event('selectionchange'))
  await settle()

  expect(setSelectionRange).not.toHaveBeenCalled()
  setSelectionRange.mockRestore()
})

test('replacing a character with the same one leaves no stale caret for a later outside change', async () => {
  const setter: { current: ((value: string) => void) | null } = {
    current: null
  }
  await render(
    <Field
      setter={setter}
      transformChar={(character) => {
        return character.toUpperCase()
      }}
      validationType="alphanumeric"
      value="1A34"
    />
  )
  await userEvent.tab()
  codeInput().setSelectionRange(1, 2)
  await expect.poll(activeCells).toEqual([1])
  // `a` becomes `A`: the same value as before.
  await userEvent.keyboard('a')
  await expect.poll(activeCells).toEqual([2])

  setter.current?.('567890')

  await expect
    .poll(() => {
      return codeInput().value
    })
    .toBe('567890')
  await expect.poll(activeCells).toEqual([5])
})

test('the active cell is tracked inside a shadow root', async () => {
  const host = document.createElement('div')
  document.body.append(host)
  const shadow = host.attachShadow({ mode: 'open' })
  const container = document.createElement('div')
  shadow.append(container)
  await render(<OtpInput label="Verification code" length={4} />, {
    container
  })
  const input = shadow.querySelector('input') as HTMLInputElement
  input.focus()
  await expect
    .poll(() => {
      return [...shadow.querySelectorAll('[data-slot="input-otp-slot"]')].map(
        (cell) => {
          return cell.hasAttribute('data-active')
        }
      )
    })
    .toEqual([true, false, false, false])
  host.remove()
})

test('the skin keeps forced colors off the transparent input and dims a bare disabled field', async () => {
  await render(
    <>
      <InputOTP aria-label="Bare" disabled length={2}>
        <InputOTPGroup>
          <InputOTPSlot data-testid="bare-cell" index={0} />
          <InputOTPSlot index={1} />
        </InputOTPGroup>
      </InputOTP>
      <OtpInput disabled label="Wrapped" length={2} />
    </>
  )
  const bare = page.getByRole('textbox', { name: 'Bare' }).element()
  expect(getComputedStyle(bare).forcedColorAdjust).toBe('none')
  expect(
    getComputedStyle(page.getByTestId('bare-cell').element()).opacity
  ).toBe('0.5')
  // The wrapper already dims the whole field; cells are not dimmed twice.
  const wrapped = document.querySelectorAll<HTMLElement>(
    '[data-slot="otp-field"] [data-slot="input-otp-slot"]'
  )[0]
  expect(getComputedStyle(wrapped).opacity).toBe('1')
})

test('only a password-manager badge over this field pushes the input', async () => {
  const badge = document.createElement('div')
  badge.setAttribute('data-lastpass-icon-root', '')
  badge.style.cssText = 'position:fixed;left:0;bottom:0;width:20px;height:20px'
  document.body.append(badge)

  try {
    // Leave room on the right, where the gutter would go.
    await render(
      <div style={{ width: 300 }}>
        <OtpInput label="Verification code" length={4} />
      </div>
    )
    await userEvent.tab()
    await settle(200)
    const input = codeInput()
    const root = input.parentElement as HTMLElement
    expect(input.getBoundingClientRect().width).toBe(
      root.getBoundingClientRect().width
    )

    // A badge drawn over the field's right edge does push it.
    const rect = root.getBoundingClientRect()
    badge.style.left = `${rect.right - 26}px`
    badge.style.top = `${rect.top}px`
    badge.style.bottom = ''
    input.blur()
    await settle(50)
    input.focus()
    await expect
      .poll(() => {
        return input.getBoundingClientRect().width
      })
      .toBeGreaterThan(root.getBoundingClientRect().width)
  } finally {
    badge.remove()
  }
})
