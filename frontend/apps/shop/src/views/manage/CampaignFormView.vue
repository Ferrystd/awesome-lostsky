<script setup lang="ts">
import { friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsSwitchField from '@lostsky/ui/components/LsSwitchField.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { NDatePicker, NInput, NInputNumber, NSelect, useDialog } from 'naive-ui'
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { canManage, entitlementManagement, loadManageAccess, resourceOwnerLabel } from '../../lib'

const route = useRoute()
const router = useRouter()
const dialog = useDialog()
const id = computed(() => Number(route.params.id || 0))
const editing = computed(() => id.value > 0)
const scope = computed(() => route.meta.workspace === 'personal' ? 'personal' : 'team')
const management = computed(() => entitlementManagement(scope.value))
const personal = computed(() => management.value.personal)
const access = useQuery({ queryKey: ['shop-manage-access'], queryFn: () => loadManageAccess() })
const expectedEntityId = computed(() => access.data.value?.identity?.entity_id ?? 0)
const form = reactive({ name: '', package_id: null as number | null, claim_group: '', mode: 1, total_limit: null as number | null, per_target_limit: 1, range: null as [number, number] | null, is_active: 1 })
const options = useQuery({ queryKey: computed(() => [scope.value, 'manage-options']), queryFn: () => management.value.options() })
const detail = useQuery({ queryKey: computed(() => [scope.value, 'manage-campaign', id.value]), queryFn: () => management.value.campaign(id.value), enabled: editing })

watch(() => detail.data.value, data => {
  if (!data) return
  Object.assign(form, {
    name: data.name, package_id: data.package_id, claim_group: data.claim_group,
    mode: Number(data.mode), total_limit: data.total_limit ?? null,
    per_target_limit: data.per_target_limit,
    range: data.redeem_starts_at || data.redeem_ends_at ? [data.redeem_starts_at * 1000, data.redeem_ends_at * 1000] : null,
    is_active: data.is_active,
  })
}, { immediate: true })

const availablePackages = computed(() => {
  const packages = [...(options.data.value?.packages ?? [])]
  const linked = detail.data.value?.package
  if (linked && !packages.some(item => item.id === linked.id)) packages.push(linked)
  return packages
})
const packageOptions = computed(() => availablePackages.value.map(item => ({
  label: `${item.name} · ${resourceOwnerLabel(item, expectedEntityId.value)}`,
  value: item.id,
  disabled: !item.is_active,
})))
const save = useMutation({
  mutationFn: () => management.value.saveCampaign(editing.value ? id.value : null, {
    name: form.name, package_id: form.package_id, claim_group: form.claim_group || undefined,
    mode: form.mode, total_limit: form.total_limit, per_target_limit: form.per_target_limit,
    redeem_starts_at: form.range ? Math.floor(form.range[0] / 1000) : 0,
    redeem_ends_at: form.range ? Math.floor(form.range[1] / 1000) : 0,
    is_active: form.is_active,
  }, expectedEntityId.value),
  onSuccess: data => {
    feedback.success('卡活动已保存')
    void router.push(`${management.value.routePrefix}/campaigns/${data.id}/codes`)
  },
})
const disable = useMutation({
  mutationFn: () => management.value.disableCampaign(id.value, expectedEntityId.value),
  onSuccess: () => router.push(`${management.value.routePrefix}/campaigns`),
})
function stop() {
  dialog.warning({ title: '停用卡活动', content: '所有未领取卡密会立即不可用，历史领取结果保持不变。', positiveText: '确认停用', negativeText: '返回', onPositiveClick: () => disable.mutate() })
}
const valid = computed(() => Boolean(form.name.trim() && form.package_id))
</script>

<template>
  <div class="manage-page">
    <LsPageHeader
      :title="editing ? (personal ? '编辑本人卡活动' : '编辑卡活动') : (personal ? '新建本人卡活动' : '新建卡活动')"
      description="模式、领取互斥组和权益包在创建后保持固定，避免已发行卡密改变语义。"
      :back-to="`${management.routePrefix}/campaigns`"
      back-label="返回活动"
    >
      <template #actions>
        <RouterLink v-if="editing" class="secondary-link" :to="`${management.routePrefix}/campaigns/${id}/codes`">管理兑换码</RouterLink>
        <LsButton v-if="editing && canManage(management.disablePermission)" variant="danger" @click="stop">停用活动</LsButton>
      </template>
    </LsPageHeader>
    <form class="manage-form" @submit.prevent="save.mutate()">
      <LsFormSection title="活动配置">
        <p v-if="personal" class="form-intro" role="note">此卡活动自动归属当前 Entity，只能绑定本人或团队公用权益包。</p>
        <LsField label="活动名称" for-id="campaign-name" required><NInput id="campaign-name" v-model:value="form.name" maxlength="100" /></LsField>
        <LsField label="权益包" for-id="campaign-package" required><NSelect id="campaign-package" v-model:value="form.package_id" :options="packageOptions" filterable :disabled="editing" /></LsField>
        <LsField label="发行模式" for-id="campaign-mode" required><NSelect id="campaign-mode" v-model:value="form.mode" :options="[{ label: '独立卡密', value: 1 }, { label: '公共活动码', value: 2 }, { label: '定向卡密', value: 3 }]" :disabled="editing" /></LsField>
        <LsField label="领取互斥组" for-id="campaign-group" hint="留空时由服务端生成；公共活动可用相同组限制每个主体一次。"><NInput id="campaign-group" v-model:value="form.claim_group" :disabled="editing" maxlength="100" /></LsField>
        <LsField label="领取时间" for-id="campaign-range"><NDatePicker id="campaign-range" v-model:value="form.range" type="datetimerange" clearable /></LsField>
        <LsField label="总领取上限" for-id="campaign-limit" hint="留空表示不限"><NInputNumber id="campaign-limit" v-model:value="form.total_limit" :min="1" clearable /></LsField>
        <LsField label="每个主体上限" for-id="campaign-target-limit"><NInputNumber id="campaign-target-limit" v-model:value="form.per_target_limit" :min="1" /></LsField>
        <LsSwitchField id="campaign-active" :model-value="form.is_active === 1" label="启用状态" description="停用后不能继续领取新的卡密权益。" @update:model-value="value => form.is_active = value ? 1 : 0" />
      </LsFormSection>
      <LsInlineError v-if="detail.isError.value" :message="friendlyError(detail.error.value)" />
      <LsInlineError v-if="save.isError.value" :message="friendlyError(save.error.value)" />
      <LsFormActions>
        <LsButton type="button" variant="secondary" @click="router.back()">取消</LsButton>
        <LsButton type="submit" :disabled="!valid || !canManage(management.permission) || (personal && !expectedEntityId)" :loading="save.isPending.value">保存活动</LsButton>
      </LsFormActions>
    </form>
  </div>
</template>
