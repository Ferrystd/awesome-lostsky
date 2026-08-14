<script setup lang="ts">
import LsEntityTag from '@lostsky/ui/components/LsEntityTag.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import type { EntityType } from '@lostsky/ui/entity'
import { computed } from 'vue'
import type { ManageOwnedResource } from '../types'

const props = defineProps<{ resource: ManageOwnedResource }>()
const knownTypes: EntityType[] = ['entity', 'customer', 'team', 'virtual', 'teamMember', 'teamCustomer', 'teamVirtual']
const ownerType = computed<EntityType>(() => {
  const type = props.resource.owner?.type ?? props.resource.owner?.entityable_type
  return knownTypes.includes(type as EntityType) ? type as EntityType : 'unknown'
})
</script>

<template>
  <LsStatusTag v-if="!resource.owner_entity_id" label="团队公用" type="info" />
  <LsEntityTag
    v-else
    :type="ownerType"
    :name="resource.owner?.name || `Entity #${resource.owner_entity_id}`"
    :slug="resource.owner?.slug || ''"
  />
</template>
