import type React from 'react'
import type { BoxProps as MuiBoxProps } from '@mui/material/Box'
import type { TextFieldProps as MuiTextFieldProps } from '@mui/material/TextField'
import type {
  OtpInvalidDetails,
  OtpValidationType,
  PastePreprocess
} from './headless'

export type MuiOtpTextFieldProps = Omit<
  MuiTextFieldProps,
  'autoFocus' | 'defaultValue' | 'multiline' | 'onChange' | 'select' | 'value'
>

type BoxProps = Omit<
  MuiBoxProps,
  'autoFocus' | 'defaultValue' | 'onBlur' | 'onChange'
>

export interface BaseMuiOtpInputProps {
  ariaLabel?: string
  autoComplete?: string
  autoFocus?: boolean | number
  autoSubmit?: boolean
  defaultValue?: string
  disabled?: boolean
  form?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  inputRef?: React.Ref<HTMLInputElement>
  length?: number
  mask?: boolean
  name?: string
  normalizeValue?: (value: string) => string
  onBlur?: (value: string, isCompleted: boolean) => void
  onChange?: (value: string) => void
  onComplete?: (value: string) => void
  onInvalid?: (value: string, details: OtpInvalidDetails) => void
  pastePreprocess?: PastePreprocess
  readOnly?: boolean
  required?: boolean
  slotAriaLabel?: (index: number, length: number) => string
  TextFieldsProps?:
    | MuiOtpTextFieldProps
    | ((index: number) => MuiOtpTextFieldProps | null | undefined)
  transformChar?: (character: string, index: number) => string
  validateChar?: (character: string, index: number) => boolean
  validationType?: OtpValidationType
  value?: string
}

export type MuiOtpInputProps = BoxProps & BaseMuiOtpInputProps
