import React from 'react'
import { useForm } from 'react-hook-form'
import { expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { OtpInput } from '../../src/base-ui'
import { OtpInputController } from '../../src/base-ui-react-hook-form'
import { MuiOtpInput } from '../../src/mui'
import { MuiOtpInputController } from '../../src/react-hook-form'
import '../../src/shadcn.css'

function slotValues() {
  return page
    .getByRole('textbox')
    .all()
    .map((locator) => {
      return (locator.element() as HTMLInputElement).value
    })
    .join('')
}

const plusOne = (character: string) => {
  return /\d/u.test(character)
    ? String((Number(character) + 1) % 10)
    : character
}

test('MUI keeps the value when a slot rejects a character', async () => {
  const invalid = vi.fn()
  const change = vi.fn()

  await render(
    <MuiOtpInput
      ariaLabel="Code"
      defaultValue="1234"
      onChange={change}
      onInvalid={invalid}
      validationType="numeric"
    />
  )

  await page.getByRole('textbox', { name: 'Code 2/4' }).click()
  await userEvent.keyboard('x')

  expect(invalid).toHaveBeenCalledWith('x', expect.anything())
  expect(change).not.toHaveBeenCalled()
  expect(slotValues()).toBe('1234')
})

test('transformChar runs once per typed character in both renderers', async () => {
  const muiChange = vi.fn()
  const baseChange = vi.fn()

  await render(
    <>
      <MuiOtpInput
        ariaLabel="Mui"
        length={2}
        onChange={muiChange}
        transformChar={plusOne}
        validationType="numeric"
      />
      <OtpInput
        label="Base"
        length={2}
        onValueChange={baseChange}
        transformChar={plusOne}
      />
    </>
  )

  await page.getByRole('textbox', { name: 'Mui 1/2' }).click()
  await userEvent.keyboard('1')
  expect(muiChange).toHaveBeenLastCalledWith('2')

  await page.getByRole('textbox', { name: 'Base', exact: true }).click()
  await userEvent.keyboard('1')
  expect(baseChange).toHaveBeenLastCalledWith('2', expect.anything())
  expect(
    (
      page
        .getByRole('textbox', { name: 'Base', exact: true })
        .element() as HTMLInputElement
    ).value
  ).toBe('2')
})

test('Base UI validates each slot by its own index', async () => {
  const change = vi.fn()

  const validateChar = (character: string, index: number) => {
    return index === 0 ? character === '1' : character === '2'
  }

  await render(
    <OtpInput
      label="Code"
      length={2}
      onValueChange={change}
      validateChar={validateChar}
    />
  )

  await page.getByRole('textbox', { name: 'Code', exact: true }).click()
  await userEvent.keyboard('12')
  expect(change).toHaveBeenLastCalledWith('12', expect.anything())
})

test('Base UI honors a cancelled change', async () => {
  await render(
    <OtpInput
      label="Code"
      length={4}
      onValueChange={(_value, details) => {
        details.cancel()
      }}
    />
  )

  await page.getByRole('textbox', { name: 'Code', exact: true }).click()
  await userEvent.keyboard('1')
  expect(slotValues()).toBe('')
})

test('MUI submits only the visible characters after length shrinks', async () => {
  function Field({ length }: { length: number }) {
    return (
      <form data-testid="form">
        <MuiOtpInput
          ariaLabel="Code"
          defaultValue="1234"
          length={length}
          name="code"
        />
      </form>
    )
  }

  const screen = await render(<Field length={4} />)
  await screen.rerender(<Field length={2} />)

  const form = page.getByTestId('form').element() as HTMLFormElement
  expect(new FormData(form).get('code')).toBe('12')
})

test('read-only slots keep their characters on deletion', async () => {
  await render(
    <>
      <MuiOtpInput
        ariaLabel="Mui"
        defaultValue="1234"
        TextFieldsProps={{ slotProps: { htmlInput: { readOnly: true } } }}
      />
      <OtpInput
        defaultValue="1234"
        label="Base"
        length={4}
        slotProps={{ readOnly: true }}
      />
    </>
  )

  await page.getByRole('textbox', { name: 'Mui 2/4' }).click()
  await userEvent.keyboard('{Backspace}{Delete}')
  await page.getByRole('textbox', { name: 'Base 2/4' }).click()
  await userEvent.keyboard('{Backspace}{Delete}')

  expect(slotValues()).toBe('12341234')
})

test('a cancelled form reset keeps the edited value', async () => {
  await render(
    <form
      data-testid="form"
      onReset={(event) => {
        event.preventDefault()
      }}
    >
      <MuiOtpInput ariaLabel="Mui" defaultValue="1234" />
      <OtpInput defaultValue="1234" label="Base" length={4} />
    </form>
  )

  await page.getByRole('textbox', { name: 'Mui 1/4' }).click()
  await userEvent.keyboard('9')
  await page.getByRole('textbox', { name: 'Base', exact: true }).click()
  await userEvent.keyboard('9')
  ;(page.getByTestId('form').element() as HTMLFormElement).reset()
  await new Promise((resolve) => {
    setTimeout(resolve, 0)
  })

  expect(slotValues()).toBe('92349234')
})

test('MUI typing after a filled slot character overwrites only that slot', async () => {
  const change = vi.fn()

  await render(
    <MuiOtpInput ariaLabel="Code" defaultValue="1234" onChange={change} />
  )

  const first = page.getByRole('textbox', { name: 'Code 1/4' })
  await first.click()
  const input = first.element() as HTMLInputElement
  input.setSelectionRange(1, 1)
  await userEvent.keyboard('9')

  expect(change).toHaveBeenLastCalledWith('9234')
})

test('MUI arrow keys follow the visual order in RTL', async () => {
  await render(
    <div dir="rtl">
      <MuiOtpInput ariaLabel="Code" defaultValue="1234" />
    </div>
  )

  await page.getByRole('textbox', { name: 'Code 2/4' }).click()
  await userEvent.keyboard('{ArrowLeft}')
  await expect
    .element(page.getByRole('textbox', { name: 'Code 3/4' }))
    .toHaveFocus()
})

test('Base UI form controller is touched only after focus leaves the field', async () => {
  function Form() {
    const { control, formState } = useForm<{ code: string }>({
      defaultValues: { code: '' },
      mode: 'onBlur'
    })

    return (
      <>
        <output data-testid="touched">
          {String(Boolean(formState.touchedFields.code))}
        </output>
        <OtpInputController
          control={control}
          label="Code"
          length={4}
          name="code"
        />
        <button type="button">Next</button>
      </>
    )
  }

  await render(<Form />)
  await page.getByRole('textbox', { name: 'Code', exact: true }).click()
  await userEvent.keyboard('1')
  await expect.element(page.getByTestId('touched')).toHaveTextContent('false')

  await page.getByRole('button', { name: 'Next' }).click()
  await expect.element(page.getByTestId('touched')).toHaveTextContent('true')
})

test('MUI form controller error describes every slot', async () => {
  function Form() {
    const { control, setError } = useForm<{ code: string }>({
      defaultValues: { code: '' }
    })

    React.useEffect(() => {
      setError('code', { message: 'Invalid code' })
    }, [setError])

    return (
      <MuiOtpInputController ariaLabel="Code" control={control} name="code" />
    )
  }

  await render(<Form />)
  await expect.element(page.getByText('Invalid code')).toBeVisible()
  const message = page.getByText('Invalid code').element()

  for (const slot of page.getByRole('textbox').all()) {
    const describedBy = slot.element().getAttribute('aria-describedby') ?? ''
    expect(describedBy.split(' ')).toContain(message.id)
  }
})

test('Base UI keeps a slot aria-describedby next to its own description', async () => {
  await render(
    <>
      <p id="extra">Extra hint</p>
      <OtpInput
        helperText="Six digits"
        label="Code"
        length={2}
        slotProps={{ 'aria-describedby': 'extra' }}
      />
    </>
  )

  const describedBy =
    page
      .getByRole('textbox', { name: 'Code', exact: true })
      .element()
      .getAttribute('aria-describedby') ?? ''
  expect(describedBy.split(' ')).toContain('extra')
  expect(describedBy.split(' ')).toHaveLength(2)
})

test('MUI respects a password type and lets a gap prop replace the default spacing', async () => {
  await render(
    <MuiOtpInput
      ariaLabel="Code"
      data-testid="root"
      // @ts-expect-error MUI 9 Box no longer types system props; MUI 7 applies them.
      gap="2px"
      TextFieldsProps={{ type: 'password' }}
    />
  )

  expect(
    (page.getByLabelText('Code 1/4').element() as HTMLInputElement).type
  ).toBe('password')
  expect(getComputedStyle(page.getByTestId('root').element()).columnGap).toBe(
    '2px'
  )
})

test('six MUI slots keep whole digits at a 288px width', async () => {
  await render(
    <div style={{ width: 288 }}>
      <MuiOtpInput ariaLabel="Code" defaultValue="888888" length={6} />
    </div>
  )

  for (const slot of page.getByRole('textbox').all()) {
    const input = slot.element() as HTMLInputElement
    // Content box is wide enough for one digit; nothing is clipped.
    expect(input.scrollWidth).toBeLessThanOrEqual(input.clientWidth)
    expect(input.clientWidth).toBeGreaterThanOrEqual(12)
  }
})

function setNativeValue(input: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value'
  )?.set?.call(input, value)
}

