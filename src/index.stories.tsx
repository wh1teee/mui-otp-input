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

export const WithTransform: StoryFn<typeof MuiOtpInput> = () => {
  const [value, setValue] = React.useState<string>('')

  const handleChange = (newValue: string) => {
    setValue(newValue)
    action('onChange')(newValue)
  }

  const handleComplete = (finalValue: string) => {
    action('onComplete')(finalValue)
  }

  return (
    <ThemeProvider theme={theme}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          padding: '20px'
        }}
      >
        <div>
          <h3>Character Transformation Example</h3>
          <p style={{ fontSize: '14px', color: '#666' }}>
            This example automatically converts lowercase letters to uppercase.
            Try typing lowercase letters - they will be converted to uppercase
            automatically.
          </p>
        </div>

        <MuiOtpInput
          length={6}
          sx={{ width: 400 }}
          gap={1}
          value={value}
          onChange={handleChange}
          onComplete={handleComplete}
          transformChar={(char) => {
            return char.toUpperCase()
          }}
          validateChar={(char) => {
            return /[A-Z0-9]/.test(char)
          }}
          TextFieldsProps={{
            placeholder: '·',
            helperText: 'Auto-converts to uppercase (accepts A-Z, 0-9)'
          }}
        />

        <div style={{ fontSize: '14px' }}>
          Current value: &quot;{value}&quot; (length: {value.length})
        </div>

        <button
          type="button"
          onClick={() => {
            return setValue('')
          }}
        >
          Clear
        </button>
      </div>
    </ThemeProvider>
  )
}

export const Primary: StoryFn<typeof MuiOtpInput> = () => {
  const [value, setValue] = React.useState<string>('')
  const [pasteMode, setPasteMode] = React.useState<
    'none' | 'trim' | 'digits-only'
  >('digits-only')

  const handleChange = (newValue: string) => {
    setValue(newValue)
    action('onChange')(newValue)
  }

  const handleComplete = (finalValue: string) => {
    action('onComplete')(finalValue)
  }

  return (
    <ThemeProvider theme={theme}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          padding: '20px'
        }}
      >
        <div>
          <h3>Test Paste Preprocessing</h3>
          <div style={{ marginBottom: '10px' }}>
            <label>
              Paste Preprocess Mode:
              <select
                value={pasteMode}
                onChange={(e) => {
                  return setPasteMode(e.target.value as any)
                }}
                style={{ marginLeft: '10px' }}
              >
                <option value="none">none (original behavior)</option>
                <option value="trim">trim (remove edge spaces)</option>
                <option value="digits-only">
                  digits-only (keep only digits)
                </option>
              </select>
            </label>
          </div>
          <div
            style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}
          >
            Try copying and pasting these values:
            <ul>
              <li>&quot; 123456 &quot; (with spaces)</li>
              <li>&quot;12 34 56&quot; (spaces inside)</li>
              <li>&quot;Code: 123-456&quot; (with extra characters)</li>
            </ul>
          </div>
        </div>

        <MuiOtpInput
          length={6}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          sx={{ width: 400 }}
          gap={1}
          onComplete={handleComplete}
          pastePreprocess={pasteMode}
          TextFieldsProps={{
            type: 'text',
            size: 'medium'
          }}
          value={value}
          onChange={handleChange}
        />

        <div style={{ fontSize: '14px' }}>
          Current value: &quot;{value}&quot; (length: {value.length})
        </div>

        <button
          type="button"
          onClick={() => {
            return setValue('')
          }}
        >
          Clear
        </button>
      </div>
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
