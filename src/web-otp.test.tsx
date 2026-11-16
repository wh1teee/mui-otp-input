import { afterEach, describe, expect, test, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { isWebOtpSupported, requestWebOtp } from './headless'
import { useWebOtp } from './shadcn'

type PendingRequest = {
  options: CredentialRequestOptions
  resolve: (credential: { code: string } | null) => void
}

/** A WebOTP browser whose requests the test resolves by hand. */
function mockWebOtp() {
  const requests: PendingRequest[] = []
  const get = vi.fn((options: CredentialRequestOptions) => {
    return new Promise((resolve, reject) => {
      options.signal?.addEventListener('abort', () => {
        reject(new DOMException('Aborted', 'AbortError'))
      })
      requests.push({ options, resolve })
    })
  })
  vi.stubGlobal('OTPCredential', class {})
  Object.defineProperty(navigator, 'credentials', {
    configurable: true,
    value: { get }
  })

  return { get, requests }
}

afterEach(() => {
  vi.unstubAllGlobals()
  Reflect.deleteProperty(navigator, 'credentials')
})

describe('requestWebOtp', () => {
  test('is a no-op where WebOTP is unsupported', async () => {
    expect(isWebOtpSupported()).toBe(false)
    await expect(requestWebOtp({ length: 6 })).resolves.toBeNull()
  })

  test('returns a code of the expected length and digits only', async () => {
    const { requests } = mockWebOtp()

    const valid = requestWebOtp({ length: 6 })
    requests[0].resolve({ code: '123456' })
    await expect(valid).resolves.toBe('123456')
    expect(requests[0].options).toMatchObject({ otp: { transport: ['sms'] } })

    const short = requestWebOtp({ length: 6 })
    requests[1].resolve({ code: '1234' })
    await expect(short).resolves.toBeNull()

    const letters = requestWebOtp({ length: 6 })
    requests[2].resolve({ code: '12a456' })
    await expect(letters).resolves.toBeNull()
  })
})

describe('useWebOtp', () => {
  test('delivers a valid code once', async () => {
    const { requests } = mockWebOtp()
    const onCode = vi.fn()
    renderHook(() => {
      return useWebOtp({ length: 6, onCode })
    })

    await waitFor(() => {
      return expect(requests).toHaveLength(1)
    })
    requests[0].resolve({ code: '654321' })

    await waitFor(() => {
      return expect(onCode).toHaveBeenCalledWith('654321')
    })
    expect(onCode).toHaveBeenCalledTimes(1)
  })

  test('ignores a malformed code', async () => {
    const { requests } = mockWebOtp()
    const onCode = vi.fn()
    renderHook(() => {
      return useWebOtp({ length: 6, onCode })
    })

    await waitFor(() => {
      return expect(requests).toHaveLength(1)
    })
    requests[0].resolve({ code: '12 456' })
    await Promise.resolve()
    await new Promise((resolve) => {
      setTimeout(resolve, 0)
    })

    expect(onCode).not.toHaveBeenCalled()
  })

  test('aborts on unmount', async () => {
    const { requests } = mockWebOtp()
    const onCode = vi.fn()
    const { unmount } = renderHook(() => {
      return useWebOtp({ length: 6, onCode })
    })
    await waitFor(() => {
      return expect(requests).toHaveLength(1)
    })

    unmount()

    expect(requests[0].options.signal?.aborted).toBe(true)
    requests[0].resolve({ code: '123456' })
    await new Promise((resolve) => {
      setTimeout(resolve, 0)
    })
    expect(onCode).not.toHaveBeenCalled()
  })

  test('aborts when disabled and through abort()', async () => {
    const { get, requests } = mockWebOtp()
    const { rerender, result } = renderHook(
      ({ enabled }) => {
        return useWebOtp({ enabled, length: 6, onCode: vi.fn() })
      },
      { initialProps: { enabled: true } }
    )
    await waitFor(() => {
      return expect(requests).toHaveLength(1)
    })

    rerender({ enabled: false })
    expect(requests[0].options.signal?.aborted).toBe(true)

    rerender({ enabled: true })
    await waitFor(() => {
      return expect(requests).toHaveLength(2)
    })
    result.current.abort()
    expect(requests[1].options.signal?.aborted).toBe(true)
    expect(get).toHaveBeenCalledTimes(2)
  })

  test('restart() requests again after abort(), for a resend', async () => {
    const { requests } = mockWebOtp()
    const onCode = vi.fn()
    const { result } = renderHook(() => {
      return useWebOtp({ length: 6, onCode })
    })
    await waitFor(() => {
      return expect(requests).toHaveLength(1)
    })

    act(() => {
      result.current.abort()
    })
    expect(requests[0].options.signal?.aborted).toBe(true)

    act(() => {
      result.current.restart()
    })
    await waitFor(() => {
      return expect(requests).toHaveLength(2)
    })
    requests[1].resolve({ code: '111222' })
    await waitFor(() => {
      return expect(onCode).toHaveBeenCalledWith('111222')
    })
    expect(onCode).toHaveBeenCalledTimes(1)
  })

  test('does not request while disabled', () => {
    const { get } = mockWebOtp()
    renderHook(() => {
      return useWebOtp({ enabled: false, length: 6, onCode: vi.fn() })
    })
    expect(get).not.toHaveBeenCalled()
  })
})
