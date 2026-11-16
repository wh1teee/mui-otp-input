'use client'

import React from 'react'
import {
  normalizeOtpValue,
  type OtpValidationType,
  type PastePreprocess,
  preprocessOtpPaste
} from './headless'
import { mergeRefs } from './internal/merge-refs'
import { useDelayedFocus, useFormReset } from './internal/otp-field-effects'

// One real <input> carries the value, the selection, autofill, paste and the
// accessible name; it lies transparent over cells drawn from that value. The
// approach follows input-otp (MIT, Guilherme Rodz); see THIRD_PARTY_NOTICES.md.

export type InputOTPChangeReason =
  'imperative' | 'input-change' | 'input-clear' | 'input-paste'

export interface InputOTPChangeDetails {
  /** Keeps the current value; the field does not change. */
  cancel(): void
  /** The DOM event behind the change; absent for `clear()`. */
  event: Event | undefined
  isCanceled: boolean
  reason: InputOTPChangeReason
}

export interface InputOTPInvalidDetails {
  event: Event
  reason: 'input-change' | 'input-paste'
}

export interface InputOTPHandle {
  /** Empties the value; with `focus: true` the caret lands in the first cell. */
  clear(options?: { focus?: boolean }): void
  /** Focuses the input with the caret after the last character. */
  focus(options?: FocusOptions): void
  readonly input: HTMLInputElement | null
  readonly root: HTMLDivElement | null
}

type NativeInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  | 'autoFocus'
  | 'children'
  | 'className'
  | 'defaultValue'
  | 'dir'
  | 'maxLength'
  | 'minLength'
  | 'onChange'
  | 'onInvalid'
  | 'pattern'
  | 'size'
  | 'style'
  | 'type'
  | 'value'
>

export interface InputOTPProps extends NativeInputProps {
  /** Submits the owning form with `requestSubmit()` when `onComplete` fires. */
  autoSubmit?: boolean
  /** `true` focuses on mount; a number focuses after that many milliseconds. */
  autoFocus?: boolean | number
  children: React.ReactNode
  /** Class of the root element. Every other attribute goes to the input. */
  className?: string
  defaultValue?: string
  inputRef?: React.Ref<HTMLInputElement>
  length: number
  /** Draws a dot in filled cells instead of the character. */
  mask?: boolean
  normalizeValue?: (value: string) => string
  /** Fires once each time the value becomes complete; not on mount. */
  onComplete?: (value: string) => void
  onValueChange?: (value: string, details: InputOTPChangeDetails) => void
  /** Fires when typed or pasted text adds no accepted character. */
  onValueInvalid?: (value: string, details: InputOTPInvalidDetails) => void
  pastePreprocess?: PastePreprocess
  /** Style of the root element. */
  style?: React.CSSProperties
  transformChar?: (character: string, index: number) => string
  validateChar?: (character: string, index: number) => boolean
  validationType?: OtpValidationType
  value?: string
}

export interface InputOTPSlotState {
  char: null | string
  hasFakeCaret: boolean
  isActive: boolean
  isFilled: boolean
  isInvalid: boolean
}

type InputOTPContextValue = {
  disabled: boolean
  registerSlot(index: number, element: HTMLElement | null): void
  slots: InputOTPSlotState[]
}

const InputOTPContext = React.createContext<InputOTPContextValue | null>(null)

type Selection = readonly [number, number]

const PATTERNS: Partial<Record<OtpValidationType, string>> = {
  alphanumeric: '[A-Za-z0-9]*',
  numeric: '[0-9]*'
}
const STYLE_ID = 'mui-otp-input-style'
const INPUT_SELECTOR = '[data-slot=input-otp-input]'
const BADGE_SPACE = 40
const BADGE_SELECTORS =
  '[data-lastpass-icon-root],com-1password-button,[data-dashlanecreated],[style$="2147483647 !important;"]'

const INPUT_MODES: Partial<
  Record<OtpValidationType, React.HTMLAttributes<HTMLElement>['inputMode']>
> = {
  alphanumeric: 'text',
  numeric: 'numeric'
}

