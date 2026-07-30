import { api } from '@lostsky/api/client'
import { useQuery } from '@tanstack/vue-query'
export {
  abilityReason,
  fileUploadReason,
  hasPermission,
  hasPermissionMatching,
  permissionReason,
} from './teamAccessReason'

export interface TeamAbilityState {
  enabled: boolean
  level: number
  expire_time: number
  reason: 'missing' | 'level' | 'expired' | null
  label: string
}

export interface TeamAccessSnapshot {
  permissions: string[]
  abilities: Record<string, TeamAbilityState>
}

export function useTeamAccess() {
  return useQuery({
    queryKey: ['team-access'],
    queryFn: () => api.get<TeamAccessSnapshot>('/access'),
    staleTime: 30_000,
    retry: false,
  })
}
