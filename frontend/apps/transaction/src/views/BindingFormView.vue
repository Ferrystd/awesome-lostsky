<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NSelect } from 'naive-ui'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '../components/PageHeader.vue'
import { customerOptions, memberOptions } from '../lib'
import type { TransactionOptions } from '../types'

const router = useRouter()
const client = useQueryClient()
const memberId = ref<number | null>(null)
const customerId = ref<number | null>(null)
const options = useQuery({ queryKey: ['transaction-options'], queryFn: () => api.get<TransactionOptions>('/transaction/options') })
const save = useMutation({
  mutationFn: () => api.post('/transaction/sender/bind', { member_id: memberId.value, customer_id: customerId.value }),
  onSuccess: async () => {
    await client.invalidateQueries({ queryKey: ['sender-bindings'] })
    await router.push('/bindings')
  },
})
const valid = computed(() => Boolean(memberId.value && customerId.value))
</script>

<template>
  <div class="binding-form-view">
    <PageHeader title="新增发单绑定" description="一个客户可以绑定给不同成员；同一成员与客户的重复绑定会被拒绝。" back-to="/bindings" back-label="返回发单绑定" />
    <form class="panel form-panel" @submit.prevent="save.mutate()">
      <label class="field"><span>发单人 <b>*</b></span><NSelect v-model:value="memberId" :options="memberOptions(options.data.value)" filterable placeholder="选择成员" /></label>
      <label class="field"><span>客户 <b>*</b></span><NSelect v-model:value="customerId" :options="customerOptions(options.data.value)" filterable placeholder="选择客户" /></label>
      <p v-if="options.isError.value || save.isError.value" class="feedback error" role="alert">{{ friendlyError(options.error.value || save.error.value) }}</p>
      <div class="form-actions"><LsButton type="button" variant="secondary" @click="router.push('/bindings')">取消</LsButton><LsButton type="submit" :loading="save.isPending.value" :disabled="!valid">保存绑定</LsButton></div>
    </form>
  </div>
</template>
