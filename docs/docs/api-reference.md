---
sidebar_position: 3
---

# API Reference

This article discusses the API and props of **MuiOtpInput**. Props are defined within `MuiOtpInputProps`.

## `value`

- Type: `string` | `undefined`
- Default: `''`

```tsx
<MuiOtpInput />
<MuiOtpInput value="A3B7" />
```

## `onChange`

- Type: `(value: string) => void`
- Default: `undefined`

Gets called once the user updates one of the inputs.

```tsx

const handleChange = (value) => {
  /**
  value: "A"
  **/
}

<MuiOtpInput onChange={handleChange} />
```

## `length`

- Type: `number`
- Default: `4`

Choose the number of inputs to display, it also represents the length of the final value.

```tsx
<MuiOtpInput length={6} />
```


## `onComplete`

- Type: `(value: string) => void`
- Default: `undefined`

Gets called once the user has filled all inputs.

```tsx

const handleComplete = (value) => {
  /**
  value: "ABCD"
  **/
}

<MuiOtpInput length={4} onComplete={handleComplete} />
```

## `onBlur`

- Type: `((value: string, isCompleted: boolean) => void) | undefined`
- Default: `undefined`


Unlike the normal type of a `TextField['onBlur']` prop, here it only triggers when no input of the component is focused.

```tsx
<MuiOtpInput onBlur={() => console.log('no input of the component is focused')} />
```


## `autoFocus`

- Type: `boolean`
- Default: `false`

Choose to auto focus the first input.

```tsx
<MuiOtpInput autoFocus />
```


## `validateChar`

- Type: `(value: string, index: number) => boolean`
- Default: `() => true`

A function that validates each character during keyPress / paste events. If a user fills in an invalid character (like a letter instead of a number), it will not be displayed.

```tsx

export function matchIsNumeric(text) {
  const isNumber = typeof text === 'number'
  const isString = matchIsString(text)
  return (isNumber || (isString && text !== '')) && !isNaN(Number(text))
}

const validateChar = (value, index) => {
  return matchIsNumeric(value)
}

<MuiOtpInput length={4} validateChar={validateChar} />
```

## `pastePreprocess`

- Type: `'none' | 'trim' | 'digits-only' | ((value: string) => string)`
- Default: `'none'`

Pre-process pasted value before it is applied to the input.

- `'none'`: No preprocessing (default for backward compatibility)
- `'trim'`: Trim whitespace from start and end
- `'digits-only'`: Remove all non-digit characters
- Function: Custom preprocessing function

```tsx
// Remove spaces from pasted OTP codes
<MuiOtpInput pastePreprocess="trim" />

// Keep only digits for numeric OTP
<MuiOtpInput pastePreprocess="digits-only" />

// Custom preprocessing
<MuiOtpInput 
  pastePreprocess={(value) => value.replace('Code: ', '')} 
/>
```

## `transformChar`

- Type: `(character: string, index: number) => string`
- Default: `undefined`

Transform characters during input. Applied before validation.

```tsx
// Convert to uppercase
<MuiOtpInput 
  transformChar={(char) => char.toUpperCase()}
  validateChar={(char) => /[A-Z0-9]/.test(char)}
/>

// Advanced example: replace visually similar characters (use with caution)
<MuiOtpInput
  transformChar={(char) => {
    // Only use if you're certain users might confuse these characters
    if (char === 'O' || char === 'o') return '0'
    if (char === 'l' || char === 'I') return '1'
    return char
  }}
  validateChar={(char) => /\d/.test(char)}
/>
```

## `TextFieldsProps`

While not explicitly documented, the props of the MUI **[TextField](https://mui.com/api/text-field)** component can be used for each `TextField`.

See: https://mui.com/material-ui/api/text-field/

```jsx
<MuiOtpInput TextFieldsProps={{ disabled: true, size: 'small' }} />
```

OR if you want to pass different props depending of the index.

```jsx
<MuiOtpInput TextFieldsProps={(index) => ({ size: 'small', placeholder: String(index) })}  />
```

## `placeholder`

- Type: `string` | `undefined` | `(index: number) => string | undefined`
- Default: `undefined`

Unlike the normal type of a `TextField`, here you can manage a distinct placeholder for each field.

```tsx
<MuiOtpInput TextFieldsProps={{ placeholder: '-' }} />
<MuiOtpInput TextFieldsProps={{ placeholder: (index) => `i-${index}` }} />
```
