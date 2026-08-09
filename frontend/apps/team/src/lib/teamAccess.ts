import { api } from '@lostsky/api/client'
import { useQuery } from '@tanstack/vue-query'
export {
  abilityReason,
  fileUploadReason,
  resourceUploadReason,
  hasPermission,
  permissionReason,
  settingReason,
  type SettingRequirement,
  type SettingValue,
} from './teamAccessReason'

export interface TeamAbilityState {
  enabled: boolean
  level: number
  expire_time: number
  reason: 'missing' | 'level' | 'expired' | null
  label: string
}

export interface TeamAccessSnapshot {
  team?: { id: number; slug: string; name: string } | null
  permissions?: string[]
  abilities?: Record<string, TeamAbilityState>
  identity?: { type: string }
}

export function useTeamAccess() {
  return useQuery({
    queryKey: ['team-access'],
    queryFn: () => api.get<TeamAccessSnapshot>('/access'),
    staleTime: 30_000,
  })
}
