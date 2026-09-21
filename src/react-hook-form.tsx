'use client'

import type React from 'react'
import {
  Controller,
  type ControllerProps,
  type FieldPathByValue,
  type FieldValues
} from 'react-hook-form'
import type { MuiOtpInputProps } from './index.types'
import { MuiOtpInput } from './mui'

export type MuiOtpControllerFieldPath<TValues extends FieldValues> =
  FieldPathByValue<TValues, string>

export type MuiOtpInputControllerProps<
  TValues extends FieldValues,
  TName extends MuiOtpControllerFieldPath<TValues> =
    MuiOtpControllerFieldPath<TValues>
> = Omit<
  MuiOtpInputProps,
  'defaultValue' | 'inputRef' | 'onChange' | 'ref' | 'value'
> &
  Omit<ControllerProps<TValues, TName>, 'render'> & {
    error?: boolean
    helperText?: React.ReactNode
  }

export function MuiOtpInputController<
  TValues extends FieldValues,
  TName extends MuiOtpControllerFieldPath<TValues> =
    MuiOtpControllerFieldPath<TValues>
>({
  control,
  defaultValue,
  disabled,
  error,
  helperText,
  name,
  onBlur,
  rules,
  shouldUnregister,
  ...props
}: MuiOtpInputControllerProps<TValues, TName>): React.ReactElement {
  return (
    <Controller<TValues, TName>
      control={control}
      defaultValue={defaultValue}
      disabled={disabled}
      name={name}
      rules={rules}
      shouldUnregister={shouldUnregister}
      render={({ field, fieldState }) => {
        const userTextFieldsProps = props.TextFieldsProps

        return (
          <MuiOtpInput
            {...props}
            disabled={field.disabled ?? disabled}
            inputRef={field.ref}
            name={field.name}
            onBlur={(value, complete) => {
              field.onBlur()
              onBlur?.(value, complete)
            }}
            onChange={field.onChange}
            TextFieldsProps={(index) => {
              const resolved =
                (typeof userTextFieldsProps === 'function'
                  ? userTextFieldsProps(index)
                  : userTextFieldsProps) ?? {}

              return {
                ...resolved,
                error: Boolean(error || fieldState.error || resolved.error),
                helperText:
                  index === 0
                    ? (fieldState.error?.message ??
                      helperText ??
                      resolved.helperText)
                    : resolved.helperText
              }
            }}
            value={(field.value as string | undefined) ?? ''}
          />
        )
      }}
    />
  )
}
