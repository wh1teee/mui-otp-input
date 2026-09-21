---
sidebar_position: 1
---

# Getting started

`@wh1teee/mui-otp-input` exposes independent MUI and Base UI renderers. Install the package and only the peer dependencies for the renderer you use.

## Material UI

```bash
pnpm add @wh1teee/mui-otp-input @mui/material @emotion/react @emotion/styled react react-dom
```

```tsx
import { MuiOtpInput } from '@wh1teee/mui-otp-input'

export function CodeField() {
  const [value, setValue] = React.useState('')

  return (
    <MuiOtpInput
      ariaLabel="Verification code"
      length={6}
      value={value}
      onChange={setValue}
      validationType="numeric"
      pastePreprocess="digits-only"
    />
  )
}
```

The explicit `/mui` import is equivalent to the root import. MUI 7 and MUI 9 are supported.

## Base UI

```bash
pnpm add @wh1teee/mui-otp-input @base-ui/react react react-dom
```

```tsx
import { OtpInput } from '@wh1teee/mui-otp-input/base-ui'
;<OtpInput
  label="Verification code"
  helperText="Enter the six digits from the message."
  length={6}
  name="code"
/>
```

Use `InputOTP`, `InputOTPGroup`, `InputOTPSlot`, and `InputOTPSeparator` when an application already owns its field label, help text, and validation layout.

## shadcn-style skin

```tsx
import { OtpInput } from '@wh1teee/mui-otp-input/shadcn'
import '@wh1teee/mui-otp-input/shadcn.css'
```

The stylesheet is opt-in, has no global reset, and uses semantic variables such as `--background`, `--foreground`, `--input`, `--ring`, `--destructive`, `--muted-foreground`, and `--radius`.

## Client components and SSR

UI entrypoints emit the `"use client"` directive and can be server-rendered. The package is ESM and does not need `transpilePackages`, `serverExternalPackages`, or experimental `optimizePackageImports` configuration. The exact tarball is production-built and server-rendered in a Next.js 16 App Router consumer.

The `/headless` export is UI-independent and safe to import from neutral/server code when only value normalization is required.

## TypeScript 7

This package's declarations and examples are checked with TypeScript 7.0.2.
The repository also installs Microsoft's official TypeScript 6 compatibility
package only for tools that embed the compiler API; application type-checking
continues to use the native TypeScript 7 `tsc` binary.
