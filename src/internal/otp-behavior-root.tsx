'use client'

import React from 'react'
import { OTPField } from '@base-ui/react/otp-field'
import type { OtpValidationType, PastePreprocess } from '../headless'
import { normalizeOtpValue, preprocessOtpPaste } from '../headless'
import { mergeRefs } from './merge-refs'

type RootProps = OTPField.Root.Props

export type OtpBehaviorProps = {
  autoFocus?: boolean | number
  inputRef?: React.Ref<HTMLInputElement>
  normalizeValue?: (value: string) => string
  pastePreprocess?: PastePreprocess
  transformChar?: (character: string, index: number) => string
  validateChar?: (character: string, index: number) => boolean
  validationType?: OtpValidationType
}

export type OtpBehaviorRootProps = Omit<
  RootProps,
  'autoFocus' | 'children' | 'inputMode' | 'normalizeValue' | 'validationType'
> &
  OtpBehaviorProps & {
    children: React.ReactNode
    inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  }

type OtpAdapterContextValue = {
  autoFocus: boolean | number
  focusFirstInput(): void
  handleMouseDown(
    index: number,
    event: React.MouseEvent<HTMLInputElement>
  ): void
  markPaste(): void
  registerInput(index: number, input: HTMLInputElement | null): void
}

const OtpAdapterContext = React.createContext<OtpAdapterContextValue | null>(
  null
)

function preventBaseUiHandler(event: React.SyntheticEvent) {
  const prevent = (
    event as React.SyntheticEvent & {
      preventBaseUIHandler?: () => void
    }
  ).preventBaseUIHandler
  prevent?.()
}

function setExternalInputRef(
  ref: React.Ref<HTMLInputElement> | undefined,
  value: HTMLInputElement | null
) {
  if (typeof ref === 'function') {
    return ref(value)
  }

  if (ref) {
    ref.current = value
  }

  return undefined
}

export const OtpBehaviorRoot = React.forwardRef<
  HTMLDivElement,
  OtpBehaviorRootProps
