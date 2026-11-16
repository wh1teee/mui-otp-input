'use client'

import React from 'react'

/**
 * Restores the initial value of an uncontrolled field when its form resets.
 * A later listener may still cancel the reset, so the decision waits until
 * the event has been dispatched.
 */
export function useFormReset({
  enabled,
  formId,
  reset,
  resolveForm
}: {
  enabled: boolean
  formId: string | undefined
  reset: () => void
  resolveForm: () => Element | null | undefined
}) {
  const latest = React.useRef({ reset, resolveForm })

  React.useEffect(() => {
    latest.current = { reset, resolveForm }
  })

  React.useEffect(() => {
    if (!enabled) {
      return
    }

    const form = latest.current.resolveForm()

    if (!(form instanceof HTMLFormElement)) {
      return
    }

    const handleReset = (event: Event) => {
      queueMicrotask(() => {
        if (!event.defaultPrevented) {
          latest.current.reset()
        }
      })
    }

    form.addEventListener('reset', handleReset)

    return () => {
      return form.removeEventListener('reset', handleReset)
    }
  }, [enabled, formId])
}

/** `autoFocus={milliseconds}` focuses the field once after that delay. */
export function useDelayedFocus(
  autoFocus: boolean | number,
  focus: () => void
) {
  React.useEffect(() => {
    if (typeof autoFocus !== 'number') {
      return
    }

    const timeout = window.setTimeout(focus, autoFocus)

    return () => {
      return window.clearTimeout(timeout)
    }
  }, [autoFocus, focus])
}
