export interface DashboardStats {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  isActive: boolean
  isStaff: boolean
}

export interface DashboardData {
  userStats: DashboardStats | null
  isLoading: boolean
  error: string | null
}
