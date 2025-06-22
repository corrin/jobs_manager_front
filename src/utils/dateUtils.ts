/**
 * Date utilities for Calendar components
 * Follows SRP - single responsibility for date conversions
 */

import type { DateValue } from '@internationalized/date'
import { CalendarDate } from '@internationalized/date'

/**
 * Converts JavaScript Date to DateValue for calendar components
 * Uses early return pattern for better readability
 */
export function toDateValue(date: Date | string | null | undefined): DateValue | undefined {
  // Guard clause - early return for invalid inputs
  if (!date) {
    return undefined
  }

  // Convert string to Date if needed
  const dateObj = typeof date === 'string' ? new Date(date) : date

  // Guard clause - early return for invalid dates
  if (isNaN(dateObj.getTime())) {
    return undefined
  }
  try {
    // Create DateValue using year, month, day
    const year = dateObj.getFullYear()
    const month = dateObj.getMonth() + 1 // Month is 0-indexed in Date, 1-indexed in DateValue
    const day = dateObj.getDate()

    // Use imported CalendarDate instead of require
    return new CalendarDate(year, month, day)
  } catch (error) {
    console.warn('Failed to convert date to DateValue:', error)
    return undefined
  }
}

/**
 * Converts DateValue back to JavaScript Date
 * Uses early return pattern for validation
 */
export function fromDateValue(dateValue: DateValue | null | undefined): Date | null {
  // Guard clause - early return for invalid inputs
  if (!dateValue) {
    return null
  }

  try {
    // DateValue has year, month, day properties
    return new Date(dateValue.year, dateValue.month - 1, dateValue.day)
  } catch (error) {
    console.warn('Failed to convert DateValue to Date:', error)
    return null
  }
}
