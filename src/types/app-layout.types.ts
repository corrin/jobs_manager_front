export interface NavigationItem {
  name: string
  to: string
  label: string
}

export type AppLayoutProps = object

export interface UserInfo {
  displayName: string
  username: string
  is_staff?: boolean
  is_active?: boolean
  // Add other fields as needed from backend user
}
