/**
 * Frontend UI types for data table components
 * These are presentation-layer types for table UI state and interactions
 */

export interface DataTableRowContext {
  isSelected: boolean
  isExpanded: boolean
  isEditing: boolean
  index: number
}
