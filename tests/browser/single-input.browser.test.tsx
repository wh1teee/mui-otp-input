import React from 'react'
import axe from 'axe-core'
import { expect, test, vi } from 'vitest'
import { cdp, page, server, userEvent } from 'vitest/browser'
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
  // WebKit on Linux does not reflect the IDL property; the attribute is what
  // a keyboard reads.
  expect(input.getAttribute('enterkeyhint')).toBe('done')
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
  // Focusing a full value selects the last cell (in WebKit right after its
  // own select-all on keyboard focus).
  await expect.poll(activeCells).toEqual([5])

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

test('the skin dims a bare disabled field once', async () => {
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
  expect(
    getComputedStyle(page.getByTestId('bare-cell').element()).opacity
  ).toBe('0.5')
  // The wrapper already dims the whole field; cells are not dimmed twice.
  const wrapped = document.querySelectorAll<HTMLElement>(
    '[data-slot="otp-field"] [data-slot="input-otp-slot"]'
  )[0]
  expect(getComputedStyle(wrapped).opacity).toBe('1')
})

// Only Chromium can emulate forced colors; WebKit has no such mode.
test.runIf(server.browser === 'chromium')(
  'in forced colors the real input text stays transparent over the cells',
  async () => {
    const session = cdp() as unknown as {
      send(method: string, params: object): Promise<unknown>
    }
    await session.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'forced-colors', value: 'active' }]
    })

    try {
      await render(<Field value="1234" />)
      expect(matchMedia('(forced-colors: active)').matches).toBe(true)
      const style = getComputedStyle(codeInput())
      expect(style.color).toBe('rgba(0, 0, 0, 0)')
      expect(style.caretColor).toBe('rgba(0, 0, 0, 0)')
    } finally {
      await session.send('Emulation.setEmulatedMedia', { features: [] })
    }
  }
)

test('only a password-manager badge over this field pushes the input', async () => {
  const badge = document.createElement('div')
  badge.setAttribute('data-lastpass-icon-root', '')
  badge.style.cssText = 'position:fixed;left:0;bottom:0;width:20px;height:20px'
  document.body.append(badge)

  try {
    await render(
      <div style={{ width: 300 }}>
        <OtpInput label="Verification code" length={4} />
      </div>
    )
    const input = codeInput()
    const root = input.parentElement as HTMLElement
    // There is room for the gutter, so only detection decides.
    expect(
      document.documentElement.clientWidth - root.getBoundingClientRect().right
    ).toBeGreaterThanOrEqual(40)

    // A known badge elsewhere on the page does not push this field.
    input.focus()
    await settle(200)
    expect(input.getBoundingClientRect().width).toBe(
      root.getBoundingClientRect().width
    )

    // A known badge over the field does, even one that ignores the pointer
    // (so only the rectangle check, not elementFromPoint, can see it).
    const rect = root.getBoundingClientRect()
    badge.style.cssText = `position:fixed;left:${rect.right - 26}px;top:${rect.top}px;width:20px;height:20px;pointer-events:none`
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

test('a host can cancel paste, mouse and key handling with preventDefault', async () => {
  const onValue = vi.fn()
  await render(
    <Field
      onKeyDown={(event) => {
        if (event.key === '5') {
          event.preventDefault()
        }
      }}
      onMouseDown={(event) => {
        event.preventDefault()
      }}
      onPaste={(event) => {
        event.preventDefault()
      }}
      onValue={onValue}
      value="12"
    />
  )
  await userEvent.tab()
  await expect.poll(activeCells).toEqual([2])

  dispatchPaste(codeInput(), '123456')
  await userEvent.keyboard('5')
  await settle()
  expect(onValue).not.toHaveBeenCalled()
  expect(codeInput().value).toBe('12')

  // The host's mousedown kept the internal cell placement from running.
  await clickCell(0)
  expect(activeCells()).toEqual([2])
})

test('host handlers run first and see the field before the internal handling', async () => {
  const seen: unknown[] = []
  await render(
    <Field
      onMouseDown={(event) => {
        seen.push([
          'mousedown',
          event.defaultPrevented,
          codeInput().selectionStart
        ])
      }}
      onPaste={(event) => {
        seen.push(['paste', event.defaultPrevented])
      }}
      value="12"
    />
  )
  await userEvent.tab()
  await expect.poll(activeCells).toEqual([2])
  dispatchPaste(codeInput(), '345678')
  await expect.element(page.getByTestId('value')).toHaveTextContent('345678')
  await clickCell(1)
  expect(activeCells()).toEqual([1])
  // Internal-first would already have prevented the default and moved the
  // caret to the clicked cell when the host handler ran.
  expect(seen).toEqual([
    ['paste', false],
    ['mousedown', false, 5]
  ])
})

test('six cells shrink equally to fit a 288px line and keep their set width on a wide one', async () => {
  // The README layout: two groups around a separator.
  function Cells({ width }: { width: number }) {
    return (
      <div data-testid={`box-${width}`} style={{ width }}>
        <InputOTP aria-label={`Code ${width}`} length={6}>
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
      </div>
    )
  }

  await render(
    <>
      <Cells width={288} />
      <Cells width={600} />
    </>
  )

  for (const [width, expected] of [
    [288, null],
    [600, 40]
  ] as const) {
    const box = page.getByTestId(`box-${width}`).element() as HTMLElement
    const widths = [
      ...box.querySelectorAll<HTMLElement>('[data-slot="input-otp-slot"]')
    ].map((cell) => {
      return cell.getBoundingClientRect().width
    })
    const last = box
      .querySelectorAll<HTMLElement>('[data-slot="input-otp-slot"]')[5]
      .getBoundingClientRect()

    const boxCells = [
      ...box.querySelectorAll<HTMLElement>('[data-slot="input-otp-slot"]')
    ]
    // One line, equal up to sub-pixel layout rounding.
    expect(
      new Set(
        boxCells.map((cell) => {
          return Math.round(cell.getBoundingClientRect().top)
        })
      ).size
    ).toBe(1)
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(0.5)
    expect(last.right).toBeLessThanOrEqual(box.getBoundingClientRect().right)
    expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth)

    if (expected === null) {
      expect(widths[0]).toBeLessThan(40)
    } else {
      expect(widths[0]).toBe(expected)
    }
  }
})

test('mounting into a container not yet in the document does not throw', async () => {
  const { createRoot } = await import('react-dom/client')
  const errors: unknown[] = []

  const onError = (event: ErrorEvent) => {
    errors.push(event.error)
  }

  window.addEventListener('error', onError)
  const container = document.createElement('div')
  const root = createRoot(container)

  try {
    root.render(<OtpInput label="Detached code" length={4} />)
    await settle()
    document.body.append(container)
    await settle()
    expect(errors).toEqual([])
    expect(container.querySelectorAll('input')).toHaveLength(1)
  } finally {
    root.unmount()
    container.remove()
    window.removeEventListener('error', onError)
  }
})

/** A native edit as a browser performs it: beforeinput, then the text. */
function nativeInsert(input: HTMLInputElement, data: string) {
  const start = input.selectionStart ?? 0
  const end = input.selectionEnd ?? start
  input.dispatchEvent(
    new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      data,
      inputType: 'insertText'
    })
  )
  setNativeValue(
    input,
    input.value.slice(0, start) + data + input.value.slice(end)
  )
  input.setSelectionRange(start + data.length, start + data.length)
  input.dispatchEvent(
    new InputEvent('input', { bubbles: true, data, inputType: 'insertText' })
  )
}

