<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEntitySelect from '@lostsky/ui/components/LsEntitySelect.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NSelect } from 'naive-ui'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { customerOptions } from '../lib'
import type { TransactionOptions } from '../types'

const router = useRouter()
const client = useQueryClient()
const entityId = ref<number | null>(null)
const customerId = ref<number | null>(null)
const options = useQuery({ queryKey: ['transaction-options'], queryFn: () => api.get<TransactionOptions>('/transaction/options') })
const save = useMutation({
  mutationFn: () => api.post('/transaction/sender/bind', { entity_id: entityId.value, customer_id: customerId.value }),
  onSuccess: async () => {
    await client.invalidateQueries({ queryKey: ['sender-bindings'] })
    await router.push('/bindings')
  },
})
const valid = computed(() => Boolean(entityId.value && customerId.value))
</script>

<template>
  <div class="binding-form-view">
    <LsPageHeader title="新增发单绑定" description="一个客户可以绑定给不同发单人；同一发单人与客户的重复绑定会被拒绝。" back-to="/bindings" back-label="返回发单绑定" />
    <form @submit.prevent="save.mutate()">
      <LsFormSection title="绑定关系">
        <LsField label="发单人" for-id="binding-entity" required><LsEntitySelect id="binding-entity" v-model="entityId" :entities="options.data.value?.entities ?? []" :loading="options.isPending.value" :disabled="options.isError.value" placeholder="选择发单人" /></LsField>
        <LsField label="客户" for-id="binding-customer" required><NSelect id="binding-customer" v-model:value="customerId" :options="customerOptions(options.data.value)" filterable placeholder="选择客户" /></LsField>
        <LsInlineError v-if="options.isError.value || save.isError.value" :message="friendlyError(options.error.value || save.error.value)" />
      </LsFormSection>
      <LsFormActions><LsButton type="button" variant="secondary" @click="router.push('/bindings')">取消</LsButton><LsButton type="submit" :loading="save.isPending.value" :disabled="!valid">保存绑定</LsButton></LsFormActions>
    </form>
  </div>
</template>
