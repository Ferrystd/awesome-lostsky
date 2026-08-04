<script setup lang="ts">
import { api, friendlyError } from "@lostsky/api/client";
import LsAsyncState from "@lostsky/ui/components/LsAsyncState.vue";
import LsButton from "@lostsky/ui/components/LsButton.vue";
import LsField from "@lostsky/ui/components/LsField.vue";
import LsInlineError from "@lostsky/ui/components/LsInlineError.vue";
import LsPageHeader from "@lostsky/ui/components/LsPageHeader.vue";
import LsPanel from "@lostsky/ui/components/LsPanel.vue";
import { feedback } from "@lostsky/ui/feedback";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import {
  NCheckbox,
  NDatePicker,
  NInput,
  NInputNumber,
  NSelect,
} from "naive-ui";
import { computed, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { customerName, dateTime, entityName } from "../lib";
import type { ServiceField, ServiceRedemption } from "../types";

const route = useRoute();
const id = computed(() => Number(route.params.id));
const client = useQueryClient();
const reason = ref("");
const handlerId = ref<number | null>(null);
const values = reactive<Record<number, any>>({});
const query = useQuery({
  queryKey: computed(() => ["service-redemption", id.value]),
  queryFn: () => api.get<ServiceRedemption>(`/service/${id.value}`),
});
const handlers = useQuery({
  queryKey: computed(() => ["service-redemption-handlers", id.value]),
  queryFn: () =>
    api.get<
      Array<{ entity_id: number; subject: { id: number; name: string } }>
    >(`/service/${id.value}/handlers`),
});
const handlerOptions = computed(() =>
  (handlers.data.value ?? []).map((item) => ({
    label: item.subject.name,
    value: item.entity_id,
  })),
);
const pending = computed(() =>
  query.data.value?.cancel_requests?.find((item) => item.status === 1),
);
const managerFields = computed(() =>
  (query.data.value?.redemption_fields ?? []).filter(
    (item) => item.fill_stage === "manager",
  ),
);
const canManage = computed(() =>
  query.data.value?.capabilities
    ? Boolean(query.data.value.capabilities.manage)
    : true,
);
const canApprove = computed(() =>
  query.data.value?.capabilities
    ? Boolean(query.data.value.capabilities.approve_cancel)
    : true,
);
const action = useMutation({
  mutationFn: (input: { path: string; body?: Record<string, unknown> }) =>
    api.post(`/service/${id.value}/${input.path}`, input.body ?? {}),
  onSuccess: async () => {
    feedback.success("核销任务已更新");
    reason.value = "";
    await Promise.all([
      client.invalidateQueries({ queryKey: ["service-redemption", id.value] }),
      client.invalidateQueries({ queryKey: ["service-redemptions"] }),
    ]);
  },
});
const statusName = (value: number) =>
  ({ 1: "未核销", 2: "核销中", 3: "已核销" })[value] ?? "未知";
const choices = (field: ServiceField) =>
  (field.options ?? []).map((value) => ({ label: value, value }));
const fieldValue = (field: ServiceField) =>
  field.value
    ? (Object.values(field.value).find(
        (value) => value !== null && value !== "",
      ) ?? "—")
    : "—";
</script>
<template>
  <div class="service-task">
    <LsPageHeader
      :title="query.data.value?.service.name || '核销详情'"
      :description="
        query.data.value
          ? `#${query.data.value.id} · ${statusName(query.data.value.status)}`
          : '正在读取'
      "
      back-to="/services"
      back-label="返回核销"
    /><LsAsyncState
      v-if="query.isPending.value"
      state="loading"
      :rows="5"
    /><LsAsyncState
      v-else-if="query.isError.value"
      state="error"
      title="暂时无法读取核销任务"
      :description="friendlyError(query.error.value)"
    /><template v-else-if="query.data.value"
      ><LsPanel
        ><dl class="facts">
          <div>
            <dt>客户</dt>
            <dd>{{ customerName(query.data.value.customer) }}</dd>
          </div>
          <div>
            <dt>当前接单人</dt>
            <dd>
              {{
                entityName(
                  query.data.value.handler,
                  query.data.value.handler_entity_id,
                )
              }}
            </dd>
          </div>
          <div>
            <dt>发起时间</dt>
            <dd>{{ dateTime(query.data.value.started_at) }}</dd>
          </div>
          <div>
            <dt>完成时间</dt>
            <dd>{{ dateTime(query.data.value.completed_at) }}</dd>
          </div>
        </dl></LsPanel
      ><LsPanel v-if="query.data.value.redemption_fields?.length"
        ><section class="task-section">
          <h2>核销信息</h2>
          <dl class="field-summary">
            <div
              v-for="field in query.data.value.redemption_fields"
              :key="field.id"
            >
              <dt>{{ field.name }}</dt>
              <dd>{{ fieldValue(field) }}</dd>
            </div>
          </dl>
        </section></LsPanel
      ><LsPanel v-if="pending"
        ><section class="task-section">
          <h2>取消申请</h2>
          <p>{{ pending.reason || "客户未填写原因" }}</p>
          <div v-if="canApprove" class="actions">
            <LsButton
              variant="secondary"
              :loading="action.isPending.value"
              @click="action.mutate({ path: 'cancel/approve' })"
              >同意取消</LsButton
            ><template v-if="canManage"
              ><NInput v-model:value="reason" placeholder="拒绝原因" /><LsButton
                variant="danger"
                :disabled="!reason.trim()"
                :loading="action.isPending.value"
                @click="
                  action.mutate({ path: 'cancel/reject', body: { reason } })
                "
                >拒绝</LsButton
              ></template
            >
          </div>
          <p v-else class="hint">
            只有当前接单人或具有服务管理权限的 Entity 可以处理该申请。
          </p>
        </section></LsPanel
      ><LsPanel v-if="query.data.value.status === 2 && !pending && canManage"
        ><section class="task-section">
          <h2>改派接单人</h2>
          <div class="actions">
            <LsField label="新接单人" for-id="service-handler"
              ><NSelect
                id="service-handler"
                v-model:value="handlerId"
                :options="handlerOptions"
                filterable
                placeholder="选择新接单人" /></LsField
            ><LsField label="改派原因" for-id="service-reassign-reason"
              ><NInput
                id="service-reassign-reason"
                v-model:value="reason"
                placeholder="记录改派原因" /></LsField
            ><LsButton
              variant="secondary"
              :disabled="!handlerId"
              @click="
                action.mutate({
                  path: 'reassign',
                  body: { handler_entity_id: handlerId, reason },
                })
              "
              >确认改派</LsButton
            >
          </div>
        </section></LsPanel
      ><LsPanel v-if="query.data.value.status === 2 && !pending && canManage"
        ><section class="task-section">
          <h2>确认完成</h2>
          <div class="manager-fields">
            <LsField
              v-for="field in managerFields"
              :key="field.id"
              :label="field.name"
              :for-id="`manager-field-${field.id}`"
              :required="Boolean(field.is_required)"
              ><NInput
                v-if="
                  field.input_type === 'textarea' ||
                  field.value_type === 'text' ||
                  field.value_type === 'json'
                "
                :id="`manager-field-${field.id}`"
                v-model:value="values[field.id]"
                type="textarea"
                :input-props="{ 'aria-label': field.name }" /><NSelect
                v-else-if="
                  ['select', 'radio'].includes(field.input_type) ||
                  field.value_type === 'select'
                "
                :id="`manager-field-${field.id}`"
                v-model:value="values[field.id]"
                :options="choices(field)" /><NSelect
                v-else-if="
                  field.value_type === 'multi_select' ||
                  field.input_type === 'checkbox'
                "
                :id="`manager-field-${field.id}`"
                v-model:value="values[field.id]"
                :options="choices(field)"
                multiple /><NCheckbox
                v-else-if="field.value_type === 'bool'"
                :id="`manager-field-${field.id}`"
                :checked="Boolean(values[field.id])"
                @update:checked="(value) => (values[field.id] = value ? 1 : 0)"
                >是</NCheckbox
              ><NInputNumber
                v-else-if="['int', 'decimal'].includes(field.value_type)"
                :id="`manager-field-${field.id}`"
                v-model:value="values[field.id]" /><NDatePicker
                v-else-if="['date', 'datetime'].includes(field.value_type)"
                :id="`manager-field-${field.id}`"
                v-model:value="values[field.id]"
                :type="
                  field.value_type === 'date' ? 'date' : 'datetime'
                " /><NInput
                v-else
                :id="`manager-field-${field.id}`"
                v-model:value="values[field.id]"
                :input-props="{ 'aria-label': field.name }"
            /></LsField>
          </div>
          <LsButton
            :loading="action.isPending.value"
            @click="
              action.mutate({
                path: 'complete',
                body: { field_values: values },
              })
            "
            >确认已核销</LsButton
          >
          <p class="hint">
            Transaction Ability 失效时服务仍可完成，但不会生成或后补核销流水。
          </p>
        </section></LsPanel
      ><LsInlineError
        v-if="action.isError.value"
        :message="friendlyError(action.error.value)"
    /></template>
  </div>
</template>
<style scoped>
.service-task {
  display: grid;
  gap: 1.25rem;
}
.facts,
.field-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 0;
}
.facts > div,
.field-summary > div {
  padding: 0.8rem;
  background: var(--cloud);
  border-radius: 8px;
}
.facts dt,
.field-summary dt {
  color: var(--muted-ink);
  font-size: 0.75rem;
}
.facts dd,
.field-summary dd {
  margin: 0.2rem 0 0;
}
.task-section {
  display: grid;
  gap: 1rem;
}
.task-section h2,
.task-section p {
  margin: 0;
}
.actions {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  align-items: end;
  gap: 0.7rem;
}
.manager-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}
.hint {
  color: var(--muted-ink);
  font-size: 0.8rem;
}
@media (max-width: 680px) {
  .facts,
  .field-summary,
  .manager-fields,
  .actions {
    grid-template-columns: 1fr;
  }
}
</style>
