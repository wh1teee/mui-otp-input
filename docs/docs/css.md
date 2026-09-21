---
sidebar_position: 5
---

# Styling

## MUI

`MuiOtpInput` accepts MUI `Box` props on the root and `TextFieldsProps` for each slot.

```tsx
<MuiOtpInput
  sx={{ gap: 1, maxWidth: 420 }}
  TextFieldsProps={(index) => ({
    size: 'small',
    sx: { flex: '1 1 0', minWidth: 0 },
    placeholder: String(index + 1)
  })}
/>
```

Stable global classes remain available for existing theme overrides:

| Class                        | Element                                                |
| ---------------------------- | ------------------------------------------------------ |
| `.MuiOtpInput-Box`           | Root MUI `Box`                                         |
| `.MuiOtpInput-TextField`     | Every MUI `TextField`                                  |
| `.MuiOtpInput-TextField-{n}` | One-based slot, for example `.MuiOtpInput-TextField-3` |

## Base UI

Base UI parts expose semantic `data-slot` attributes:

- `input-otp`
- `input-otp-group`
- `input-otp-slot`
- `input-otp-separator`
- `otp-field`
- `otp-field-label`
- `otp-field-description`

Use `classNames` and `slotProps` on `OtpInput`, or attach classes directly to the primitives.

```tsx
<OtpInput
  classNames={{
    root: 'verification-field',
    group: 'verification-slots',
    slot: 'verification-slot'
  }}
  label="Code"
  length={6}
/>
```

## Optional shadcn skin

```tsx
import '@wh1teee/mui-otp-input/shadcn.css'
```

The stylesheet is scoped to the package's `data-slot` attributes and reads semantic variables. It does not define root tokens, import fonts, reset elements, or use remote assets.
