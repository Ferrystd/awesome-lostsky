<script setup lang="ts">
import { communityActorKey } from '@lostsky/api/community'
import { useCommunityListState } from '@lostsky/shared/useCommunityListState'
import { api, friendlyError, uploadFileUrl } from '@lostsky/api/client'
import type { Community, CommunityAdministrator, CommunityPage } from '@lostsky/api/community'
import { communityWorkspaceUrl } from '@lostsky/shared/navigation'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useQueryDraft } from '@lostsky/shared/useQueryDraft'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NInput, NSelect, NList, NListItem, NThing, NTag, NSpace, NPagination, NDescriptions, NDescriptionsItem, useDialog } from 'naive-ui'
import LsPageHeader from '../components/LsPageHeader.vue'
import LsListToolbar from '../components/LsListToolbar.vue'
import LsAsyncState from '../components/LsAsyncState.vue'
import LsEmptyState from '../components/LsEmptyState.vue'
import LsButton from '../components/LsButton.vue'
import LsField from '../components/LsField.vue'
import LsFormSection from '../components/LsFormSection.vue'
import LsFormActions from '../components/LsFormActions.vue'
import LsSwitchField from '../components/LsSwitchField.vue'
import CommunityGovernance from './CommunityGovernance.vue'
import { feedback } from '../feedback'

