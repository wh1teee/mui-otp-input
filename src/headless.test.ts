import { describe, expect, test } from 'vitest'
import {
  isOtpComplete,
  normalizeOtpValue,
  preprocessOtpPaste
} from './headless'

describe('headless OTP normalization', () => {
  test('transforms a character before applying numeric validation', () => {
    // #given / #when
    const value = normalizeOtpValue('O12', {
      length: 3,
      transformChar: (character) => {
        return character === 'O' ? '0' : character
      },
      validationType: 'numeric'
    })

    // #then
    expect(value).toBe('012')
  })

  test('preserves source indexes for legacy character validation', () => {
    // #given / #when
    const value = normalizeOtpValue('ABCD', {
      length: 4,
      validateChar: (_character, index) => {
        return index % 2 === 0
      }
    })

    // #then
    expect(value).toBe('AC')
  })

  test('revalidates custom normalizer output before exposing it', () => {
    // #given / #when
    const value = normalizeOtpValue('12', {
      length: 4,
      normalizeValue: (candidate) => {
        return `${candidate}AB`
      },
      validationType: 'numeric'
    })

    // #then
    expect(value).toBe('12')
  })

  test('supports the fork digits-only paste preprocessing contract', () => {
    // #given / #when
    const value = preprocessOtpPaste('Your code is 12-34', 'digits-only')

    // #then
    expect(value).toBe('1234')
  })

  test('detects completion by Unicode code points rather than UTF-16 units', () => {
    // #given / #when / #then
    expect(isOtpComplete('AB12', 4)).toBe(true)
  })
})
