'use client'

import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { MuiOtpInput } from '@wh1teee/mui-otp-input'
import type {
  OtpValidationType,
  PastePreprocess
} from '@wh1teee/mui-otp-input/headless'
import { OtpInput } from '@wh1teee/mui-otp-input/shadcn'
import '@wh1teee/mui-otp-input/shadcn.css'
import { type ReactNode, useState } from 'react'

import { CodeBlock } from '../docs-ui'

type Renderer = 'mui' | 'shadcn'
type BuiltInPaste = Exclude<PastePreprocess, (value: string) => string>

export type Config = {
  renderer: Renderer
  length: number
  validationType: OtpValidationType
  pastePreprocess: BuiltInPaste
  upperCase: boolean
  split: boolean
  mask: boolean
  disabled: boolean
  error: boolean
}

export const DEFAULT_CONFIG: Config = {
  disabled: false,
  error: false,
  length: 6,
  mask: false,
  pastePreprocess: 'digits-only',
  renderer: 'mui',
  split: true,
  upperCase: false,
  validationType: 'numeric'
}

const LENGTHS = [4, 5, 6, 8] as const

const HELPER_TEXT = 'Enter the code we sent you.'
const ERROR_TEXT = 'That code is not valid.'

/** Generated source mirrors exactly what the preview renders. */
export function generateCode(config: Config): string {
  const isMui = config.renderer === 'mui'
  const props: string[] = []
  if (isMui) props.push('ariaLabel="Verification code"')
  else props.push('label="Verification code"')
  if (!isMui) {
    props.push(`helperText="${config.error ? ERROR_TEXT : HELPER_TEXT}"`)
  }
  props.push(`length={${config.length}}`)
  props.push('value={code}')
  props.push(isMui ? 'onChange={setCode}' : 'onValueChange={setCode}')
  // Each renderer has its own default policy; only emit what differs.
  const defaultValidation = isMui ? 'none' : 'numeric'
  if (config.validationType !== defaultValidation) {
    props.push(`validationType="${config.validationType}"`)
  }
  if (config.upperCase) {
    props.push('transformChar={(character) => character.toUpperCase()}')
  }
  if (config.pastePreprocess !== 'none') {
    props.push(`pastePreprocess="${config.pastePreprocess}"`)
  }
  const middle = Math.ceil(config.length / 2) - 1
  if (isMui) {
    // One TextFieldsProps carries both the gap and the error flag.
    const error = config.error ? 'error: true, ' : ''
    if (config.split) {
      props.push(
        `TextFieldsProps={(index) => ({ ${error}sx: index === ${middle} ? { mr: 2 } : undefined })}`
      )
    } else if (config.error) {
      props.push('TextFieldsProps={{ error: true }}')
    }
    if (config.mask) props.push('mask')
  } else {
    if (config.split) props.push(`separatorAfter={[${middle}]}`)
    if (config.mask) props.push("slotProps={{ type: 'password' }}")
    if (config.error) props.push('error')
  }
  if (config.disabled) props.push('disabled')

  const component = isMui ? 'MuiOtpInput' : 'OtpInput'
  const imports = isMui
    ? "import { MuiOtpInput } from '@wh1teee/mui-otp-input';"
    : "import { OtpInput } from '@wh1teee/mui-otp-input/shadcn';\nimport '@wh1teee/mui-otp-input/shadcn.css';"

  return `'use client';

${imports}
import { useState } from 'react';

export function VerificationCode() {
  const [code, setCode] = useState('');

  return (
    <${component}
${props.map((prop) => `      ${prop}`).join('\n')}
    />
  );
}`
}

function Group({ children, legend }: { children: ReactNode; legend: string }) {
  return (
    <fieldset className="configurator-group">
      <legend>{legend}</legend>
      <Stack spacing={1.5}>{children}</Stack>
    </fieldset>
  )
}

function Toggle({
  checked,
  label,
  onChange
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <FormControlLabel
      control={
        <Switch
          checked={checked}
          onChange={(_event, value) => onChange(value)}
        />
      }
      label={label}
    />
  )
}

