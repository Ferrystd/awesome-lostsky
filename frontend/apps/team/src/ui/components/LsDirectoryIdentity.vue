<script setup lang="ts">
import { ArrowUpRight, Bot, Building2, Handshake, UserRound, Users } from '@lucide/vue'
import { computed } from 'vue'
import { entityTypeLabel, type EntityType } from '../entity'

defineOptions({ inheritAttrs: false })
const props = defineProps<{ type: EntityType; name: string; slug?: string; imageUrl?: string | null }>()
const icon = computed(() => ({ team: Building2, entity: UserRound, teamMember: UserRound, customer: Handshake, teamCustomer: Handshake, virtual: Bot, teamVirtual: Bot, unknown: Users })[props.type])
</script>

<template>
  <div class="ls-directory-identity">
    <span class="ls-directory-identity__avatar" aria-hidden="true">
      <img v-if="imageUrl" :src="imageUrl" alt="" />
      <component v-else :is="icon" :size="20" />
    </span>
    <div class="ls-directory-identity__copy">
      <div class="ls-directory-identity__heading">
        <h2>{{ name }}</h2><slot name="status" />
      </div>
      <div class="ls-directory-identity__context">
        <span>{{ entityTypeLabel(type) }}<template v-if="slug"> · @{{ slug }}</template></span>
        <slot name="context" />
      </div>
    </div>
    <ArrowUpRight class="ls-directory-identity__open" :size="16" aria-hidden="true" />
    <span class="sr-only">查看详情</span>
  </div>
</template>

<style scoped>
.ls-directory-identity { min-width: 0; display: flex; align-items: center; gap: .75rem; }
.ls-directory-identity__avatar { width: 40px; height: 40px; flex: 0 0 40px; display: grid; place-items: center; overflow: hidden; border-radius: var(--radius-sm); color: var(--text-secondary); background: var(--surface-subtle); }
.ls-directory-identity__avatar img { width: 100%; height: 100%; object-fit: cover; }
.ls-directory-identity__copy { min-width: 0; flex: 1; }
.ls-directory-identity__heading { display: flex; align-items: center; flex-wrap: wrap; gap: .25rem .5rem; }
.ls-directory-identity__heading h2 { margin: 0; font-size: 1rem; font-weight: 600; line-height: 1.5; overflow-wrap: anywhere; }
.ls-directory-identity__context { display: flex; flex-wrap: wrap; gap: .125rem 1rem; margin-top: .25rem; color: var(--text-secondary); font-size: .8125rem; line-height: 1.5; overflow-wrap: anywhere; }
.ls-directory-identity__open { flex: 0 0 auto; color: var(--text-secondary); }
</style>
