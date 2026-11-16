import React from 'react'
import { useForm } from 'react-hook-form'
import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OtpInputController } from './base-ui-react-hook-form'
import { MuiOtpInputController } from './react-hook-form'
import { OtpInputController as ShadcnOtpInputController } from './shadcn-react-hook-form'

type VerificationForm = { code: string }

function BaseForm({
  Controller = OtpInputController,
  onSubmit
}: {
  Controller?: typeof OtpInputController
  onSubmit: (value: VerificationForm) => void
}) {
  const { control, handleSubmit, reset, setError, setFocus } =
    useForm<VerificationForm>({
      defaultValues: { code: '' }
    })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        control={control}
        label="Verification code"
        length={4}
        name="code"
        rules={{ required: 'Enter the code' }}
      />
      <button type="submit">Submit</button>
      <button
        type="button"
        onClick={() => {
          return reset({ code: '9876' })
        }}
      >
        Reset value
      </button>
      <button
        type="button"
        onClick={() => {
          return setFocus('code')
        }}
      >
        Focus code
      </button>
      <button
        type="button"
        onClick={() => {
          return setError('code', { message: 'The code expired' })
        }}
      >
        Server error
      </button>
    </form>
  )
}

function MuiForm({
  onSubmit
}: {
  onSubmit: (value: VerificationForm) => void
}) {
  const { control, handleSubmit, reset, setError, setFocus } =
    useForm<VerificationForm>({
      defaultValues: { code: '' }
    })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <MuiOtpInputController
        ariaLabel="Verification code"
        control={control}
        length={4}
        name="code"
        rules={{ required: 'Enter the code' }}
      />
      <button type="submit">Submit</button>
      <button
        type="button"
        onClick={() => {
          return reset({ code: '9876' })
        }}
      >
        Reset value
      </button>
      <button
        type="button"
        onClick={() => {
          return setFocus('code')
        }}
      >
        Focus code
      </button>
      <button
        type="button"
        onClick={() => {
          return setError('code', { message: 'The code expired' })
        }}
      >
        Server error
      </button>
    </form>
  )
}

function ShadcnForm(props: { onSubmit: (value: VerificationForm) => void }) {
  return (
    <BaseForm
      {...props}
      Controller={ShadcnOtpInputController as typeof OtpInputController}
    />
  )
}

describe.each([
  ['Base UI', BaseForm],
  ['shadcn single-input', ShadcnForm],
  ['MUI', MuiForm]
] as const)('%s React Hook Form adapter', (_adapter, Form) => {
  test('submits, resets, focuses, and projects server errors through native slots', async () => {
    // #given
    const submitted = vi.fn()
    render(<Form onSubmit={submitted} />)
    const inputs = screen.getAllByRole('textbox')

    // #when
    fireEvent.paste(inputs[0], {
      clipboardData: {
        getData: () => {
          return '1234'
        }
      }
    })
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))

    // #then
    await waitFor(() => {
      return expect(submitted).toHaveBeenLastCalledWith(
        { code: '1234' },
        expect.anything()
      )
    })

    // #when
    await userEvent.click(screen.getByRole('button', { name: 'Reset value' }))

    // #then
    await waitFor(() => {
      return expect(
        inputs
          .map((input) => {
            return (input as HTMLInputElement).value
          })
          .join('')
      ).toBe('9876')
    })

    // #when
    await userEvent.click(screen.getByRole('button', { name: 'Focus code' }))

    // #then
    expect(document.activeElement).toBe(inputs[0])

    // #when
    await userEvent.click(screen.getByRole('button', { name: 'Server error' }))

    // #then
    expect(screen.getByText('The code expired')).toBeTruthy()
    expect(inputs[0].getAttribute('aria-invalid')).toBe('true')
  })
})

describe('shadcn single-input React Hook Form adapter', () => {
  test('binds the one input: validation error, focus on error, and reset', async () => {
    // #given
    const submitted = vi.fn()
    render(<ShadcnForm onSubmit={submitted} />)
    const input = screen.getByRole('textbox', { name: 'Verification code' })
    expect(document.querySelectorAll('input')).toHaveLength(1)

    // #when
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))

    // #then
    expect(await screen.findByText('Enter the code')).toBeTruthy()
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(document.activeElement).toBe(input)
    expect(submitted).not.toHaveBeenCalled()

    // #when
    await userEvent.type(input, '12a34')
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))

    // #then
    await waitFor(() => {
      return expect(submitted).toHaveBeenLastCalledWith(
        { code: '1234' },
        expect.anything()
      )
    })
    expect(input.getAttribute('aria-invalid')).toBeNull()

    // #when
    await userEvent.click(screen.getByRole('button', { name: 'Reset value' }))

    // #then
    await waitFor(() => {
      return expect((input as HTMLInputElement).value).toBe('9876')
    })
    expect(
      [...document.querySelectorAll('[data-slot="input-otp-slot"]')]
        .map((cell) => {
          return cell.textContent
        })
        .join('')
    ).toBe('9876')
  })
})

describe('shadcn single-input completion with React Hook Form', () => {
  function CompleteDefaultForm({
    onComplete
  }: {
    onComplete: (value: string) => void
  }) {
    const { control, reset } = useForm<VerificationForm>({
      defaultValues: { code: '1234' }
    })

    return (
      <form>
        <ShadcnOtpInputController
          control={control}
          label="Verification code"
          length={4}
          name="code"
          onComplete={onComplete}
        />
        <button
          type="button"
          onClick={() => {
            reset()
          }}
        >
          Reset value
        </button>
      </form>
    )
  }

  test('a complete default and a reset to it are no completion, in StrictMode too', async () => {
    // #given
    const onComplete = vi.fn()
    render(
      <React.StrictMode>
        <CompleteDefaultForm onComplete={onComplete} />
      </React.StrictMode>
    )
    const input = screen.getByRole('textbox', { name: 'Verification code' })
    await waitFor(() => {
      return expect((input as HTMLInputElement).value).toBe('1234')
    })

    // #when
    input.focus()
    await userEvent.type(input, '{backspace}', { skipClick: true })
    await waitFor(() => {
      return expect((input as HTMLInputElement).value).toBe('123')
    })
    await userEvent.click(screen.getByRole('button', { name: 'Reset value' }))

    // #then
    await waitFor(() => {
      return expect((input as HTMLInputElement).value).toBe('1234')
    })
    expect(onComplete).not.toHaveBeenCalled()

    // #when a user completes a code
    input.focus()
    await userEvent.type(input, '{backspace}9', { skipClick: true })

    // #then
    await waitFor(() => {
      return expect(onComplete).toHaveBeenCalledWith('1239')
    })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
