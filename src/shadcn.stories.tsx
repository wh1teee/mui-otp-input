import React from 'react'
import type { Meta, StoryFn } from '@storybook/react-vite'
import {
  InputOTP,
  type InputOTPHandle,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  OtpInput
} from './shadcn'
import './shadcn.css'

export default {
  title: 'OtpInput/shadcn',
  component: OtpInput
} as Meta<typeof OtpInput>

export const NumericCode: StoryFn<typeof OtpInput> = () => {
  const [value, setValue] = React.useState('')

  return (
    <div style={{ maxWidth: 420 }}>
      <OtpInput
        helperText="Enter the six digits from the message."
        label="Verification code"
        length={6}
        onValueChange={setValue}
        separatorAfter={[2]}
        value={value}
      />
    </div>
  )
}

export const Primitives: StoryFn<typeof InputOTP> = () => {
  return (
    <div style={{ maxWidth: 420 }}>
      <label htmlFor="story-code">Verification code</label>
      <InputOTP id="story-code" length={6}>
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

/** A wrong code is wiped and the caret returns to the first cell. */
export const ClearOnWrongCode: StoryFn<typeof OtpInput> = () => {
  const field = React.useRef<InputOTPHandle>(null)
  const [error, setError] = React.useState(false)

  return (
    <div style={{ maxWidth: 420 }}>
      <OtpInput
        ref={field}
        error={error}
        helperText={error ? 'That code is not valid.' : 'Try 424242.'}
        label="Verification code"
        length={6}
        onComplete={(value) => {
          const wrong = value !== '424242'
          setError(wrong)
          if (wrong) {
            field.current?.clear({ focus: true })
          }
        }}
      />
    </div>
  )
}
