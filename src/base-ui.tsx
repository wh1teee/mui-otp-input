'use client'

import React from 'react'
import { OTPField } from '@base-ui/react/otp-field'
import { mergeRefs } from './internal/merge-refs'
import {
  OtpBehaviorRoot,
  type OtpBehaviorRootProps,
  preventBaseUiHandler,
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
  {
    index,
    onChange,
    onCompositionEnd,
    onKeyDown,
    onMouseDown,
    onPaste,
    ...props
  },
  forwardedRef
) {
  const adapter = useOtpSlotAdapter(index)
  const inputRef = React.useMemo(() => {
    return mergeRefs(adapter.ref, forwardedRef)
  }, [adapter.ref, forwardedRef])
  // While an IME composes, the slot shows the composition text so React does
  // not reset the input mid-composition; Base UI sees only the final text.
  const [composition, setComposition] = React.useState<null | string>(null)
  const committingComposition = React.useRef(false)

  return (
    <OTPField.Input
      {...props}
      {...(composition === null ? {} : { value: composition })}
      ref={inputRef}
      autoFocus={adapter.autoFocus}
      data-slot="input-otp-slot"
      onChange={(event) => {
        onChange?.(event)

        if ((event.nativeEvent as InputEvent).isComposing) {
          setComposition(event.currentTarget.value)
          preventBaseUiHandler(event)

          return
        }

        adapter.markInput(event.currentTarget.value)
      }}
      onCompositionEnd={(event) => {
        onCompositionEnd?.(event)
        const input = event.currentTarget
        const text = input.value
        setComposition(null)

        if (!text) {
          return
        }

        // Base UI exposes no way to commit text, so the composed text goes
        // through its paste path, marked as typed input (no paste cleanup).
        const commit = new Event('paste', { bubbles: true, cancelable: true })
        Object.defineProperty(commit, 'clipboardData', {
          value: {
            getData(type: string) {
              return type === 'text/plain' ? text : ''
            }
          }
        })
        committingComposition.current = true
        input.dispatchEvent(commit)
        committingComposition.current = false
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)

        // Keys during IME composition belong to the IME.
        if (event.nativeEvent.isComposing) {
          preventBaseUiHandler(event)

          return
        }

        // Base UI only honors the root's readOnly; a read-only slot keeps its value.
        if (
          event.currentTarget.readOnly &&
          (event.key === 'Backspace' || event.key === 'Delete')
        ) {
          event.preventDefault()
          preventBaseUiHandler(event)
        }
      }}
      onMouseDown={(event) => {
        onMouseDown?.(event)
        adapter.onMouseDown(event)
      }}
      onPaste={(event) => {
        onPaste?.(event)

        if (event.currentTarget.readOnly) {
          event.preventDefault()
          preventBaseUiHandler(event)

          return
        }

        const text = event.clipboardData.getData('text/plain')

        if (committingComposition.current) {
          adapter.markInput(text)
        } else {
          adapter.markPaste(text)
        }
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
        aria-describedby={
          [resolvedSlotProps['aria-describedby'], descriptionId]
            .filter(Boolean)
            .join(' ') || undefined
        }
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
