---
sidebar_position: 3
---

# TypeScript

All public entrypoints ship strict declarations and are verified with `skipLibCheck: false` from the exact packed tarball.

```tsx
import { MuiOtpInput, type MuiOtpInputProps } from '@wh1teee/mui-otp-input'
import { OtpInput, type OtpInputProps } from '@wh1teee/mui-otp-input/base-ui'
```

Renderer declarations are isolated. Importing MUI types does not require Base UI, and importing Base UI types does not require MUI or Emotion.

React Hook Form field names are constrained to string-valued paths:

```tsx
import { OtpInputController } from '@wh1teee/mui-otp-input/base-ui/react-hook-form'

type Values = {
  verification: {
    code: string
  }
}
;<OtpInputController<Values>
  control={control}
  label="Code"
  length={6}
  name="verification.code"
/>
```