function inputStyle(
  pushBadge: boolean,
  disabled: boolean
): React.CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    width: pushBadge ? `calc(100% + ${BADGE_SPACE}px)` : '100%',
    height: '100%',
    clipPath: pushBadge ? `inset(0 ${BADGE_SPACE}px 0 0)` : undefined,
    margin: 0,
    padding: 0,
    border: 0,
    outline: 'none',
    boxShadow: 'none',
    // Opacity stays 1: iOS offers paste only on a visible input.
    opacity: 1,
    background: 'transparent',
    color: 'transparent',
    caretColor: 'transparent',
    // Forced colors would paint the real text and caret over the cells.
    forcedColorAdjust: 'none',
    // 16px keeps iOS from zooming into the field on focus.
    font: '16px/1 monospace',
    letterSpacing: '-.5em',
    textAlign: 'left',
    cursor: disabled ? 'not-allowed' : 'text'
  }
}

const useIsomorphicLayoutEffect =
  typeof document === 'undefined' ? React.useEffect : React.useLayoutEffect

/** The document or shadow root the input lives in. */
function rootNodeOf(input: HTMLInputElement) {
  return input.getRootNode() as Document | ShadowRoot
}

function isFocused(input: HTMLInputElement | null): input is HTMLInputElement {
  return input !== null && rootNodeOf(input).activeElement === input
}

function insertGlobalStyles(input: HTMLInputElement) {
  const root = rootNodeOf(input)

  if (root.getElementById(STYLE_ID)) {
    return
  }

  const element = input.ownerDocument.createElement('style')
  element.id = STYLE_ID
  // Rules in document.head do not reach into a shadow tree.
  ;('head' in root ? root.head : root).append(element)
  const hidden =
    'background:transparent!important;color:transparent!important;border-color:transparent!important;box-shadow:none!important;-webkit-text-fill-color:transparent!important'

  for (const rule of [
    `${INPUT_SELECTOR}::selection{background:transparent!important;color:transparent!important}`,
    `${INPUT_SELECTOR}:autofill{${hidden}}`,
    `${INPUT_SELECTOR}:-webkit-autofill{${hidden}}`,
    // iOS draws its own selection over the text; keep that text narrow.
    `@supports (-webkit-touch-callout:none){${INPUT_SELECTOR}{letter-spacing:-.6em!important;font-weight:100!important}}`
  ]) {
    try {
      // CSSOM insertion is not blocked by a style-src Content Security Policy.
      element.sheet?.insertRule(rule)
    } catch {
      // An engine without `:autofill` only loses that cosmetic rule.
    }
  }
}

/**
 * Space between the root's right edge and the nearest box that clips
 * horizontal overflow (or the viewport): the password-manager gutter must fit.
 */
function badgeSpace(root: HTMLElement) {
  const { right } = root.getBoundingClientRect()

  for (
    let element: HTMLElement | null = root;
    element;
    element = element.parentElement
  ) {
    if (getComputedStyle(element).overflowX !== 'visible') {
      const rect = element.getBoundingClientRect()

      return rect.left + element.clientLeft + element.clientWidth - right
    }
  }

  return root.ownerDocument.documentElement.clientWidth - right
}

/** A known password-manager badge drawn over this field's rectangle. */
function hasBadgeOver(root: HTMLElement) {
  const field = root.getBoundingClientRect()

  for (const badge of root.ownerDocument.querySelectorAll(BADGE_SELECTORS)) {
    const rect = badge.getBoundingClientRect()

    if (
      rect.left < field.right &&
      rect.right > field.left &&
      rect.top < field.bottom &&
      rect.bottom > field.top
    ) {
      return true
    }
  }

  // Unknown managers: whatever is drawn where badges sit, at the right edge.
  // Optional call: test DOMs such as jsdom do not implement it.
  const probe =
    root.ownerDocument.elementFromPoint?.(
      field.right - 18,
      field.top + field.height / 2
    ) ?? null

  return probe !== null && !root.contains(probe)
}

function createChangeDetails(
  reason: InputOTPChangeReason,
  event: Event | undefined
): InputOTPChangeDetails {
  const details: InputOTPChangeDetails = {
    cancel() {
      details.isCanceled = true
    },
    event,
    isCanceled: false,
    reason
  }

  return details
}

/**
 * A collapsed caret inside the value becomes a one-character selection so
 * typing replaces that cell; moving back from a selection steps one cell.
 */
