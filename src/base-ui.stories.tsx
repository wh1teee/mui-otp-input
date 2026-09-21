import React from 'react'
import type { Meta, StoryFn } from '@storybook/react-vite'
import { OtpInput } from './base-ui'
import './shadcn.css'

export default {
  title: 'OtpInput/Base UI',
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
        value={value}
      />
    </div>
  )
}
