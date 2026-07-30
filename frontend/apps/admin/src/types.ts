export interface Page<T> { total: number; list: T[]; page: number; limit: number }
export interface AdminRole {
  id: number; role_key: string; name: string; description?: string | null
  is_system: number; administrator_count?: number; permissions?: string[]
}
export interface AdminSession {
  user: { id: number; username: string; email_masked: string; phone_masked: string }
  roles: AdminRole[]; permissions: string[]; is_super_admin: boolean
}
export interface UserSummary {
  id: number; username: string; nickname?: string; avatar?: string
  phone?: string; email?: string; phone_masked: string; email_masked: string
  is_banned: number; create_time: number; update_time: number
  team_count: number; device_count: number
}
export interface TeamSummary {
  id: number; slug: string; name?: string; avatar?: string; owner_username?: string
  user_id: number; is_banned: number; is_cancelled: number
  create_time: number; update_time: number; member_count: number
}
export interface AuditEvent {
  id: number; application: string; action: string; resource_type: string
  resource_id?: number | null; authenticated_user_id?: number | null
  actor_username?: string | null; context?: Record<string, unknown> | null
  request_id?: string | null; create_time: number
}
