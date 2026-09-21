---
sidebar_position: 7
---

# React Hook Form

The package supplies typed adapters instead of requiring every application to repeat `Controller` wiring.

## Base UI / shadcn

```tsx
import { useForm } from 'react-hook-form'
import { OtpInputController } from '@wh1teee/mui-otp-input/base-ui/react-hook-form'

type Values = { code: string }

export function VerificationForm() {
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
        rules={{
          required: 'Enter the code',
          validate: (value) => value.length === 6 || 'Enter all six digits'
        }}
      />
      <button type="submit">Continue</button>
    </form>
  )
}
```

The shadcn form export is an alias:

```ts
import { OtpInputController } from '@wh1teee/mui-otp-input/shadcn/react-hook-form'
```

## MUI

```tsx
import { MuiOtpInputController } from '@wh1teee/mui-otp-input/react-hook-form'
;<MuiOtpInputController
  ariaLabel="Verification code"
  control={control}
  length={6}
  name="code"
  rules={{ required: 'Enter the code' }}
  validationType="numeric"
/>
```

Both adapters expose the first native slot as the field ref. React Hook Form `setFocus`, reset, field disabling, touched state, and server errors therefore retain normal behavior.
