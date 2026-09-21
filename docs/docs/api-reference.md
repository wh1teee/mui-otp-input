---
sidebar_position: 2
---

# API reference

## MUI: `MuiOtpInput`

Import from the package root or `/mui`.

```tsx
import { MuiOtpInput } from '@wh1teee/mui-otp-input'
```

The component inherits MUI `Box` props. `TextFieldsProps` accepts either shared `TextField` props or a function returning props for each slot.

| Prop                                 | Type                                            | Default      | Purpose                                              |
| ------------------------------------ | ----------------------------------------------- | ------------ | ---------------------------------------------------- |
| `value`                              | `string`                                        | uncontrolled | Controlled canonical value                           |
| `defaultValue`                       | `string`                                        | `''`         | Initial uncontrolled value                           |
| `onChange`                           | `(value: string) => void`                       | —            | Called after canonical value changes                 |
| `length`                             | `number`                                        | `4`          | Number of slots and maximum value length             |
| `onComplete`                         | `(value: string) => void`                       | —            | Called when all slots become filled                  |
| `onBlur`                             | `(value, complete) => void`                     | —            | Called when focus leaves the whole field             |
| `autoFocus`                          | `boolean \| number`                             | `false`      | Immediate or delayed first-slot focus                |
| `validationType`                     | `'none' \| 'numeric' \| 'alphanumeric'`         | `'none'`     | Built-in character policy                            |
| `transformChar`                      | `(character, index) => string`                  | —            | Transform before validation                          |
| `validateChar`                       | `(character, index) => boolean`                 | —            | Additional per-character policy                      |
| `pastePreprocess`                    | `'none' \| 'trim' \| 'digits-only' \| function` | `'none'`     | Normalize paste/autofill text before character rules |
| `TextFieldsProps`                    | object or `(index) => object`                   | —            | MUI slot customization                               |
| `slotAriaLabel`                      | `(index, length) => string`                     | generated    | Localized slot names                                 |
| `inputRef`                           | `Ref<HTMLInputElement>`                         | —            | First native slot ref                                |
| `name` / `form`                      | string                                          | —            | Native form submission association                   |
| `autoSubmit`                         | boolean                                         | `false`      | Request owning form submit after completion          |
| `disabled` / `readOnly` / `required` | boolean                                         | `false`      | Native field state                                   |

For numeric codes:

```tsx
<MuiOtpInput
  length={6}
  validationType="numeric"
  pastePreprocess="digits-only"
  TextFieldsProps={(index) => ({
    size: 'small',
    placeholder: String(index + 1)
  })}
/>
```

## Base UI primitives

```tsx
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
  OtpInput
} from '@wh1teee/mui-otp-input/base-ui'
```

`InputOTP` extends Base UI `OTPField.Root` and adds the shared fork behavior: delayed autofocus, `transformChar`, `validateChar`, and `pastePreprocess`.

`InputOTPSlot` extends Base UI `OTPField.Input` and requires an `index`.

`OtpInput` composes a visible label, slots, optional separators, help/error text, native form semantics, and generated accessible slot names. Its useful additional props are:

| Prop             | Type                          | Purpose                                                          |
| ---------------- | ----------------------------- | ---------------------------------------------------------------- |
| `label`          | `ReactNode`                   | Visible field label                                              |
| `helperText`     | `ReactNode`                   | Description or error message                                     |
| `error`          | boolean                       | Invalid styling and alert semantics                              |
| `classNames`     | object                        | Classes for root, label, group, slot, separator, and description |
| `slotProps`      | object or `(index) => object` | Per-slot native/Base UI props                                    |
| `separatorAfter` | `readonly number[]`           | Insert separators after selected zero-based indexes              |

Base UI defaults `validationType` to `numeric`.

## Headless utilities

```ts
import {
  isOtpComplete,
  normalizeOtpCharacter,
  normalizeOtpValue,
  preprocessOtpPaste
} from '@wh1teee/mui-otp-input/headless'
```

The headless export has no UI runtime dependency. Normalizers are deterministic and clamp output to the configured length.
