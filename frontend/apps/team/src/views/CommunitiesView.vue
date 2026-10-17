<script setup lang="ts">
import { useRoute } from 'vue-router'
import LsFormFields from '@lostsky/ui/components/LsFormFields.vue'
import CommunityManagement from '@lostsky/ui/community/CommunityManagement.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import { friendlyError } from '@lostsky/api/client'
import { hasPermission, permissionReason, useTeamAccess } from '../lib/teamAccess'
const access = useTeamAccess()
const route = useRoute()
</script>
<template><LsAsyncState v-if="access.isPending.value" state="loading" /><LsAsyncState v-else-if="access.isError.value && !access.data.value" state="error" :description="friendlyError(access.error.value)" /><component v-else :is="['form', 'administrators'].includes(String(route.meta.communityView)) ? LsFormFields : 'div'"><CommunityManagement :key="$route.path" scope="team" :can-read="hasPermission(access.data.value, 'community.team.read')" :can-write="hasPermission(access.data.value, 'community.team.manage')" :can-moderate="hasPermission(access.data.value, 'community.team.manage')" :read-reason="permissionReason('community.team.read')" :write-reason="permissionReason('community.team.manage')" :moderate-reason="permissionReason('community.team.manage')" :expected-entity-id="access.data.value?.identity?.entity_id" /></component></template>
