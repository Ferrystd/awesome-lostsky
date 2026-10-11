<script setup lang="ts">
import { NListItem } from 'naive-ui'
import { Mail, MailOpen } from '@lucide/vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'

defineProps<{ title: string; summary?: string; recipient?: string; time: string; unread: boolean; pinned?: boolean; to: RouteLocationRaw }>()
</script>

<template>
  <NListItem :class="['team-notice-row', { 'team-notice-row--unread': unread }]">
    <RouterLink :to="to" class="team-notice-row__link">
      <component :is="unread ? Mail : MailOpen" :size="18" class="team-notice-row__icon" aria-hidden="true" />
      <div class="team-notice-row__copy">
        <div class="team-notice-row__heading">
          <h2>{{ title }}</h2>
          <LsStatusTag :label="unread ? '未读' : '已读'" :type="unread ? 'info' : 'success'" />
          <LsStatusTag v-if="pinned" label="置顶" />
          <time>{{ time }}</time>
        </div>
        <div v-if="summary || recipient" class="team-notice-row__detail">
          <p v-if="summary">{{ summary }}</p><span v-if="recipient">{{ recipient }}</span>
        </div>
      </div>
    </RouterLink>
  </NListItem>
</template>

<style scoped>
.team-notice-row.n-list-item { min-width: 0; padding: .75rem 1rem; }
.team-notice-row :deep(.n-list-item__main) { min-width: 0; width: 100%; }
.team-notice-row--unread { background: color-mix(in srgb, var(--primary) 3%, var(--surface)); }
.team-notice-row:hover, .team-notice-row:focus-within { background: var(--surface-subtle); }
.team-notice-row__link { min-width: 0; min-height: 3rem; display: flex; align-items: center; gap: .75rem; color: var(--text); text-decoration: none; }
.team-notice-row__link:focus-visible { outline: 2px solid var(--focus); outline-offset: 4px; border-radius: var(--radius-sm); }
.team-notice-row__icon { flex: none; color: var(--text-tertiary); }
.team-notice-row--unread .team-notice-row__icon { color: var(--primary); }
.team-notice-row__copy { flex: 1; min-width: 0; }
.team-notice-row__heading { display: flex; flex-wrap: wrap; align-items: center; gap: .25rem .5rem; }
.team-notice-row h2 { min-width: 0; margin: 0; font-size: .9375rem; font-weight: 600; line-height: 1.5; overflow-wrap: anywhere; }
.team-notice-row time { margin-left: auto; color: var(--text-tertiary); font-size: .75rem; }
.team-notice-row__detail { display: flex; gap: .5rem 1rem; align-items: baseline; margin-top: .25rem; color: var(--text-secondary); font-size: .8125rem; }
.team-notice-row__detail p { min-width: 0; flex: 1; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.team-notice-row__detail span { flex: none; }
@media (max-width: 639px) {
  .team-notice-row__link { align-items: flex-start; }
  .team-notice-row__icon { margin-top: .25rem; }
  .team-notice-row time { margin-left: 0; flex-basis: 100%; }
  .team-notice-row__detail { flex-wrap: wrap; }
  .team-notice-row__detail p { flex-basis: 100%; }
  .team-notice-row__detail span { overflow-wrap: anywhere; min-width: 0; flex-shrink: 1; }
}
</style>
