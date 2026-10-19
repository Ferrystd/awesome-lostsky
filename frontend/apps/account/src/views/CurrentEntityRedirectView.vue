<script setup lang="ts">
import AccountFlowPage from '../components/AccountFlowPage.vue'
import { api, friendlyError } from '@lostsky/api/client'
import { identityUrl, teamScopedAppUrl } from '@lostsky/shared/navigation'
import LsButton from '@lostsky/ui/components/LsButton.vue'

import { onMounted, ref } from 'vue'

interface Target { kind: 'identity' | 'team-personal' | 'shop-customer'; team: { slug: string } | null }
const error = ref('')
async function resolveTarget() {
  try {
    const target = await api.get<Target>('/identity/target')
    const slug = target.team?.slug || ''
    if (target.kind === 'team-personal' && slug) location.replace(teamScopedAppUrl(slug, 'team', '/personal/profile'))
    else if (target.kind === 'shop-customer' && slug) location.replace(teamScopedAppUrl(slug, 'shop', '/customer/profile'))
    else location.replace(identityUrl())
  } catch (reason) { error.value = friendlyError(reason) }
}
onMounted(resolveTarget)
</script>

<template><AccountFlowPage><section class="redirect-result" aria-live="polite"><h1>{{ error ? '暂时无法打开工作台' : '正在打开对应工作台' }}</h1><p v-if="!error">资料管理已迁移，正在依据当前身份安全跳转…</p><template v-else><p role="alert">{{ error }}</p><LsButton @click="resolveTarget">重试</LsButton></template></section></AccountFlowPage></template>
<style scoped>.redirect-result h1{margin-top:0}.redirect-result p{color:var(--muted-ink)}</style>
