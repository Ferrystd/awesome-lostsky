<script setup lang="ts">
import { communityActorKey } from '@lostsky/api/community'
import { api, friendlyError } from '@lostsky/api/client'
import { communityPath, uploadCommunityImage, type Community } from '@lostsky/api/community'
import { useQuery } from '@tanstack/vue-query'
import { useRoute } from 'vue-router'
import CommunityGovernance from '@lostsky/ui/community/CommunityGovernance.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
const actorKey = communityActorKey()
const route = useRoute(), slug = String(route.params.slug), path = communityPath(slug)
const query = useQuery({ queryKey: ['community', slug, actorKey], queryFn: () => api.get<Community>(path) })
</script>
<template>
  <LsPageHeader v-if="query.isPending.value || query.isError.value" title="社区管理" :back-to="`/c/${slug}`" />
  <LsAsyncState v-if="query.isPending.value" state="loading" /><template v-else-if="query.isError.value"><LsAsyncState state="error" :description="friendlyError(query.error.value)" /></template>
  <CommunityGovernance v-else-if="query.data.value" :key="$route.path" :api-base="`${path}/manage`" :route-base="`/c/${slug}/manage`" :back-to="`/c/${slug}`" :community-name="query.data.value.name" :can-read="query.data.value.can_manage" :can-moderate="query.data.value.can_manage" denied-reason="只有此社区管理员或所属团队的社区管理者可以治理" :expected-entity-id="query.data.value.entity_id" :upload-image="file => uploadCommunityImage(file, query.data.value?.entity_id ?? null)" :upload-disabled-reason="query.data.value.entity_id ? '' : '请先选择有效人员身份'" />
</template>
