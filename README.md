# `@wh1teee/mui-otp-input`

[![npm version](https://img.shields.io/npm/v/@wh1teee/mui-otp-input?logo=npm&label=npm&color=cb3837)](https://www.npmjs.com/package/@wh1teee/mui-otp-input)
[![npm downloads](https://img.shields.io/npm/dm/@wh1teee/mui-otp-input?logo=npm&label=downloads)](https://www.npmjs.com/package/@wh1teee/mui-otp-input)
[![CI](https://github.com/wh1teee/mui-otp-input/actions/workflows/ci.yml/badge.svg)](https://github.com/wh1teee/mui-otp-input/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@wh1teee/mui-otp-input)](./LICENSE)
[![docs](https://img.shields.io/badge/docs-mui--otp--input--docs.vercel.app-111)](https://mui-otp-input-docs.vercel.app)

An accessible one-time code input for React. Typing, paste, and SMS autofill
all land in one clean string. Use the Material UI component, the
shadcn-styled Base UI field, or the primitives inside your own design system.

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

## Base UI and shadcn

```bash
pnpm add @wh1teee/mui-otp-input @base-ui/react
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

`/shadcn` is the same component as `/base-ui` under shadcn naming. The optional
stylesheet targets only `data-slot` attributes and reads the standard shadcn
tokens (`--background`, `--input`, `--ring`, `--destructive`, `--radius`, …).
Neither entrypoint loads Material UI or Emotion.

Compose the primitives when your design system owns the field layout:

```tsx
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from '@wh1teee/mui-otp-input/shadcn'

export function CodeField() {
  return (
    <>
      <label htmlFor="code">Verification code</label>
      <InputOTP id="code" length={4}>
        <InputOTPGroup>
          {[0, 1, 2, 3].map((index) => (
            <InputOTPSlot
              key={index}
              index={index}
              aria-label={`Digit ${index + 1} of 4`}
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </>
  )
}
```

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

For Material UI, use `MuiOtpInputController` from `/mui/react-hook-form`. Both
controllers register the first slot as the field ref, so focus on error,
`reset`, and server errors behave like any other input.

## Entrypoints

| Import                                                | Provides                     | Peers                     |
| ----------------------------------------------------- | ---------------------------- | ------------------------- |
| `@wh1teee/mui-otp-input`, `/mui`                      | `MuiOtpInput`                | MUI + Emotion             |
| `/base-ui`, `/shadcn`                                 | `OtpInput`, `InputOTP` parts | Base UI                   |
| `/shadcn.css`                                         | Optional skin                | none                      |
| `/headless`                                           | Normalization helpers        | none                      |
| `/mui/react-hook-form`                                | `MuiOtpInputController`      | MUI + React Hook Form     |
| `/base-ui/react-hook-form`, `/shadcn/react-hook-form` | `OtpInputController`         | Base UI + React Hook Form |

Renderer and form peers are optional; a missing peer fails only when its
entrypoint is imported. Every entrypoint is size-budgeted and checked from the
exact tarball in isolated MUI 7, MUI 9, Base UI–only, and Next.js 16 consumers.

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
