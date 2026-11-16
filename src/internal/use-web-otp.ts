'use client'

import React from 'react'
import { requestWebOtp, type WebOtpTransport } from '../headless'

export type UseWebOtpOptions = {
  /** Requests a code while true; turning it false aborts the request. */
  enabled?: boolean
  length: number
  /** Receives a valid code once per request. */
  onCode: (code: string) => void
  transport?: readonly WebOtpTransport[]
}

export type UseWebOtpResult = {
  /** Aborts the pending request, for example on submit or resend. */
  abort: () => void
}

const SMS: readonly WebOtpTransport[] = ['sms']

/**
 * Fills a code from an SMS through the WebOTP API where the browser supports
 * it. A no-op on the server and in browsers without `OTPCredential`.
 */
export function useWebOtp({
  enabled = true,
  length,
  onCode,
  transport = SMS
}: UseWebOtpOptions): UseWebOtpResult {
  const onCodeRef = React.useRef(onCode)
  const controllerRef = React.useRef<AbortController | null>(null)
  const transportKey = transport.join(' ')

  React.useEffect(() => {
    onCodeRef.current = onCode
  })

  React.useEffect(() => {
    if (!enabled) {
      return
    }

    const controller = new AbortController()
    controllerRef.current = controller
    void requestWebOtp({
      length,
      signal: controller.signal,
      transport: transportKey.split(' ') as WebOtpTransport[]
    }).then((code) => {
      if (code !== null && !controller.signal.aborted) {
        onCodeRef.current(code)
      }
    })

    return () => {
      controller.abort()
    }
  }, [enabled, length, transportKey])

  const abort = React.useCallback(() => {
    controllerRef.current?.abort()
  }, [])

  return React.useMemo(() => {
    return { abort }
  }, [abort])
}
