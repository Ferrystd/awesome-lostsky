import { api } from '@lostsky/api/client'

export interface WorkspaceAccess {
  team?: { id: number; slug: string; name: string } | null
  permissions: string[]
  abilities: Record<string, { enabled: boolean; reason: string | null; label: string }>
  identity?: { type: string; entity_id: number; name: string; slug?: string | null; avatar?: string | null }
}

export function hasWorkspacePermission(permissions: string[], required: string) {
  return permissions.some(granted => required === granted || required.startsWith(`${granted}.`))
}

let cached: { value: WorkspaceAccess; expiresAt: number } | null = null
export async function loadWorkspaceAccess(force = false) {
  if (!force && cached && cached.expiresAt > Date.now()) return cached.value
  const value = await api.get<WorkspaceAccess>('/workspace/access')
  cached = { value, expiresAt: Date.now() + 30_000 }
  return value
}
