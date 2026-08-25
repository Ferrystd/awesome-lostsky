import { api } from '@lostsky/api/client'
import type { WorkspaceAccess } from '../types'

let cache: { value: WorkspaceAccess; expires: number } | null = null
export async function loadAccess(force = false) {
  if (!force && cache && cache.expires > Date.now()) return cache.value
  const value = await api.get<WorkspaceAccess>('/workspace/access')
  cache = { value, expires: Date.now() + 30_000 }
  return value
}
export function apiPrefix(personal: boolean) { return personal ? '/personal' : '' }
export function expectedEntity(access: WorkspaceAccess | undefined, personal: boolean) { return personal ? { expected_entity_id: access?.identity.entity_id ?? 0 } : {} }
