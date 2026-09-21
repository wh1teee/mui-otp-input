'use client'

import type React from 'react'
import {
  Controller,
  type ControllerProps,
  type FieldPathByValue,
  type FieldValues
} from 'react-hook-form'
import { OtpInput, type OtpInputProps } from './base-ui'

export type OtpControllerFieldPath<TValues extends FieldValues> =
  FieldPathByValue<TValues, string>

export type OtpInputControllerProps<
  TValues extends FieldValues,
  TName extends OtpControllerFieldPath<TValues> =
    OtpControllerFieldPath<TValues>
> = Omit<
  OtpInputProps,
  | 'defaultValue'
  | 'error'
  | 'helperText'
  | 'inputRef'
  | 'onValueChange'
  | 'value'
> &
  Omit<ControllerProps<TValues, TName>, 'render'> & {
    error?: boolean
    helperText?: React.ReactNode
  }

export function OtpInputController<
  TValues extends FieldValues,
  TName extends OtpControllerFieldPath<TValues> =
    OtpControllerFieldPath<TValues>
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
}: OtpInputControllerProps<TValues, TName>): React.ReactElement {
  return (
    <Controller<TValues, TName>
      control={control}
      defaultValue={defaultValue}
      disabled={disabled}
      name={name}
      rules={rules}
      shouldUnregister={shouldUnregister}
      render={({ field, fieldState }) => {
        return (
          <OtpInput
            {...props}
            disabled={field.disabled ?? disabled}
            error={Boolean(error || fieldState.error)}
            helperText={fieldState.error?.message ?? helperText}
            inputRef={field.ref}
            name={field.name}
            onBlur={(event) => {
              field.onBlur()
              onBlur?.(event)
            }}
            onValueChange={field.onChange}
            value={(field.value as string | undefined) ?? ''}
          />
        )
      }}
    />
  )
}