function normalizeSelection(
  input: HTMLInputElement,
  length: number,
  previous: Selection | null
): Selection | null {
  const { selectionEnd: end, selectionStart: start, value } = input

  if (start === null || end === null) {
    return null
  }

  const insertMode = start === value.length && value.length < length

  if (start !== end || value.length === 0 || insertMode) {
    return [start, end]
  }

  let next = start

  if (start >= length) {
    next = length - 1
  } else if (
    start > 0 &&
    previous &&
    start < previous[1] &&
    previous[0] !== previous[1]
  ) {
    next = start - 1
  }

  input.setSelectionRange(next, next + 1)

  return [next, next + 1]
}

export const InputOTP = React.forwardRef<InputOTPHandle, InputOTPProps>(
  function InputOTP(
    {
      autoFocus = false,
      autoSubmit = false,
      children,
      className,
      defaultValue = '',
      inputMode,
      inputRef,
      length,
      mask = false,
      normalizeValue,
      onBlur,
      onClick,
      onComplete,
      onCompositionEnd,
      onCompositionStart,
      onFocus,
      onMouseDown,
      onPaste,
      onPointerDown,
      onValueChange,
      onValueInvalid,
      pastePreprocess = 'none',
      style,
      transformChar,
      validateChar,
      validationType = 'numeric',
      value: controlledValue,
      ...props
    },
    forwardedRef
  ) {
    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const inputElementRef = React.useRef<HTMLInputElement | null>(null)
    const slotElements = React.useRef(new Map<number, HTMLElement>())
    const previousSelection = React.useRef<Selection | null>(null)
    // Where the caret goes once a committed value has rendered.
    const pendingCaret = React.useRef<null | number>(null)
    // The selection right before the browser applies an edit.
    const editRange = React.useRef<Selection | null>(null)
    const pointerType = React.useRef('mouse')
    // An IME owns the text and the selection until composition ends.
    const composing = React.useRef(false)
    // `inputType` of the edit in progress, from `beforeinput`.
    const inputType = React.useRef('')
    // The last value this component committed, to tell user edits from
    // outside changes (a form reset, a host `value`).
    const committed = React.useRef<null | string>(null)

    const canonical = (candidate: string) => {
      return normalizeOtpValue(candidate, {
        length,
        normalizeValue,
        validateChar,
        validationType
      })
    }

    const [initialValue] = React.useState(() => {
      return canonical(defaultValue)
    })
    const [uncontrolledValue, setUncontrolledValue] =
      React.useState(initialValue)
    const controlled = controlledValue !== undefined
    const value = controlled ? canonical(controlledValue) : uncontrolledValue
    const [composition, setComposition] = React.useState<null | string>(null)
    const [focused, setFocused] = React.useState(false)
    const [selection, setSelection] = React.useState<Selection | null>(null)
    const [pushBadge, setPushBadge] = React.useState(false)

    const dataProps: Record<string, unknown> = {}
    const inputProps: Record<string, unknown> = {}

    for (const [key, propValue] of Object.entries(props)) {
      ;(key.startsWith('data-') ? dataProps : inputProps)[key] = propValue
    }

    const { disabled = false, readOnly = false } = props
    const invalid =
      props['aria-invalid'] !== undefined &&
      props['aria-invalid'] !== false &&
      props['aria-invalid'] !== 'false'

    const syncSelection = React.useCallback(() => {
      const input = inputElementRef.current

      if (!isFocused(input)) {
        setSelection(null)

        return
      }

      if (composing.current) {
        // Moving the selection now would commit or cancel the composition.
        setSelection(
          input.selectionStart === null || input.selectionEnd === null
            ? null
            : [input.selectionStart, input.selectionEnd]
        )

        return
      }

      const next = normalizeSelection(input, length, previousSelection.current)
      previousSelection.current = next
      setSelection(next)
    }, [length])

    const placeCaret = React.useCallback(
      (index: number) => {
        const input = inputElementRef.current

        if (!input) {
          return
        }

        const position = Math.min(index, input.value.length, length - 1)
        input.setSelectionRange(
          position,
          position < input.value.length ? position + 1 : position
        )
        previousSelection.current = null
        syncSelection()
      },
      [length, syncSelection]
    )

    // Latest render state for event handlers and the imperative handle.
    const latest = React.useRef({ controlled, onValueChange, value })
    useIsomorphicLayoutEffect(() => {
      latest.current = { controlled, onValueChange, value }
    })

    const commit = React.useCallback(
      (next: string, reason: InputOTPChangeReason, event?: Event) => {
        const { current } = latest

        if (next === current.value) {
          return true
        }

        const details = createChangeDetails(reason, event)
        current.onValueChange?.(next, details)

        if (details.isCanceled) {
          return false
        }

        committed.current = next

        if (!current.controlled) {
          setUncontrolledValue(next)
        }

        return true
      },
      []
    )

    const restoreSelection = (range: Selection | null, fresh = false) => {
      // React restores the controlled input value after the handler returns.
      queueMicrotask(() => {
        if (range) {
          inputElementRef.current?.setSelectionRange(range[0], range[1])
        }

        if (fresh) {
          previousSelection.current = null
        }

        syncSelection()
      })
    }

    /** Replaces `value[start, end)` with raw text through the one pipeline. */
    const applyEdit = (
      start: number,
      end: number,
      text: string,
      kind: 'input' | 'paste',
      event: Event
    ) => {
      const range = previousSelection.current
      const prepared =
        kind === 'paste' ? preprocessOtpPaste(text, pastePreprocess) : text
      const options = { transformChar, validateChar, validationType }
      // A whole code replaces the field, wherever the caret was; its first
      // `length` accepted characters win.
      const whole =
        prepared.replaceAll(/\s/gu, '').length >= length
          ? normalizeOtpValue(prepared, { ...options, length })
          : ''
      const [from, to, accepted] =
        whole.length === length
          ? [0, value.length, whole]
          : [
              start,
              end,
              // No room after the last cell: nothing is accepted there.
              start < length
                ? normalizeOtpValue(prepared, {
                    ...options,
                    indexOffset: start,
                    length: length - start
                  })
                : ''
            ]

      // Text that adds no character (a rejected one, a space) is no edit.
      if (accepted === '' && prepared !== '') {
        if (prepared.trim() !== '') {
          onValueInvalid?.(prepared, {
            event,
            reason: kind === 'paste' ? 'input-paste' : 'input-change'
          })
        }

        restoreSelection(range)

        return
      }

      const next = canonical(value.slice(0, from) + accepted + value.slice(to))
      const caret = Math.min(from + accepted.length, next.length)
      const reason =
        kind === 'paste'
          ? 'input-paste'
          : accepted === ''
            ? 'input-clear'
            : 'input-change'

      if (next === value) {
        // No render follows, and React puts the old text back: move on here.
        restoreSelection([caret, caret], true)

        return
      }

      pendingCaret.current = caret

      if (!commit(next, reason, event)) {
        pendingCaret.current = null
        restoreSelection(range)
      }
    }

    /**
     * Locates a native edit from the selection it replaced when that explains
     * the new text exactly; otherwise (autofill, deletion, IME) diffs the old
     * and new strings.
     */
    const applyRaw = (raw: string, caret: null | number, event: Event) => {
      const range = editRange.current
      editRange.current = null

      if (
        range &&
        caret !== null &&
        caret >= range[0] &&
        raw ===
          value.slice(0, range[0]) +
            raw.slice(range[0], caret) +
            value.slice(range[1])
      ) {
        applyEdit(
          range[0],
          range[1],
          raw.slice(range[0], caret),
          'input',
          event
        )

        return
      }

      let start = 0

      while (
        start < value.length &&
        start < raw.length &&
        value[start] === raw[start]
      ) {
        start += 1
      }

      let suffix = 0

      while (
        suffix < value.length - start &&
        suffix < raw.length - start &&
        value[value.length - 1 - suffix] === raw[raw.length - 1 - suffix]
      ) {
        suffix += 1
      }

      const inserted = raw.slice(start, raw.length - suffix)

      // More characters than cells without a whole code among the inserted
      // text (a script or an extension set the value): the new text's first
      // `length` characters win. A whole inserted code wins in `applyEdit`.
      if (
        raw.replaceAll(/\s/gu, '').length > length &&
        inserted.replaceAll(/\s/gu, '').length < length
      ) {
        applyEdit(0, value.length, raw, 'input', event)

        return
      }

      applyEdit(start, value.length - suffix, inserted, 'input', event)
    }

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.currentTarget.value

      if ((event.nativeEvent as InputEvent).isComposing) {
        // React would reset a controlled input mid-composition otherwise.
        setComposition(raw)

        return
      }

      setComposition(null)
      applyRaw(raw, event.currentTarget.selectionStart, event.nativeEvent)
    }

    const focusInput = React.useCallback((options?: FocusOptions) => {
      inputElementRef.current?.focus(options)
    }, [])

    React.useImperativeHandle(forwardedRef, () => {
      return {
        clear(options = {}) {
          if (latest.current.value !== '' && commit('', 'imperative')) {
            pendingCaret.current = 0
          }

          if (options.focus) {
            focusInput()
            placeCaret(0)
          }
        },
        focus: focusInput,
        get input() {
          return inputElementRef.current
        },
        get root() {
          return rootRef.current
        }
      }
    }, [commit, focusInput, placeCaret])

    // Caret placement after a committed value, or after an outside change.
    useIsomorphicLayoutEffect(() => {
      const input = inputElementRef.current

      if (!isFocused(input) || composing.current) {
        pendingCaret.current = null

        return
      }

      const caret = pendingCaret.current ?? value.length
      pendingCaret.current = null

      // A forward delete keeps the caret on the deleted character's cell.
      if (inputType.current === 'deleteContentForward') {
        previousSelection.current = null
      }

      inputType.current = ''
      input.setSelectionRange(caret, caret)
      syncSelection()
    }, [value, syncSelection])

    useIsomorphicLayoutEffect(() => {
      const input = inputElementRef.current

      if (!input) {
        return
      }

      const { ownerDocument } = input
      insertGlobalStyles(input)

      const recordRange = (event: Event) => {
        inputType.current = (event as InputEvent).inputType
        editRange.current =
          input.selectionStart === null || input.selectionEnd === null
            ? null
            : [input.selectionStart, input.selectionEnd]
      }

      input.addEventListener('beforeinput', recordRange)
      ownerDocument.addEventListener('selectionchange', syncSelection, true)

      return () => {
        input.removeEventListener('beforeinput', recordRange)
        ownerDocument.removeEventListener(
          'selectionchange',
          syncSelection,
          true
        )
      }
    }, [syncSelection])

    // Password managers anchor their badge to the input's right edge. Once
    // one shows up, the input grows into a clipped gutter past the last cell
    // so the badge sits beside the cells rather than over them.
    React.useEffect(() => {
      const root = rootRef.current

      if (!focused || pushBadge || !root) {
        return
      }

      const detect = () => {
        if (hasBadgeOver(root) && badgeSpace(root) >= BADGE_SPACE) {
          setPushBadge(true)
        }
      }

      const timeouts = [0, 2000, 5000].map((delay) => {
        return window.setTimeout(detect, delay)
      })

      return () => {
        for (const timeout of timeouts) {
          window.clearTimeout(timeout)
        }
      }
    }, [focused, pushBadge])

    // Completion fires on the edge into a complete value, once per value,
    // for a change after mount. A value present at mount, or an outside
    // return to it (form reset, RHF reset), is no completion.
    const [mountValue] = React.useState(value)
    const completed = React.useRef(
      mountValue.length === length ? mountValue : null
    )
    const onCompleteRef = React.useRef(onComplete)
    React.useEffect(() => {
      onCompleteRef.current = onComplete
    })
    React.useEffect(() => {
      if (value.length !== length) {
        completed.current = null

        return
      }

      if (completed.current === value) {
        return
      }

      completed.current = value

      if (value === mountValue && committed.current !== value) {
        return
      }

      onCompleteRef.current?.(value)

      if (autoSubmit) {
        inputElementRef.current?.form?.requestSubmit()
      }
    }, [autoSubmit, length, mountValue, value])

    useDelayedFocus(autoFocus, focusInput)
    useFormReset({
      enabled: !controlled,
      formId: props.form,
      reset: () => {
        setUncontrolledValue(initialValue)
      },
      resolveForm: () => {
        return inputElementRef.current?.form
      }
    })

    const mergedInputRef = React.useMemo(() => {
      return mergeRefs(inputElementRef, inputRef)
    }, [inputRef])
    const shown = composition ?? value
    const registerSlot = React.useCallback(
      (index: number, element: HTMLElement | null) => {
        if (element) {
          slotElements.current.set(index, element)
        } else {
          slotElements.current.delete(index)
        }
      },
      []
    )
    const context = React.useMemo<InputOTPContextValue>(() => {
      const slots = Array.from({ length }, (_, index) => {
        const char = shown[index] ?? null
        const isActive =
          selection !== null &&
          (selection[0] === selection[1]
            ? index === selection[0]
            : index >= selection[0] && index < selection[1])

        return {
          char: char !== null && mask ? '•' : char,
          hasFakeCaret: isActive && char === null,
          isActive,
          isFilled: char !== null,
          isInvalid: invalid
        }
      })

      return { disabled, registerSlot, slots }
    }, [disabled, invalid, length, mask, registerSlot, selection, shown])

    /** The cell nearest to a horizontal point, by its center. */
    const caretFromPoint = (clientX: number) => {
      let nearest = -1
      let distance = Infinity

      for (const [index, element] of slotElements.current) {
        const rect = element.getBoundingClientRect()
        const offset = Math.abs(clientX - (rect.left + rect.width / 2))

        if (offset < distance) {
          nearest = index
          distance = offset
        }
      }

      if (nearest >= 0) {
        placeCaret(nearest)
      }
    }

    return (
      <div
        {...dataProps}
        ref={rootRef}
        className={className}
        style={{
          position: 'relative',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          ...style
        }}
        data-slot="input-otp"
        data-complete={value.length === length || undefined}
        data-disabled={disabled || undefined}
        data-focused={focused || undefined}
        data-invalid={invalid || undefined}
        dir="ltr"
        translate="no"
      >
        <InputOTPContext.Provider value={context}>
          {children}
        </InputOTPContext.Provider>
        <input
          autoCapitalize="off"
          autoComplete="one-time-code"
          autoCorrect="off"
          spellCheck={false}
          {...inputProps}
          ref={mergedInputRef}
          autoFocus={autoFocus === true}
          data-slot="input-otp-input"
          dir="ltr"
          inputMode={inputMode ?? INPUT_MODES[validationType]}
          pattern={PATTERNS[validationType]}
          style={inputStyle(pushBadge, disabled)}
          type="text"
          value={shown}
          onBlur={(event) => {
            setFocused(false)
            setSelection(null)
            onBlur?.(event)
          }}
          onChange={handleChange}
          onClick={(event) => {
            // Touch and pen taps focus natively; then the tapped cell wins.
            if (pointerType.current !== 'mouse' && event.detail < 2) {
              caretFromPoint(event.clientX)
            }

            onClick?.(event)
          }}
          onCompositionEnd={(event) => {
            const raw = event.currentTarget.value
            composing.current = false
            setComposition(null)
            editRange.current = null

            if (raw !== value) {
              applyRaw(raw, null, event.nativeEvent)
            }

            onCompositionEnd?.(event)
          }}
          onCompositionStart={(event) => {
            composing.current = true
            onCompositionStart?.(event)
          }}
          onFocus={(event) => {
            setFocused(true)
            const input = event.currentTarget
            const end = input.value.length
            input.setSelectionRange(Math.min(end, length - 1), end)
            previousSelection.current = null
            syncSelection()
            onFocus?.(event)
          }}
          onMouseDown={(event) => {
            // A click selects the cell under the pointer, never a text offset.
            if (
              !disabled &&
              event.button === 0 &&
              event.detail < 2 &&
              pointerType.current === 'mouse'
            ) {
              event.preventDefault()
              focusInput()
              caretFromPoint(event.clientX)
            }

            onMouseDown?.(event)
          }}
          onPaste={(event) => {
            if (!readOnly && !disabled) {
              event.preventDefault()
              const input = event.currentTarget
              applyEdit(
                input.selectionStart ?? value.length,
                input.selectionEnd ?? value.length,
                event.clipboardData.getData('text/plain'),
                'paste',
                event.nativeEvent
              )
            }

            onPaste?.(event)
          }}
          onPointerDown={(event) => {
            pointerType.current = event.pointerType
            onPointerDown?.(event)
          }}
        />
      </div>
    )
  }
)

