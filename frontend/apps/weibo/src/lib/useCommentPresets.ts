import { api } from '@lostsky/api/client'
import { readAccessReason } from '@lostsky/api/access-result'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { apiPrefix } from './workspace'
import type { WeiboCommentPreset } from '../types'

export function useCommentPresets() {
  const route = useRoute()
  const personal = computed(() => route.meta.workspace === 'personal')
  const prefix = computed(() => apiPrefix(personal.value))
  const scope = computed(() => personal.value ? 'personal' : 'team')
  const routeAccess = useRouteAccess()
  const query = useQuery({
    queryKey: computed(() => ['weibo-comment-presets', prefix.value]),
    queryFn: () => api.get<WeiboCommentPreset[]>(`${prefix.value}/comment-presets`),
    structuralSharing: false,
    enabled: computed(() => !routeAccess.restricted.value),
  })
  const accessReason = computed(() => readAccessReason(query.data.value) || routeAccess.reason.value)
  const restricted = computed(() => Boolean(accessReason.value))
  return { personal, prefix, scope, query, accessReason, restricted }
}