function typeWhole(input: HTMLInputElement, text: string) {
  setNativeValue(input, text)
  input.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      data: text,
      inputType: 'insertText'
    })
  )
}

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

  input.dispatchEvent(
    new CompositionEvent('compositionend', {
      bubbles: true,
      data: steps.at(-1)
    })
  )
}

test('characters outside the BMP are rejected in both renderers', async () => {
  const muiChange = vi.fn()
  const baseChange = vi.fn()

  await render(
    <>
      <MuiOtpInput ariaLabel="Mui" length={2} onChange={muiChange} />
      <OtpInput
        label="Base"
        length={2}
        onValueChange={baseChange}
        validationType="none"
      />
    </>
  )

  // Typed as one insertion, as a real keyboard does; Playwright's keyboard
  // splits the pair into replacement characters in Chromium.
  const mui = page.getByRole('textbox', { name: 'Mui 1/2' })
  await mui.click()
  typeWhole(mui.element() as HTMLInputElement, '😀')
  expect(muiChange).not.toHaveBeenCalled()
  await userEvent.keyboard('a')
  expect(muiChange).toHaveBeenLastCalledWith('a')

  const base = page.getByRole('textbox', { name: 'Base', exact: true })
  await base.click()
  typeWhole(base.element() as HTMLInputElement, '😀')
  expect(baseChange).not.toHaveBeenCalled()
  await userEvent.keyboard('a')
  expect(baseChange).toHaveBeenLastCalledWith('a', expect.anything())
})

