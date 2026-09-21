'use client'

import React from 'react'
import Box from '@mui/material/Box'
import TextFieldBox from './components/TextFieldBox/TextFieldBox'
import {
  isOtpComplete,
  normalizeOtpCharacter,
  normalizeOtpValue,
  type OtpInputReason,
  preprocessOtpPaste
} from './headless'
import type { MuiOtpInputProps, MuiOtpTextFieldProps } from './index.types'
import { mergeRefs } from './internal/merge-refs'

const BASE_BOX_SX = {
  alignItems: 'center',
  display: 'flex',
  gap: '20px'
} as const

const visuallyHidden = {
  border: 0,
  clipPath: 'inset(50%)',
  height: 1,
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: 1
} as const

function joinClassNames(...values: (string | undefined)[]) {
  return values.filter(Boolean).join(' ')
}

function resolveInputMode(
  value: MuiOtpInputProps['inputMode'],
  validationType: MuiOtpInputProps['validationType']
) {
  if (value !== undefined) {
    return value
  }

  if (validationType === 'numeric') {
    return 'numeric'
  }

  if (validationType === 'alphanumeric') {
    return 'text'
  }
}

interface MuiOtpSlotProps {
  autoComplete: string
  autoFocus: boolean
  disabled: boolean
  form?: string
  index: number
  inputMode: MuiOtpInputProps['inputMode']
  internalRef: React.RefObject<HTMLInputElement | null>
  length: number
  mask: boolean
  onBlur(event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>): void
  onChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void
  onKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void
  onPaste(event: React.ClipboardEvent<HTMLDivElement>): void
  onPointerDown(event: React.PointerEvent<HTMLDivElement>): void
  readOnly: boolean
  required: boolean
  rootInputRef?: React.Ref<HTMLInputElement>
  slotLabel: string
  textFieldProps: MuiOtpTextFieldProps
  value: string
}

function MuiOtpSlot({
  autoComplete,
  autoFocus,
  disabled,
  form,
  index,
  inputMode,
  internalRef,
  length,
  mask,
  onBlur,
  onChange,
  onKeyDown,
  onPaste,
  onPointerDown,
  readOnly,
  required,
  rootInputRef,
  slotLabel,
  textFieldProps,
  value
}: MuiOtpSlotProps) {
  const {
    className,
    inputRef,
    onBlur: userOnBlur,
    onFocus: userOnFocus,
    onKeyDown: userOnKeyDown,
    onPaste: userOnPaste,
    onPointerDown: userOnPointerDown,
    slotProps,
    ...restTextFieldProps
  } = textFieldProps
  const htmlInputSlot = slotProps?.htmlInput
  const mergedInputRef = React.useMemo(() => {
    return mergeRefs(internalRef, rootInputRef, inputRef)
  }, [inputRef, internalRef, rootInputRef])

  return (
    <TextFieldBox
      {...restTextFieldProps}
      autoComplete={index === 0 ? autoComplete : 'off'}
      autoFocus={autoFocus}
      className={joinClassNames(
        `MuiOtpInput-TextField MuiOtpInput-TextField-${index + 1}`,
        className
      )}
      disabled={disabled || textFieldProps.disabled}
      inputRef={mergedInputRef}
      onBlur={(event) => {
        userOnBlur?.(event)
        onBlur(event)
      }}
      onChange={(event) => {
        onChange(event)
      }}
      onFocus={(event) => {
        event.target.select()
        userOnFocus?.(event)
      }}
      onKeyDown={(event) => {
        userOnKeyDown?.(event)

        if (!event.defaultPrevented) {
          onKeyDown(event)
        }
      }}
      onPaste={(event) => {
        userOnPaste?.(event)

        if (!event.defaultPrevented) {
          onPaste(event)
        }
      }}
      onPointerDown={(event) => {
        userOnPointerDown?.(event)

        if (!event.defaultPrevented) {
          onPointerDown(event)
        }
      }}
      required={required || textFieldProps.required}
      slotProps={{
        ...slotProps,
        htmlInput: (ownerState) => {
          const userHtmlInput = ((typeof htmlInputSlot === 'function'
            ? htmlInputSlot(ownerState)
            : htmlInputSlot) ??
            {}) as React.InputHTMLAttributes<HTMLInputElement>

          return {
            ...userHtmlInput,
            'aria-label': userHtmlInput['aria-label'] ?? slotLabel,
            autoComplete: index === 0 ? autoComplete : 'off',
            form,
            inputMode,
            maxLength: index === 0 ? length : 1,
            readOnly: readOnly || userHtmlInput.readOnly,
            type: mask ? 'password' : 'text'
          }
        }
      }}
      value={value}
    />
  )
}

