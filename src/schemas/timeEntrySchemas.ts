import { z } from 'zod'

/**
 * Schema for time entry creation form
 */
export const TimeEntryCreationSchema = z.object({
  hours: z
    .number()
    .min(0.25, 'Minimum 0.25 hours required')
    .max(24, 'Maximum 24 hours allowed'),
  
  rateMultiplier: z
    .union([z.number(), z.string()])
    .transform((val) => typeof val === 'string' ? parseFloat(val) : val)
    .refine((val) => !isNaN(val), 'Rate multiplier must be a valid number')
    .refine((val) => val >= 0, 'Rate multiplier cannot be negative')
    .refine((val) => val <= 3, 'Rate multiplier cannot exceed 3.0'),
  
  description: z
    .string()
    .min(3, 'Description must be at least 3 characters')
    .max(500, 'Description cannot exceed 500 characters')
    .trim(),
  
  isBillable: z.boolean(),
  
  notes: z
    .string()
    .max(1000, 'Notes cannot exceed 1000 characters')
    .optional()
    .default('')
})

/**
 * Inferred type from schema
 */
export type TimeEntryCreationForm = z.infer<typeof TimeEntryCreationSchema>

/**
 * Rate type enum for better type safety
 */
export const RateTypeEnum = z.enum(['Ord', '1.5', '2.0', 'Unpaid'])
export type RateType = z.infer<typeof RateTypeEnum>

/**
 * Rate multiplier mapping
 */
export const RATE_MULTIPLIERS = {
  'Ord': 1.0,
  '1.5': 1.5,
  '2.0': 2.0,
  'Unpaid': 0.0
} as const

/**
 * Convert rate multiplier to rate type string
 */
export function getRateTypeFromMultiplier(multiplier: number): RateType {
  switch (multiplier) {
    case 0.0: return 'Unpaid'
    case 1.0: return 'Ord'
    case 1.5: return '1.5'
    case 2.0: return '2.0'
    default: return 'Ord'
  }
}

/**
 * Convert rate type to multiplier
 */
export function getMultiplierFromRateType(rateType: RateType): number {
  return RATE_MULTIPLIERS[rateType]
}
