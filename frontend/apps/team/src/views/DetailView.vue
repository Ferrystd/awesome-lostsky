<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { useQuery } from '@tanstack/vue-query'
import { ArrowLeft } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const props=withDefaults(defineProps<{endpoint:string;title:string;staticParams?:Record<string,unknown>}>(),{staticParams:()=>({})});const route=useRoute();const router=useRouter();const params=computed(()=>({...props.staticParams,...(route.query.id?{id:route.query.id}:{})}));const query=useQuery({queryKey:computed(()=>['detail',props.endpoint,params.value]),queryFn:()=>api.get<Record<string,unknown>>(props.endpoint,params.value)});const display=(value:unknown)=>value==null?'—':typeof value==='object'?JSON.stringify(value):String(value)
</script>
<template><div class="detail"><LsButton variant="ghost" class="back" @click="router.back()"><template #icon><ArrowLeft :size="18" /></template>返回</LsButton><LsAsyncState v-if="query.isError.value" state="error" :title="`暂时无法读取${title}`" :description="friendlyError(query.error.value)" /><LsAsyncState v-else-if="query.isPending.value" state="loading" :rows="6" /><LsPanel v-else><template #header><div class="detail-heading"><p>{{ title }}</p><h2>{{ query.data.value?.name ?? query.data.value?.title ?? title }}</h2></div></template><dl><template v-for="(value, key) in query.data.value" :key="key"><dt>{{ key }}</dt><dd>{{ display(value) }}</dd></template></dl></LsPanel></div></template>
<style scoped>.detail{display:grid;gap:1rem}.back{width:fit-content}.detail-heading p{margin:0;color:var(--sky-lost-strong);font-size:.75rem;font-weight:700}.detail-heading h2{margin:.35rem 0 0;font-size:1.4rem}dl{display:grid;grid-template-columns:minmax(5.5rem,.45fr) 1.55fr;margin:0}dt,dd{margin:0;padding:.7rem 0;border-bottom:1px solid var(--line);overflow-wrap:anywhere}dt{color:var(--muted-ink);font-size:.8rem}dd{font-size:.88rem}@media(min-width:760px){.detail :deep(.ls-panel){max-width:56rem}}</style>