test('a full field overwrites the cell at a collapsed caret and ignores a key past the end', async () => {
  const onComplete = vi.fn()
  const onValue = vi.fn()
  await render(
    <Field onComplete={onComplete} onValue={onValue} value="123456" />
  )
  await userEvent.tab()
  const input = codeInput()

  // Home, then a digit before the selection is normalised.
  input.setSelectionRange(0, 0)
  nativeInsert(input, '9')
  await expect.element(page.getByTestId('value')).toHaveTextContent('923456')

  input.setSelectionRange(6, 6)
  nativeInsert(input, '7')
  await settle()
  expect(onValue.mock.calls).toEqual([['923456']])
  expect(input.value).toBe('923456')
  expect(onComplete.mock.calls).toEqual([['923456']])
})

test('a digit typed right after an arrow key replaces the cell, before selectionchange arrives', async () => {
  // Hold back selectionchange, as a fast typist outruns it.
  const block = (event: Event) => {
    event.stopImmediatePropagation()
  }

  await render(<Field value="1234" />)
  await userEvent.tab()
  await expect.poll(activeCells).toEqual([4])
  window.addEventListener('selectionchange', block, true)
  codeInput().addEventListener('selectionchange', block, true)

  try {
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}9')
    await expect.element(page.getByTestId('value')).toHaveTextContent('1294')
  } finally {
    window.removeEventListener('selectionchange', block, true)
    codeInput().removeEventListener('selectionchange', block, true)
  }
})

test('full-width digits from a Japanese IME or a paste become ASCII digits', async () => {
  await render(<Field />)
  await userEvent.tab()
  dispatchPaste(codeInput(), '１２３４５６')
  await expect.element(page.getByTestId('value')).toHaveTextContent('123456')
})

test('a pasted message takes the run of exactly length code characters', async () => {
  await render(<Field />)
  await userEvent.tab()
  dispatchPaste(codeInput(), 'Order 42: your code 123456')
  await expect.element(page.getByTestId('value')).toHaveTextContent('123456')

  // Without such a run, the first length accepted characters.
  dispatchPaste(codeInput(), '12a34b56c78')
  await settle()
  await expect.element(page.getByTestId('value')).toHaveTextContent('123456')
  dispatchPaste(codeInput(), '98-76-54-32')
  await expect.element(page.getByTestId('value')).toHaveTextContent('987654')
})

test('focus on a one-character value puts the next digit in cell 1', async () => {
  await render(<Field value="1" />)
  await userEvent.tab()
  await settle(50)
  await userEvent.keyboard('2')
  await expect.element(page.getByTestId('value')).toHaveTextContent('12')
})

test('a selection the host makes in its own onFocus is kept', async () => {
  await render(
    <Field
      onFocus={(event) => {
        event.currentTarget.select()
      }}
      value="123456"
    />
  )
  await userEvent.tab()
  await settle(100)
  expect(activeCells()).toEqual([0, 1, 2, 3, 4, 5])
})

test('arrow keys move the active cell inside a shadow root', async () => {
  const host = document.createElement('div')
  document.body.append(host)
  const shadow = host.attachShadow({ mode: 'open' })
  const container = document.createElement('div')
  shadow.append(container)
  await render(
    <OtpInput defaultValue="1234" label="Verification code" length={6} />,
    { container }
  )

  const active = () => {
    return [...shadow.querySelectorAll('[data-slot="input-otp-slot"]')].flatMap(
      (cell, index) => {
        return cell.hasAttribute('data-active') ? [index] : []
      }
    )
  }

  ;(shadow.querySelector('input') as HTMLInputElement).focus()
  await expect.poll(active).toEqual([4])
  await userEvent.keyboard('{ArrowLeft}{ArrowLeft}')
  await expect.poll(active).toEqual([2])
  host.remove()
})
