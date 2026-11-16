'use client'

import React from 'react'
import {
  Controller,
  type ControllerProps,
  type FieldPathByValue,
  type FieldValues
} from 'react-hook-form'

export type OtpControllerFieldPath<TValues extends FieldValues> =
  FieldPathByValue<TValues, string>

type ControlledOtpFieldProps = {
  disabled?: boolean
  error?: boolean
  helperText?: React.ReactNode
  inputRef?: React.Ref<HTMLInputElement>
  name?: string
  onBlur?: React.FocusEventHandler<HTMLElement>
  onValueChange?: (value: string) => void
  value?: string
}

export type OtpFieldControllerProps<
  TFieldProps,
  TValues extends FieldValues,
  TName extends OtpControllerFieldPath<TValues>
> = Omit<
  TFieldProps,
  | 'defaultValue'
  | 'error'
  | 'helperText'
  | 'inputRef'
  | 'onValueChange'
  | 'ref'
  | 'value'
> &
  Omit<ControllerProps<TValues, TName>, 'render'> & {
    error?: boolean
    helperText?: React.ReactNode
  }

/** Binds an OTP field (Base UI or single-input) to a React Hook Form field. */
export function renderOtpFieldController<
  TValues extends FieldValues,
  TName extends OtpControllerFieldPath<TValues>
>(
  Field: React.ComponentType<ControlledOtpFieldProps>,
  {
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
  }: OtpFieldControllerProps<
    { onBlur?: React.FocusEventHandler<HTMLElement> },
    TValues,
    TName
  >
): React.ReactElement {
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
          <Field
            {...props}
            disabled={field.disabled ?? disabled}
            error={Boolean(error || fieldState.error)}
            helperText={fieldState.error?.message ?? helperText}
            inputRef={field.ref}
            name={field.name}
            onBlur={(event) => {
              onBlur?.(event)

              // Moving between slots is not leaving the field.
              if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                field.onBlur()
              }
            }}
            onValueChange={field.onChange}
            value={(field.value as string | undefined) ?? ''}
          />
        )
      }}
    />
  )
}
