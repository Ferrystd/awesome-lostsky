<script setup lang="ts">
import { friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import { feedback } from '@lostsky/ui/feedback'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import ProductFieldsEditor from '../../components/ProductFieldsEditor.vue'
import { canManage, loadManageAccess, productManagement } from '../../lib'
import { useQuery } from '@tanstack/vue-query'

const route = useRoute()
const id = computed(() => Number(route.params.id))
const scope = computed(() => route.meta.workspace === 'personal' ? 'personal' : 'team')
const management = computed(() => productManagement(scope.value))
const access = useQuery({ queryKey: ['shop-manage-access'], queryFn: () => loadManageAccess() })
const expectedEntityId = computed(() => access.data.value?.identity?.entity_id ?? 0)
const editor = ref<InstanceType<typeof ProductFieldsEditor> | null>(null)
const saving = ref(false)
const error = ref<unknown>(null)

async function save() {
  saving.value = true
  error.value = null
  try {
    await editor.value?.save()
    feedback.success('核销字段已保存')
  } catch (reason) {
    error.value = reason
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="manage-page">
    <LsPageHeader
      title="核销字段"
      description="顾客字段在发起时填写，管理字段在确认完成时填写；停用不会删除历史值。"
      :back-to="`${management.routeBase}/${id}`"
      :back-label="management.personal ? '返回本人商品' : '返回商品'"
    />
    <form class="manage-form" @submit.prevent="save">
      <ProductFieldsEditor ref="editor" :product-id="id" :scope="scope" :expected-entity-id="expectedEntityId" />
      <LsInlineError v-if="error" :message="friendlyError(error)" />
      <LsFormActions>
        <LsButton
          type="submit"
          :disabled="!canManage(management.permission) || (management.personal && !expectedEntityId)"
          :loading="saving"
        >保存全部字段</LsButton>
      </LsFormActions>
    </form>
  </div>
</template>
