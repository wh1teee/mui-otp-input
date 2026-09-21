import React from 'react'
import { useForm } from 'react-hook-form'
import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OtpInputController } from './base-ui-react-hook-form'
import { MuiOtpInputController } from './react-hook-form'

type VerificationForm = { code: string }

function BaseForm({
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
      <OtpInputController
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

describe.each([
  ['Base UI', BaseForm],
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
