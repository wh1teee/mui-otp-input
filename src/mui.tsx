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
  display: 'flex'
} as const

// Up to 20px between slots, narrowing with the field so digits stay readable.
const DEFAULT_GAP_SX = { gap: 'clamp(4px, 4.5%, 20px)' } as const

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

interface NavigationInput {
  boundaryModifier: boolean
  filledLength: number
  index: number
  key: string
  length: number
  rtl: boolean
}

/** The slot a navigation key moves to, or null for any other key. */
function resolveNavigationTarget({
  boundaryModifier,
  filledLength,
  index,
  key,
  length,
  rtl
}: NavigationInput) {
  const end = Math.min(filledLength, length - 1)

  if (key === (rtl ? 'ArrowRight' : 'ArrowLeft')) {
    return boundaryModifier ? 0 : index - 1
  }

  if (key === (rtl ? 'ArrowLeft' : 'ArrowRight')) {
    return boundaryModifier ? end : index + 1
  }

  if (key === 'Home' || key === 'ArrowUp') {
    return 0
  }

  if (key === 'End' || key === 'ArrowDown') {
    return end
  }

  return null
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
  onCompositionEnd(event: React.CompositionEvent<HTMLDivElement>): void
  onFocus(): void
  onKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void
  onPaste(event: React.ClipboardEvent<HTMLDivElement>): void
  onPointerDown(event: React.PointerEvent<HTMLDivElement>): void
  readOnly: boolean
  required: boolean
  rootInputRef?: React.Ref<HTMLInputElement>
  slotLabel: string
  tabIndex: number
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
  onCompositionEnd,
  onFocus,
  onKeyDown,
  onPaste,
  onPointerDown,
  readOnly,
  required,
  rootInputRef,
  slotLabel,
  tabIndex,
  textFieldProps,
  value
}: MuiOtpSlotProps) {
  const {
    className,
    inputRef,
    onBlur: userOnBlur,
    onCompositionEnd: userOnCompositionEnd,
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
      onCompositionEnd={(event) => {
        userOnCompositionEnd?.(event)
        onCompositionEnd(event)
      }}
      onFocus={(event) => {
        event.target.select()
        onFocus()
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
            // One spare character lets typing overwrite a filled slot when
            // the caret is not on a selection; the first slot also receives
            // whole autofilled codes.
            maxLength: index === 0 ? length + 1 : 2,
            readOnly: readOnly || userHtmlInput.readOnly,
            tabIndex: userHtmlInput.tabIndex ?? tabIndex,
            type: mask ? 'password' : (restTextFieldProps.type ?? 'text')
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
    // Stored values are already canonical: validate them by position, but
    // transform only what the user types, pastes, or autofills.
    const canonicalOptions = React.useMemo(() => {
      return {
        length,
        normalizeValue: customNormalizeValue,
        validateChar,
        validationType
      }
    }, [customNormalizeValue, length, validateChar, validationType])
    const initialValueRef = React.useRef<string | null>(null)

    if (initialValueRef.current === null) {
      initialValueRef.current = normalizeOtpValue(
        defaultValue,
        canonicalOptions
      )
    }

    const controlled = controlledValue !== undefined
    const [uncontrolledValue, setUncontrolledValue] = React.useState(
      initialValueRef.current
    )
    // Re-normalizing the uncontrolled value keeps it within a shorter length.
    const value = normalizeOtpValue(
      controlled ? controlledValue : uncontrolledValue,
      canonicalOptions
    )
    const slotCharacters = Array.from(value)
    const valueRef = React.useRef(value)
    valueRef.current = value
    const inputMode = resolveInputMode(inputModeProp, validationType)
    // Only the active slot is in the tab order, as in the Base UI field:
    // Tab moves past the whole code instead of through every slot.
    const [focusedIndex, setFocusedIndex] = React.useState<null | number>(null)
    const activeIndex =
      focusedIndex ?? Math.min(slotCharacters.length, length - 1)
    // While an IME composes, the slot shows the composition text so React
    // does not reset the input mid-composition.
    const [composition, setComposition] = React.useState<null | {
      index: number
      text: string
    }>(null)

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
        const nextValue = normalizeOtpValue(candidate, canonicalOptions)
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
      [
        canonicalOptions,
        controlled,
        length,
        onChange,
        onComplete,
        requestSubmit
      ]
    )

    // Kept from the original package: a value that starts complete reports
    // completion once on mount. The Base UI field reports only user input.
    const initialCompletionChecked = React.useRef(false)

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

      const handleReset = (event: Event) => {
        // A later listener may still cancel the reset; decide after dispatch.
        queueMicrotask(() => {
          if (event.defaultPrevented) {
            return
          }

          const initialValue = initialValueRef.current ?? ''
          setUncontrolledValue(initialValue)
          valueRef.current = initialValue
        })
      }

      associatedForm.addEventListener('reset', handleReset)

      return () => {
        return associatedForm.removeEventListener('reset', handleReset)
      }
    }, [controlled, form, stableInputRefs])

    const handleSlotInput = React.useCallback(
      (index: number, input: HTMLInputElement, nativeEvent: Event) => {
        if (disabled || readOnly || input.readOnly) {
          return
        }

        const current = Array.from(valueRef.current)
        const currentCharacter = current[index] ?? ''
        let rawValue = input.value

        // Typing into a filled slot overwrites it, wherever the caret was:
        // Safari keeps the caret instead of selecting the slot on click.
        const { data, inputType } = nativeEvent as InputEvent

        if (
          inputType === 'insertText' &&
          currentCharacter &&
          data &&
          Array.from(rawValue).length > 1
        ) {
          rawValue = data
        }

        const rawCharacters = Array.from(rawValue)

        if (rawCharacters.length === 0) {
          current.splice(index, 1)
          const nextValue = commitValue(
            current.join(''),
            'keyboard',
            nativeEvent
          )

          if (index > 0 && Array.from(nextValue).length <= index) {
            focusInput(index - 1)
          }

          return
        }

        if (rawCharacters.length === 1) {
          const character = normalizeOtpCharacter(rawCharacters[0], index, {
            transformChar,
            validateChar,
            validationType
          })

          if (!character) {
            // Rejected input never changes the value; React restores the slot.
            onInvalid?.(rawValue, {
              event: nativeEvent,
              reason: 'input-change'
            })
            queueMicrotask(() => {
              return input.select()
            })

            return
          }

          current[index] = character
          commitValue(current.join(''), 'input-change', nativeEvent)
          focusInput(index + 1)

          return
        }

        // Several characters at once: an autofilled or dropped code. The first
        // slot replaces the whole value; later slots fill from their position.
        const processed = preprocessOtpPaste(rawValue, pastePreprocess)
        const fragment = normalizeOtpValue(processed, {
          indexOffset: index,
          length: length - index,
          transformChar,
          validateChar,
          validationType
        })
        const expected = Array.from(processed.replaceAll(/\s/gu, ''))
          .slice(0, length - index)
          .join('')

        if (fragment !== expected) {
          onInvalid?.(rawValue, { event: nativeEvent, reason: 'input-change' })
        }

        if (!fragment) {
          return
        }

        const fragmentCharacters = Array.from(fragment)
        const nextCharacters =
          index === 0
            ? fragmentCharacters
            : [
                ...current.slice(0, index),
                ...fragmentCharacters,
                ...current.slice(index + fragmentCharacters.length)
              ]
        const nextValue = commitValue(
          nextCharacters.join(''),
          'input-change',
          nativeEvent
        )
        focusInput(Math.min(Array.from(nextValue).length, length - 1))
      },
      [
        commitValue,
        disabled,
        focusInput,
        length,
        onInvalid,
        pastePreprocess,
        readOnly,
        transformChar,
        validateChar,
        validationType
      ]
    )

    const handleOneInputChange = React.useCallback(
      (
        index: number,
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => {
        // An IME is still composing; commit once composition ends.
        if ((event.nativeEvent as InputEvent).isComposing) {
          setComposition({ index, text: event.currentTarget.value })

          return
        }

        handleSlotInput(
          index,
          event.currentTarget as HTMLInputElement,
          event.nativeEvent
        )
      },
      [handleSlotInput]
    )

    const handleOneInputPaste = React.useCallback(
      (index: number, event: React.ClipboardEvent<HTMLDivElement>) => {
        if (
          disabled ||
          readOnly ||
          (event.target as HTMLInputElement).readOnly
        ) {
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
          Array.from(processed.replaceAll(/\s/gu, ''))
            .slice(0, availableLength)
            .join('')
        ) {
          onInvalid?.(rawValue, {
            event: event.nativeEvent,
            reason: 'input-paste'
          })
        }

        const current = Array.from(valueRef.current).slice(0, length)

        for (const [offset, character] of Array.from(normalized).entries()) {
          current[index + offset] = character
        }

        commitValue(current.join(''), 'input-paste', event.nativeEvent, true)
        focusInput(Math.min(index + Array.from(normalized).length, length - 1))
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

        // Keys during IME composition belong to the IME.
        if (event.nativeEvent.isComposing) {
          return
        }

        const input = event.target as HTMLInputElement
        const selected =
          input.selectionStart === 0 &&
          input.selectionEnd === input.value.length
        const boundaryModifier =
          (event.ctrlKey || event.metaKey) && !event.altKey
        const navigationTarget = resolveNavigationTarget({
          boundaryModifier,
          filledLength: Array.from(valueRef.current).length,
          index,
          key: event.key,
          length,
          // Arrow keys follow the visual order, which RTL reverses.
          rtl:
            rootRef.current !== null &&
            getComputedStyle(rootRef.current).direction === 'rtl'
        })

        if (navigationTarget !== null) {
          event.preventDefault()
          focusInput(navigationTarget)

          return
        }

        if (readOnly || input.readOnly) {
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

        // As in the Base UI field: delete this slot's character, or the
        // previous one when this slot is empty, and step back.
        const characters = Array.from(valueRef.current)
        const targetIndex = Math.max(0, index - 1)
        const deleteIndex = input.value ? index : targetIndex
        characters.splice(deleteIndex, 1)
        commitValue(characters.join(''), 'keyboard', event.nativeEvent)
        focusInput(targetIndex)
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
          setFocusedIndex(null)
          onBlur?.(valueRef.current, isOtpComplete(valueRef.current, length))
        }
      },
      [length, onBlur, stableInputRefs]
    )

    const sxItems = sx ? [sx].flat() : []
    // MUI 9 no longer applies Box system props, so a `gap` prop is moved
    // into sx where both MUI 7 and 9 honor it over the default spacing.
    const { gap, ...boxProps } = restBoxProps as typeof restBoxProps & {
      gap?: React.CSSProperties['gap']
    }
    const defaultSx = gap === undefined ? [DEFAULT_GAP_SX] : [{ gap }]

    return (
      <Box
        {...boxProps}
        ref={mergedRootRef}
        aria-label={boxProps['aria-label'] ?? ariaLabel}
        className={joinClassNames('MuiOtpInput-Box', className)}
        role={boxProps.role ?? 'group'}
        sx={[BASE_BOX_SX, ...defaultSx, ...sxItems]}
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
              onCompositionEnd={(event) => {
                setComposition(null)

                return handleSlotInput(
                  index,
                  event.target as HTMLInputElement,
                  event.nativeEvent
                )
              }}
              onFocus={() => {
                return setFocusedIndex(index)
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
              tabIndex={activeIndex === index ? 0 : -1}
              textFieldProps={resolvedTextFieldProps}
              value={
                composition?.index === index
                  ? composition.text
                  : (slotCharacters[index] ?? '')
              }
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
