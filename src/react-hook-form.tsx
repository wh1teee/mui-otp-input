'use client'

import React from 'react'
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
  const generatedId = React.useId()
  const firstSlotId = `${generatedId}-slot-1`
  // MUI derives the helper text id from the TextField id.
  const helperTextId = `${firstSlotId}-helper-text`

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
              const message =
                fieldState.error?.message ?? helperText ?? resolved.helperText

              if (index === 0) {
                return {
                  ...resolved,
                  error: Boolean(error || fieldState.error || resolved.error),
                  helperText: message,
                  id: firstSlotId
                }
              }

              // The message renders under the first slot; every slot points to it.
              return {
                ...resolved,
                error: Boolean(error || fieldState.error || resolved.error),
                slotProps: message
                  ? {
                      ...resolved.slotProps,
                      htmlInput: (ownerState: never) => {
                        const userHtmlInput = resolved.slotProps?.htmlInput
                        const resolvedHtmlInput = ((typeof userHtmlInput ===
                        'function'
                          ? userHtmlInput(ownerState)
                          : userHtmlInput) ??
                          {}) as React.InputHTMLAttributes<HTMLInputElement>

                        return {
                          ...resolvedHtmlInput,
                          'aria-describedby':
                            [
                              resolvedHtmlInput['aria-describedby'],
                              helperTextId
                            ]
                              .filter(Boolean)
                              .join(' ') || undefined
                        }
                      }
                    }
                  : resolved.slotProps
              }
            }}
            value={(field.value as string | undefined) ?? ''}
          />
        )
      }}
    />
  )
}
