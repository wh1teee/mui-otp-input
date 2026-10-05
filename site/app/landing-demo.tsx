'use client'

import { MuiOtpInput } from '@wh1teee/mui-otp-input'
import { OtpInput } from '@wh1teee/mui-otp-input/shadcn'
import '@wh1teee/mui-otp-input/shadcn.css'
import { useState } from 'react'

import { CopyButton } from './copy-button'

type Renderer = 'mui' | 'shadcn'

const LENGTH = 6
const SAMPLE_MESSAGE = 'Your verification code is 482-913'

export function LandingDemo() {
  const [renderer, setRenderer] = useState<Renderer>('mui')
  const [value, setValue] = useState('')
  const complete = value.length === LENGTH

  return (
    <section className="landing-demo" aria-label="Live one-time code demo">
      <fieldset className="landing-demo-switch" data-active={renderer}>
        <legend className="docs-visually-hidden">Renderer</legend>
        {/* One thumb slides between options instead of two backgrounds swapping. */}
        <span aria-hidden="true" className="landing-demo-thumb" />
        {(
          [
            ['mui', 'Material UI'],
            ['shadcn', 'shadcn / Base UI']
          ] as const
        ).map(([key, label]) => (
          <button
            aria-pressed={renderer === key}
            key={key}
            onClick={() => setRenderer(key)}
            type="button"
          >
            {label}
          </button>
        ))}
      </fieldset>
      <div className="landing-demo-field" data-complete={complete || undefined}>
        {renderer === 'mui' ? (
          <MuiOtpInput
            ariaLabel="Verification code"
            data-testid="landing-mui-otp"
            length={LENGTH}
            onChange={setValue}
            pastePreprocess="digits-only"
            sx={{ gap: 1 }}
            validationType="numeric"
            value={value}
          />
        ) : (
          <OtpInput
            data-testid="landing-shadcn-otp"
            label="Verification code"
            length={LENGTH}
            onValueChange={setValue}
            pastePreprocess="digits-only"
            separatorAfter={[2]}
            value={value}
          />
        )}
      </div>
      <dl className="landing-demo-value">
        <dt>Value</dt>
        <dd>
          <output
            data-empty={value === '' || undefined}
            data-testid="landing-otp-value"
          >
            {value === '' ? 'empty' : value}
          </output>
          <span
            className="landing-demo-status"
            data-complete={complete || undefined}
          >
            {complete ? 'Complete' : `${value.length} / ${LENGTH}`}
          </span>
        </dd>
      </dl>
      <div className="landing-demo-sample">
        <p>
          Paste a whole message — only the digits land.
          <span className="landing-demo-sms">{SAMPLE_MESSAGE}</span>
        </p>
        <CopyButton label="Copy sample message" text={SAMPLE_MESSAGE} />
      </div>
    </section>
  )
}
