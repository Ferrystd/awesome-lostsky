<script setup lang="ts">
import { useQueryDraft } from '@lostsky/shared/useQueryDraft'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'

import { ApiError, friendlyError } from '@lostsky/api/client'
import LsMediaUploadField from '@lostsky/ui/components/LsMediaUploadField.vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { ArrowRight, BadgeCheck, CircleAlert, RotateCcw, ShieldCheck, UserRound } from '@lucide/vue'
import { NButton, NInput, NSelect, NSpin } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { fileUploadReason, rememberCustomer, shopApi } from '../lib'

const route = useRoute()
const queryClient = useQueryClient()
const customer = useQuery({ queryKey: ['shop-customer'], queryFn: shopApi.me, retry: false })
const storefront = useQuery({ queryKey: ['shop-storefront'], queryFn: shopApi.storefront })
const assignees = useQuery({ queryKey: ['shop-customer-assignees'], queryFn: shopApi.assignees })
const nickname = ref('')
const avatar = ref('')
const avatarUploading = ref(false)
const avatarUploadReason = computed(() => fileUploadReason(customer.data.value?.file_upload))
const description = ref('')
const newSlug = ref('')
const claimedSlug = ref('')
const assigneeEntityId = ref<number | null>(null)
const success = ref('')
const saveError = ref('')

const draft = useQueryDraft({
  key: () => `customer-profile:${customer.data.value?.team_id ?? 0}:${customer.data.value?.id ?? 0}`,
  read: () => ({ nickname: nickname.value, avatar: avatar.value, description: description.value, assigneeEntityId: assigneeEntityId.value, newSlug: newSlug.value }),
  apply: value => {
    nickname.value = value.nickname
    avatar.value = value.avatar
    description.value = value.description
    assigneeEntityId.value = value.assigneeEntityId
    newSlug.value = value.newSlug
  },
})
useUnsavedChangesGuard(draft.dirty, { shouldConfirm: (to, from) => to.path !== from.path })
watch([() => customer.data.value?.id, () => customer.data.value?.team_id], () => { claimedSlug.value = ''; success.value = ''; saveError.value = '' }, { flush: 'sync' })

watch(
  () => customer.data.value,
  value => {
    if (!value) return
    rememberCustomer(value.id)
    draft.hydrate({ nickname: value.profile.name, avatar: value.profile.avatar || '', description: value.profile.description || '', assigneeEntityId: value.assignee?.entity_id ?? null, newSlug: '' })
  },
  { immediate: true },
)

const merchantName = computed(() => storefront.data.value?.profile.name || '当前商家')
const slug = computed(() => customer.data.value?.identity.slug || claimedSlug.value)
const profileState = computed<'ready' | 'loading' | 'blocked' | 'mismatch' | 'error'>(() => {
  if (customer.isPending.value) return 'loading'
  if (!customer.error.value) return 'ready'
  const error = customer.error.value
  if (error instanceof ApiError && error.status === 403 && error.message.includes('封禁')) return 'blocked'
  if (error instanceof ApiError && [403, 404].includes(error.status)) return 'mismatch'
  return 'error'
})
const retryTarget = computed(() => typeof route.query.redirect === 'string' ? route.query.redirect : '/customer/profile')
const assigneeOptions = computed(() => (assignees.data.value ?? []).map(item => ({
  label: `${item.name} · @${item.slug}`,
  value: item.entity_id,
})))

const save = useMutation({
  mutationFn: async () => {
    const submission = draft.capture()
    const values = submission.value
    const name = values.nickname.trim()
    if (!name) throw new Error('团队内昵称不能为空')
    if (!slug.value) {
      const claimed = values.newSlug.trim()
      if (!claimed) throw new Error('请先领取顾客标识')
      const result = await shopApi.claimSlug(claimed)
      if (!draft.isCurrent(submission)) return submission
      claimedSlug.value = result.slug
    }
    await shopApi.updateProfile({
      nickname: name,
      avatar: values.avatar.trim() || null,
      description: values.description.trim() || null,
      assignee_entity_id: values.assigneeEntityId,
    })
    return submission
  },
  onMutate: () => {
    success.value = ''
    saveError.value = ''
    return draft.capture()
  },
  onSuccess: async submission => {
    if (!draft.accept(submission)) return
    await queryClient.invalidateQueries({ queryKey: ['shop-customer'] })
    if (!draft.isCurrent(submission)) return
    success.value = '资料已保存，仅在当前商家的团队内使用。'
  },
  onError: (error, _variables, submission) => {
    if (!submission || !draft.isCurrent(submission)) return
    saveError.value = error instanceof ApiError ? friendlyError(error) : error instanceof Error ? error.message : friendlyError(error)
  },
})
</script>

