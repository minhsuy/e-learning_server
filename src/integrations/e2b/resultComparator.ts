/**
 * TMDEMY — RESULT COMPARATOR
 * 
 * Deep structural comparator for grading actual code outputs against expected outputs.
 * 
 * Rules:
 * - Number: supports floating-point tolerance (default 1e-7), NaN, and Infinity.
 * - String & Boolean: strict equality (no silent type coercion like "15" == 15).
 * - Null & Undefined: distinguished explicitly.
 * - Array: order-sensitive element-by-element deep comparison.
 * - Object: structural deep comparison (key insertion order insensitive).
 */

export interface ComparisonOptions {
  floatTolerance?: number
}

export interface ComparisonResult {
  isEqual: boolean
  reason?: string
}

const DEFAULT_FLOAT_TOLERANCE = 1e-7

/**
 * Unwrap special types emitted by the safe JavaScript harness
 */
function unwrapSpecialType(val: unknown): unknown {
  if (val && typeof val === 'object' && '__specialType' in val) {
    const specialObj = val as { __specialType: string; value?: unknown }
    const special = specialObj.__specialType
    if (special === 'undefined') return undefined
    if (special === 'nan') return NaN
    if (special === 'infinity') return Infinity
    if (special === '-infinity') return -Infinity
    if (special === 'bigint') return specialObj.value
  }
  return val
}

function formatValue(val: unknown): string {
  if (val === undefined) return 'undefined'
  if (val === null) return 'null'
  if (typeof val === 'number') {
    if (Number.isNaN(val)) return 'NaN'
    if (val === Infinity) return 'Infinity'
    if (val === -Infinity) return '-Infinity'
    return String(val)
  }
  if (typeof val === 'string') return `"${val}"`
  if (typeof val === 'boolean') return String(val)
  try {
    return JSON.stringify(val)
  } catch {
    return String(val)
  }
}

export function compareOutputs(
  rawActual: unknown,
  rawExpected: unknown,
  options?: ComparisonOptions
): ComparisonResult {
  const actual = unwrapSpecialType(rawActual)
  const expected = unwrapSpecialType(rawExpected)
  const tolerance = options?.floatTolerance ?? DEFAULT_FLOAT_TOLERANCE

  // 1. Identical reference or primitive equality
  if (actual === expected) {
    return { isEqual: true }
  }

  // 2. Undefined check
  if (actual === undefined || expected === undefined) {
    if (actual === expected) return { isEqual: true }
    return {
      isEqual: false,
      reason: `Expected ${formatValue(expected)}, but received ${formatValue(actual)}`
    }
  }

  // 3. Null check
  if (actual === null || expected === null) {
    if (actual === expected) return { isEqual: true }
    return {
      isEqual: false,
      reason: `Expected ${formatValue(expected)}, but received ${formatValue(actual)}`
    }
  }

  // 4. Number comparison (with float tolerance & NaN check)
  if (typeof actual === 'number' && typeof expected === 'number') {
    if (Number.isNaN(actual) && Number.isNaN(expected)) {
      return { isEqual: true }
    }
    if (Number.isNaN(actual) || Number.isNaN(expected)) {
      return {
        isEqual: false,
        reason: `Expected ${formatValue(expected)}, but received ${formatValue(actual)}`
      }
    }
    if (!Number.isFinite(actual) || !Number.isFinite(expected)) {
      return {
        isEqual: actual === expected,
        reason: actual === expected
          ? undefined
          : `Expected ${formatValue(expected)}, but received ${formatValue(actual)}`
      }
    }
    // Floating point comparison with tolerance
    const diff = Math.abs(actual - expected)
    if (diff <= tolerance) {
      return { isEqual: true }
    }
    return {
      isEqual: false,
      reason: `Expected ${expected}, but received ${actual} (difference ${diff} exceeds tolerance ${tolerance})`
    }
  }

  // 5. Strict Type check (reject coercion, e.g., "15" !== 15)
  if (typeof actual !== typeof expected) {
    return {
      isEqual: false,
      reason: `Type mismatch: expected type "${typeof expected}" (${formatValue(expected)}), but received type "${typeof actual}" (${formatValue(actual)})`
    }
  }

  // 6. String / Boolean comparison
  if (typeof actual === 'string' || typeof actual === 'boolean') {
    if (actual === expected) {
      return { isEqual: true }
    }
    return {
      isEqual: false,
      reason: `Expected ${formatValue(expected)}, but received ${formatValue(actual)}`
    }
  }

  // 7. Array comparison (order sensitive)
  const actualIsArray = Array.isArray(actual)
  const expectedIsArray = Array.isArray(expected)

  if (actualIsArray || expectedIsArray) {
    if (!actualIsArray || !expectedIsArray) {
      return {
        isEqual: false,
        reason: `Type mismatch: expected ${expectedIsArray ? 'an Array' : 'a non-Array'}, but received ${actualIsArray ? 'an Array' : 'a non-Array'}`
      }
    }

    const actualArr = actual as unknown[]
    const expectedArr = expected as unknown[]

    if (actualArr.length !== expectedArr.length) {
      return {
        isEqual: false,
        reason: `Array lengths differ: expected length ${expectedArr.length}, but received length ${actualArr.length}`
      }
    }

    for (let i = 0; i < expectedArr.length; i++) {
      const elemRes = compareOutputs(actualArr[i], expectedArr[i], options)
      if (!elemRes.isEqual) {
        return {
          isEqual: false,
          reason: `Array mismatch at index [${i}]: ${elemRes.reason}`
        }
      }
    }

    return { isEqual: true }
  }

  // 8. Plain Object comparison (key order insensitive)
  if (typeof actual === 'object' && typeof expected === 'object') {
    const actualObj = actual as Record<string, unknown>
    const expectedObj = expected as Record<string, unknown>

    const actualKeys = Object.keys(actualObj).sort()
    const expectedKeys = Object.keys(expectedObj).sort()

    if (actualKeys.length !== expectedKeys.length) {
      const missingKeys = expectedKeys.filter((k) => !actualKeys.includes(k))
      const extraKeys = actualKeys.filter((k) => !expectedKeys.includes(k))
      const diffParts: string[] = []
      if (missingKeys.length > 0) diffParts.push(`missing keys: [${missingKeys.join(', ')}]`)
      if (extraKeys.length > 0) diffParts.push(`extra keys: [${extraKeys.join(', ')}]`)
      return {
        isEqual: false,
        reason: `Object structure differs (${diffParts.join('; ')})`
      }
    }

    // Check all key names match
    for (let i = 0; i < expectedKeys.length; i++) {
      if (actualKeys[i] !== expectedKeys[i]) {
        return {
          isEqual: false,
          reason: `Object key names differ: expected key "${expectedKeys[i]}", but found "${actualKeys[i]}"`
        }
      }
    }

    // Check all values match recursively
    for (const key of expectedKeys) {
      const valRes = compareOutputs(actualObj[key], expectedObj[key], options)
      if (!valRes.isEqual) {
        return {
          isEqual: false,
          reason: `Object property "${key}" differs: ${valRes.reason}`
        }
      }
    }

    return { isEqual: true }
  }

  return {
    isEqual: false,
    reason: `Unsupported type comparison between ${formatValue(expected)} and ${formatValue(actual)}`
  }
}
