export type StaffAvatarSize = 'normal' | 'sm'

export interface StaffPanelState {
  isLoading: boolean
  error: string | null
  activeFilters: string[]
}

export interface StaffFilterEvent {
  staffIds: string[]
  action: 'add' | 'remove' | 'clear'
}

export interface StaffDragEvent {
  staffId: string
  fromContainer: string
  toContainer: string
  jobId?: string
}
