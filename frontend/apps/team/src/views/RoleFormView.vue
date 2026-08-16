<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsSwitchField from '@lostsky/ui/components/LsSwitchField.vue'
import { useMutation } from '@tanstack/vue-query'
import { Check } from '@lucide/vue'
import { NForm, NFormItem, NInput, NInputNumber } from 'naive-ui'
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'

const router = useRouter()
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
  if (!form.role_key.trim() || !form.name.trim()) return
  save.mutate()
}
</script>

<template>
    <div class="role-form-page">
      <AdminPageHeader title="新建角色" description="先建立角色，再为它分配完成工作所需的最小权限（Permission）。" back-to="/roles" back-label="返回角色与权限" />
      <NForm class="role-form" label-placement="top" :show-require-mark="true" @submit.prevent="submit">
        <NFormItem label="角色标识" required>
          <NInput v-model:value="form.role_key" aria-label="角色标识" autocomplete="off" placeholder="例如 operator" />
          <template #feedback>创建后不建议更改；使用小写字母、数字和下划线。</template>
        </NFormItem>
        <NFormItem label="角色名称" required>
          <NInput v-model:value="form.name" aria-label="角色名称" autocomplete="off" placeholder="例如 运营" />
        </NFormItem>
        <NFormItem label="说明">
          <NInput v-model:value="form.description" aria-label="说明" type="textarea" :autosize="{ minRows: 4, maxRows: 8 }" placeholder="说明该角色负责的工作范围" />
        </NFormItem>
        <NFormItem label="显示顺序">
          <NInputNumber v-model:value="form.sort" aria-label="显示顺序" :min="0" :show-button="false" />
          <template #feedback>数字越小越靠前。</template>
        </NFormItem>
        <LsSwitchField v-model="form.is_displayed" label="公开主页展示" aria-label="在公开实体资料中展示此角色" description="开启后，获得此角色的公开成员或虚拟实体（Virtual Entity）会展示角色名称和说明；角色权限不会公开。" />
        <p v-if="save.isError.value" class="error" role="alert">{{ friendlyError(save.error.value) }}</p>
        <footer>
          <LsButton variant="secondary" @click="router.push('/roles')">取消</LsButton>
          <LsButton type="submit" :loading="save.isPending.value" :disabled="!form.role_key.trim() || !form.name.trim()">
            <template #icon><Check :size="17" /></template>创建角色
          </LsButton>
        </footer>
      </NForm>
    </div>
</template>

<style scoped>
.role-form-page{display:grid;gap:1.5rem}.role-form{display:grid;gap:.25rem;padding:1.25rem;background:white;border:1px solid var(--line);border-radius:12px}.role-form :deep(.n-form-item-label){font-weight:650}.role-form :deep(.n-input-number){width:100%}.role-form footer{display:flex;justify-content:flex-end;gap:.75rem;padding-top:.5rem}.error{padding:.75rem;margin:0;color:var(--danger);background:color-mix(in oklch,var(--danger),white 94%);border-radius:8px}@media(min-width:720px){.role-form{padding:1.75rem}}
</style>
