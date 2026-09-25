<script setup lang="ts">
import { api, auth, friendlyError } from '@lostsky/api/client'
import { identityUrl } from '@lostsky/shared/navigation'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import { useDialog } from 'naive-ui'

interface Departure { id: number; status_code: string }
const leaving = ref(false)
const dialog = useDialog()
const departures = useQuery({
  queryKey: ['my-member-departures', auth.entity()?.id],
  queryFn: () => api.get<Departure[]>('/memberDeparture/mine'),
  enabled: computed(() => !leaving.value),
  retry: false,
})
const pending = computed(() => departures.data.value?.find(item => item.status_code === 'applied'))
const action = useMutation({
  mutationFn: async (cancelId: number | null) => {
    if (cancelId) {
      await api.post('/memberDeparture/cancel', { id: cancelId })
      return { cancelled: true, approved: false }
    }
    const result = await api.post<Departure>('/memberDeparture/apply')
    return { cancelled: false, approved: result.status_code === 'approved' }
  },
  onSuccess: async result => {
    if (result.approved) {
      leaving.value = true
      location.replace(identityUrl(''))
      return
    }
    feedback.success(result.cancelled ? '离职申请已取消' : '离职申请已提交')
    await departures.refetch()
  },
  onError: error => feedback.error(friendlyError(error)),
})
async function retry() {
  const result = await departures.refetch()
  if (result.error) feedback.error(friendlyError(result.error))
}
function submit() {
  if (leaving.value || action.isPending.value || departures.isFetching.value || !departures.isSuccess.value) return
  const cancelId = pending.value?.id ?? null
  if (cancelId) {
    action.mutate(cancelId)
    return
  }
  dialog.warning({
    title: '确认申请离职？',
    content: '团队可能自动批准并立即结束当前会话。离职后，资料、角色和历史业务关系会保留。',
    positiveText: '确认申请',
    negativeText: '返回',
    onPositiveClick: () => action.mutate(null),
  })
}
</script>

<template>
  <LsButton v-if="departures.isError.value" variant="secondary" :loading="departures.isFetching.value" @click="retry">重试读取申请</LsButton>
  <LsButton v-else :variant="pending ? 'secondary' : 'danger'" :loading="leaving || action.isPending.value || departures.isFetching.value" :disabled="!departures.isSuccess.value" @click="submit">{{ pending ? '取消离职申请' : '申请离职' }}</LsButton>
</template>
