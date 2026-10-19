<script setup lang="ts">
import LsFormPage from '@lostsky/ui/components/LsFormPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import { ArrowLeft } from '@lucide/vue'

import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsInput from '@lostsky/ui/components/LsInput.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { NDatePicker, NSelect } from 'naive-ui'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'

interface AbilityCatalogItem { key: string; label: string; levels: number[] }
interface GrantResult { team_slug: string; ability_key: string; level: number; expire_time: number }

const route = useRoute()
const routeAccess = useRouteAccess()
const initialSlug = typeof route.query.team === 'string' ? route.query.team.trim().toLowerCase() : ''
const requestedReturn = typeof route.query.return === 'string' ? route.query.return : ''
const returnTo = /^\/teams\/\d+$/.test(requestedReturn) ? requestedReturn : undefined
const teamSlug = ref(initialSlug)
const abilityKey = ref<string | null>(null)
const level = ref<number | null>(null)
const expireAt = ref<number | null>(Date.now() + 30 * 86400 * 1000)
const dirty = computed(() => Boolean(teamSlug.value.trim() || abilityKey.value || level.value !== null))
const catalog = useQuery({
  queryKey: ['admin-team-ability-catalog'],
  queryFn: () => api.get<AbilityCatalogItem[]>('/team-abilities/catalog'),
  enabled: computed(() => !routeAccess.restricted.value),
})
const abilityOptions = computed(() => (catalog.data.value ?? []).map((item) => ({ label: `${item.label}（${item.key}）`, value: item.key })))
const selectedCatalog = computed(() => catalog.data.value?.find((item) => item.key === abilityKey.value))
const levelOptions = computed(() => (selectedCatalog.value?.levels ?? []).map((value) => ({ label: `等级 ${value}`, value })))
const validSlug = computed(() => /^[a-z][a-z0-9_-]{1,49}$/.test(teamSlug.value.trim().toLowerCase()))
const valid = computed(() => Boolean(
  validSlug.value
  && abilityKey.value
  && level.value !== null
  && selectedCatalog.value?.levels.includes(level.value)
  && (expireAt.value === null || expireAt.value > Date.now()),
))

watch(abilityKey, () => {
  level.value = selectedCatalog.value?.levels[0] ?? null
})

const save = useMutation({
  mutationFn: () => api.post<GrantResult>('/team-abilities', {
    team_slug: teamSlug.value.trim().toLowerCase(),
    ability_key: abilityKey.value,
    level: level.value,
    expire_time: expireAt.value === null ? 0 : Math.floor(expireAt.value / 1000),
  }),
  onSuccess: (result) => {
    feedback.success(`团队 ${result.team_slug} 的 ${result.ability_key} Ability 已开通`)
    teamSlug.value = ''
    abilityKey.value = null
    level.value = null
    expireAt.value = Date.now() + 30 * 86400 * 1000
  },
  onError: (error) => feedback.error(friendlyError(error)),
})

function beforeUnload(event: BeforeUnloadEvent) {
  if (!dirty.value) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
onBeforeRouteLeave(() => {
  if (save.isPending.value) return false
  if (!dirty.value) return true
  return window.confirm('当前团队能力配置尚未提交，确定离开吗？')
})
</script>

<template>
  <LsFormPage title="开通团队能力" description="直接输入团队标识来开通能力；无需从团队列表中查找。">
    <template #actions>
      <LsPageLink v-if="returnTo" :to="returnTo" :icon="ArrowLeft" label="返回团队详情" />
    </template>

    <LsAsyncState v-if="!routeAccess.restricted.value && catalog.isPending.value" state="loading" :rows="4" />
    <LsAsyncState v-else-if="!routeAccess.restricted.value && catalog.isError.value" state="error" title="暂时无法读取 Ability 目录" :description="friendlyError(catalog.error.value)" />
    <form class="ability-grant-fields" v-else @submit.prevent="routeAccess.restricted.value ? feedback.info(routeAccess.reason.value) : save.mutate()">
      <LsFormSection title="授权对象" description="确认接收能力的团队标识。">
        <LsField label="团队 slug" for-id="team-ability-slug" hint="字母开头，仅使用字母、数字、下划线和连字符。" required>
          <LsInput id="team-ability-slug" v-model="teamSlug" autocomplete="off" autocapitalize="none" spellcheck="false" pattern="[A-Za-z][A-Za-z0-9_-]+" minlength="2" maxlength="50" placeholder="lostsky" required />
        </LsField>
      </LsFormSection>
      <LsFormSection title="能力与有效期" description="选择能力、等级，以及本次授权的到期时间。">
        <LsField label="Ability" for-id="team-ability-key" required>
          <NSelect id="team-ability-key" v-model:value="abilityKey" :options="abilityOptions" :disabled="routeAccess.restricted.value || save.isPending.value" :placeholder="routeAccess.restricted.value ? '-' : '选择要开通的能力'" aria-label="Ability" />
        </LsField>
        <LsField label="等级" for-id="team-ability-level" required>
          <NSelect id="team-ability-level" v-model:value="level" :options="levelOptions" :disabled="!abilityKey || save.isPending.value" placeholder="先选择 Ability" aria-label="等级" />
        </LsField>
        <LsField label="到期时间" for-id="team-ability-expire" hint="清空表示永久有效；有限期默认设置为 30 天。">
          <NDatePicker id="team-ability-expire" v-model:value="expireAt" type="datetime" clearable :disabled="save.isPending.value" aria-label="到期时间" :is-date-disabled="(timestamp: number) => timestamp <= Date.now()" />
        </LsField>
      </LsFormSection>
      <LsInlineError v-if="save.isError.value" :message="friendlyError(save.error.value)" />
      <LsFormSection title="确认授权" description="提交会覆盖该团队同一种能力的旧手工授权，但不影响角色权限和体验活动授权。">
      <LsFormActions>
        <LsButton type="submit" :disabled="routeAccess.restricted.value || !valid" :disabled-reason="routeAccess.reason.value" :loading="save.isPending.value">开通能力</LsButton>
      </LsFormActions>
      </LsFormSection>
    </form>
  </LsFormPage>
</template>

<style scoped>
.ability-grant-fields{display:grid;gap:1.25rem}
</style>
