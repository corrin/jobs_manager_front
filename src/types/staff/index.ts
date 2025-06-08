// Types specific to Staff components and functionality
// Internal TypeScript types, not for validation

// Staff avatar display sizes
export type StaffAvatarSize = 'normal' | 'sm'

// Staff panel state
export interface StaffPanelState {
  isLoading: boolean
  error: string | null
  activeFilters: string[]
}

// Staff filter events
export interface StaffFilterEvent {
  staffIds: string[]
  action: 'add' | 'remove' | 'clear'
}

// Drag and drop staff events
export interface StaffDragEvent {
  staffId: string
  fromContainer: string
  toContainer: string
  jobId?: string
}
