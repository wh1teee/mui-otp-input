export const DEFAULT_OTP_LENGTH = 4

export type OtpValidationType = 'alphanumeric' | 'none' | 'numeric'

export type OtpInputReason = 'input-change' | 'input-paste' | 'keyboard'

export type OtpInvalidDetails = {
  event: Event
  reason: Extract<OtpInputReason, 'input-change' | 'input-paste'>
}

export type PastePreprocess =
  'digits-only' | 'none' | 'trim' | ((value: string) => string)

export type NormalizeOtpValueOptions = {
  indexOffset?: number
  length?: number
  normalizeValue?: (value: string) => string
  transformChar?: (character: string, index: number) => string
  validateChar?: (character: string, index: number) => boolean
  validationType?: OtpValidationType
}

function normalizeLength(length: number | undefined) {
  if (length === undefined) {
    return DEFAULT_OTP_LENGTH
  }

  if (!Number.isInteger(length) || length <= 0) {
    throw new RangeError('OTP length must be a positive integer.')
  }

  return length
}

function matchesValidationType(
  character: string,
  validationType: OtpValidationType
) {
  switch (validationType) {
    case 'numeric':
      return /^[0-9]$/u.test(character)
    case 'alphanumeric':
      return /^[A-Za-z0-9]$/u.test(character)
    case 'none':
      return true
    default:
      return false
  }
}

function normalizeCharacters(
  value: string,
  options: Omit<NormalizeOtpValueOptions, 'normalizeValue'>
) {
  const length = normalizeLength(options.length)
  const validationType = options.validationType ?? 'none'
  const indexOffset = options.indexOffset ?? 0
  const result: string[] = []

  for (const [sourceIndex, sourceCharacter] of Array.from(
    value.replaceAll(/\s/gu, '')
  ).entries()) {
    const index = indexOffset + sourceIndex
    const transformed =
      options.transformChar?.(sourceCharacter, index) ?? sourceCharacter

    for (const character of Array.from(transformed)) {
      if (!matchesValidationType(character, validationType)) {
        continue
      }

      if (options.validateChar && !options.validateChar(character, index)) {
        continue
      }

      result.push(character)

      if (result.length === length) {
        return result.join('')
      }
    }
  }

  return result.join('')
}

/**
 * Normalizes controlled, default, typed, autofilled, and pasted OTP candidates.
 * Transformation runs before validation so legacy `transformChar` behavior is
 * preserved even when it maps an otherwise invalid character to a valid one.
 */
export function normalizeOtpValue(
  value: null | string | undefined,
  options: NormalizeOtpValueOptions = {}
) {
  const normalized = normalizeCharacters(value ?? '', options)

  if (!options.normalizeValue) {
    return normalized
  }

  return normalizeCharacters(options.normalizeValue(normalized), {
    indexOffset: options.indexOffset,
    length: options.length,
    validationType: options.validationType,
    validateChar: options.validateChar
  })
}

export function normalizeOtpCharacter(
  character: string,
  index: number,
  options: Pick<
    NormalizeOtpValueOptions,
    'transformChar' | 'validateChar' | 'validationType'
  > = {}
) {
  const transformed = options.transformChar?.(character, index) ?? character
  const validationType = options.validationType ?? 'none'

  for (const candidate of Array.from(transformed)) {
    if (!matchesValidationType(candidate, validationType)) {
      continue
    }

    if (options.validateChar && !options.validateChar(candidate, index)) {
      continue
    }

    return candidate
  }

  return ''
}

export function preprocessOtpPaste(
  value: string,
  strategy: PastePreprocess = 'none'
) {
  if (typeof strategy === 'function') {
    return strategy(value)
  }

  switch (strategy) {
    case 'digits-only':
      return value.replaceAll(/[^0-9]/gu, '')
    case 'trim':
      return value.trim()
    case 'none':
      return value
    default:
      return value
  }
}

export function isOtpComplete(value: string, length = DEFAULT_OTP_LENGTH) {
  return Array.from(value).length === normalizeLength(length)
}