<template>
  <section class="customer-profile-page">
    <header class="profile-heading">
      <div>
        <p class="section-label">顾客中心</p>
        <h1 tabindex="-1">我的资料</h1>
        <p>维护你在 <strong>{{ merchantName }}</strong> 的团队内身份。这些内容不会出现在公开顾客目录。</p>
      </div>
      <div class="profile-mark" aria-hidden="true"><UserRound :size="34" /></div>
    </header>

    <div v-if="profileState === 'loading'" class="profile-state" aria-live="polite">
      <NSpin size="large" />
      <strong>正在验证当前顾客身份</strong>
      <p>我们正在读取你在此商家的资料。</p>
    </div>

    <div v-else-if="profileState === 'blocked'" class="profile-state profile-state-danger" role="alert">
      <CircleAlert :size="38" aria-hidden="true" />
      <strong>当前顾客身份已被商家封禁</strong>
      <p>{{ friendlyError(customer.error.value) }}</p>
      <RouterLink to="/">返回商城</RouterLink>
    </div>

    <div v-else-if="profileState === 'mismatch'" class="profile-state" role="alert">
      <ShieldCheck :size="38" aria-hidden="true" />
      <strong>当前身份不属于这家商店</strong>
      <p>你可以为 {{ merchantName }} 建立独立的顾客身份，完成后会回到本页。</p>
      <RouterLink class="primary-link" :to="{ path: '/customer/bind', query: { redirect: retryTarget } }">
        建立顾客身份<ArrowRight :size="18" aria-hidden="true" />
      </RouterLink>
    </div>

    <div v-else-if="profileState === 'error'" class="profile-state" role="alert">
      <CircleAlert :size="38" aria-hidden="true" />
      <strong>暂时无法读取顾客资料</strong>
      <p>{{ friendlyError(customer.error.value) }}</p>
      <NButton secondary size="large" @click="customer.refetch()"><RotateCcw :size="17" />重新加载</NButton>
    </div>

    <form v-else class="profile-form" @submit.prevent="draft.dirty.value && !save.isPending.value && !avatarUploading && save.mutate()">
      <section class="profile-section" aria-labelledby="identity-heading">
        <div class="section-copy">
          <span>01</span>
          <div>
            <h2 id="identity-heading">团队内身份</h2>
            <p>昵称和简介仅供当前商家的业务、订单与会话识别。</p>
          </div>
        </div>
        <div class="profile-fields">
          <label for="customer-nickname">
            团队内昵称
            <NInput v-model:value="nickname" maxlength="50" size="large" :input-props="{ id: 'customer-nickname', 'aria-label': '团队内昵称' }" placeholder="你希望商家如何称呼你" />
          </label>
          <label for="customer-avatar">
            头像
            <LsMediaUploadField id="customer-avatar" v-model="avatar" :upload="shopApi.uploadCustomerFile" accept="image/*" placeholder="图片 URL 或上传文件" button-label="上传头像" :disabled="Boolean(avatarUploadReason)" :disabled-reason="avatarUploadReason" @uploading="avatarUploading = $event" @uploaded="customer.refetch()" />
          </label>
          <label for="customer-description">
            团队内简介
            <NInput v-model:value="description" type="textarea" maxlength="500" show-count :autosize="{ minRows: 4, maxRows: 8 }" :input-props="{ id: 'customer-description', 'aria-label': '团队内简介' }" placeholder="可选，补充便于商家服务你的信息" />
          </label>
        </div>
      </section>

      <section class="profile-section" aria-labelledby="slug-heading">
        <div class="section-copy">
          <span>02</span>
          <div>
            <h2 id="slug-heading">顾客标识</h2>
            <p>标识用于身份签发和内部引用，不代表公开主页；领取后不可修改。</p>
          </div>
        </div>
        <div class="profile-fields">
          <label v-if="slug" for="customer-slug">
            只读 slug
            <NInput :value="slug" readonly size="large" :input-props="{ id: 'customer-slug', 'aria-label': '只读 slug' }" />
          </label>
          <label v-else for="customer-new-slug">
            首次领取 slug
            <NInput v-model:value="newSlug" maxlength="50" size="large" :input-props="{ id: 'customer-new-slug', 'aria-label': '首次领取 slug' }" placeholder="例如 sky-friend" />
            <small>仅历史上尚未生成标识的顾客需要填写。</small>
          </label>
        </div>
      </section>

      <section class="profile-section" aria-labelledby="assignee-heading">
        <div class="section-copy">
          <span>03</span>
          <div>
            <h2 id="assignee-heading">服务归属</h2>
            <p>归属人会成为之后订单和流水的发单人；变更不会修改已经产生的历史记录。</p>
          </div>
        </div>
        <div class="profile-fields">
          <label for="customer-assignee">
            当前归属人员
            <NSelect
              v-model:value="assigneeEntityId"
              :options="assigneeOptions"
              :loading="assignees.isPending.value"
              clearable
              filterable
              size="large"
              placeholder="未归属"
              aria-label="当前归属人员"
            />
            <small>可以选择当前团队的 Team、成员或虚拟人员，Customer 不能成为归属人。</small>
          </label>
        </div>
      </section>

      <div class="profile-actions">
        <div aria-live="polite">
          <p v-if="success" class="save-success" role="status"><BadgeCheck :size="18" />{{ success }}</p>
          <p v-if="saveError" class="save-error" role="alert">{{ saveError }}</p>
        </div>
        <NButton attr-type="submit" type="primary" size="large" :loading="save.isPending.value" :disabled="avatarUploading || !draft.dirty.value">保存资料</NButton>
      </div>
    </form>
  </section>
