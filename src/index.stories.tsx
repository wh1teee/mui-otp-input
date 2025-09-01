import React from 'react'
import { createTheme, ThemeProvider } from '@mui/material'
import { action } from '@storybook/addon-actions'
import type { Meta, StoryFn } from '@storybook/react'
import { MuiOtpInput } from './index'

export default {
  title: 'MuiOtpInput',
  component: MuiOtpInput
} as Meta<typeof MuiOtpInput>

const theme = createTheme()

export const Primary: StoryFn<typeof MuiOtpInput> = () => {
  const [value, setValue] = React.useState<string>('123456')

  const handleChange = (newValue: string) => {
    setValue(newValue)
  }

  const handleComplete = (finalValue: string) => {
    action('onCompete')(finalValue)
  }

  return (
    <ThemeProvider theme={theme}>
      <MuiOtpInput
        length={5}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        sx={{ width: 300 }}
        gap={1}
        onComplete={handleComplete}
        TextFieldsProps={(index: number) => {
          return {
            type: 'text',
            size: 'medium',
            placeholder: String(index)
          }
        }}
        value={value}
        onChange={handleChange}
      />
    </ThemeProvider>
  )
}

export const DelayedAutoFocus: StoryFn<typeof MuiOtpInput> = () => {
  const [value, setValue] = React.useState<string>('')

  const handleChange = (newValue: string) => {
    setValue(newValue)
  }

  const handleComplete = (finalValue: string) => {
    action('onComplete')(finalValue)
  }

  return (
    <ThemeProvider theme={theme}>
      <div>
        <p style={{ marginBottom: 16 }}>
          This input will focus automatically after 200ms delay
        </p>
        <MuiOtpInput
          length={6}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={200}
          sx={{ width: 350 }}
          gap={1}
          onComplete={handleComplete}
          value={value}
          onChange={handleChange}
        />
      </div>
    </ThemeProvider>
  )
}

export const NoAutoFocus: StoryFn<typeof MuiOtpInput> = () => {
  const [value, setValue] = React.useState<string>('')

  const handleChange = (newValue: string) => {
    setValue(newValue)
  }

  const handleComplete = (finalValue: string) => {
    action('onComplete')(finalValue)
  }

  return (
    <ThemeProvider theme={theme}>
      <div>
        <p style={{ marginBottom: 16 }}>This input has no autofocus</p>
        <MuiOtpInput
          length={4}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={false}
          sx={{ width: 250 }}
          gap={1}
          onComplete={handleComplete}
          value={value}
          onChange={handleChange}
        />
      </div>
    </ThemeProvider>
  )
}
