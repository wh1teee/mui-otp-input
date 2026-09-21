# `@wh1teee/mui-otp-input`

Accessible one-time-code input for React with **independent MUI and Base UI / shadcn renderers** over shared normalization contracts.

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![npm](https://img.shields.io/npm/v/@wh1teee/mui-otp-input/next)](https://www.npmjs.com/package/@wh1teee/mui-otp-input)

The root export remains the MUI component for compatibility with earlier releases of this fork. Base UI, shadcn, headless, and form adapters are explicit subpath exports, so consumers install only the renderer peers they use.

## Choose a renderer

### Material UI

```bash
pnpm add @wh1teee/mui-otp-input @mui/material @emotion/react @emotion/styled react react-dom
```

```tsx
'use client'

import { MuiOtpInput } from '@wh1teee/mui-otp-input'
// Equivalent explicit import:
// import { MuiOtpInput } from '@wh1teee/mui-otp-input/mui'

export function VerificationCode() {
  const [value, setValue] = React.useState('')

  return (
    <MuiOtpInput
      ariaLabel="Verification code"
      length={6}
      value={value}
      onChange={setValue}
      validationType="numeric"
      pastePreprocess="digits-only"
      TextFieldsProps={{ size: 'small' }}
    />
  )
}
```

MUI 7 and MUI 9 are supported. The MUI entrypoint does not import Base UI or React Hook Form.

### Base UI

```bash
pnpm add @wh1teee/mui-otp-input @base-ui/react react react-dom
```

Use the complete accessible field:

```tsx
'use client'

import { OtpInput } from '@wh1teee/mui-otp-input/base-ui'

export function VerificationCode() {
  const [value, setValue] = React.useState('')

  return (
    <OtpInput
      label="Verification code"
      helperText="Enter the six digits from the message."
      length={6}
      name="code"
      value={value}
      onValueChange={setValue}
    />
  )
}
```

Or compose the primitives around an existing design-system field:

```tsx
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from '@wh1teee/mui-otp-input/base-ui'
;<InputOTP length={6} value={value} onValueChange={setValue}>
  <InputOTPGroup>
    {Array.from({ length: 6 }, (_, index) => (
      <InputOTPSlot
        key={index}
        index={index}
        aria-label={`Verification code ${index + 1}/6`}
      />
    ))}
  </InputOTPGroup>
</InputOTP>
```

The first slot should also have a visible `<label>` or an `aria-labelledby` relationship. `OtpInput` configures that automatically.

### shadcn-style skin

The `/shadcn` export uses the same Base UI primitives and public component names. Styling is opt-in and maps only semantic variables; it has no reset and no global selectors.

```tsx
import { OtpInput } from '@wh1teee/mui-otp-input/shadcn'
import '@wh1teee/mui-otp-input/shadcn.css'
;<OtpInput label="Code" length={6} />
```

Override semantic variables in the owning scope:

```css
.verification-scope {
  --background: white;
  --foreground: #171717;
  --input: #d4d4d4;
  --ring: #525252;
  --destructive: #b91c1c;
  --muted-foreground: #737373;
  --radius: 0.5rem;
}
```

### Headless normalization

The headless export has no React, MUI, Emotion, Base UI, or React Hook Form runtime import.

```ts
import {
  isOtpComplete,
  normalizeOtpValue,
  preprocessOtpPaste
} from '@wh1teee/mui-otp-input/headless'

const pasted = preprocessOtpPaste('Your code is 12-34', 'digits-only')
const value = normalizeOtpValue(pasted, {
  length: 4,
  validationType: 'numeric'
})

isOtpComplete(value, 4) // true
```

## React Hook Form

Install `react-hook-form` only when using a form adapter.

```tsx
import { useForm } from 'react-hook-form'
import { OtpInputController } from '@wh1teee/mui-otp-input/base-ui/react-hook-form'

type Values = { code: string }

export function Form() {
  const { control, handleSubmit } = useForm<Values>({
    defaultValues: { code: '' }
  })

  return (
    <form onSubmit={handleSubmit(console.log)}>
      <OtpInputController
        control={control}
        label="Verification code"
        length={6}
        name="code"
        rules={{ required: 'Enter the code' }}
      />
      <button type="submit">Continue</button>
    </form>
  )
}
```

Available adapters:

- `@wh1teee/mui-otp-input/react-hook-form` — MUI `MuiOtpInputController`
- `@wh1teee/mui-otp-input/base-ui/react-hook-form` — Base UI `OtpInputController`
- `@wh1teee/mui-otp-input/shadcn/react-hook-form` — alias of the Base UI form adapter

Both adapters register the first native slot as the field ref, so `setFocus`, reset, server errors, and native form submission retain normal form behavior.

## Shared behavior

All renderers use the same value rules:

- a single canonical string is exposed to the form;
- controlled and uncontrolled values are normalized and clamped to `length`;
- typing, full-code paste, and platform `autocomplete="one-time-code"` replacement are supported;
- focus advances after valid input and redirects clicks on later empty slots to the first empty slot;
- `Backspace`, `Delete`, arrow keys, `Home`, and `End` retain slot navigation;
- only the first slot advertises one-time-code autocomplete; later slots use `off`;
- native named form submission and reset are supported;
- `autoSubmit` is opt-in and defaults to `false`.

For numeric verification codes, use `validationType="numeric"`. The complete Base UI field defaults to numeric behavior. The MUI adapter defaults to `none` to preserve the historical MUI API.

### Fork behavior retained

The maintained MUI adapter keeps the behavior previously shipped by this fork:

- `autoFocus={number}` for delayed focus;
- `transformChar` before character validation;
- `pastePreprocess="none" | "trim" | "digits-only" | function`;
- stable native input refs and no empty-slot focus flicker.

## Exports

| Export                                           | Runtime UI peer                 |
| ------------------------------------------------ | ------------------------------- |
| `@wh1teee/mui-otp-input`                         | MUI + Emotion                   |
| `@wh1teee/mui-otp-input/mui`                     | MUI + Emotion                   |
| `@wh1teee/mui-otp-input/headless`                | none                            |
| `@wh1teee/mui-otp-input/base-ui`                 | Base UI                         |
| `@wh1teee/mui-otp-input/shadcn`                  | Base UI                         |
| `@wh1teee/mui-otp-input/react-hook-form`         | MUI + Emotion + React Hook Form |
| `@wh1teee/mui-otp-input/base-ui/react-hook-form` | Base UI + React Hook Form       |
| `@wh1teee/mui-otp-input/shadcn.css`              | opt-in stylesheet               |

Renderer and form peers are optional at the package level. Missing peers fail only when their corresponding export is imported.

## Migration to v8

This fork is synchronized with upstream v7, including MUI 9 support, while retaining the fork-specific input behavior above.

Existing fork users can keep the root import. Applications that prefer an
explicit renderer boundary may switch to the equivalent `/mui` subpath:

```diff
- import { MuiOtpInput } from '@wh1teee/mui-otp-input'
+ import { MuiOtpInput } from '@wh1teee/mui-otp-input/mui'
```

The v8 prerelease is a major because the maintained fork moved from the older v5 code line to upstream v7 and introduced explicit renderer boundaries. Validate MUI theme overrides and strict TypeScript builds before adopting the stable v8 release.

## Verification

The repository verifies:

- unit behavior and React Hook Form integration;
- Chromium, Firefox, and WebKit typing, paste, autofill replacement, focus, native form, narrow viewport, and automated WCAG checks;
- strict declarations and SSR/runtime execution from the exact packed tarball;
- MUI 7 + React 18 and MUI 9 + React 19 consumers;
- Base UI consumers without MUI/Emotion installed;
- MUI consumers without Base UI installed;
- renderer-isolated bundle closures and scoped shadcn CSS.

Run the full pull-request gate with:

```bash
pnpm ci:pr
```

## License and attribution

MIT. This maintained fork incorporates the original `viclafouch/mui-otp-input` work. See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
