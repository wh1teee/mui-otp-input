'use client'

import Button from '@mui/material/Button'
import { OtpInputController } from '@wh1teee/mui-otp-input/shadcn/react-hook-form'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

type Values = { code: string }

const EXPECTED_CODE = '424242'

export function FormExample() {
  const [verified, setVerified] = useState<string | null>(null)
  const { control, handleSubmit, reset, setError } = useForm<Values>({
    defaultValues: { code: '' }
  })

  return (
    <section
      className="docs-section playground-form"
      aria-labelledby="form-example-title"
    >
      <h2 id="form-example-title">With React Hook Form</h2>
      <p>
        Submit an incomplete code to see focus move back to the field, or a
        wrong one to see a server-style error. The right code is{' '}
        <code>{EXPECTED_CODE}</code>.
      </p>
      <form
        className="playground-form-body"
        noValidate
        onSubmit={handleSubmit(({ code }) => {
          // Stands in for a verification request.
          if (code !== EXPECTED_CODE) {
            setError(
              'code',
              { message: 'That code is not valid.' },
              { shouldFocus: true }
            )
            setVerified(null)
            return
          }
          setVerified(code)
        })}
      >
        <OtpInputController
          control={control}
          label="Verification code"
          length={6}
          name="code"
          rules={{
            validate: (value) => value.length === 6 || 'Enter all six digits.'
          }}
          separatorAfter={[2]}
        />
        <div className="playground-form-actions">
          <Button type="submit" variant="contained">
            Verify
          </Button>
          <Button
            onClick={() => {
              reset()
              setVerified(null)
            }}
            type="button"
          >
            Reset
          </Button>
        </div>
        <output aria-live="polite" data-testid="form-result">
          {verified ? `Verified ${verified}` : ''}
        </output>
      </form>
    </section>
  )
}
