<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { ArrowRight, Plus, UserRoundCog } from '@lucide/vue'
import { NSkeleton } from 'naive-ui'
import { computed, ref } from 'vue'
import AdminPageHeader from '../components/AdminPageHeader.vue'

interface RoleRecord {
  id: number
  name?: string
  role_key?: string
  description?: string
  is_displayed?: number
}

const routeAccess = useRouteAccess()
const query = useQuery({
  queryKey: ['roles'],
  queryFn: () => api.get<RoleRecord[]>('/role/index'),
  enabled: computed(() => !routeAccess.restricted.value),
})
const roles = computed(() => query.data.value ?? [])
const search = ref('')
const filtered = computed(() => { const keyword = search.value.trim().toLocaleLowerCase(); return roles.value.filter(role => !keyword || `${role.name ?? ''} ${role.role_key ?? ''} ${role.description ?? ''}`.toLocaleLowerCase().includes(keyword)) })
</script>

<template>
    <div class="roles-page">
      <AdminPageHeader title="角色与权限" description="角色列表只用于查找和进入管理任务；角色资料、权限（Permission）与人员分配分别在独立页面完成。">
        <template #actions>
          <RouterLink class="secondary-link" to="/roles/entities"><UserRoundCog :size="17" />人员角色分配</RouterLink>
          <LsPagePrimaryAction :icon="Plus" label="新建角色" to="/roles/new" />
        </template>
      </AdminPageHeader>
      <LsListToolbar v-model="search" placeholder="搜索角色名称或标识" aria-label="搜索角色" :count-label="routeAccess.restricted.value ? '0 个角色' : `${filtered.length} 个角色`" />

      <p v-if="!routeAccess.restricted.value && query.isError.value" class="error" role="alert">{{ friendlyError(query.error.value) }}</p>
      <section v-else-if="!routeAccess.restricted.value && query.isPending.value" class="loading" aria-label="正在加载角色">
        <div v-for="index in 4" :key="index"><NSkeleton text width="34%" /><NSkeleton text width="58%" /></div>
      </section>
      <LsEmptyState :source="query.data.value" v-else-if="routeAccess.restricted.value || !filtered.length" :title="routeAccess.restricted.value ? '没有可显示的角色' : '还没有角色'" description="先创建角色，再为它选择完成工作所需的最小权限。" />
      <section v-else class="role-list" aria-label="角色列表">
        <RouterLink v-for="role in filtered" :key="role.id" :to="`/roles/${role.id}`">
          <div>
            <h2>{{ role.name || `角色 #${role.id}` }}</h2>
            <code>{{ role.role_key }}</code>
            <LsStatusTag :label="Number(role.is_displayed) === 1 ? '公开展示' : '仅内部'" :type="Number(role.is_displayed) === 1 ? 'info' : 'default'" />
            <p>{{ role.description || '暂无角色说明' }}</p>
          </div>
          <span>管理角色<ArrowRight :size="18" /></span>
        </RouterLink>
      </section>
    </div>
</template>

<style scoped>
.roles-page{display:grid;gap:1.5rem}.secondary-link{min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:.45rem;padding:0 1rem;color:var(--sky-lost-strong);background:white;border:1px solid var(--line);border-radius:10px;font-size:.875rem;font-weight:680}.secondary-link:hover{border-color:var(--sky-lost-strong);background:color-mix(in oklch,var(--sky-lost),white 94%)}.role-list{display:grid;background:white;border:1px solid var(--line);border-radius:12px}.role-list>a{min-height:88px;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 1.25rem;color:var(--ink)}.role-list>a+a{border-top:1px solid var(--line)}.role-list>a:hover{background:var(--cloud)}.role-list>a:first-child{border-radius:11px 11px 0 0}.role-list>a:last-child{border-radius:0 0 11px 11px}.role-list>a:only-child{border-radius:11px}.role-list h2,.role-list p{margin:0}.role-list h2{display:inline;font-size:1rem}.role-list code{margin-left:.5rem;color:var(--muted-ink);font-size:.75rem}.role-list .visibility{display:inline-flex;margin-left:.5rem;padding:.2rem .5rem;color:var(--sky-lost-strong);background:color-mix(in oklch,var(--sky-lost),white 92%);border-radius:999px;font-size:.72rem;font-weight:680}.role-list p{max-width:70ch;margin-top:.35rem;color:var(--muted-ink);font-size:.82rem;line-height:1.5}.role-list span{display:inline-flex;align-items:center;gap:.35rem;flex:none;color:var(--sky-lost-strong);font-size:.82rem;font-weight:680}.loading{display:grid;gap:1px;overflow:hidden;background:var(--line);border:1px solid var(--line);border-radius:12px}.loading>div{display:grid;gap:.7rem;padding:1.25rem;background:white}.empty{display:grid;justify-items:center;gap:.65rem;padding:3.5rem 1.25rem;color:var(--muted-ink);text-align:center;background:white;border:1px dashed var(--line);border-radius:12px}.empty h2,.empty p{margin:0}.empty h2{color:var(--ink);font-size:1.05rem}.empty p{line-height:1.6}.error{margin:0;padding:1rem;color:var(--danger);background:color-mix(in oklch,var(--danger),white 94%);border-radius:8px}
@media(max-width:639px){.role-list>a{align-items:flex-start;flex-direction:column}.role-list span{min-height:44px}.role-list code{display:block;margin:.25rem 0 0}}
</style>