test('MUI Backspace and Tab follow the Base UI field', async () => {
  const change = vi.fn()

  await render(
    <>
      <MuiOtpInput ariaLabel="Code" defaultValue="1234" onChange={change} />
      <button type="button">After</button>
    </>
  )

  await page.getByRole('textbox', { name: 'Code 2/4' }).click()
  await userEvent.keyboard('{Backspace}')
  expect(change).toHaveBeenLastCalledWith('134')
  await expect
    .element(page.getByRole('textbox', { name: 'Code 1/4' }))
    .toHaveFocus()

  await userEvent.keyboard('{Tab}')
  await expect
    .element(page.getByRole('button', { name: 'After' }))
    .toHaveFocus()
})

test('IME composition commits once it ends in both renderers', async () => {
  const muiChange = vi.fn()
  const baseChange = vi.fn()

  await render(
    <>
      <MuiOtpInput ariaLabel="Mui" length={2} onChange={muiChange} />
      <OtpInput
        label="Base"
        length={2}
        onValueChange={baseChange}
        validationType="none"
      />
    </>
  )

  const mui = page.getByRole('textbox', { name: 'Mui 1/2' })
  await mui.click()
  compose(mui.element() as HTMLInputElement, ['n', 'に'])
  expect(muiChange).toHaveBeenCalledTimes(1)
  expect(muiChange).toHaveBeenLastCalledWith('に')
  await expect
    .element(page.getByRole('textbox', { name: 'Mui 2/2' }))
    .toHaveFocus()

  const base = page.getByRole('textbox', { name: 'Base', exact: true })
  await base.click()
  compose(base.element() as HTMLInputElement, ['n', 'に'])
  expect(baseChange).toHaveBeenCalledTimes(1)
  expect(baseChange).toHaveBeenLastCalledWith('に', expect.anything())
  await expect
    .element(page.getByRole('textbox', { name: 'Base 2/2' }))
    .toHaveFocus()
})
