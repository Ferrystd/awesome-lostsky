<script setup lang="ts">
import CommunityManagement from '@lostsky/ui/community/CommunityManagement.vue'
import { can, permissionReason } from '../session'
</script>
<template><CommunityManagement :key="$route.path" scope="admin" :can-read="can('admin.community.read')" :can-write="can('admin.community.write')" :can-moderate="can('admin.community.moderate')" :read-reason="permissionReason('admin.community.read')" :write-reason="permissionReason('admin.community.write')" :moderate-reason="permissionReason('admin.community.moderate')" /></template>
