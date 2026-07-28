<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NInput, NSwitch } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
const route=useRoute(), client=useQueryClient(), id=computed(()=>Number(route.query.id||0))
const detail=useQuery({queryKey:computed(()=>['entity',id.value]),queryFn:()=>api.get<any>('/entity/get',{entity_id:id.value})})
const form=reactive({name:'',avatar:'',description:'',intro_image:'',intro_video:'',introduction_markdown:''})
const isDisplayed=ref(false)
const canDisplay=computed(()=>['teamMember','teamVirtual'].includes(String(detail.data.value?.entityable_type??'')))
const profileSave=useMutation({mutationFn:()=>api.post('/entity/profile',{entity_id:id.value,...form}),onSuccess:()=>client.invalidateQueries({queryKey:['entity',id.value]})})
const displaySave=useMutation({mutationFn:()=>api.post('/entity/display',{entity_id:id.value,is_displayed:isDisplayed.value?1:0}),onSuccess:()=>client.invalidateQueries({queryKey:['entity',id.value]})})
watch(() => detail.data.value, (data) => {
  if (!data) return
  isDisplayed.value=Number(data.is_displayed)===1
  const p=data.profile
  if (p) Object.assign(form,{name:p.name||'',avatar:p.avatar||'',description:p.description||'',intro_image:p.intro_image||'',intro_video:p.intro_video||'',introduction_markdown:p.introduction_markdown||''})
}, { immediate:true })
</script>
<template><div class="entity-detail"><AdminPageHeader title="实体资料" description="维护该实体的公开资料。职责与访问范围请通过角色权限管理。" back-to="/entities" back-label="返回实体" /><p v-if="detail.isError.value" class="feedback error" role="alert">{{ friendlyError(detail.error.value) }}</p><template v-else-if="detail.data.value"><form class="panel" @submit.prevent="profileSave.mutate()"><h2>{{ detail.data.value.entityable_type }} · @{{ detail.data.value.slug }}</h2><label>名称<NInput v-model:value="form.name" /></label><label>头像 URL<NInput v-model:value="form.avatar" /></label><label>展示图片（人物图）URL<NInput v-model:value="form.intro_image" placeholder="用于公开主页 Hero 的人物图" /></label><p class="field-help">复用现有介绍图片；建议使用透明背景或竖版人物图，未设置时使用名称占位。</p><label>简介<NInput v-model:value="form.description" type="textarea" /></label><p v-if="profileSave.isError.value" class="feedback error" role="alert">{{ friendlyError(profileSave.error.value) }}</p><p v-if="profileSave.isSuccess.value" class="feedback success" role="status">实体资料已保存。</p><LsButton type="submit" :loading="profileSave.isPending.value">保存资料</LsButton></form><section class="panel display-setting"><div><h2>公开主页展示</h2><p v-if="canDisplay">开启后，访客可以在团队公开主页浏览该实体的 Profile、公开字段和公开文档。</p><p v-else>团队主页始终公开；客户实体为保护隐私不支持公开展示。</p></div><NSwitch v-if="canDisplay" v-model:value="isDisplayed" aria-label="在公开主页展示"><template #checked>公开</template><template #unchecked>隐藏</template></NSwitch><p v-if="displaySave.isError.value" class="feedback error" role="alert">{{ friendlyError(displaySave.error.value) }}</p><p v-if="displaySave.isSuccess.value" class="feedback success" role="status">公开展示设置已保存。</p><LsButton v-if="canDisplay" variant="secondary" :loading="displaySave.isPending.value" @click="displaySave.mutate()">保存公开设置</LsButton></section></template></div></template>
<style scoped>.entity-detail{display:grid;gap:22px}.panel{display:grid;gap:16px;padding:24px;border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--surface)}.panel h2,.panel p{margin:0}.panel h2{font-size:1.05rem}.panel label{display:grid;gap:7px;color:var(--text-secondary);font-weight:650}.field-help{margin-top:-10px!important;color:var(--text-secondary);font-size:.8rem;line-height:1.55}.display-setting>div p{max-width:62ch;margin-top:.4rem;color:var(--text-secondary);font-size:.84rem;line-height:1.6}.display-setting :deep(.n-switch){min-height:44px;justify-self:start}.display-setting :deep(.ls-button){justify-self:start}.feedback{padding:.75rem;border-radius:8px}.error{color:var(--danger);background:color-mix(in oklch,var(--danger),white 94%)}.success{color:var(--success);background:color-mix(in oklch,var(--success),white 94%)}@media(max-width:639px){.panel{padding:16px}.display-setting :deep(.ls-button){width:100%}}</style>