export const MuiOtpInput = React.forwardRef<HTMLDivElement, MuiOtpInputProps>(
  function MuiOtpInput(
    {
      ariaLabel = 'One-time password',
      autoComplete = 'one-time-code',
      autoFocus = false,
      autoSubmit = false,
      className,
      defaultValue = '',
      disabled = false,
      form,
      inputMode: inputModeProp,
      inputRef,
      length = 4,
      mask = false,
      name,
      normalizeValue: customNormalizeValue,
      onBlur,
      onChange,
      onComplete,
      onInvalid,
      pastePreprocess = 'none',
      readOnly = false,
      required = false,
      slotAriaLabel,
      sx,
      TextFieldsProps,
      transformChar,
      validateChar,
      validationType = 'none',
      value: controlledValue,
      ...restBoxProps
    },
    forwardedRef
  ) {
    if (!Number.isInteger(length) || length <= 0) {
      throw new RangeError('OTP length must be a positive integer.')
    }

    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const mergedRootRef = React.useMemo(() => {
      return mergeRefs(rootRef, forwardedRef)
    }, [forwardedRef])
    const stableInputRefs = React.useMemo(() => {
      return Array.from({ length }, () => {
        return React.createRef<HTMLInputElement>()
      })
    }, [length])
    const options = React.useMemo(() => {
      return {
        length,
        normalizeValue: customNormalizeValue,
        transformChar,
        validateChar,
        validationType
      }
    }, [
      customNormalizeValue,
      length,
      transformChar,
      validateChar,
      validationType
    ])
    const initialValueRef = React.useRef<string | null>(null)

    if (initialValueRef.current === null) {
      initialValueRef.current = normalizeOtpValue(defaultValue, options)
    }

    const controlled = controlledValue !== undefined
    const [uncontrolledValue, setUncontrolledValue] = React.useState(
      initialValueRef.current
    )
    const value = controlled
      ? normalizeOtpValue(controlledValue, options)
      : uncontrolledValue
    const valueRef = React.useRef(value)
    valueRef.current = value
    const inputMode = resolveInputMode(inputModeProp, validationType)
    const initialCompletionChecked = React.useRef(false)

    const focusInput = React.useCallback(
      (index: number) => {
        const target =
          stableInputRefs[Math.min(Math.max(index, 0), length - 1)]?.current

        if (!target) {
          return
        }

        target.focus()
        target.select()
      },
      [length, stableInputRefs]
    )

    const requestSubmit = React.useCallback(() => {
      if (!autoSubmit) {
        return
      }

      let associatedForm =
        stableInputRefs[0]?.current?.form ?? rootRef.current?.closest('form')

      if (form) {
        const candidate = rootRef.current?.ownerDocument.getElementById(form)

        if (candidate instanceof HTMLFormElement) {
          associatedForm = candidate
        }
      }

      associatedForm?.requestSubmit()
    }, [autoSubmit, form, stableInputRefs])

    const commitValue = React.useCallback(
      (
        candidate: string,
        reason: OtpInputReason,
        event: Event,
        completeSameValue = false
      ) => {
        void reason
        void event
        const nextValue = normalizeOtpValue(candidate, options)
        const previousValue = valueRef.current

        if (!controlled) {
          setUncontrolledValue(nextValue)
        }

        onChange?.(nextValue)
        valueRef.current = nextValue

        const becameComplete =
          isOtpComplete(nextValue, length) &&
          (!isOtpComplete(previousValue, length) || completeSameValue)

        if (becameComplete) {
          onComplete?.(nextValue)
          queueMicrotask(requestSubmit)
        }

        return nextValue
      },
      [controlled, length, onChange, onComplete, options, requestSubmit]
    )

    React.useEffect(() => {
      if (initialCompletionChecked.current) {
        return
      }

      initialCompletionChecked.current = true

      if (isOtpComplete(value, length)) {
        onComplete?.(value)
      }
    }, [length, onComplete, value])

    React.useEffect(() => {
      if (typeof autoFocus !== 'number') {
        return
      }

      const timeout = window.setTimeout(() => {
        return focusInput(0)
      }, autoFocus)

      return () => {
        return window.clearTimeout(timeout)
      }
    }, [autoFocus, focusInput])

    React.useEffect(() => {
      if (controlled) {
        return
      }

      const associatedForm = form
        ? rootRef.current?.ownerDocument.getElementById(form)
        : (stableInputRefs[0]?.current?.form ??
          rootRef.current?.closest('form'))

      if (!(associatedForm instanceof HTMLFormElement)) {
        return
      }

      const handleReset = () => {
        const initialValue = initialValueRef.current ?? ''
        setUncontrolledValue(initialValue)
        valueRef.current = initialValue
      }

      associatedForm.addEventListener('reset', handleReset)

      return () => {
        return associatedForm.removeEventListener('reset', handleReset)
      }
    }, [controlled, form, stableInputRefs])

    const handleOneInputChange = React.useCallback(
      (
        index: number,
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => {
        if (disabled || readOnly) {
          return
        }

        const input = event.currentTarget as HTMLInputElement
        const rawValue = input.value

        if (rawValue.length > 1) {
          const processed = preprocessOtpPaste(rawValue, pastePreprocess)
          const normalized = normalizeOtpValue(processed, options)

          if (
            normalized !== processed.replaceAll(/\s/gu, '').slice(0, length)
          ) {
            onInvalid?.(rawValue, {
              event: event.nativeEvent,
              reason: 'input-change'
            })
          }

          const nextValue = commitValue(
            normalized,
            'input-change',
            event.nativeEvent
          )
          focusInput(Math.max(0, Math.min(nextValue.length, length) - 1))

          return
        }

        const sourceCharacter = rawValue[0] ?? ''
        const character = sourceCharacter
          ? normalizeOtpCharacter(sourceCharacter, index, {
              transformChar,
              validateChar,
              validationType
            })
          : ''

        if (sourceCharacter && !character) {
          onInvalid?.(sourceCharacter, {
            event: event.nativeEvent,
            reason: 'input-change'
          })
        }

        const characters = Array.from(
          valueRef.current.padEnd(length, '')
        ).slice(0, length)
        characters[index] = character
        const nextValue = commitValue(
          characters.join(''),
          character ? 'input-change' : 'keyboard',
          event.nativeEvent
        )

        if (character) {
          focusInput(Math.min(index + 1, length - 1))
        } else if (index > 0 && nextValue.length <= index) {
          focusInput(index - 1)
        }
      },
      [
        commitValue,
        disabled,
        focusInput,
        length,
        onInvalid,
        options,
        pastePreprocess,
        readOnly,
        transformChar,
        validateChar,
        validationType
      ]
    )

    const handleOneInputPaste = React.useCallback(
      (index: number, event: React.ClipboardEvent<HTMLDivElement>) => {
        if (disabled || readOnly) {
          return
        }

        event.preventDefault()
        const rawValue = event.clipboardData.getData('text/plain')
        const processed = preprocessOtpPaste(rawValue, pastePreprocess)
        const availableLength = length - index
        const normalized = normalizeOtpValue(processed, {
          ...options,
          indexOffset: index,
          length: availableLength,
          normalizeValue: undefined
        })

        if (
          normalized !==
          processed.replaceAll(/\s/gu, '').slice(0, availableLength)
        ) {
          onInvalid?.(rawValue, {
            event: event.nativeEvent,
            reason: 'input-paste'
          })
        }

        const current = Array.from(valueRef.current.padEnd(length, '')).slice(
          0,
          length
        )

        for (const [offset, character] of Array.from(normalized).entries()) {
          current[index + offset] = character
        }

        commitValue(current.join(''), 'input-paste', event.nativeEvent, true)
        focusInput(Math.min(index + normalized.length, length - 1))
      },
      [
        commitValue,
        disabled,
        focusInput,
        length,
        onInvalid,
        options,
        pastePreprocess,
        readOnly
      ]
    )

    const handleOneInputKeyDown = React.useCallback(
      (index: number, event: React.KeyboardEvent<HTMLDivElement>) => {
        if (disabled) {
          return
        }

        const input = event.target as HTMLInputElement
        const selected =
          input.selectionStart === 0 &&
          input.selectionEnd === input.value.length
        const boundaryModifier =
          (event.ctrlKey || event.metaKey) && !event.altKey

        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          focusInput(boundaryModifier ? 0 : index - 1)

          return
        }

        if (event.key === 'ArrowRight') {
          event.preventDefault()
          focusInput(
            boundaryModifier
              ? Math.min(valueRef.current.length, length - 1)
              : index + 1
          )

          return
        }

        if (event.key === 'Home' || event.key === 'ArrowUp') {
          event.preventDefault()
          focusInput(0)

          return
        }

        if (event.key === 'End' || event.key === 'ArrowDown') {
          event.preventDefault()
          focusInput(Math.min(valueRef.current.length, length - 1))

          return
        }

        if (readOnly) {
          return
        }

        if (event.key.length === 1 && selected && input.value === event.key) {
          event.preventDefault()
          focusInput(index + 1)

          return
        }

        if (event.key === 'Delete') {
          event.preventDefault()
          const characters = Array.from(valueRef.current)
          characters.splice(index, 1)
          commitValue(characters.join(''), 'keyboard', event.nativeEvent)
          focusInput(index)

          return
        }

        if (event.key !== 'Backspace') {
          return
        }

        event.preventDefault()

        if (boundaryModifier) {
          commitValue('', 'keyboard', event.nativeEvent)
          focusInput(0)

          return
        }

        const characters = Array.from(valueRef.current)
        const deleteIndex = input.value ? index : Math.max(0, index - 1)
        characters.splice(deleteIndex, 1)
        commitValue(characters.join(''), 'keyboard', event.nativeEvent)
        focusInput(deleteIndex)
      },
      [commitValue, disabled, focusInput, length, readOnly]
    )

    const handlePointerDown = React.useCallback(
      (index: number, event: React.PointerEvent<HTMLDivElement>) => {
        if (disabled || event.button !== 0) {
          return
        }

        const selected = stableInputRefs[index]?.current
        const firstEmpty = stableInputRefs.findIndex((input) => {
          return !input.current?.value
        })

        if (firstEmpty >= 0 && index > firstEmpty && !selected?.value) {
          event.preventDefault()
          focusInput(firstEmpty)
        }
      },
      [disabled, focusInput, stableInputRefs]
    )

    const handleBlur = React.useCallback(
      (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const stillInside = stableInputRefs.some((input) => {
          return input.current === event.relatedTarget
        })

        if (!stillInside) {
          onBlur?.(valueRef.current, isOtpComplete(valueRef.current, length))
        }
      },
      [length, onBlur, stableInputRefs]
    )

    const sxItems = sx ? [sx].flat() : []

    return (
      <Box
        {...restBoxProps}
        ref={mergedRootRef}
        aria-label={restBoxProps['aria-label'] ?? ariaLabel}
        className={joinClassNames('MuiOtpInput-Box', className)}
        role={restBoxProps.role ?? 'group'}
        sx={[BASE_BOX_SX, ...sxItems]}
      >
        {Array.from({ length }, (_, index) => {
          const resolvedTextFieldProps =
            (typeof TextFieldsProps === 'function'
              ? TextFieldsProps(index)
              : TextFieldsProps) ?? {}
          const slotLabel =
            slotAriaLabel?.(index, length) ??
            resolvedTextFieldProps['aria-label'] ??
            `${ariaLabel} ${index + 1}/${length}`

          return (
            <MuiOtpSlot
              key={index}
              autoComplete={autoComplete}
              autoFocus={autoFocus === true && index === 0}
              disabled={disabled}
              form={form}
              index={index}
              inputMode={inputMode}
              internalRef={stableInputRefs[index]}
              length={length}
              mask={mask}
              onBlur={handleBlur}
              onChange={(event) => {
                return handleOneInputChange(index, event)
              }}
              onKeyDown={(event) => {
                return handleOneInputKeyDown(index, event)
              }}
              onPaste={(event) => {
                return handleOneInputPaste(index, event)
              }}
              onPointerDown={(event) => {
                return handlePointerDown(index, event)
              }}
              readOnly={readOnly}
              required={required}
              rootInputRef={index === 0 ? inputRef : undefined}
              slotLabel={slotLabel}
              textFieldProps={resolvedTextFieldProps}
              value={value[index] ?? ''}
            />
          )
        })}
        {name ? (
          <input
            aria-hidden="true"
            autoComplete={autoComplete}
            disabled={disabled}
            form={form}
            inputMode={inputMode}
            name={name}
            readOnly
            style={visuallyHidden}
            tabIndex={-1}
            type="text"
            value={value}
          />
        ) : null}
      </Box>
    )
  }
)

export type { MuiOtpInputProps, MuiOtpTextFieldProps } from './index.types'
