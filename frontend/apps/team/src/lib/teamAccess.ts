import { api } from '@lostsky/api/client'
import { useQuery } from '@tanstack/vue-query'
export {
  abilityReason,
  fileAvailabilityReason,
  fileUploadReason,
  resourceUploadReason,
  hasPermission,
  permissionReason,
  settingReason,
  type SettingRequirement,
  type SettingValue,
  type FileUploadAvailability,
} from './teamAccessReason'
import type { FileUploadAvailability } from './teamAccessReason'

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
  identity?: { type: string; entity_id: number; name: string; slug?: string | null; avatar?: string | null; belongs_to_team: boolean; is_external: boolean }
  entry_warning?: { required: boolean; kind: string | null; ttl_seconds: number }
  file_upload?: FileUploadAvailability
}

export function useTeamAccess() {
  return useQuery({
    queryKey: ['team-access'],
    queryFn: () => api.get<TeamAccessSnapshot>('/access'),
    staleTime: 30_000,
  })
}
