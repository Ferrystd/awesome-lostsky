<script setup lang="ts">
import { friendlyError } from "@lostsky/api/client";
import LsAsyncState from "@lostsky/ui/components/LsAsyncState.vue";
import LsButton from "@lostsky/ui/components/LsButton.vue";
import LsField from "@lostsky/ui/components/LsField.vue";
import LsFormList from "@lostsky/ui/components/LsFormList.vue";
import LsInlineError from "@lostsky/ui/components/LsInlineError.vue";
import LsPageHeader from "@lostsky/ui/components/LsPageHeader.vue";
import LsPanel from "@lostsky/ui/components/LsPanel.vue";
import { feedback } from "@lostsky/ui/feedback";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { NInput, NSelect, NSwitch } from "naive-ui";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { canManage, manageApi } from "../../lib";
type Field = {
  key: string;
  id?: number;
  field_key: string;
  name: string;
  value_type: string;
  input_type: string;
  options_text: string;
  fill_stage: "customer" | "manager";
  is_customer_visible: number;
  is_required: number;
  is_active: number;
  sort: number;
};
let seq = 0;
const make = (): Field => ({
  key: `new-${++seq}`,
  field_key: "",
  name: "",
  value_type: "string",
  input_type: "text",
  options_text: "",
  fill_stage: "customer",
  is_customer_visible: 1,
  is_required: 0,
  is_active: 1,
  sort: 0,
});
const route = useRoute();
const id = computed(() => Number(route.params.id));
const client = useQueryClient();
const fields = ref<Field[]>([]);
const savedIds = ref<number[]>([]);
const query = useQuery({
  queryKey: computed(() => ["product-fields", id.value]),
  queryFn: () => manageApi.productFields(id.value),
});
watch(
  () => query.data.value,
  (data) => {
    if (data) {
      fields.value = data.map((f: any) => ({
        key: `field-${f.id}`,
        id: f.id,
        field_key: f.field_key,
        name: f.name,
        value_type: f.value_type,
        input_type: f.input_type,
        options_text: Array.isArray(f.options) ? f.options.join("\n") : "",
        fill_stage: f.fill_stage,
        is_customer_visible: f.is_customer_visible,
        is_required: f.is_required,
        is_active: f.is_active,
        sort: f.sort,
      }));
      savedIds.value = data.map((f: any) => Number(f.id));
    }
  },
  { immediate: true },
);
const save = useMutation({
  mutationFn: async () => {
    const currentIds = new Set(
      fields.value.flatMap((field) => (field.id ? [field.id] : [])),
    );
    for (const fieldId of savedIds.value) {
      if (!currentIds.has(fieldId)) {
        await manageApi.deleteProductField(id.value, fieldId);
      }
    }
    for (let index = 0; index < fields.value.length; index++) {
      const f = fields.value[index];
      await manageApi.saveProductField(id.value, f.id ?? null, {
        field_key: f.field_key,
        name: f.name,
        value_type: f.value_type,
        input_type: f.input_type,
        options: f.options_text
          .split(/\r?\n|,/)
          .map((v) => v.trim())
          .filter(Boolean),
        fill_stage: f.fill_stage,
        is_customer_visible: f.is_customer_visible,
        is_required: f.is_required,
        is_active: f.is_active,
        sort: index,
      });
    }
  },
  onSuccess: async () => {
    feedback.success("核销字段已保存");
    await client.invalidateQueries({ queryKey: ["product-fields", id.value] });
  },
});
const valueTypes = [
  { label: "短文本", value: "string" },
  { label: "长文本", value: "text" },
  { label: "整数", value: "int" },
  { label: "小数", value: "decimal" },
  { label: "日期", value: "date" },
  { label: "日期时间", value: "datetime" },
  { label: "单选", value: "select" },
  { label: "多选", value: "multi_select" },
  { label: "是/否", value: "bool" },
];
const inputTypes = [
  { label: "单行输入", value: "text" },
  { label: "多行输入", value: "textarea" },
  { label: "下拉选择", value: "select" },
  { label: "单选项", value: "radio" },
  { label: "复选项", value: "checkbox" },
];
</script>
<template>
  <div class="manage-page">
    <LsPageHeader
      title="核销字段"
      description="客户字段在发起时填写，管理字段在确认完成时填写；停用不会删除历史值。"
      :back-to="`/manage/products/${id}`"
      back-label="返回商品"
    /><LsAsyncState
      v-if="query.isPending.value"
      state="loading"
      :rows="4"
    /><LsAsyncState
      v-else-if="query.isError.value"
      state="error"
      title="暂时无法读取字段"
      :description="friendlyError(query.error.value)"
    />
    <form v-else class="manage-form" @submit.prevent="save.mutate()">
      <LsPanel
        ><div class="form-panel">
          <LsFormList
            v-model="fields"
            :item-key="(f) => f.key"
            :create-item="make"
            item-label="字段"
            add-label="添加核销字段"
            ><template #item="{ item }"
              ><div class="field-editor">
                <div class="inline-fields">
                  <LsField
                    label="字段标识"
                    :for-id="`field-key-${item.key}`"
                    required
                    ><NInput
                      :id="`field-key-${item.key}`"
                      v-model:value="item.field_key"
                      :disabled="Boolean(item.id)"
                      placeholder="例如 account_name" /></LsField
                  ><LsField
                    label="显示名称"
                    :for-id="`field-name-${item.key}`"
                    required
                    ><NInput
                      :id="`field-name-${item.key}`"
                      v-model:value="item.name" /></LsField
                  ><LsField label="数据类型" :for-id="`field-type-${item.key}`"
                    ><NSelect
                      :id="`field-type-${item.key}`"
                      v-model:value="item.value_type"
                      :options="valueTypes" /></LsField
                  ><LsField label="输入控件" :for-id="`field-input-${item.key}`"
                    ><NSelect
                      :id="`field-input-${item.key}`"
                      v-model:value="item.input_type"
                      :options="inputTypes" /></LsField
                  ><LsField label="填写阶段" :for-id="`field-stage-${item.key}`"
                    ><NSelect
                      :id="`field-stage-${item.key}`"
                      v-model:value="item.fill_stage"
                      :options="[
                        { label: '客户发起时', value: 'customer' },
                        { label: '管理确认时', value: 'manager' },
                      ]"
                  /></LsField>
                </div>
                <LsField
                  v-if="
                    ['select', 'multi_select'].includes(item.value_type) ||
                    ['select', 'radio', 'checkbox'].includes(item.input_type)
                  "
                  label="选项"
                  :for-id="`field-options-${item.key}`"
                  hint="每行一个选项"
                  ><NInput
                    :id="`field-options-${item.key}`"
                    v-model:value="item.options_text"
                    type="textarea"
                /></LsField>
                <div class="switch-row">
                  <label
                    ><NSwitch
                      :value="item.is_required === 1"
                      @update:value="(v) => (item.is_required = v ? 1 : 0)"
                    />必填</label
                  ><label
                    ><NSwitch
                      :value="item.is_customer_visible === 1"
                      @update:value="
                        (v) => (item.is_customer_visible = v ? 1 : 0)
                      "
                    />Customer 可见</label
                  ><label
                    ><NSwitch
                      :value="item.is_active === 1"
                      @update:value="(v) => (item.is_active = v ? 1 : 0)"
                    />启用</label
                  >
                </div>
              </div></template
            ></LsFormList
          >
        </div></LsPanel
      ><LsInlineError
        v-if="save.isError.value"
        :message="friendlyError(save.error.value)"
      />
      <div class="form-actions">
        <LsButton
          type="submit"
          :disabled="!canManage('shop.product.write')"
          :loading="save.isPending.value"
          >保存全部字段</LsButton
        >
      </div>
    </form>
  </div>
</template>