/** The drawn state of one cell, for hosts that render their own cells. */
export function useInputOTPSlot(index: number) {
  const context = React.useContext(InputOTPContext)

  if (!context) {
    throw new Error('OTP slots must be rendered inside an OTP root.')
  }

  const { registerSlot } = context
  const ref = React.useCallback(
    (element: HTMLElement | null) => {
      return registerSlot(index, element)
    },
    [index, registerSlot]
  )

  return {
    ...(context.slots[index] ?? {
      char: null,
      hasFakeCaret: false,
      isActive: false,
      isFilled: false,
      isInvalid: false
    }),
    disabled: context.disabled,
    ref
  }
}

export const InputOTPGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'>
>(function InputOTPGroup(props, ref) {
  return <div {...props} ref={ref} data-slot="input-otp-group" />
})

export interface InputOTPSlotProps extends Omit<
  React.ComponentPropsWithoutRef<'div'>,
  'children'
> {
  index: number
}

/** A drawn cell. Hidden from assistive technology: the input is announced. */
export const InputOTPSlot = React.forwardRef<HTMLDivElement, InputOTPSlotProps>(
  function InputOTPSlot({ index, ...props }, forwardedRef) {
    const slot = useInputOTPSlot(index)
    const ref = React.useMemo(() => {
      return mergeRefs(slot.ref, forwardedRef)
    }, [slot.ref, forwardedRef])

    return (
      <div
        {...props}
        ref={ref}
        aria-hidden="true"
        data-slot="input-otp-slot"
        data-active={slot.isActive || undefined}
        data-disabled={slot.disabled || undefined}
        data-fake-caret={slot.hasFakeCaret || undefined}
        data-filled={slot.isFilled || undefined}
        data-invalid={slot.isInvalid || undefined}
      >
        {slot.char}
        {slot.hasFakeCaret ? <span data-slot="input-otp-caret" /> : null}
      </div>
    )
  }
)

