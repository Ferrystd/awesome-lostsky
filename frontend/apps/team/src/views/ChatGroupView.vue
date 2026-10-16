<script setup lang="ts">
import LsFormFields from '@lostsky/ui/components/LsFormFields.vue'
import LsFormPage from '@lostsky/ui/components/LsFormPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import { ArrowLeft } from '@lucide/vue'

import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { api, friendlyError } from '@lostsky/api/client'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'
import { feedback } from '@lostsky/ui/feedback'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { NInput, NSelect, NCheckbox, NList, NListItem } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTeamAccess } from '../lib/teamAccess'
import ChatGroupMembers from '../components/ChatGroupMembers.vue'
import ChatGroupMessages from '../components/ChatGroupMessages.vue'
interface Person { slug: string; name: string; status: 'pending' | 'active' | 'rejected'; left_at: number | null }
interface Group { uuid: string; title: string; is_closed: boolean; participants: Person[] }
interface Message { id: number; content: string | null; sender: { name: string }; create_time: number; revoked_at: number | null }
const route = useRoute()
const router = useRouter()
const access = useRouteAccess()
const cache = useQueryClient()
const teamAccess = useTeamAccess()
const expectedEntityId = ref(0)
watch(() => teamAccess.data.value?.identity?.entity_id, id => { if (!expectedEntityId.value && id) expectedEntityId.value = id }, { immediate: true })
const uuid = computed(() => typeof route.params.uuid === 'string' ? route.params.uuid : '')
const isNew = computed(() => !uuid.value)
const title = ref('')
const baseline = ref('')
const selected = ref<string[]>([])
const searchInput = ref('')
const search = ref('')
const searchMode = ref('q')
const beforeId = ref<number | undefined>()
const previousMessages = ref<Message[]>([])
const dirty = computed(() => title.value !== baseline.value || selected.value.length > 0)
useUnsavedChangesGuard(dirty)
const group = useQuery({ queryKey: computed(() => ['team-chat-group', uuid.value]), queryFn: () => access.read(() => api.get<Group>('/chatGroup/get', { uuid: uuid.value })), enabled: computed(() => Boolean(uuid.value) && !access.restricted.value) })
watch(() => group.data.value, value => { if (value && title.value === baseline.value) { title.value = value.title; baseline.value = value.title } })
watch(uuid, () => { title.value = ''; baseline.value = ''; selected.value = []; previousMessages.value = []; beforeId.value = undefined })
const people = useQuery({ queryKey: computed(() => ['team-chat-people', searchMode.value, search.value]), queryFn: () => api.get<Person[]>('/chatGroup/actors', { [searchMode.value]: search.value }), enabled: computed(() => Boolean(search.value) && !access.restricted.value) })
const messages = useQuery({ queryKey: computed(() => ['team-chat-messages', uuid.value, beforeId.value]), queryFn: () => api.get<Message[]>('/chatGroup/messages', { uuid: uuid.value, before_id: beforeId.value, limit: 50 }), enabled: computed(() => Boolean(uuid.value) && !access.restricted.value) })
const allMessages = computed(() => [...new Map([...(messages.data.value ?? []), ...previousMessages.value].map(item => [item.id, item])).values()].sort((a, b) => a.id - b.id))
const activeMembers = computed(() => (group.data.value?.participants ?? []).filter(item => item.status === 'active'))
const invitations = computed(() => (group.data.value?.participants ?? []).filter(item => item.status === 'pending'))
const disabledReason = computed(() => access.reason.value || (!expectedEntityId.value ? '正在读取当前身份' : '') || (group.data.value?.is_closed ? '群聊已关闭' : ''))
const save = useMutation({
  mutationFn: (snapshot: { title: string; participants: string[] }) => api.post<Group>(isNew.value ? '/chatGroup/create' : '/chatGroup/update', { expected_entity_id: expectedEntityId.value, uuid: uuid.value, ...snapshot }),
  onSuccess: async (result, snapshot) => {
    baseline.value = snapshot.title
    selected.value = []
    feedback.success(isNew.value ? '群聊已创建，邀请已发出' : '群聊资料已保存')
    await cache.invalidateQueries({ queryKey: ['team-chat-groups'] })
    if (isNew.value) await router.replace(`/chat-groups/${result.uuid}`)
    else await group.refetch()
  },
})
const action = useMutation({
  mutationFn: ({ path, body }: { path: string; body?: Record<string, unknown> }) => api.post(path, { expected_entity_id: expectedEntityId.value, uuid: uuid.value, ...body }),
  onSuccess: async () => { selected.value = []; previousMessages.value = []; beforeId.value = undefined; await cache.invalidateQueries({ queryKey: ['team-chat-group'] }); await cache.invalidateQueries({ queryKey: ['team-chat-messages'] }); feedback.success('操作已完成') },
  onError: error => feedback.error(friendlyError(error)),
})
function submit() { if (!disabledReason.value && title.value.trim()) save.mutate({ title: title.value.trim(), participants: isNew.value ? [...selected.value] : [] }) }
function toggle(slug: string, checked: boolean) { selected.value = checked ? [...new Set([...selected.value, slug])] : selected.value.filter(item => item !== slug) }
function remove(slug: string) { if (confirm('确认移出该人员？移出后将不能读取群消息。')) action.mutate({ path: '/chatGroup/participant/remove', body: { entity_slug: slug } }) }
function revoke(id: number) { if (confirm('确认撤回这条消息？')) action.mutate({ path: '/chatGroup/message/revoke', body: { message_id: id } }) }
function close() { if (confirm('关闭后成员不能继续发送消息，确认关闭群聊？')) action.mutate({ path: '/chatGroup/close' }) }
function older() { previousMessages.value = allMessages.value; beforeId.value = allMessages.value[0]?.id }
</script>
<template>
  <LsFormPage :title="isNew ? '创建群聊' : '管理群聊'" description="团队管理员可管理成员和历史消息；发言需以当前身份接受入群邀请。">
    <template #actions>
      <LsPageLink to="/chat-groups" :icon="ArrowLeft" label="返回聊天管理" />
      <template v-if="!isNew"><LsButton variant="danger" :disabled="Boolean(disabledReason)" :disabled-reason="disabledReason" :loading="action.isPending.value" @click="close">关闭群聊</LsButton></template>
    </template>

    <LsPanel><form class="group-form" @submit.prevent="submit"><LsSectionHeader title="群聊资料"><template v-if="!isNew" #aside><LsStatusTag :label="group.data.value?.is_closed ? '已关闭' : '进行中'" :type="group.data.value?.is_closed ? 'default' : 'success'" /></template></LsSectionHeader><LsFormFields><LsField label="群聊名称" for-id="group-title" required><NInput :input-props="{ id: 'group-title' }" aria-label="群聊名称" v-model:value="title" maxlength="100" :placeholder="access.restricted.value ? '-' : '填写群聊名称'" /></LsField></LsFormFields><LsInlineError :message="save.isError.value || group.isError.value ? friendlyError(save.error.value || group.error.value) : ''" /><LsButton v-if="!isNew" type="submit" :loading="save.isPending.value" :disabled="Boolean(disabledReason) || !title.trim() || title === baseline" :disabled-reason="disabledReason || (!title.trim() ? '请填写群聊名称' : '没有未保存的修改')">保存资料</LsButton></form></LsPanel>
    <LsPanel><section class="group-form"><LsSectionHeader :title="isNew ? '邀请首批成员' : '邀请人员'" description="所有人员均需本人确认加入，包括创建者和管理员。" /><NSelect v-model:value="searchMode" aria-label="搜索方式" :options="[{ label: '按姓名搜索', value: 'q' }, { label: '按准确标识查找', value: 'slug' }]" /><LsField label="人员" for-id="invite-search"><NInput :input-props="{ id: 'invite-search' }" aria-label="人员" v-model:value="searchInput" @keydown.enter.prevent="search = searchInput.trim()" /></LsField><LsButton variant="secondary" :disabled="Boolean(disabledReason) || !searchInput.trim()" :disabled-reason="disabledReason || '请输入姓名或标识'" @click="search = searchInput.trim()">查找人员</LsButton><LsInlineError :message="people.isError.value ? friendlyError(people.error.value) : ''" /><NList v-if="people.data.value?.length"><NListItem v-for="person in people.data.value" :key="person.slug"><NCheckbox :checked="selected.includes(person.slug)" @update:checked="toggle(person.slug, $event)">{{ person.name }} · @{{ person.slug }}</NCheckbox></NListItem></NList><p v-if="selected.length">已选择 {{ selected.length }} 位人员</p><LsButton v-if="isNew" :loading="save.isPending.value" :disabled="Boolean(disabledReason) || !title.trim()" :disabled-reason="disabledReason || '请填写群聊名称'" @click="submit">创建并发送邀请</LsButton><LsButton v-else :loading="action.isPending.value" :disabled="Boolean(disabledReason) || !selected.length" :disabled-reason="disabledReason || '请选择要邀请的人员'" @click="action.mutate({ path: '/chatGroup/invite', body: { participants: selected } })">发送邀请</LsButton></section></LsPanel>
    <template v-if="!isNew"><ChatGroupMembers :participants="activeMembers" :invitations="invitations" :busy="action.isPending.value" :disabled-reason="disabledReason" @remove="remove" @cancel="action.mutate({ path: '/chatGroup/invitation/cancel', body: { entity_slug: $event } })" /><LsInlineError :message="messages.isError.value ? friendlyError(messages.error.value) : ''" /><ChatGroupMessages :messages="allMessages" :busy="action.isPending.value || messages.isFetching.value" :disabled-reason="access.reason.value" :has-older="(messages.data.value?.length ?? 0) === 50" @revoke="revoke" @older="older" /></template>
  </LsFormPage>
</template>
<style scoped>.group-form{display:grid;gap:1rem}</style>
