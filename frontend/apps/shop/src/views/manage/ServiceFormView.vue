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
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NInput, NInputNumber, NSelect, useDialog } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { canManage, manageApi } from '../../lib'

const route = useRoute()
const router = useRouter()
const dialog = useDialog()
const client = useQueryClient()
const id = computed(() => Number(route.params.id || 0))
const editing = computed(() => id.value > 0)
const form = reactive({
  name: '', description: '', unit_name: '次', quantity_scale: 0, quantity_step: 1,
  default_total_price: 0, default_cost: 0, default_handler_cut: 0,
  default_sender_cut: 0, default_cs_cut: 0, default_team_cut: 0, is_active: 1,
})
const handlerIds = ref<number[]>([])
const options = useQuery({ queryKey: ['manage-options'], queryFn: manageApi.options })
const detail = useQuery({ queryKey: computed(() => ['manage-service', id.value]), queryFn: () => manageApi.service(id.value), enabled: editing })
const pool = useQuery({ queryKey: computed(() => ['manage-service-handlers', id.value]), queryFn: () => manageApi.serviceHandlers(id.value), enabled: editing })

watch(() => detail.data.value, data => {
  if (data) Object.assign(form, data, { quantity_step: Number(data.quantity_step) })
}, { immediate: true })
watch(() => pool.data.value, data => {
  if (data) handlerIds.value = data.map(item => Number(item.entity_id))
}, { immediate: true })
watch(() => options.data.value?.service_defaults, defaults => {
  if (defaults && !editing.value) Object.assign(form, {
    unit_name: defaults.default_unit_name,
    quantity_scale: defaults.default_quantity_scale,
    quantity_step: Number(defaults.default_quantity_step),
  })
}, { immediate: true })

const entityOptions = computed(() => (options.data.value?.entities ?? []).map(entity => ({
  label: entity.name,
  value: Number(entity.entity_id ?? entity.id),
})))
const precisionOptions = [0, 1, 2, 3, 4].map(value => ({ label: value === 0 ? '仅整数' : `${value} 位小数`, value }))
const save = useMutation({
  mutationFn: () => manageApi.saveService(editing.value ? id.value : null, form),
  onSuccess: async data => {
    await client.invalidateQueries({ queryKey: ['manage-options'] })
    feedback.success('服务已保存')
    await router.push(`/manage/services/${data.id}`)
  },
})
const savePool = useMutation({
  mutationFn: () => manageApi.saveServiceHandlers(id.value, handlerIds.value),
  onSuccess: async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['manage-service-handlers', id.value] }),
      client.invalidateQueries({ queryKey: ['manage-service', id.value] }),
    ])
    feedback.success('接单池已更新')
  },
})
const disable = useMutation({ mutationFn: () => manageApi.disableService(id.value), onSuccess: () => router.push('/manage/services') })
const valid = computed(() => Boolean(form.name.trim() && form.unit_name.trim() && form.quantity_step > 0))

function stop() {
  dialog.warning({
    title: '停用服务',
    content: '停用后不能加入新的权益配置；历史权益与履约切片不受影响。',
    positiveText: '确认停用', negativeText: '返回', onPositiveClick: () => disable.mutate(),
  })
}
</script>

