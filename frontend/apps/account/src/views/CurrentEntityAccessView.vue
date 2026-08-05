<script setup lang="ts">
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsPage from '@lostsky/ui/components/LsPage.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { NCollapse, NCollapseItem } from 'naive-ui'
import { computed } from 'vue'
import { useCurrentEntityQuery } from '../lib/current-entity'

const query = useCurrentEntityQuery()
const assignments = computed(() => query.data.value?.role_assignments ?? [])
const permissions = computed(() => query.data.value?.effective_permissions ?? [])
const roles = computed(() => assignments.value.map(assignment => {
  const role = assignment.role && typeof assignment.role === 'object'
    ? assignment.role as Record<string, unknown>
    : {}
  return {
    id: Number(role.id ?? assignment.role_id ?? 0),
    name: String(role.name ?? `角色 #${role.id ?? assignment.role_id ?? '?'}`),
    description: String(role.description ?? role.role_key ?? '暂无说明'),
  }
}))
const groups = computed(() => {
  const result = new Map<string, typeof permissions.value>()
  for (const permission of permissions.value) {
    const group = permission.group || '其他权限'
    result.set(group, [...(result.get(group) ?? []), permission])
  }
  return [...result.entries()].map(([name, items]) => ({ name, items }))
})
</script>

<template>
  <LsPage width="form" class="access-page">
    <header class="task-heading"><p>当前实体</p><h1>角色权限</h1><span>这里只解释当前实体的有效访问范围，角色分配仍由团队管理。</span></header>
    <LsPanel>
      <template #header><div class="section-heading"><h2>已分配角色</h2><p>角色不可在当前实体中心修改。</p></div></template>
      <div v-if="roles.length" class="role-list">
        <div v-for="role in roles" :key="role.id"><strong>{{ role.name }}</strong><span>{{ role.description }}</span></div>
      </div>
      <LsEmptyState v-else title="尚未分配角色" description="当前实体没有团队角色；这不代表它不可用，只表示没有额外角色授权。" />
    </LsPanel>
    <LsPanel>
      <template #header><div class="section-heading"><h2>有效权限</h2><p>由全部已分配角色合并得出，共 {{ permissions.length }} 项。</p></div></template>
      <NCollapse v-if="groups.length">
        <NCollapseItem v-for="group in groups" :key="group.name" :title="group.name" :name="group.name">
          <ul><li v-for="permission in group.items" :key="permission.key"><span>{{ permission.label || permission.key }}</span><code>{{ permission.key }}</code></li></ul>
        </NCollapseItem>
      </NCollapse>
      <LsEmptyState v-else title="没有有效业务权限" description="当前角色没有授予额外业务操作权限。" />
    </LsPanel>
  </LsPage>
</template>

<style scoped>
.task-heading p,.task-heading h1,.task-heading span,.section-heading h2,.section-heading p{margin:0}.task-heading p{color:var(--sky-lost-strong);font-size:.72rem;font-weight:750;letter-spacing:.06em}.task-heading h1{margin-top:.2rem;font-size:1.55rem}.task-heading span,.section-heading p{color:var(--muted-ink);font-size:.85rem}.section-heading h2{font-size:1rem}.section-heading p{margin-top:.25rem}.role-list{display:grid;border:1px solid var(--line);border-radius:8px}.role-list div{display:grid;gap:.15rem;padding:.75rem 1rem;border-bottom:1px solid var(--line)}.role-list div:last-child{border-bottom:0}.role-list strong{font-size:.88rem}.role-list span{color:var(--muted-ink);font-size:.75rem}.access-page :deep(.n-collapse-item__header){min-height:48px}.access-page ul{display:grid;gap:.5rem;margin:0 0 1rem;padding:0;list-style:none}.access-page li{display:grid;grid-template-columns:minmax(8rem,.35fr) minmax(0,1fr);gap:1rem;padding:.45rem 0;border-bottom:1px solid var(--line);font-size:.82rem}.access-page code{overflow-wrap:anywhere;color:var(--muted-ink);font-size:.75rem}@media(max-width:639px){.access-page li{grid-template-columns:1fr;gap:.15rem}}
</style>