export function Configurator() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [code, setCode] = useState('')
  const [completions, setCompletions] = useState(0)
  const [lastRejected, setLastRejected] = useState<string | null>(null)

  const update = <Key extends keyof Config>(key: Key, value: Config[Key]) => {
    setConfig((current) => ({ ...current, [key]: value }))
    // A new policy may not accept the old value; start the preview clean.
    if (key !== 'error' && key !== 'disabled') setCode('')
  }

  const isMui = config.renderer === 'mui'
  const middle = Math.ceil(config.length / 2) - 1
  const transformChar = config.upperCase
    ? (character: string) => character.toUpperCase()
    : undefined
  const handleComplete = () => setCompletions((count) => count + 1)

  const preview = isMui ? (
    <MuiOtpInput
      ariaLabel="Verification code"
      data-testid="config-mui-otp"
      disabled={config.disabled}
      key={`${config.renderer}-${config.length}`}
      length={config.length}
      mask={config.mask}
      onChange={setCode}
      onComplete={handleComplete}
      onInvalid={(attempt) => setLastRejected(attempt)}
      pastePreprocess={config.pastePreprocess}
      TextFieldsProps={(index) => ({
        error: config.error,
        sx: config.split && index === middle ? { mr: 2 } : undefined
      })}
      transformChar={transformChar}
      validationType={config.validationType}
      value={code}
    />
  ) : (
    <OtpInput
      data-testid="config-shadcn-otp"
      disabled={config.disabled}
      error={config.error}
      helperText={config.error ? ERROR_TEXT : HELPER_TEXT}
      key={`${config.renderer}-${config.length}`}
      label="Verification code"
      length={config.length}
      onValueChange={setCode}
      onValueComplete={handleComplete}
      onValueInvalid={(attempt) => setLastRejected(attempt)}
      pastePreprocess={config.pastePreprocess}
      separatorAfter={config.split ? [middle] : []}
      slotProps={config.mask ? { type: 'password' } : undefined}
      transformChar={transformChar}
      validationType={config.validationType}
      value={code}
    />
  )

  return (
    <section className="configurator" aria-labelledby="configurator-title">
      <div className="configurator-heading">
        <div>
          <h2 id="configurator-title">Configurator</h2>
          <p>
            Every control maps to a prop, and the generated code matches the
            preview.
          </p>
        </div>
      </div>

      <div className="configurator-layout">
        <aside className="configurator-controls" aria-label="OTP input options">
          <Group legend="Renderer">
            <ToggleButtonGroup
              aria-label="Renderer"
              exclusive
              fullWidth
              onChange={(_event, value: Renderer | null) => {
                if (value) update('renderer', value)
              }}
              size="small"
              value={config.renderer}
            >
              <ToggleButton value="mui">Material UI</ToggleButton>
              <ToggleButton value="shadcn">shadcn / Base UI</ToggleButton>
            </ToggleButtonGroup>
          </Group>

          <Group legend="Code">
            <TextField
              label="Length"
              onChange={(event) => update('length', Number(event.target.value))}
              select
              size="small"
              value={config.length}
            >
              {LENGTHS.map((length) => (
                <MenuItem key={length} value={length}>
                  {length} characters
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Allowed characters"
              onChange={(event) =>
                update(
                  'validationType',
                  event.target.value as OtpValidationType
                )
              }
              select
              size="small"
              value={config.validationType}
            >
              <MenuItem value="numeric">Digits</MenuItem>
              <MenuItem value="alphanumeric">Letters and digits</MenuItem>
              <MenuItem value="none">Anything</MenuItem>
            </TextField>
            <TextField
              label="Paste cleanup"
              onChange={(event) =>
                update('pastePreprocess', event.target.value as BuiltInPaste)
              }
              select
              size="small"
              value={config.pastePreprocess}
            >
              <MenuItem value="digits-only">Keep digits only</MenuItem>
              <MenuItem value="trim">Trim whitespace</MenuItem>
              <MenuItem value="none">None</MenuItem>
            </TextField>
            <Toggle
              checked={config.upperCase}
              label="Upper-case letters"
              onChange={(value) => update('upperCase', value)}
            />
          </Group>

          <Group legend="Presentation">
            <Toggle
              checked={config.split}
              label="Split into two groups"
              onChange={(value) => update('split', value)}
            />
            <Toggle
              checked={config.mask}
              label="Mask characters"
              onChange={(value) => update('mask', value)}
            />
            <Toggle
              checked={config.error}
              label="Error state"
              onChange={(value) => update('error', value)}
            />
            <Toggle
              checked={config.disabled}
              label="Disabled"
              onChange={(value) => update('disabled', value)}
            />
          </Group>
        </aside>

        <div className="configurator-result">
          <Paper className="configurator-preview" variant="outlined">
            <div className="configurator-preview-topline">
              <Typography component="h3" variant="h6">
                Live result
              </Typography>
              <span className="configurator-preset-label">
                {isMui ? 'Material UI' : 'shadcn / Base UI'}
              </span>
            </div>
            <div className="configurator-otp-stage" data-testid="config-stage">
              {preview}
            </div>
            <section
              aria-labelledby="configurator-inspector-title"
              className="configurator-inspector"
            >
              <h4
                className="docs-visually-hidden"
                id="configurator-inspector-title"
              >
                Live state
              </h4>
              <div>
                <span>Value</span>
                <output
                  data-empty={code === '' || undefined}
                  data-testid="config-value"
                >
                  {code === '' ? 'empty' : code}
                </output>
              </div>
              <div>
                <span>Complete</span>
                <output data-testid="config-complete">
                  {code.length === config.length ? 'yes' : 'no'}
                </output>
              </div>
              <div>
                <span>Completions</span>
                <output data-testid="config-completions">{completions}</output>
              </div>
              <div>
                <span>Last rejected input</span>
                <output data-testid="config-rejected">
                  {lastRejected === null ? 'none' : `"${lastRejected}"`}
                </output>
              </div>
            </section>
          </Paper>

          <div data-testid="generated-code">
            <CodeBlock title="VerificationCode.tsx">
              {generateCode(config)}
            </CodeBlock>
          </div>
        </div>
      </div>
    </section>
  )
}