const actorKey = communityActorKey()
const props = defineProps<{ scope: 'team' | 'admin'; canRead: boolean; canWrite: boolean; canModerate: boolean; readReason: string; writeReason: string; moderateReason: string; expectedEntityId?: number | null }>()
const route = useRoute(), router = useRouter(), cache = useQueryClient(), dialog = useDialog()
const id = computed(() => Number(route.params.id)), path = computed(() => `/communities/${id.value}`)
const mode = computed(() => String(route.meta.communityView || 'list'))
const { keyword, status, page, restoreScroll } = useCommunityListState(`${props.scope}:${mode.value}:${id.value || 'list'}`)
const busy = ref(false)
watch([keyword, status], () => { page.value = 1 })
const list = useQuery({ queryKey: computed(() => ['managed-communities', props.scope, keyword.value, status.value, page.value, actorKey]), queryFn: () => api.get<CommunityPage<Community>>('/communities', { keyword: keyword.value, status: status.value, page: page.value, limit: 20 }), enabled: computed(() => props.canRead && mode.value === 'list') })
const detail = useQuery({ queryKey: computed(() => ['managed-community', props.scope, id.value, actorKey]), queryFn: () => api.get<Community>(path.value), enabled: computed(() => props.canRead && Boolean(id.value)) })
const administrators = useQuery({ queryKey: computed(() => ['community-administrators', props.scope, id.value, actorKey]), queryFn: () => api.get<CommunityPage<CommunityAdministrator>>(`${path.value}/administrators`, { page: page.value, limit: 20 }), enabled: computed(() => props.canRead && mode.value === 'administrators') })
const form = reactive({ name: '', slug: '', description: '', status: 'Active' as 'Active' | 'Paused', is_official: false, reason: '' })
const draft = useQueryDraft({ key: () => route.path, read: () => form, apply: value => Object.assign(form, value) })
useUnsavedChangesGuard(draft.dirty)
watch(detail.data, value => { if (value) draft.hydrate({ name: value.name, slug: value.slug, description: value.description, status: value.status, is_official: value.is_official, reason: '' }) }, { immediate: true })
const identityBody = computed(() => props.expectedEntityId == null ? {} : { expected_entity_id: props.expectedEntityId })
const writeDisabled = computed(() => !props.canRead ? props.readReason : !props.canWrite ? props.writeReason : busy.value ? '正在保存' : '')
const formReason = computed(() => writeDisabled.value || (!form.name.trim() ? '请填写社区名称' : !/^[a-z][a-z0-9_-]{1,49}$/.test(form.slug) ? '社区标识需为 2–50 位，以小写字母开头，可含数字、下划线或连字符' : form.status === 'Paused' && !form.reason.trim() ? '暂停社区需填写原因' : '') || (id.value && !draft.dirty.value ? '没有待保存的修改' : ''))
async function save() {
  if (formReason.value) return feedback.info(formReason.value)
  const submission = draft.capture(); busy.value = true
  try { const { is_official, ...values } = submission.value; const saved = await api.post<Community>(id.value ? path.value : '/communities', { ...values, ...(props.scope === 'admin' ? { is_official } : {}), ...identityBody.value }); if (!draft.accept(submission) || draft.dirty.value) return; await cache.invalidateQueries({ queryKey: ['managed-communities'] }); await cache.invalidateQueries({ queryKey: ['managed-community'] }); feedback.success('社区已保存'); await router.push(`/communities/${id.value || saved.id}`) } catch (error) { feedback.error(friendlyError(error)) } finally { busy.value = false }
}
const entitySlug = ref('')
async function addAdministrator() {
  if (writeDisabled.value || !entitySlug.value.trim()) return
  busy.value = true
  try { await api.post(`${path.value}/administrators`, { entity_slug: entitySlug.value.trim(), ...identityBody.value }); entitySlug.value = ''; await administrators.refetch(); feedback.success('已分配社区管理员') } catch (error) { feedback.error(friendlyError(error)) } finally { busy.value = false }
}
function removeAdministrator(row: CommunityAdministrator) {
  dialog.warning({ title: '移除社区管理员', content: `移除后，${row.entity.name}不再通过此管理员关系获得社区管理权。`, positiveText: '确认移除', negativeText: '取消', onPositiveClick: async () => {
    if (writeDisabled.value) return false
    try { await api.post(`${path.value}/administrators/${row.entity_id}/remove`, identityBody.value); await administrators.refetch(); feedback.success('已移除社区管理员') } catch (error) { feedback.error(friendlyError(error)); return false }
  } })
}
watch(list.isSuccess, ready => { if (ready) void restoreScroll() }, { immediate: true })
</script>
<template>
  <LsAsyncState v-if="mode === 'form' && detail.isError.value && detail.data.value" state="error" title="暂时无法更新资料" description="已输入内容保留，网络恢复后将自动重新读取。" />
  <LsPageHeader v-if="mode !== 'list' && mode !== 'form' && detail.isError.value" title="社区管理" back-to="/communities" />
  <template v-if="mode === 'list'">
    <LsPageHeader :title="scope === 'admin' ? '平台社区' : '团队社区'" :description="scope === 'admin' ? '管理平台拥有的社区、官方公告与讨论。' : '维护当前团队拥有的社区，并分配日常管理人员。'"><template #actions><LsButton @click="router.push('/communities/new')">创建社区</LsButton></template></LsPageHeader>
    <LsListToolbar v-model="keyword" placeholder="搜索社区名称" aria-label="搜索社区名称" :count-label="`${list.data.value?.total ?? 0} 个社区`"><template #filters><NSelect v-model:value="status" clearable aria-label="社区状态" placeholder="全部状态" :options="[{ label: '正常', value: 'Active' }, { label: '已暂停', value: 'Paused' }]" /></template></LsListToolbar>
    <LsEmptyState v-if="!canRead" :title="readReason" description="请联系管理员分配社区读取权限。" /><LsAsyncState v-else-if="list.isPending.value" state="loading" /><template v-else-if="list.isError.value"><LsAsyncState state="error" :description="friendlyError(list.error.value)" /></template><LsEmptyState v-else-if="!list.data.value?.list.length" title="没有可显示的社区" description="调整筛选条件，或创建第一个社区。" />
    <NList v-else bordered><NListItem v-for="row in list.data.value.list" :key="row.id"><NThing><template #header><RouterLink :to="`/communities/${row.id}`">{{ row.name }}</RouterLink></template><template #description>{{ row.slug }} · {{ row.description }}</template><template #header-extra><NSpace><NTag v-if="row.is_official" type="info">官方</NTag><NTag>{{ row.status === 'Paused' ? '已暂停' : '正常' }}</NTag></NSpace></template></NThing></NListItem></NList>
    <NPagination v-if="(list.data.value?.total ?? 0) > 20" v-model:page="page" :item-count="list.data.value?.total" :page-size="20" simple />
  </template>
  <template v-else-if="mode === 'form'">
    <LsPageHeader :title="id ? '编辑社区资料' : '创建社区'" :back-to="id ? path : '/communities'" />
    <LsAsyncState v-if="canRead && id && detail.isPending.value" state="loading" /><LsAsyncState v-else-if="detail.isError.value && !detail.data.value" state="error" :description="friendlyError(detail.error.value)" />
    <form v-else @submit.prevent="save"><LsFormSection title="社区资料与状态"><LsField label="社区名称" for-id="community-name" required><NInput :input-props="{ id: 'community-name' }" v-model:value="form.name" maxlength="100" :readonly="!canWrite" /></LsField><LsField label="社区标识" for-id="community-slug" required hint="用于社区网址，全平台唯一。"><NInput :input-props="{ id: 'community-slug' }" v-model:value="form.slug" maxlength="50" :readonly="!canWrite" /></LsField><LsField label="社区简介" for-id="community-description"><NInput :input-props="{ id: 'community-description' }" v-model:value="form.description" type="textarea" maxlength="1000" :readonly="!canWrite" /></LsField><LsSwitchField v-if="scope === 'admin'" v-model="form.is_official" label="官方社区" description="官方标记仅适用于平台拥有的社区。" :read-only="!canWrite" :disabled-reason="writeReason" /><LsField v-if="id" label="社区状态" for-id="community-status"><NSelect id="community-status" v-model:value="form.status" :options="[{ label: '正常', value: 'Active' }, { label: '暂停', value: 'Paused' }]" /></LsField><LsField v-if="form.status === 'Paused'" label="暂停原因" for-id="community-reason" required><NInput :input-props="{ id: 'community-reason' }" v-model:value="form.reason" type="textarea" maxlength="500" /></LsField></LsFormSection><LsFormActions><LsButton type="submit" :disabled="Boolean(formReason)" :disabled-reason="formReason">保存社区</LsButton></LsFormActions></form>
  </template>
  <template v-else>
    <LsAsyncState v-if="canRead && detail.isPending.value" state="loading" /><template v-else-if="detail.isError.value && !detail.data.value"><LsAsyncState state="error" :description="friendlyError(detail.error.value)" /></template>
    <template v-else-if="mode === 'governance'"><CommunityGovernance :key="$route.path" :api-base="path" :route-base="`${path}/manage`" :back-to="path" :community-name="detail.data.value?.name || '-'" :can-read="canRead" :can-moderate="canRead && canModerate" :denied-reason="!canRead ? readReason : moderateReason" :upload-image="file => uploadFileUrl(file, 'markdown')" upload-disabled-reason="平台后台使用账号管理；请以有效人员身份前往社区上传图片。" /></template>
    <template v-else>
      <LsPageHeader :title="mode === 'administrators' ? '社区管理员' : detail.data.value?.name || '-'" :description="mode === 'administrators' ? '管理员绑定全局人员，不会授予平台或团队后台权限。' : detail.data.value?.description" :back-to="mode === 'administrators' ? path : '/communities'"><template v-if="mode === 'detail'" #actions><LsButton @click="router.push(`${path}/edit`)">编辑资料与状态</LsButton></template></LsPageHeader>
      <template v-if="mode === 'detail'"><NDescriptions :column="1" bordered><NDescriptionsItem label="社区标识">{{ detail.data.value?.slug || '-' }}</NDescriptionsItem><NDescriptionsItem label="所有者">{{ detail.data.value ? detail.data.value.owner?.name || 'LostSky 平台' : '-' }}</NDescriptionsItem><NDescriptionsItem label="状态">{{ detail.data.value ? detail.data.value.status === 'Paused' ? '已暂停' : '正常' : '-' }}</NDescriptionsItem><NDescriptionsItem v-if="scope === 'admin'" label="官方社区">{{ detail.data.value ? detail.data.value.is_official ? '是' : '否' : '-' }}</NDescriptionsItem></NDescriptions><NSpace><RouterLink :to="`${path}/administrators`">管理员分配</RouterLink><a v-if="detail.data.value" :href="communityWorkspaceUrl(`/c/${detail.data.value.slug}`)">查看社区</a><a v-if="scope === 'team' && detail.data.value" :href="communityWorkspaceUrl(`/c/${detail.data.value.slug}/manage/boards`)">前往社区日常管理</a><RouterLink v-if="scope === 'admin'" :to="`${path}/manage/boards`">板块、公告、内容与成员</RouterLink></NSpace></template>
      <template v-else-if="mode === 'administrators'"><form @submit.prevent="addAdministrator"><LsField label="人员标识" for-id="administrator-slug" hint="准确输入有效人员的全局标识，可分配跨团队人员。" required><NInput :input-props="{ id: 'administrator-slug' }" v-model:value="entitySlug" placeholder="人员 slug" /></LsField><LsFormActions><LsButton type="submit" :disabled="Boolean(writeDisabled) || !entitySlug.trim()" :disabled-reason="writeDisabled || '请填写准确的人员标识'">添加管理员</LsButton></LsFormActions></form><LsEmptyState v-if="!canRead" :title="readReason" description="请联系管理员分配社区读取权限。" /><LsAsyncState v-else-if="administrators.isPending.value" state="loading" /><LsAsyncState v-else-if="administrators.isError.value" state="error" :description="friendlyError(administrators.error.value)" /><LsEmptyState v-else-if="!administrators.data.value?.list.length" title="尚未分配社区管理员" description="具有管理权限的后台人员可以添加管理员。" /><NList v-else bordered><NListItem v-for="row in administrators.data.value.list" :key="row.entity_id"><NThing :title="row.entity.name" :description="`${row.entity.slug} · ${row.entity.is_valid ? '有效' : '已失效'}`"><template #action><LsButton variant="danger" :disabled="Boolean(writeDisabled)" :disabled-reason="writeDisabled" @click="removeAdministrator(row)">移除管理员</LsButton></template></NThing></NListItem></NList><NPagination v-if="(administrators.data.value?.total ?? 0) > 20" v-model:page="page" :item-count="administrators.data.value?.total" :page-size="20" simple /></template>
    </template>
  </template>
</template>
