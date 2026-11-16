'use client'

import type React from 'react'
import type { FieldValues } from 'react-hook-form'
import {
  type OtpControllerFieldPath,
  type OtpFieldControllerProps,
  renderOtpFieldController
} from './internal/otp-field-controller'
import { OtpInput, type OtpInputProps } from './shadcn'

export type { OtpControllerFieldPath }

export type OtpInputControllerProps<
  TValues extends FieldValues,
  TName extends OtpControllerFieldPath<TValues> =
    OtpControllerFieldPath<TValues>
> = OtpFieldControllerProps<OtpInputProps, TValues, TName>

export function OtpInputController<
  TValues extends FieldValues,
  TName extends OtpControllerFieldPath<TValues> =
    OtpControllerFieldPath<TValues>
>(props: OtpInputControllerProps<TValues, TName>): React.ReactElement {
  return renderOtpFieldController(
    OtpInput as React.ComponentType<object>,
    props
  )
}
