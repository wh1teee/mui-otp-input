import type { BoxProps as MuiBoxProps } from '@mui/material/Box'
import type { TextFieldProps as MuiTextFieldProps } from '@mui/material/TextField'

type TextFieldProps = Omit<
  MuiTextFieldProps,
  'onChange' | 'select' | 'multiline' | 'defaultValue' | 'value' | 'autoFocus'
>

type BoxProps = Omit<MuiBoxProps, 'onChange' | 'onBlur'>

export type PastePreprocess =
  // No preprocessing (default for backward compatibility)
  | 'none'
  // Trim whitespace from start and end
  | 'trim'
  // Remove all non-digit characters
  | 'digits-only'
  // Custom preprocessing function
  | ((value: string) => string)

export interface BaseMuiOtpInputProps {
  value?: string
  length?: number
  autoFocus?: boolean
  TextFieldsProps?: TextFieldProps | ((index: number) => TextFieldProps)
  onComplete?: (value: string) => void
  validateChar?: (character: string, index: number) => boolean
  transformChar?: (character: string, index: number) => string
  onChange?: (value: string) => void
  onBlur?: (value: string, isCompleted: boolean) => void
  /**
   * Pre-process pasted value before it is applied to the input.
   * - 'none': No preprocessing (default for backward compatibility)
   * - 'trim': Trim whitespace from start and end
   * - 'digits-only': Remove all non-digit characters
   * - Function: Custom preprocessing function
   * @default 'none'
   */
  pastePreprocess?: PastePreprocess
}

export type MuiOtpInputProps = BoxProps & BaseMuiOtpInputProps
