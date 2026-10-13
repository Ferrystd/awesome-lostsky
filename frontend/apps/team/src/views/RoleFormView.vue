<script setup lang="ts">
import LsFormPage from '@lostsky/ui/components/LsFormPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import { ArrowLeft, Check } from '@lucide/vue'

import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsSwitchField from '@lostsky/ui/components/LsSwitchField.vue'
import { useMutation } from '@tanstack/vue-query'

import { NInput, NInputNumber } from 'naive-ui'
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'

const router = useRouter()
const routeAccess = useRouteAccess()
const form = reactive({ role_key: '', name: '', description: '', sort: 0, is_displayed: false })
const save = useMutation({
  mutationFn: () => api.post<{ id?: number }>('/role/add', {
    role_key: form.role_key.trim(),
    name: form.name.trim(),
    description: form.description.trim() || null,
    sort: Number(form.sort),
    is_displayed: form.is_displayed ? 1 : 0,
  }),
  onSuccess: (role) => router.replace(role.id ? `/roles/${role.id}` : '/roles'),
})

function submit() {
  if (routeAccess.restricted.value) return
  if (!form.role_key.trim() || !form.name.trim()) return
  save.mutate()
}
</script>

<template>
  <LsFormPage title="新建角色" description="填写角色资料并创建；创建后进入角色页面设置权限。">
    <template #actions>
      <LsPageLink to="/roles" :icon="ArrowLeft" label="返回角色与权限" />
    </template>

      <LsPanel><form class="role-form" @submit.prevent="submit">
        <LsField label="角色标识" for-id="role-key" required hint="创建后不建议更改；使用小写字母、数字和下划线。">
          <NInput :input-props="{ id: 'role-key' }" v-model:value="form.role_key" autocomplete="off" placeholder="例如 operator" />
        </LsField>
        <LsField label="角色名称" for-id="role-name" required>
          <NInput :input-props="{ id: 'role-name' }" v-model:value="form.name" autocomplete="off" placeholder="例如 运营" />
        </LsField>
        <LsField label="说明" for-id="role-description">
          <NInput :input-props="{ id: 'role-description' }" v-model:value="form.description" type="textarea" :autosize="{ minRows: 4, maxRows: 8 }" placeholder="说明该角色负责的工作范围" />
        </LsField>
        <LsField label="显示顺序" for-id="role-sort" hint="数字越小越靠前。">
          <NInputNumber :input-props="{ id: 'role-sort' }" v-model:value="form.sort" :min="0" :show-button="false" />
        </LsField>
        <LsSwitchField v-model="form.is_displayed" label="公开主页展示" aria-label="在公开人员资料中展示此角色" description="开启后，获得此角色的公开成员或虚拟人员会展示角色名称和说明；角色权限不会公开。" />
        <p v-if="save.isError.value && !routeAccess.restricted.value" class="error" role="alert">{{ friendlyError(save.error.value) }}</p>
        <LsFormActions>
          <LsPageLink to="/roles" :icon="ArrowLeft" label="取消" />
          <LsButton type="submit" :loading="save.isPending.value" :disabled="routeAccess.restricted.value || !form.role_key.trim() || !form.name.trim()" :disabled-reason="routeAccess.reason.value">
            <template #icon><Check :size="17" /></template>创建角色
          </LsButton>
        </LsFormActions>
      </form></LsPanel>
  </LsFormPage>
</template>

<style scoped>
.role-form{display:grid;gap:1.25rem}.error{margin:0;color:var(--danger)}
</style>
