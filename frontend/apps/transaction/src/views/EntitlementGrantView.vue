<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsEntitySelect from '@lostsky/ui/components/LsEntitySelect.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import { shopWorkspaceUrl } from '@lostsky/shared/navigation'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { NInputNumber, NSelect } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { customerOptions, money } from '../lib'
import { loadWorkspaceAccess } from '../lib/workspace-access'
import type { ManualEntitlementGrantOptions, ManualEntitlementGrantResult } from '../types'

const router = useRouter()
const route = useRoute()
const personal = computed(() => route.meta.workspace === 'personal')
const grantBase = computed(() => personal.value ? '/personal/entitlement-grant' : '/entitlement-grant')
const form = reactive({
  product_id: null as number | null,
  customer_id: null as number | null,
  quantity: 1 as number | null,
  sender_entity_id: null as number | null,
  cs_entity_id: null as number | null,
})
const result = ref<ManualEntitlementGrantResult | null>(null)
const options = useQuery({
  queryKey: computed(() => ['manual-entitlement-grant-options', personal.value ? 'personal' : 'team']),
  queryFn: () => api.get<ManualEntitlementGrantOptions>(`${grantBase.value}/options`),
})
const access = useQuery({
  queryKey: ['transaction-workspace-access'],
  queryFn: () => loadWorkspaceAccess(),
})
watch(() => access.data.value?.identity?.entity_id, (entityId) => {
  if (!personal.value && !form.sender_entity_id && entityId) form.sender_entity_id = Number(entityId)
}, { immediate: true })

const products = computed(() => options.data.value?.products ?? [])
const productOptions = computed(() => products.value.map(product => ({
  label: `${product.name} · ${money(product.price)}`,
  value: Number(product.id),
})))
const selectedProduct = computed(() => products.value.find(product => Number(product.id) === form.product_id))
const quantityValid = computed(() => Number.isInteger(form.quantity) && Number(form.quantity) >= 1 && Number(form.quantity) <= 999)
const valid = computed(() => Boolean(
  form.product_id
  && form.customer_id
  && (personal.value || form.sender_entity_id)
  && quantityValid.value,
))
const shopProductsUrl = shopWorkspaceUrl('/manage/products')

const save = useMutation({
  mutationFn: () => api.post<ManualEntitlementGrantResult>(grantBase.value, {
    product_id: form.product_id,
    customer_id: form.customer_id,
    quantity: form.quantity,
    ...(personal.value ? {} : { sender_entity_id: form.sender_entity_id }),
    cs_entity_id: form.cs_entity_id,
  }),
  onSuccess: (data) => {
    result.value = data
    form.product_id = null
    form.customer_id = null
    form.quantity = 1
    form.cs_entity_id = null
    feedback.success('顾客权益已赋予')
  },
})
</script>

<template>
  <div class="entitlement-grant-view">
    <LsPageHeader
      :title="personal ? '下发顾客权益' : '赋予顾客权益'"
      :description="personal ? '为当前实体（Entity）接待的顾客直接交付 Shop 服务套餐权益；本操作不创建商城订单。' : '从 Shop 服务套餐读取权益快照并直接交付给顾客；本操作不创建商城订单。'"
      :back-to="personal ? '/personal/entitlements' : '/services'"
      :back-label="personal ? '返回权益下发' : '返回服务核销'"
    />
    <LsAsyncState v-if="options.isPending.value" state="loading" :rows="5" />
    <LsAsyncState v-else-if="options.isError.value" state="error" title="暂时无法读取赋予候选" :description="friendlyError(options.error.value)" />
    <LsEmptyState v-else-if="!products.length" title="没有可赋予的服务套餐" description="先在 Shop 创建并启用关联权益包的服务套餐商品。">
      <template #action><a class="primary-link" :href="shopProductsUrl">前往商品管理</a></template>
    </LsEmptyState>
    <form v-else @submit.prevent="save.mutate()">
      <LsFormSection title="赋予内容" :description="personal ? '商品、本人接待顾客、客服和份数会作为同一次原子操作保存；发单人固定为当前实体（Entity）。' : '商品、顾客、业务归属和份数会作为同一次原子操作保存。'">
        <LsField label="服务套餐商品" for-id="grant-product" required hint="只显示 Shop 中已启用且关联有效权益包的服务套餐。">
          <NSelect id="grant-product" v-model:value="form.product_id" :options="productOptions" filterable placeholder="选择服务套餐商品" />
        </LsField>
        <LsField label="顾客" for-id="grant-customer" required>
          <NSelect id="grant-customer" v-model:value="form.customer_id" :options="customerOptions(options.data.value)" filterable placeholder="选择顾客" />
        </LsField>
        <LsField label="赋予份数" for-id="grant-quantity" required hint="每份包含该商品权益包中的全部服务权益。">
          <NInputNumber id="grant-quantity" v-model:value="form.quantity" :min="1" :max="999" :precision="0" />
        </LsField>
        <LsField v-if="!personal" label="发单人" for-id="grant-sender" required hint="顾客已有当前归属时，服务端优先使用该归属。">
          <LsEntitySelect id="grant-sender" v-model="form.sender_entity_id" :entities="options.data.value?.entities ?? []" placeholder="选择发单人" />
        </LsField>
        <LsField label="客服" for-id="grant-cs">
          <LsEntitySelect id="grant-cs" v-model="form.cs_entity_id" :entities="options.data.value?.entities ?? []" clearable placeholder="可选" />
        </LsField>
        <p class="grant-note" role="note">
          <template v-if="selectedProduct">当前商品单份 {{ money(selectedProduct.price) }}；</template>
          {{ options.data.value?.sync_transaction ? '提交后会同步一笔服务包收款流水。' : '当前设置只赋予权益，不同步流水。' }}
        </p>
        <p v-if="!customerOptions(options.data.value).length" class="grant-note" role="note">当前没有可用顾客，请先建立并启用顾客资料。</p>
        <LsInlineError v-if="save.isError.value" :message="friendlyError(save.error.value)" />
        <p v-if="result" class="grant-result" role="status" aria-live="polite">
          已赋予 {{ result.entitlement_count }} 项权益；未创建商城订单；{{ result.transaction_id ? `已生成流水 #${result.transaction_id}` : '未同步流水' }}。
        </p>
      </LsFormSection>
      <LsFormActions>
        <LsButton type="button" variant="secondary" @click="router.back()">取消</LsButton>
        <LsButton type="submit" :loading="save.isPending.value" :disabled="!valid">确认赋予</LsButton>
      </LsFormActions>
    </form>
  </div>
</template>

<style scoped>
.entitlement-grant-view,.entitlement-grant-view form{display:grid;gap:1.25rem}.grant-note,.grant-result{margin:0;padding:.75rem .875rem;border-radius:8px;background:var(--cloud);color:var(--muted-ink);font-size:.875rem;line-height:1.6}.grant-result{color:var(--ink)}
</style>
