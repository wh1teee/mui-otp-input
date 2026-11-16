# `@wh1teee/mui-otp-input`

[![npm version](https://img.shields.io/npm/v/@wh1teee/mui-otp-input?logo=npm&label=npm&color=cb3837)](https://www.npmjs.com/package/@wh1teee/mui-otp-input)
[![npm downloads](https://img.shields.io/npm/dm/@wh1teee/mui-otp-input?logo=npm&label=downloads)](https://www.npmjs.com/package/@wh1teee/mui-otp-input)
[![CI](https://github.com/wh1teee/mui-otp-input/actions/workflows/ci.yml/badge.svg)](https://github.com/wh1teee/mui-otp-input/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@wh1teee/mui-otp-input)](./LICENSE)
[![docs](https://img.shields.io/badge/docs-mui--otp--input--docs.vercel.app-111)](https://mui-otp-input-docs.vercel.app)

An accessible one-time code input for React. Typing, paste, and SMS autofill
all land in one clean string. Use the Material UI component, the shadcn
field (one real input under drawn cells), the per-cell Base UI field, or the
primitives inside your own design system.

**[Documentation](https://mui-otp-input-docs.vercel.app)** ·
**[Playground](https://mui-otp-input-docs.vercel.app/playground)** ·
**[Migration](https://mui-otp-input-docs.vercel.app/migration)**

## Material UI

```bash
pnpm add @wh1teee/mui-otp-input @mui/material @emotion/react @emotion/styled
```

```tsx
'use client'

import { MuiOtpInput } from '@wh1teee/mui-otp-input'
import { useState } from 'react'

export function VerificationCode() {
  const [code, setCode] = useState('')

  return (
    <MuiOtpInput
      ariaLabel="Verification code"
      length={6}
      value={code}
      onChange={setCode}
      validationType="numeric"
      pastePreprocess="digits-only"
    />
  )
}
```

Material UI 7 and 9, React 18 and 19. The component keeps the API of the
original `mui-one-time-password-input`; the root also accepts Material UI `Box`
props.

## shadcn

```bash
pnpm add @wh1teee/mui-otp-input
```

```tsx
'use client'

import { OtpInput } from '@wh1teee/mui-otp-input/shadcn'
import '@wh1teee/mui-otp-input/shadcn.css'
import { useState } from 'react'

export function VerificationCode() {
  const [code, setCode] = useState('')

  return (
    <OtpInput
      label="Verification code"
      helperText="Enter the six digits we sent to your phone."
      length={6}
      separatorAfter={[2]}
      value={code}
      onValueChange={setCode}
    />
  )
}
```

`/shadcn` renders **one real `<input>`** (`autocomplete="one-time-code"`,
`inputmode` from `validationType`) lying transparent over drawn cells, like
shadcn/ui's InputOTP. SMS autofill, keyboard suggestions, password managers,
WebOTP, screen readers and paste all see a single field; the label names it
and the cells are hidden from assistive technology. The active cell follows
the input's selection, and a click on a cell puts the caret there. It needs no
renderer peer.

The optional stylesheet targets only `data-slot` attributes and reads the
standard shadcn tokens (`--background`, `--input`, `--ring`, `--destructive`,
`--radius`, …). Cells expose `data-active`, `data-filled`, `data-fake-caret`,
`data-invalid` and `data-disabled` for your own styles.

Size the cells with `--input-otp-slot-width` (default `2.5rem`, `2.75rem` on
touch screens), `--input-otp-slot-height` and `--input-otp-gap` (`0.5rem`). A
cell never grows past its width and shrinks, equally with the others, when the
line is narrower than the cells need, so six cells fit a 320px phone.

Event handlers passed to `InputOTP` compose with the internal ones. For
`onPaste`, `onMouseDown`, `onClick` and `onKeyDown` your handler runs first,
and calling `preventDefault()` skips the internal handling. For
`onCompositionStart`, `onCompositionEnd`, `onFocus` and `onBlur` the internal
handling runs first, so your handler sees the committed value. To refuse an
edit, call `details.cancel()` in `onValueChange`; React's `onBeforeInput` is
synthetic and does not see deletions.

The single-input root lays its groups and separators out in one row and a
group shrinks to its cells, so centre the field on the root.

Compose the primitives when your design system owns the field layout. Root
attributes such as `id`, `name`, `aria-*` and event handlers go to the input:

```tsx
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot
} from '@wh1teee/mui-otp-input/shadcn'

export function CodeField() {
  return (
    <>
      <label htmlFor="code">Verification code</label>
      <InputOTP id="code" length={6}>
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
    </>
  )
}
```

For custom cells, `useInputOTPSlot(index)` returns
`{ char, isActive, hasFakeCaret, isFilled, isInvalid }`.

### Completion, clearing and WebOTP

```tsx
'use client'

import {
  type InputOTPHandle,
  OtpInput,
  useWebOtp
} from '@wh1teee/mui-otp-input/shadcn'
import { useRef, useState } from 'react'

export function VerificationCode({
  resend,
  verify
}: {
  resend: () => Promise<void>
  verify: (code: string) => Promise<boolean>
}) {
  const [code, setCode] = useState('')
  const field = useRef<InputOTPHandle>(null)
  // Fills the code from the SMS where the browser supports WebOTP.
  const webOtp = useWebOtp({ length: 6, onCode: setCode })

  return (
    <>
      <OtpInput
        ref={field}
        label="Verification code"
        length={6}
        value={code}
        onValueChange={setCode}
        onComplete={async (value) => {
          if (await verify(value)) {
            // Done: stop listening for the SMS.
            webOtp.abort()
          } else {
            // A wrong code: wipe it and put the caret in the first cell; the
            // SMS can still fill the field.
            field.current?.clear({ focus: true })
          }
        }}
      />
      <button
        type="button"
        onClick={async () => {
          await resend()
          // A new SMS is on its way: listen for it again.
          webOtp.restart()
        }}
      >
        Send a new code
      </button>
    </>
  )
}
```

`onComplete` fires once each time a change makes the value complete: not for
the value present at mount, not when a form reset (or an RHF `reset()`)
returns to that mount value, and not twice for the same value; any other
complete value set from outside (WebOTP, an RHF `reset(values)`) counts.
`autoSubmit` submits the owning form with `requestSubmit()` on the same edge,
so guard the form against a second submit while one is in flight (Enter right
after `autoSubmit` submits again). Full-width digits (`１２３`) become ASCII
digits in the numeric mode, and a pasted message yields the run of exactly
`length` code characters in it. The `ref` handle offers
`clear({ focus })`, `focus()`, `root` and `input`. `useWebOtp` returns
`abort()` and `restart()`; `requestWebOtp` in `/headless` is its React-free
core. WebOTP codes are accepted as digits only.

`mask` draws dots in the cells but hides nothing from assistive technology:
the input stays `type="text"` (so one-time-code autofill keeps working), and a
screen reader still reads the characters.

## Base UI

```bash
pnpm add @wh1teee/mui-otp-input @base-ui/react
```

`/base-ui` exports the same `OtpInput`, `InputOTP*` and `useWebOtp` names with
one `<input>` per cell, built on Base UI's OTP Field. Slots there accept input
props such as `aria-label`.

## React Hook Form

```tsx
import { useForm } from 'react-hook-form'
import { OtpInputController } from '@wh1teee/mui-otp-input/shadcn/react-hook-form'

export function VerifyForm() {
  const { control, handleSubmit } = useForm({ defaultValues: { code: '' } })

  return (
    <form onSubmit={handleSubmit((values) => console.log(values.code))}>
      <OtpInputController
        control={control}
        name="code"
        label="Verification code"
        length={6}
        rules={{
          validate: (value) => value.length === 6 || 'Enter all six digits'
        }}
      />
      <button type="submit">Verify</button>
    </form>
  )
}
```

Use `/base-ui/react-hook-form` with the per-cell field and
`MuiOtpInputController` from `/mui/react-hook-form` with Material UI. Every
controller registers the input (the first slot for per-cell fields) as the
field ref, so focus on error, `reset`, and server errors behave like any other
input.

## Entrypoints

| Import                           | Provides                     | Peers                     |
| -------------------------------- | ---------------------------- | ------------------------- |
| `@wh1teee/mui-otp-input`, `/mui` | `MuiOtpInput`                | MUI + Emotion             |
| `/shadcn`                        | Single-input field and parts | none                      |
| `/base-ui`                       | Per-cell field and parts     | Base UI                   |
| `/shadcn.css`                    | Optional skin                | none                      |
| `/headless`                      | Normalization, WebOTP        | none                      |
| `/mui/react-hook-form`           | `MuiOtpInputController`      | MUI + React Hook Form     |
| `/shadcn/react-hook-form`        | `OtpInputController`         | React Hook Form           |
| `/base-ui/react-hook-form`       | `OtpInputController`         | Base UI + React Hook Form |

Renderer and form peers are optional; a missing peer fails only when its
entrypoint is imported. Every entrypoint is size-budgeted and checked from the
exact tarball in isolated MUI 7, MUI 9, Base UI–only, shadcn-only (no Base
UI) and Next.js 16 consumers. Upgrading from 8.x: see
[docs/releases/9.0.0.md](./docs/releases/9.0.0.md).

## Development

```bash
pnpm install
pnpm build
pnpm --dir site dev   # documentation site
pnpm ci:pr            # the full pull-request gate
```

## License

MIT. This project continues
[viclafouch/mui-otp-input](https://github.com/viclafouch/mui-otp-input); see
[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
