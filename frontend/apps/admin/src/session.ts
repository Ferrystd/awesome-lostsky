import { api, ApiError } from '@lostsky/api/client'
import { reactive } from 'vue'
import type { AdminSession } from './types'

export const adminSession = reactive<{ data: AdminSession | null; loaded: boolean }>({
  data: null,
  loaded: false,
})

let task: Promise<AdminSession> | null = null
export async function loadAdminSession() {
  if (adminSession.data) return adminSession.data
  task ??= api.get<AdminSession>('/session')
  try {
    adminSession.data = await task
    adminSession.loaded = true
    return adminSession.data
  } finally {
    task = null
  }
}

export function can(permission: string) {
  return Boolean(adminSession.data?.is_super_admin || adminSession.data?.permissions.includes(permission))
}

export function isForbidden(error: unknown) {
  return error instanceof ApiError && error.status === 403
}