>(function OtpBehaviorRoot(
  {
    autoFocus = false,
    children,
    defaultValue = '',
    form,
    inputMode,
    inputRef,
    normalizeValue: customNormalizeValue,
    onValueChange,
    pastePreprocess = 'none',
    transformChar,
    validateChar,
    validationType = 'numeric',
    value: controlledValue,
    ...rootProps
  },
  forwardedRef
) {
  const rootElementRef = React.useRef<HTMLDivElement | null>(null)
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])
  const inputRefCleanup = React.useRef<undefined | (() => void)>(undefined)
  const inputRefAssigned = React.useRef(false)
  const normalizationContext = React.useRef<'paste' | 'value'>('value')
  const pasteGeneration = React.useRef(0)

  const registerInput = React.useCallback(
    (index: number, input: HTMLInputElement | null) => {
      inputRefs.current[index] = input
      if (index !== 0) {
        return
      }

      if (inputRefCleanup.current) {
        inputRefCleanup.current()
      } else if (inputRefAssigned.current && typeof inputRef === 'function') {
        inputRef(null)
      }

      inputRefCleanup.current = undefined
      inputRefAssigned.current = input !== null
      const cleanup = setExternalInputRef(inputRef, input)
      if (typeof cleanup === 'function') {
        inputRefCleanup.current = cleanup
      }
    },
    [inputRef]
  )

  const focusInput = React.useCallback((index: number) => {
    const input = inputRefs.current[index]
    if (!input) {
      return
    }

    input.focus()
    input.select()
  }, [])

  const focusFirstInput = React.useCallback(() => {
    focusInput(0)
  }, [focusInput])

  const handleMouseDown = React.useCallback(
    (index: number, event: React.MouseEvent<HTMLInputElement>) => {
      if (event.defaultPrevented || event.button !== 0) {
        return
      }

      const firstEmpty = inputRefs.current.findIndex((input) => !input?.value)
      const selected = inputRefs.current[index]
      if (firstEmpty >= 0 && index > firstEmpty && !selected?.value) {
        event.preventDefault()
        preventBaseUiHandler(event)
        focusInput(firstEmpty)
      }
    },
    [focusInput]
  )

  const markPaste = React.useCallback(() => {
    normalizationContext.current = 'paste'
    pasteGeneration.current += 1
    const generation = pasteGeneration.current

    queueMicrotask(() => {
      if (pasteGeneration.current === generation) {
        normalizationContext.current = 'value'
      }
    })
  }, [])

  const normalizer = React.useCallback(
    (candidate: string) =>
      normalizeOtpValue(
        normalizationContext.current === 'paste'
          ? preprocessOtpPaste(candidate, pastePreprocess)
          : candidate,
        {
          length: rootProps.length,
          normalizeValue: customNormalizeValue,
          transformChar,
          validateChar,
          validationType
        }
      ),
    [
      customNormalizeValue,
      pastePreprocess,
      rootProps.length,
      transformChar,
      validateChar,
      validationType
    ]
  )

  const initialValue = React.useState(() => normalizer(defaultValue))[0]
  const controlled = controlledValue !== undefined
  const [uncontrolledValue, setUncontrolledValue] = React.useState(initialValue)
  const value = controlled ? normalizer(controlledValue) : uncontrolledValue
  const rootRef = React.useMemo(
    () => mergeRefs(rootElementRef, forwardedRef),
    [forwardedRef]
  )

  const handleValueChange = React.useCallback<
    NonNullable<RootProps['onValueChange']>
  >(
    (nextValue, details) => {
      if (!controlled) {
        setUncontrolledValue(nextValue)
      }
      onValueChange?.(nextValue, details)
    },
    [controlled, onValueChange]
  )

  React.useEffect(() => {
    if (typeof autoFocus !== 'number') {
      return () => undefined
    }

    const timeout = window.setTimeout(focusFirstInput, autoFocus)
    return () => window.clearTimeout(timeout)
  }, [autoFocus, focusFirstInput])

  React.useEffect(() => {
    if (controlled) {
      return () => undefined
    }

    const root = rootElementRef.current
    const associatedForm = form
      ? root?.ownerDocument.getElementById(form)
      : (inputRefs.current[0]?.form ?? root?.closest('form'))
    if (!(associatedForm instanceof HTMLFormElement)) {
      return () => undefined
    }

    const handleReset = () => {
      setUncontrolledValue(initialValue)
    }
    associatedForm.addEventListener('reset', handleReset)
    return () => associatedForm.removeEventListener('reset', handleReset)
  }, [controlled, form, initialValue])

  React.useEffect(
    () => () => {
      if (inputRefCleanup.current) {
        inputRefCleanup.current()
      } else if (typeof inputRef === 'function') {
        if (inputRefAssigned.current) {
          inputRef(null)
        }
      } else if (inputRef) {
        inputRef.current = null
      }

      inputRefCleanup.current = undefined
      inputRefAssigned.current = false
    },
    [inputRef]
  )

  const context = React.useMemo<OtpAdapterContextValue>(
    () => ({
      autoFocus,
      focusFirstInput,
      handleMouseDown,
      markPaste,
      registerInput
    }),
    [autoFocus, focusFirstInput, handleMouseDown, markPaste, registerInput]
  )

  return (
    <OtpAdapterContext.Provider value={context}>
      <OTPField.Root
        {...rootProps}
        ref={rootRef}
        form={form}
        inputMode={
          inputMode ??
          (validationType === 'numeric'
            ? 'numeric'
            : validationType === 'alphanumeric'
              ? 'text'
              : undefined)
        }
        normalizeValue={normalizer}
        onValueChange={handleValueChange}
        validationType="none"
        value={value}
      >
        {children}
      </OTPField.Root>
    </OtpAdapterContext.Provider>
  )
})

export function useOtpSlotAdapter(index: number) {
  const context = React.useContext(OtpAdapterContext)
  if (!context) {
    throw new Error('OTP slots must be rendered inside an OTP root.')
  }

  return {
    autoFocus: context.autoFocus === true && index === 0,
    onMouseDown(event: React.MouseEvent<HTMLInputElement>) {
      context.handleMouseDown(index, event)
    },
    onPaste() {
      context.markPaste()
    },
    ref(input: HTMLInputElement | null) {
      context.registerInput(index, input)
    }
  }
}
