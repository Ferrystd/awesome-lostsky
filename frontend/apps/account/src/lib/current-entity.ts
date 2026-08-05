import { api } from '@lostsky/api/client'
import { useQuery } from '@tanstack/vue-query'

export type CurrentEntityType = 'team' | 'teamMember' | 'teamCustomer' | 'teamVirtual'
export interface CurrentIdentitySummary {
  entity_id: number
  type: CurrentEntityType
  id: number
  slug: string | null
  name: string
  avatar: string | null
  status_code?: string | null
  status_label?: string | null
  team: { id: number; slug: string; name: string }
}
export interface CurrentProfile {
  name: string
  avatar: string | null
  description: string | null
  intro_image?: string | null
  intro_video?: string | null
  introduction_markdown?: string | null
}
export interface CurrentEntityField {
  id: number
  name: string
  field_key?: string
  value_type?: string
  input_type?: string
  options?: unknown
  default_value?: unknown
  is_required?: number
  is_editable?: number
  can_edit?: boolean
}
export interface CurrentFieldValue {
  field_id: number
  value_string?: string | null
  value_text?: string | null
  value_int?: number | null
  value_decimal?: number | null
  value_datetime?: number | string | null
  value_json?: unknown
}
export interface CurrentEntityResult {
  identity: CurrentIdentitySummary | null
  supported: boolean
  unsupported_reason?: string
  profile?: CurrentProfile
  custom_fields?: CurrentEntityField[]
  custom_field_values?: CurrentFieldValue[]
  role_assignments?: Array<Record<string, unknown>>
  effective_permissions?: Array<{ key: string; label: string; group: string }>
  customer?: { assignee_entity_id: number | null }
  upload?: { enabled: boolean; reason: string | null }
}

export const currentEntityQueryKey = ['account-current-entity'] as const

export function useCurrentEntityQuery() {
  return useQuery({
    queryKey: currentEntityQueryKey,
    queryFn: () => api.get<CurrentEntityResult>('/identity/current'),
  })
}
