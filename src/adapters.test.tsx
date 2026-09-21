import React from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InputOTP, InputOTPGroup, InputOTPSlot, OtpInput } from './base-ui'
import { MuiOtpInput } from './mui'

afterEach(() => {
  vi.useRealTimers()
})

function BasePrimitive(
  props: Partial<React.ComponentProps<typeof InputOTP>> = {}
) {
  return (
    <InputOTP aria-label="Code" length={4} {...props}>
      <InputOTPGroup>
        {Array.from({ length: 4 }, (_, index) => {
          return (
            <InputOTPSlot
              key={index}
              index={index}
              aria-label={index === 0 ? undefined : `Code ${index + 1}/4`}
            />
          )
        })}
      </InputOTPGroup>
    </InputOTP>
  )
}

interface AdapterHarnessProps {
  length?: number
  onCanonicalChange?: (value: string) => void
  onCanonicalComplete?: (value: string) => void
  pastePreprocess?: React.ComponentProps<typeof InputOTP>['pastePreprocess']
  transformChar?: React.ComponentProps<typeof InputOTP>['transformChar']
  validationType?: React.ComponentProps<typeof InputOTP>['validationType']
  value?: string
}

describe.each([
  [
    'MUI',
    ({
      onCanonicalChange,
      onCanonicalComplete,
      ...props
    }: AdapterHarnessProps) => {
      return (
        <MuiOtpInput
          {...props}
          onChange={onCanonicalChange}
          onComplete={onCanonicalComplete}
        />
      )
    }
  ],
  [
    'Base UI',
    ({
      onCanonicalChange,
      onCanonicalComplete,
      ...props
    }: AdapterHarnessProps) => {
      return (
        <BasePrimitive
          {...props}
          onValueChange={(value) => {
            return onCanonicalChange?.(value)
          }}
          onValueComplete={(value) => {
            return onCanonicalComplete?.(value)
          }}
        />
      )
    }
  ]
] as const)('%s adapter parity', (_adapter, renderAdapter) => {
  test('preprocesses a full pasted message and completes with one canonical value', async () => {
    // #given
    const onChange = vi.fn()
    const onComplete = vi.fn()
    render(
      renderAdapter({
        length: 4,
        onCanonicalChange: onChange,
        onCanonicalComplete: onComplete,
        pastePreprocess: 'digits-only',
        validationType: 'numeric'
      })
    )

    // #when
    fireEvent.paste(screen.getAllByRole('textbox')[0], {
      clipboardData: {
        getData: () => {
          return 'Your code is 12-34'
        }
      }
    })

    // #then
    await waitFor(() => {
      return expect(onChange).toHaveBeenLastCalledWith('1234')
    })
    expect(onComplete).toHaveBeenCalledWith('1234')
  })

  test('applies transformChar before validation', async () => {
    // #given
    const onChange = vi.fn()
    render(
      renderAdapter({
        length: 4,
        onCanonicalChange: onChange,
        transformChar: (character: string) => {
          return character.toUpperCase()
        },
        validationType: 'alphanumeric'
      })
    )

    // #when
    await userEvent.type(screen.getAllByRole('textbox')[0], 'a')

    // #then
    await waitFor(() => {
      return expect(onChange).toHaveBeenLastCalledWith('A')
    })
  })

  test('redirects a click on a later empty slot to the first empty slot', async () => {
    // #given
    function Controlled() {
      const [value, setValue] = React.useState('12')
      const adapterProps = {
        length: 4,
        value,
        onCanonicalChange: setValue
      }

      return renderAdapter(adapterProps)
    }

    render(<Controlled />)
    const inputs = screen.getAllByRole('textbox')

    // #when
    await userEvent.click(inputs[3])

    // #then
    expect(document.activeElement).toBe(inputs[2])
  })
})

describe('MUI compatibility adapter', () => {
  test('fires initial completion once for an already complete controlled value', () => {
    // #given
    const onComplete = vi.fn()

    // #when
    const view = render(<MuiOtpInput value="1234" onComplete={onComplete} />)
    view.rerender(<MuiOtpInput value="1234" onComplete={onComplete} />)

    // #then
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  test('supports the fork delayed autofocus contract', async () => {
    // #given
    vi.useFakeTimers()
    render(<MuiOtpInput autoFocus={75} />)
    const first = screen.getAllByRole('textbox')[0]

    // #when
    await act(async () => {
      return vi.advanceTimersByTime(75)
    })

    // #then
    expect(document.activeElement).toBe(first)
  })

  test('preserves per-slot MUI TextField props and user event handlers', async () => {
    // #given
    const onFocus = vi.fn()
    render(
      <MuiOtpInput
        TextFieldsProps={(index) => {
          return {
            'data-testid': `mui-slot-${index}`,
            onFocus
          }
        }}
      />
    )

    // #when
    await userEvent.click(
      screen.getByTestId('mui-slot-0').querySelector('input')!
    )

    // #then
    expect(onFocus).toHaveBeenCalledTimes(1)
  })

  test('auto-submits one named value and restores the uncontrolled default on reset', async () => {
    // #given
    const submitted = vi.fn()
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault()
          submitted(Object.fromEntries(new FormData(event.currentTarget)))
        }}
      >
        <MuiOtpInput
          autoSubmit
          defaultValue="12"
          length={4}
          name="code"
          validationType="numeric"
        />
        <button type="reset">Reset</button>
      </form>
    )
    const inputs = screen.getAllByRole('textbox')

    // #when
    await userEvent.click(inputs[2])
    await userEvent.keyboard('3')

    // #then
    expect(submitted).not.toHaveBeenCalled()

    // #when
    await userEvent.keyboard('4')

    // #then
    await waitFor(() => {
      return expect(submitted).toHaveBeenLastCalledWith({ code: '1234' })
    })

    // #when
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))

    // #then
    await waitFor(() => {
      return expect(
        inputs
          .map((input) => {
            return (input as HTMLInputElement).value
          })
          .join('')
      ).toBe('12')
    })
  })
})

describe('Base UI field and native forms', () => {
  test('submits one named canonical value and restores its default on form reset', async () => {
    // #given
    const submitted = vi.fn()
    render(
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
          validationType="numeric"
        />
        <button type="submit">Submit</button>
        <button type="reset">Reset</button>
      </form>
    )
    const inputs = screen.getAllByRole('textbox')

    // #when
    await userEvent.type(inputs[2], '3')
    await userEvent.type(inputs[3], '4')
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))

    // #then
    expect(submitted).toHaveBeenLastCalledWith({ code: '1234' })

    // #when
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))

    // #then
    await waitFor(() => {
      return expect(
        inputs
          .map((input) => {
            return (input as HTMLInputElement).value
          })
          .join('')
      ).toBe('12')
    })
  })

  test('exposes error help through the visible field contract', () => {
    // #given / #when
    render(
      <OtpInput
        error
        helperText="The code is incorrect"
        label="Verification code"
        length={4}
      />
    )

    // #then
    expect(screen.getByRole('alert').textContent).toContain(
      'The code is incorrect'
    )
  })
})
