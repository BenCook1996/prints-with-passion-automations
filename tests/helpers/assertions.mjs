/**
 * TAP v13 Assertion Library for Prints With Passion E2E Recovery Test Runner
 *
 * Implements strict, zero-dependency assertion primitives that emit
 * structured AssertionError objects for standard TAP v13 reporting.
 */

export class AssertionError extends Error {
  constructor({ message, operator, actual, expected }) {
    super(message || 'Assertion failed');
    this.name = 'AssertionError';
    this.operator = operator || 'ok';
    this.actual = actual;
    this.expected = expected;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AssertionError);
    }
  }
}

export function assertOk(value, message = 'expected truthy value') {
  if (!value) {
    throw new AssertionError({
      message,
      operator: 'ok',
      actual: value,
      expected: true
    });
  }
  return true;
}

export function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new AssertionError({
      message: message || `expected ${JSON.stringify(actual)} === ${JSON.stringify(expected)}`,
      operator: 'equal',
      actual,
      expected
    });
  }
  return true;
}

export function assertNotEqual(actual, expected, message) {
  if (actual === expected) {
    throw new AssertionError({
      message: message || `expected ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`,
      operator: 'notEqual',
      actual,
      expected: `not ${JSON.stringify(expected)}`
    });
  }
  return true;
}

export function assertLength(value, expectedLength, message) {
  const len = value?.length ?? (typeof value === 'object' && value !== null ? Object.keys(value).length : undefined);
  if (len !== expectedLength) {
    throw new AssertionError({
      message: message || `expected length ${expectedLength}, got ${len}`,
      operator: 'length',
      actual: len,
      expected: expectedLength
    });
  }
  return true;
}

export function assertRange(value, min, max, message) {
  const num = typeof value === 'number' ? value : value?.length;
  if (num === undefined || num < min || num > max) {
    throw new AssertionError({
      message: message || `expected value in range [${min}, ${max}], got ${num}`,
      operator: 'range',
      actual: num,
      expected: `[${min}, ${max}]`
    });
  }
  return true;
}

export function assertRegex(value, regex, message) {
  const str = String(value ?? '');
  if (!regex.test(str)) {
    throw new AssertionError({
      message: message || `expected ${JSON.stringify(str)} to match ${regex}`,
      operator: 'regex',
      actual: str,
      expected: regex.toString()
    });
  }
  return true;
}

export function assertNotRegex(value, regex, message) {
  const str = String(value ?? '');
  if (regex.test(str)) {
    throw new AssertionError({
      message: message || `expected ${JSON.stringify(str)} NOT to match ${regex}`,
      operator: 'notRegex',
      actual: str,
      expected: `not ${regex.toString()}`
    });
  }
  return true;
}

export function assertIncludes(actual, searchString, message) {
  const contains = Array.isArray(actual)
    ? actual.includes(searchString)
    : String(actual ?? '').includes(searchString);

  if (!contains) {
    throw new AssertionError({
      message: message || `expected ${JSON.stringify(actual)} to include ${JSON.stringify(searchString)}`,
      operator: 'includes',
      actual,
      expected: `includes ${JSON.stringify(searchString)}`
    });
  }
  return true;
}

export function assertNotIncludes(actual, searchString, message) {
  const contains = Array.isArray(actual)
    ? actual.includes(searchString)
    : String(actual ?? '').includes(searchString);

  if (contains) {
    throw new AssertionError({
      message: message || `expected ${JSON.stringify(actual)} NOT to include ${JSON.stringify(searchString)}`,
      operator: 'notIncludes',
      actual,
      expected: `not includes ${JSON.stringify(searchString)}`
    });
  }
  return true;
}

export function assertDeepEqual(actual, expected, message) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new AssertionError({
      message: message || 'deep equality check failed',
      operator: 'deepEqual',
      actual,
      expected
    });
  }
  return true;
}
