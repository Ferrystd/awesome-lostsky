<script setup lang="ts">
import { friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsEntitySelect from '@lostsky/ui/components/LsEntitySelect.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NInputNumber, NPagination, useDialog } from 'naive-ui'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { canManage, entitlementManagement, formatDate, loadManageAccess, managePermissionReason } from '../../lib'

const route = useRoute()
const routeAccess = useRouteAccess()
const id = computed(() => Number(route.params.id))
const scope = computed(() => route.meta.workspace === 'personal' ? 'personal' : 'team')
const management = computed(() => entitlementManagement(scope.value))
const personal = computed(() => management.value.personal)
const access = useQuery({ queryKey: ['shop-manage-access'], queryFn: () => loadManageAccess() })
const expectedEntityId = computed(() => access.data.value?.identity?.entity_id ?? 0)
const page = ref(1)
const quantity = ref(1)
const targetEntityId = ref<number | null>(null)
const revealed = ref<Record<number, string>>({})
const issued = ref<Array<{ id: number; code: string; code_hint: string }>>([])
const client = useQueryClient()
const dialog = useDialog()
const campaign = useQuery({ queryKey: computed(() => [scope.value, 'manage-campaign', id.value]), queryFn: () => routeAccess.read(() => management.value.campaign(id.value)), enabled: computed(() => !routeAccess.restricted.value) })
const options = useQuery({ queryKey: computed(() => [scope.value, 'manage-options']), queryFn: () => management.value.options(), enabled: computed(() => !routeAccess.restricted.value) })
const query = useQuery({ queryKey: computed(() => [scope.value, 'manage-codes', id.value, page.value]), queryFn: () => management.value.codes(id.value, { page: page.value, limit: 20 }), enabled: computed(() => !routeAccess.restricted.value) })
const pages = computed(() => Math.max(1, Math.ceil(Number(query.data.value?.total ?? 0) / 20)))
const issue = useMutation({
  mutationFn: () => management.value.issueCodes(id.value, { quantity: quantity.value, target_entity_id: targetEntityId.value }, expectedEntityId.value),
  onSuccess: async rows => {
    issued.value = rows
    feedback.success(`已发行 ${rows.length} 个兑换码`)
    await client.invalidateQueries({ queryKey: [scope.value, 'manage-codes', id.value] })
  },
})

async function reveal(codeId: number) {
  const result = await management.value.revealCode(id.value, codeId, expectedEntityId.value)
  revealed.value = { ...revealed.value, [codeId]: result.code }
}

async function copy(value: string) {
  await navigator.clipboard.writeText(value)
  feedback.success('兑换码已复制')
}

function stop(codeId: number) {
  dialog.warning({
    title: '停用兑换码',
    content: '停用后该兑换码不能继续领取，已经领取的权益不受影响。',
    positiveText: '确认停用',
    negativeText: '返回',
    onPositiveClick: async () => {
      await management.value.disableCode(id.value, codeId, expectedEntityId.value)
      await client.invalidateQueries({ queryKey: [scope.value, 'manage-codes', id.value] })
    },
  })
}
</script>

<template>
  <div class="manage-page">
    <LsPageHeader :title="campaign.data.value?.name || (personal ? '我的卡密' : '兑换码')" description="列表只显示脱敏片段；发行结果和显式查看才展示完整兑换码。" :back-to="`${management.routePrefix}/campaigns/${id}`" back-label="返回活动" />
    <LsFormSection title="发行兑换码">
      <div class="inline-fields">
        <label>数量<NInputNumber v-model:value="quantity" :min="1" :max="100" /></label>
        <label v-if="Number(campaign.data.value?.mode) === 3">
          定向 Entity
          <LsEntitySelect v-model="targetEntityId" :entities="options.data.value?.entities ?? []" :loading="options.isPending.value" :disabled="options.isError.value" placeholder="选择受益 Entity" />
        </label>
      </div>
      <LsButton :disabled="routeAccess.restricted.value || !canManage(management.permission) || (Number(campaign.data.value?.mode) === 3 && !targetEntityId)" :disabled-reason="routeAccess.reason.value || (!canManage(management.permission) ? managePermissionReason(management.permission) : '')" :loading="issue.isPending.value" @click="issue.mutate()">发行兑换码</LsButton>
      <LsInlineError v-if="issue.isError.value" :message="friendlyError(issue.error.value)" />
      <div v-if="issued.length" class="issued-codes" role="status">
        <p>请立即安全保存本次发行结果：</p>
        <button v-for="row in issued" :key="row.id" type="button" @click="copy(row.code)"><code>{{ row.code }}</code><span>复制</span></button>
      </div>
    </LsFormSection>
    <LsAsyncState v-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="5" />
    <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取兑换码" :description="friendlyError(query.error.value)" />
    <LsEmptyState :source="query.data.value" v-else-if="routeAccess.restricted.value || !query.data.value?.list.length" :title="routeAccess.restricted.value ? '没有可显示的兑换码' : '还没有兑换码'" description="按活动模式发行第一批兑换码。" />
    <section v-else class="code-list">
      <article v-for="row in query.data.value.list" :key="row.id">
        <div><strong>{{ revealed[row.id] || row.code_hint }}</strong><small>#{{ row.id }} · {{ formatDate(row.create_time) }} · 已使用 {{ row.use_count }} 次</small></div>
        <LsStatusTag :label="row.is_active ? '可用' : '已停用'" :type="row.is_active ? 'success' : 'default'" />
        <div class="row-actions">
          <LsButton v-if="!revealed[row.id]" size="sm" variant="secondary" :disabled="!canManage(management.permission)" :disabled-reason="managePermissionReason(management.permission)" @click="reveal(row.id)">查看</LsButton>
          <LsButton v-else-if="revealed[row.id]" size="sm" variant="secondary" @click="copy(revealed[row.id])">复制</LsButton>
          <LsButton v-if="row.is_active" size="sm" variant="danger" :disabled="!canManage(management.permission)" :disabled-reason="managePermissionReason(management.permission)" @click="stop(row.id)">停用</LsButton>
        </div>
      </article>
    </section>
    <div v-if="query.data.value?.total" class="pager"><span>第 {{ page }} / {{ pages }} 页</span><NPagination v-model:page="page" :page-count="pages" /></div>
  </div>
</template>
