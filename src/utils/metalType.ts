/**
 * Utility functions for metal type formatting and handling
 */

export interface MetalTypeOption {
  value: string
  label: string
}

// Metal type options (matching backend enum)
export const metalTypeOptions: MetalTypeOption[] = [
  { value: 'stainless_steel', label: 'Stainless Steel' },
  { value: 'mild_steel', label: 'Mild Steel' },
  { value: 'aluminum', label: 'Aluminum' },
  { value: 'brass', label: 'Brass' },
  { value: 'copper', label: 'Copper' },
  { value: 'titanium', label: 'Titanium' },
  { value: 'zinc', label: 'Zinc' },
  { value: 'galvanized', label: 'Galvanized' },
  { value: 'unspecified', label: 'Unspecified' },
  { value: 'other', label: 'Other' },
]

/**
 * Formats a metal type value to a human-readable label
 * @param metalType - The metal type value from backend
 * @returns Human-readable label or the original value if not found
 */
export function formatMetalType(metalType: string | undefined | null): string {
  if (!metalType) return ''

  const option = metalTypeOptions.find((opt) => opt.value === metalType)
  return option?.label || metalType
}

/**
 * Gets the metal type value from a label
 * @param label - The human-readable label
 * @returns The metal type value or the original label if not found
 */
export function getMetalTypeValue(label: string): string {
  const option = metalTypeOptions.find((opt) => opt.label === label)
  return option?.value || label
}
