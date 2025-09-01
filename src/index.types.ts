import type { BoxProps as MuiBoxProps } from '@mui/material/Box'
import type { TextFieldProps as MuiTextFieldProps } from '@mui/material/TextField'

type TextFieldProps = Omit<
  MuiTextFieldProps,
  'onChange' | 'select' | 'multiline' | 'defaultValue' | 'value' | 'autoFocus'
>

type BoxProps = Omit<MuiBoxProps, 'onChange' | 'onBlur' | 'autoFocus'>

export interface BaseMuiOtpInputProps {
  value?: string
  length?: number
  /**
   * Controls autofocus behavior for the first input field.
   * - `true`: Focus immediately on mount
   * - `false`: No autofocus (default)
   * - `number`: Delay in milliseconds before focusing
   */
  autoFocus?: boolean | number
  TextFieldsProps?: TextFieldProps | ((index: number) => TextFieldProps)
  onComplete?: (value: string) => void
  validateChar?: (character: string, index: number) => boolean
  onChange?: (value: string) => void
  onBlur?: (value: string, isCompleted: boolean) => void
}

export type MuiOtpInputProps = BoxProps & BaseMuiOtpInputProps
