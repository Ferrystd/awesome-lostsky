<script setup lang="ts">
import { NConfigProvider } from 'naive-ui'
import { workspaceSceneProviderProps } from '@lostsky/ui/workspace-scene-theme'
import LsWorkspaceScene from '@lostsky/ui/components/LsWorkspaceScene.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import { api, auth, friendlyError } from '@lostsky/api/client'
import { useMutation, useQuery } from '@tanstack/vue-query'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import JoinApplicationFields, { type JoinField, type FieldValue } from '../components/JoinApplicationFields.vue'
import { syncReferral } from '@lostsky/shared/referral'
import { ArrowLeft } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fileAvailabilityReason, type FileUploadAvailability } from '../lib/teamAccess'

interface JoinForm {
  purpose_code: 'join' | 'reinstate'
  purpose_label: string
  refill_required: boolean
  fields: JoinField[]
  file_upload: FileUploadAvailability
}

const route = useRoute()
const form = useQuery({ queryKey: ['join-form'], queryFn: () => api.get<JoinForm>('/join/form') })
const mine = useQuery({ queryKey: ['join-mine'], queryFn: () => api.get<Record<string, unknown>[]>('/join/mine'), enabled: Boolean(auth.token()) })
const values = ref<Record<string, FieldValue>>({})
const inviterSlug = ref('')
const uploading = ref(false)
const purpose = computed(() => form.data.value?.purpose_code ?? 'join')
const isReinstate = computed(() => purpose.value === 'reinstate')
const fields = computed(() => form.data.value?.fields ?? [])
const uploadDisabledReason = computed(() => fileAvailabilityReason(form.data.value?.file_upload))
const missingRequired = computed(() => fields.value.some((field) => {
  if (!field.is_apply_required) return false
  const value = values.value[field.field_key || String(field.id ?? '')]
  return Array.isArray(value) ? value.length === 0 : value === undefined || value === null || String(value).trim() === ''
}))
const mutation = useMutation({ mutationFn: () => api.post('/join/apply', {
  values: { ...values.value },
  ...(!isReinstate.value && inviterSlug.value ? { inviter_slug: inviterSlug.value } : {}),
}) })
const cancel = useMutation({ mutationFn: (id: number) => api.post('/join/cancel', { id }), onSuccess: () => mine.refetch() })

watch(() => route.query.ref, value => { inviterSlug.value = syncReferral(value) }, { immediate: true })

async function uploadFile(file: File) {
  const body = new FormData(); body.append('file', file)
  const result = await api.post<Record<string, unknown>>('/join/upload', body)
  await form.refetch()
  return String(result.id ?? result.file_id ?? result.url ?? '')
}
</script>

<template>
  <NConfigProvider v-bind="workspaceSceneProviderProps(true)"><LsWorkspaceScene><main class="join">
    <nav class="join-navigation"><LsPageLink href="//www.lostsky.work" :icon="ArrowLeft" label="LostSky 官网" /></nav>
    <LsPageHeader :title="isReinstate ? '申请复职' : '申请加入团队'" :description="isReinstate ? '复职会继续使用原成员身份、对象标识和业务关系。' : '填写团队设置的申请资料，提交后由管理员审核。'" /><LsPanel>
    <form @submit.prevent="mutation.mutate()">
      <ol class="join-progress" aria-label="申请流程"><li :aria-current="!mutation.isSuccess.value ? 'step' : undefined">填写申请</li><li :aria-current="mutation.isSuccess.value ? 'step' : undefined">等待审核</li></ol>
      <p v-if="form.isPending.value" class="form-state">正在读取申请表…</p>
      <LsInlineError v-else-if="form.isError.value" :message="friendlyError(form.error.value)" />
      <div v-if="inviterSlug && !isReinstate" class="referral-confirmation" aria-label="当前邀请人">
        <span>邀请人</span>
        <strong>@{{ inviterSlug }}</strong>
        <small>邀请人来自当前链接，提交申请时会一并记录，无法在此修改。</small>
      </div>
      <JoinApplicationFields v-model="values" v-model:uploading="uploading" :fields="fields" :upload-file="uploadFile" :upload-disabled-reason="uploadDisabledReason" :disabled="mutation.isPending.value" />
      <LsInlineError v-if="mutation.isError.value" :message="friendlyError(mutation.error.value)" />
      <p v-if="mutation.isSuccess.value" class="success" role="status">{{ isReinstate ? '复职申请已提交，请等待审核。' : '加入申请已提交，请等待审核。' }}</p>
      <LsButton type="submit" size="lg" :loading="mutation.isPending.value" :disabled="form.isPending.value || Boolean(uploading) || missingRequired">提交{{ isReinstate ? '复职' : '加入' }}申请</LsButton>

    </form>
      <section v-if="mine.data.value?.length" class="mine"><h2>我的申请</h2><article v-for="item in mine.data.value" :key="String(item.id)"><div><strong>{{ item.purpose_label || '加入' }}申请 #{{item.id}}</strong><LsStatusTag :label="String(item.status_label || item.status)" /></div><p v-if="item.memo">{{item.memo}}</p><LsButton v-if="['applied','reviewing','已申请','审核中',1,2].includes((item.status_code ?? item.status) as string|number)" type="button" variant="danger" size="sm" :loading="cancel.isPending.value" @click="cancel.mutate(Number(item.id))">取消申请</LsButton></article></section>
  </LsPanel></main></LsWorkspaceScene></NConfigProvider>
</template>

<style scoped>
.join{min-height:100dvh;width:100%;max-width:44rem;margin-inline:auto;padding:1.5rem 1rem 3rem;display:grid;align-content:start;gap:1.5rem;color:var(--ink);overflow-wrap:anywhere}.join-navigation{display:flex;justify-content:space-between;align-items:center;gap:1rem}.join-progress{display:flex;gap:1.5rem;flex-wrap:wrap;list-style:none;padding:0 0 1rem;margin:0;border-bottom:1px solid var(--line);color:var(--muted-ink)}.join-progress [aria-current]{color:var(--ink);font-weight:700}form{display:grid;gap:1.25rem;min-width:0}.referral-confirmation{display:grid;gap:.4rem;padding-block:.75rem;border-block:1px solid var(--line)}.referral-confirmation small,.form-state{color:var(--muted-ink)}.success{color:var(--success)}.mine{display:grid;gap:1rem;margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--line)}.mine h2,.mine p{margin:0}.mine h2{font-size:1.125rem}.mine article{display:grid;gap:.75rem;padding-block:.75rem;border-bottom:1px solid var(--line)}.mine article>div{display:flex;justify-content:space-between;flex-wrap:wrap;gap:.75rem}
</style>