export const InputOTPSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'>
>(function InputOTPSeparator({ children, ...props }, ref) {
  return (
    <div
      {...props}
      ref={ref}
      aria-hidden="true"
      data-slot="input-otp-separator"
    >
      {children ?? '−'}
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

type SlotProps = Omit<InputOTPSlotProps, 'index'>

export interface OtpInputProps extends Omit<
  InputOTPProps,
  'aria-describedby' | 'children'
> {
  classNames?: OtpInputClassNames
  error?: boolean
  helperText?: React.ReactNode
  label: React.ReactNode
  separatorAfter?: readonly number[]
  slotProps?: SlotProps | ((index: number) => SlotProps | undefined)
}

const EMPTY_CLASS_NAMES: OtpInputClassNames = {}
const EMPTY_SEPARATOR_AFTER: readonly number[] = []

/** Complete field. Import `/shadcn.css` for the optional semantic skin. */
export const OtpInput = React.forwardRef<InputOTPHandle, OtpInputProps>(
  function OtpInput(
    {
      classNames = EMPTY_CLASS_NAMES,
      error = false,
      helperText,
      id: idProp,
      label,
      length,
      separatorAfter = EMPTY_SEPARATOR_AFTER,
      slotProps,
      ...props
    },
    ref
  ) {
    const generatedId = React.useId()
    const id = idProp ?? generatedId
    const descriptionId = `${id}-description`
    const hasHelperText = helperText !== null && helperText !== undefined

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
          aria-invalid={error || undefined}
          {...props}
          ref={ref}
          id={id}
          length={length}
          aria-describedby={hasHelperText ? descriptionId : undefined}
        >
          <InputOTPGroup className={classNames.group}>
            {Array.from({ length }, (_, index) => {
              const resolved =
                (typeof slotProps === 'function'
                  ? slotProps(index)
                  : slotProps) ?? {}

              return (
                <React.Fragment key={index}>
                  <InputOTPSlot
                    {...resolved}
                    index={index}
                    className={resolved.className ?? classNames.slot}
                  />
                  {separatorAfter.includes(index) && index < length - 1 ? (
                    <InputOTPSeparator className={classNames.separator} />
                  ) : null}
                </React.Fragment>
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
)
