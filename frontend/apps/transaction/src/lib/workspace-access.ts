import { api } from '@lostsky/api/client'
import { formatAbilityDenied } from '@lostsky/api/error-format'

export interface WorkspaceAccess {
  team?: { id: number; slug: string; name: string } | null
  permissions: string[]
  abilities: Record<string, { enabled: boolean; reason: string | null; label: string }>
  identity?: { type: string; entity_id: number; name: string; slug?: string | null; avatar?: string | null; belongs_to_team: boolean; is_external: boolean }
  entry_warning?: { required: boolean; kind: string | null; ttl_seconds: number }
}

export type WorkspacePermissionRequirement = string | readonly string[]

export const serviceRedemptionReadPermissions = ['service.redemption.read', 'service.redemption.manage'] as const

export function workspacePermissionKeys(required: WorkspacePermissionRequirement) {
  return typeof required === 'string' ? [required] : [...required]
}

export function hasWorkspacePermission(permissions: string[], required: WorkspacePermissionRequirement) {
  return workspacePermissionKeys(required).some(permission =>
    permissions.some(granted => permission === granted || permission.startsWith(`${granted}.`)),
  )
}

export function transactionAbilityReason(access: WorkspaceAccess | null | undefined) {
  if (!access) return '暂时无法确认记账能力，请稍后重试'
  const ability = access.abilities?.transaction
  return ability?.enabled ? '' : formatAbilityDenied('transaction', ability?.label ?? '记账')
}

export async function resolveTransactionAbilityReason(access: WorkspaceAccess | null | undefined) {
  if (access) return transactionAbilityReason(access)
  try {
    return transactionAbilityReason(await loadWorkspaceAccess())
  } catch {
    return transactionAbilityReason(null)
  }
}

let cached: { value: WorkspaceAccess; expiresAt: number } | null = null
export async function loadWorkspaceAccess(force = false) {
  if (!force && cached && cached.expiresAt > Date.now()) return cached.value
  const value = await api.get<WorkspaceAccess>('/workspace/access')
  cached = { value, expiresAt: Date.now() + 30_000 }
  return value
}
