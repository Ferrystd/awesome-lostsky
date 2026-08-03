<script setup lang="ts">
import { ArrowRight } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { entityTypeLabel } from '../lib'
import type { EntitySummary } from '../types'

withDefaults(defineProps<{
  entities: EntitySummary[]
  preview?: boolean
}>(), {
  preview: false,
})
</script>

<template>
  <div class="entity-list" :class="{ 'entity-list-preview': preview }">
    <RouterLink v-for="entity in entities" :key="entity.slug" :to="`/entity/${entity.slug}`">
      <img v-if="entity.avatar" :src="entity.avatar" :alt="`${entity.name} 头像`" width="88" height="88" loading="lazy">
      <span v-else class="entity-placeholder" aria-hidden="true">{{ entity.name.slice(0, 1) }}</span>
      <span class="entity-copy">
        <small>{{ entityTypeLabel(entity.type) }} · @{{ entity.slug }}<em v-if="entity.status_label && entity.status_code !== 'active'">{{ entity.status_label }}</em></small>
        <strong>{{ entity.name }}</strong>
        <span v-if="entity.roles?.length" class="entity-roles">{{ entity.roles.map(role => role.name).join(' · ') }}</span>
        <p>{{ entity.description || '查看公开资料与文档' }}</p>
      </span>
      <ArrowRight :size="20" aria-hidden="true" />
    </RouterLink>
  </div>
</template>