</template>

<style scoped>
.customer-profile-page {
  width: min(100% - 2rem, 72rem);
  min-height: calc(100dvh - 13rem);
  margin: 0 auto;
  padding: clamp(3.5rem, 8vw, 7rem) 0;
}
.profile-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 2rem;
  padding-bottom: clamp(2.5rem, 5vw, 4rem);
  border-bottom: 1px solid var(--line);
}
.profile-heading > div:first-child { max-width: 46rem; }
.profile-heading h1 {
  margin: .5rem 0 1rem;
  font-family: "Barlow Condensed", "PingFang SC", sans-serif;
  font-size: clamp(3.4rem, 8vw, 6.8rem);
  line-height: .92;
  letter-spacing: -.035em;
}
.profile-heading p:last-child { margin: 0; color: var(--muted); font-size: 1rem; line-height: 1.8; }
.profile-heading strong { color: var(--ink); }
.profile-mark {
  display: grid;
  width: 5rem;
  aspect-ratio: 1;
  place-items: center;
  flex: 0 0 auto;
  border: 1px solid rgba(105, 228, 220, .55);
  border-radius: 50%;
  color: var(--cyan);
}
.profile-form { display: grid; }
.profile-section {
  display: grid;
  grid-template-columns: minmax(14rem, .7fr) minmax(0, 1.3fr);
  gap: clamp(2rem, 7vw, 7rem);
  padding: clamp(2.5rem, 6vw, 5rem) 0;
  border-bottom: 1px solid var(--line);
}
.section-copy { display: flex; align-items: start; gap: 1rem; }
.section-copy > span { color: var(--cyan); font-family: "Barlow Condensed", sans-serif; font-weight: 700; }
.section-copy h2 { margin: 0; font-size: clamp(1.5rem, 3vw, 2.2rem); }
.section-copy p { margin: .8rem 0 0; color: var(--muted); line-height: 1.7; }
.profile-fields { display: grid; gap: 1.5rem; }
.profile-fields label { display: grid; gap: .65rem; font-weight: 700; }
.profile-fields small { color: var(--muted); font-size: .8rem; font-weight: 400; line-height: 1.6; }
.profile-actions {
  display: flex;
  min-height: 8rem;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}
.profile-actions > div { min-width: 0; }
.save-success, .save-error { display: flex; align-items: center; gap: .5rem; margin: 0; line-height: 1.6; }
.save-success { color: var(--cyan-soft); }
.save-error { color: var(--danger); }
.profile-state {
  display: grid;
  min-height: 28rem;
  place-items: center;
  align-content: center;
  gap: 1rem;
  padding: 3rem 1rem;
  text-align: center;
}
.profile-state > svg { color: var(--cyan); }
.profile-state-danger > svg { color: var(--danger); }
.profile-state strong { font-size: clamp(1.5rem, 4vw, 2.5rem); }
.profile-state p { max-width: 40rem; margin: 0; color: var(--muted); line-height: 1.7; }
.profile-state > a:not(.primary-link) { min-height: 44px; display: inline-flex; align-items: center; color: var(--cyan); }
@media (max-width: 720px) {
  .customer-profile-page { width: min(100% - 1.5rem, 72rem); padding-top: 2.5rem; }
  .profile-heading { align-items: start; }
  .profile-mark { width: 3.25rem; }
  .profile-mark :deep(svg) { width: 1.5rem; }
  .profile-section { grid-template-columns: 1fr; gap: 1.75rem; }
  .profile-actions { align-items: stretch; flex-direction: column; justify-content: center; padding: 2rem 0; }
  .profile-actions :deep(.n-button) { width: 100%; }
}
</style>