<template>
  <div class="manage-page">
    <LsPageHeader :title="editing ? '编辑服务' : '新建服务'" description="定义可计量的服务单位、核销步长与默认单价；接单资格通过独立接单池维护。" back-to="/manage/services" back-label="返回服务">
      <template #actions><LsButton v-if="editing && canManage('shop.product.delete')" variant="danger" @click="stop">停用服务</LsButton></template>
    </LsPageHeader>

    <form class="manage-form" @submit.prevent="save.mutate()">
      <LsFormSection title="基本信息">
        <LsField label="服务名称" for-id="service-name" required><NInput id="service-name" v-model:value="form.name" maxlength="100" /></LsField>
        <LsField label="说明" for-id="service-description"><NInput id="service-description" v-model:value="form.description" type="textarea" maxlength="1000" show-count /></LsField>
        <LsSwitchField id="service-active" :model-value="form.is_active === 1" label="启用状态" description="停用后不能用于新的权益配置或发起新任务。" @update:model-value="value => form.is_active = value ? 1 : 0" />
      </LsFormSection>
      <LsFormSection title="计量规则" description="同一套模型可表达按人、按次、按小时或其他可计量服务。">
        <LsField label="计量单位" for-id="service-unit" required hint="例如：人、次、小时"><NInput id="service-unit" v-model:value="form.unit_name" maxlength="20" /></LsField>
        <LsField label="数量精度" for-id="service-scale" required><NSelect id="service-scale" v-model:value="form.quantity_scale" :options="precisionOptions" /></LsField>
        <LsField label="最小核销步长" for-id="service-step" required hint="每次履约数量必须是该步长的整数倍。"><NInputNumber id="service-step" v-model:value="form.quantity_step" :min="1 / 10 ** form.quantity_scale" :step="1 / 10 ** form.quantity_scale" :precision="form.quantity_scale" /></LsField>
      </LsFormSection>
      <LsFormSection title="默认单位金额与分配" description="用于无订单金额快照的服务卡；服务包会按权益包配置冻结整份额度金额。">
        <LsField label="单位服务价值" for-id="service-price"><NInputNumber id="service-price" v-model:value="form.default_total_price" :min="0" :precision="2" /></LsField>
        <LsField label="单位成本" for-id="service-cost"><NInputNumber id="service-cost" v-model:value="form.default_cost" :min="0" :precision="2" /></LsField>
        <LsField label="单位接单分配" for-id="service-handler-cut"><NInputNumber id="service-handler-cut" v-model:value="form.default_handler_cut" :min="0" :precision="2" /></LsField>
        <LsField label="单位发单分配" for-id="service-sender-cut"><NInputNumber id="service-sender-cut" v-model:value="form.default_sender_cut" :min="0" :precision="2" /></LsField>
        <LsField label="单位客服分配" for-id="service-cs-cut"><NInputNumber id="service-cs-cut" v-model:value="form.default_cs_cut" :min="0" :precision="2" /></LsField>
        <LsField label="单位团队分配" for-id="service-team-cut"><NInputNumber id="service-team-cut" v-model:value="form.default_team_cut" :min="0" :precision="2" /></LsField>
      </LsFormSection>
      <LsInlineError v-if="detail.isError.value" :message="friendlyError(detail.error.value)" />
      <LsInlineError v-if="save.isError.value" :message="friendlyError(save.error.value)" />
      <LsFormActions><LsButton type="button" variant="secondary" @click="router.back()">取消</LsButton><LsButton type="submit" :disabled="!valid || !canManage('shop.product.write')" :loading="save.isPending.value">保存服务</LsButton></LsFormActions>
    </form>

    <form v-if="editing" class="manage-form" @submit.prevent="savePool.mutate()">
      <LsFormSection title="接单池" description="名单只表示接单资格。移除后不能接受新邀请或领取新任务，已经接取的任务不会被改写。">
        <LsField label="可接单 Entity" for-id="service-handlers" hint="仅可选择当前团队内有效的 Team、TeamMember 或 TeamVirtual Entity。">
          <NSelect id="service-handlers" v-model:value="handlerIds" :options="entityOptions" multiple filterable clearable placeholder="选择一个或多个 Entity" />
        </LsField>
      </LsFormSection>
      <LsInlineError v-if="pool.isError.value" :message="friendlyError(pool.error.value)" />
      <LsInlineError v-if="savePool.isError.value" :message="friendlyError(savePool.error.value)" />
      <LsFormActions><LsButton type="submit" :disabled="!canManage('shop.product.write')" :loading="savePool.isPending.value">保存接单池</LsButton></LsFormActions>
    </form>
  </div>
</template>
