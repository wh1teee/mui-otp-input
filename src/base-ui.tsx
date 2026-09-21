'use client'

import React from 'react'
import { OTPField } from '@base-ui/react/otp-field'
import { mergeRefs } from './internal/merge-refs'
import {
  OtpBehaviorRoot,
  type OtpBehaviorRootProps,
  useOtpSlotAdapter
} from './internal/otp-behavior-root'

export interface InputOTPProps extends Omit<OtpBehaviorRootProps, 'children'> {
  children: React.ReactNode
}

export const InputOTP = React.forwardRef<HTMLDivElement, InputOTPProps>(
  function InputOTP({ className, ...props }, ref) {
    return (
      <OtpBehaviorRoot
        {...props}
        ref={ref}
        className={className}
        data-slot="input-otp"
      />
    )
  }
)

export const InputOTPGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'>
>(function InputOTPGroup(props, ref) {
  return <div {...props} ref={ref} data-slot="input-otp-group" />
})

export interface InputOTPSlotProps extends Omit<OTPField.Input.Props, 'ref'> {
  index: number
}

export const InputOTPSlot = React.forwardRef<
  HTMLInputElement,
  InputOTPSlotProps
>(function InputOTPSlot(
  { index, onMouseDown, onPaste, ...props },
  forwardedRef
) {
  const adapter = useOtpSlotAdapter(index)
  const inputRef = React.useMemo(() => {
    return mergeRefs(adapter.ref, forwardedRef)
  }, [adapter.ref, forwardedRef])

  return (
    <OTPField.Input
      {...props}
      ref={inputRef}
      autoFocus={adapter.autoFocus}
      data-slot="input-otp-slot"
      onMouseDown={(event) => {
        onMouseDown?.(event)
        adapter.onMouseDown(event)
      }}
      onPaste={(event) => {
        adapter.onPaste()
        onPaste?.(event)
      }}
    />
  )
})

export const InputOTPSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'>
>(function InputOTPSeparator({ children, ...props }, ref) {
  return (
    <div {...props} ref={ref} data-slot="input-otp-separator" role="separator">
      {children ?? <span aria-hidden="true">−</span>}
    </div>
  )
})

export interface OtpInputClassNames {
  description?: string
  group?: string
  label?: string
  root?: string
  separator?: string
  slot?: string
}

export interface OtpInputProps extends Omit<
  InputOTPProps,
  'aria-describedby' | 'children'
> {
  classNames?: OtpInputClassNames
  error?: boolean
  helperText?: React.ReactNode
  label: React.ReactNode
  separatorAfter?: readonly number[]
  slotAriaLabel?: (index: number, length: number) => string
  slotProps?:
    | Omit<InputOTPSlotProps, 'index' | 'ref'>
    | ((index: number) => Omit<InputOTPSlotProps, 'index' | 'ref'> | undefined)
}

const EMPTY_CLASS_NAMES: OtpInputClassNames = {}
const EMPTY_SEPARATOR_AFTER: readonly number[] = []

/** Complete Base UI field. Import `/shadcn.css` for the optional semantic skin. */
export function OtpInput({
  classNames = EMPTY_CLASS_NAMES,
  error = false,
  helperText,
  id: idProp,
  label,
  length,
  separatorAfter = EMPTY_SEPARATOR_AFTER,
  slotAriaLabel,
  slotProps,
  ...props
}: OtpInputProps) {
  const generatedId = React.useId()
  const id = idProp ?? generatedId
  const descriptionId = `${id}-description`
  const hasHelperText = helperText !== null && helperText !== undefined
  const separators = React.useMemo(() => {
    return new Set(separatorAfter)
  }, [separatorAfter])

  return (
    <div
      className={classNames.root}
      data-disabled={props.disabled || undefined}
      data-invalid={error || undefined}
      data-slot="otp-field"
    >
      <label
        className={classNames.label}
        htmlFor={id}
        data-slot="otp-field-label"
      >
        {label}
      </label>
      <InputOTP
        {...props}
        id={id}
        length={length}
        aria-describedby={hasHelperText ? descriptionId : undefined}
      >
        <InputOTPGroup className={classNames.group}>
          {Array.from({ length }, (_, index) => {
            return (
              <OtpFieldSlot
                key={index}
                classNames={classNames}
                descriptionId={hasHelperText ? descriptionId : undefined}
                error={error}
                index={index}
                label={label}
                length={length}
                separator={separators.has(index) && index < length - 1}
                slotAriaLabel={slotAriaLabel}
                slotProps={slotProps}
              />
            )
          })}
        </InputOTPGroup>
      </InputOTP>
      {hasHelperText ? (
        <p
          className={classNames.description}
          id={descriptionId}
          role={error ? 'alert' : undefined}
          data-slot="otp-field-description"
        >
          {helperText}
        </p>
      ) : null}
    </div>
  )
}

function OtpFieldSlot({
  classNames,
  descriptionId,
  error,
  index,
  label,
  length,
  separator,
  slotAriaLabel,
  slotProps
}: Readonly<{
  classNames: OtpInputClassNames
  descriptionId?: string
  error: boolean
  index: number
  label: React.ReactNode
  length: number
  separator: boolean
  slotAriaLabel?: OtpInputProps['slotAriaLabel']
  slotProps: OtpInputProps['slotProps']
}>) {
  const resolvedSlotProps =
    (typeof slotProps === 'function' ? slotProps(index) : slotProps) ?? {}
  const accessibleLabel =
    slotAriaLabel?.(index, length) ??
    resolvedSlotProps['aria-label'] ??
    (typeof label === 'string'
      ? `${label} ${index + 1}/${length}`
      : `Character ${index + 1} of ${length}`)

  return (
    <>
      <InputOTPSlot
        {...resolvedSlotProps}
        index={index}
        aria-describedby={descriptionId}
        aria-invalid={error || resolvedSlotProps['aria-invalid']}
        aria-label={accessibleLabel}
        className={resolvedSlotProps.className ?? classNames.slot}
      />
      {separator ? (
        <InputOTPSeparator className={classNames.separator} />
      ) : null}
    </>
  )
}

export type { OtpBehaviorRootProps as InputOTPRootProps }
