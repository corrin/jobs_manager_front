/**
 * Date utilities with guard clauses and early returns
 * Following SRP principle for date handling
 */

/**
 * Safely create a Date object with guard clause for undefined values
 */
export function createSafeDate(dateValue: string | undefined): Date {
  // Guard clause - early return for undefined/null
  if (!dateValue) {
    return new Date()
  }

  try {
    const date = new Date(dateValue)
    // Guard clause - early return for invalid dates
    if (isNaN(date.getTime())) {
      console.warn('Invalid date value:', dateValue)
      return new Date()
    }
    return date
  } catch (error) {
    console.warn('Error creating date:', error)
    return new Date()
  }
}

/**
 * Safely get a numeric value with guard clause
 */
export function getSafeNumber(value: number | undefined, defaultValue: number = 0): number {
  // Guard clause - early return for undefined/null
  if (value === undefined || value === null || isNaN(value)) {
    return defaultValue
  }

  return value
}

/**
 * Safely get a string value with guard clause
 */
export function getSafeString(value: string | undefined, defaultValue: string = ''): string {
  // Guard clause - early return for undefined/null
  if (!value) {
    return defaultValue
  }

  return value
}
