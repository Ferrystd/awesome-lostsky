<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import { useQuery } from '@tanstack/vue-query'
import { ArrowLeft } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const props=withDefaults(defineProps<{endpoint:string;title:string;staticParams?:Record<string,unknown>}>(),{staticParams:()=>({})});const route=useRoute();const router=useRouter();const params=computed(()=>({...props.staticParams,...(route.query.id?{id:route.query.id}:{})}));const query=useQuery({queryKey:computed(()=>['detail',props.endpoint,params.value]),queryFn:()=>api.get<Record<string,unknown>>(props.endpoint,params.value)});const display=(value:unknown)=>value==null?'—':typeof value==='object'?JSON.stringify(value):String(value)
</script>
<template><div class="detail"><LsButton variant="ghost" class="back" @click="router.back()"><template #icon><ArrowLeft :size="18" /></template>返回</LsButton><LsAsyncState v-if="query.isError.value" state="error" :title="`暂时无法读取${title}`" :description="friendlyError(query.error.value)" /><LsAsyncState v-else-if="query.isPending.value" state="loading" :rows="6" /><div v-else class="detail-panel"><LsPanel><template #header><LsSectionHeader :eyebrow="title" :title="String(query.data.value?.name ?? query.data.value?.title ?? title)" /></template><LsDescriptionList><template v-for="(value, key) in query.data.value" :key="key"><dt>{{ key }}</dt><dd>{{ display(value) }}</dd></template></LsDescriptionList></LsPanel></div></div></template>
<style scoped>.detail{display:grid;gap:1rem}.back{width:fit-content}@media(min-width:760px){.detail-panel{max-width:56rem}}</style>
