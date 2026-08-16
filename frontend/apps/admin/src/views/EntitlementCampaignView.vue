<script setup lang="ts">
import { api, friendlyError } from "@lostsky/api/client";
import LsAsyncState from "@lostsky/ui/components/LsAsyncState.vue";
import LsButton from "@lostsky/ui/components/LsButton.vue";
import LsEmptyState from "@lostsky/ui/components/LsEmptyState.vue";
import LsField from "@lostsky/ui/components/LsField.vue";
import LsFormActions from "@lostsky/ui/components/LsFormActions.vue";
import LsFormSection from "@lostsky/ui/components/LsFormSection.vue";
import LsInlineError from "@lostsky/ui/components/LsInlineError.vue";
import LsPageHeader from "@lostsky/ui/components/LsPageHeader.vue";
import LsSwitchField from "@lostsky/ui/components/LsSwitchField.vue";
import LsStatusTag from "@lostsky/ui/components/LsStatusTag.vue";
import { feedback } from "@lostsky/ui/feedback";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import {
  NDatePicker,
  NInput,
  NInputNumber,
  NPagination,
  NSelect,
} from "naive-ui";
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { can } from "../session";
type Page<T> = { total: number; list: T[] };
const route = useRoute();
const router = useRouter();
const client = useQueryClient();
const id = computed(() => Number(route.params.id || 0));
const editing = computed(() => id.value > 0);
const form = reactive({
  name: "",
  package_id: null as number | null,
  claim_group: "",
  mode: 2,
  total_limit: null as number | null,
  per_target_limit: 1,
  range: null as [number, number] | null,
  is_active: 1,
});
const packageQuery = useQuery({
  queryKey: ["admin-entitlement-package-options"],
  queryFn: () =>
    api.get<Page<any>>("/entitlements/packages", { page: 1, limit: 100 }),
});
const detail = useQuery({
  queryKey: computed(() => ["admin-entitlement-campaign", id.value]),
  queryFn: () => api.get<any>(`/entitlements/campaigns/${id.value}`),
  enabled: editing,
});
watch(
  () => detail.data.value,
  (d) => {
    if (d)
      Object.assign(form, {
        name: d.name,
        package_id: d.package_id,
        claim_group: d.claim_group,
        mode: Number(d.mode),
        total_limit: d.total_limit ?? null,
        per_target_limit: d.per_target_limit,
        range:
          d.redeem_starts_at || d.redeem_ends_at
            ? [d.redeem_starts_at * 1000, d.redeem_ends_at * 1000]
            : null,
        is_active: d.is_active,
      });
  },
  { immediate: true },
);
const packages = computed(() =>
  (packageQuery.data.value?.list ?? []).map((p) => ({
    label: p.name,
    value: p.id,
    disabled: !p.is_active,
  })),
);
const save = useMutation({
  mutationFn: () =>
    api.post<{ id: number }>(
      editing.value
        ? `/entitlements/campaigns/${id.value}`
        : "/entitlements/campaigns",
      {
        name: form.name,
        package_id: form.package_id,
        claim_group: form.claim_group || undefined,
        mode: form.mode,
        total_limit: form.total_limit,
        per_target_limit: form.per_target_limit,
        redeem_starts_at: form.range ? Math.floor(form.range[0] / 1000) : 0,
        redeem_ends_at: form.range ? Math.floor(form.range[1] / 1000) : 0,
        is_active: form.is_active,
      },
    ),
  onSuccess: (data) => {
    feedback.success("体验活动已保存");
    router.push(`/entitlements/campaigns/${data.id}`);
  },
  onError: (error) => feedback.error(friendlyError(error)),
});
const page = ref(1);
const quantity = ref(1);
const targetTeam = ref<number | null>(null);
const issued = ref<any[]>([]);
const revealed = ref<Record<number, string>>({});
const codes = useQuery({
  queryKey: computed(() => ["admin-entitlement-codes", id.value, page.value]),
  queryFn: () =>
    api.get<Page<any>>(`/entitlements/campaigns/${id.value}/codes`, {
      page: page.value,
      limit: 20,
    }),
  enabled: editing,
});
const issue = useMutation({
  mutationFn: () =>
    api.post<any[]>(`/entitlements/campaigns/${id.value}/codes`, {
      quantity: quantity.value,
      target_team_id: targetTeam.value,
    }),
  onSuccess: async (rows) => {
    issued.value = rows;
    feedback.success(`已发行 ${rows.length} 个体验码`);
    await client.invalidateQueries({
      queryKey: ["admin-entitlement-codes", id.value],
    });
  },
  onError: (error) => feedback.error(friendlyError(error)),
});
async function reveal(codeId: number) {
  try {
    const r = await api.post<{ code: string }>(
      `/entitlements/campaigns/${id.value}/codes/${codeId}/reveal`,
      {},
    );
    revealed.value = { ...revealed.value, [codeId]: r.code };
  } catch (error) { feedback.error(friendlyError(error)) }
}
async function copy(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    feedback.success("体验码已复制");
  } catch (error) { feedback.error(friendlyError(error)) }
}
async function disable(codeId: number) {
  try {
    await api.post(
      `/entitlements/campaigns/${id.value}/codes/${codeId}/disable`,
      {},
    );
    await client.invalidateQueries({
      queryKey: ["admin-entitlement-codes", id.value],
    });
  } catch (error) { feedback.error(friendlyError(error)) }
}
const pages = computed(() =>
  Math.max(1, Math.ceil(Number(codes.data.value?.total ?? 0) / 20)),
);
const valid = computed(() => Boolean(form.name.trim() && form.package_id));
</script>
<template>
  <div class="campaign-view">
    <LsPageHeader
      :title="editing ? 'Ability 体验活动' : '创建 Ability 体验活动'"
      description="公共活动码使用共享代码，但同一个 Team 在相同领取组中只能成功一次。"
      back-to="/entitlements/campaigns"
      back-label="返回活动"
    />
    <form class="campaign-form" @submit.prevent="save.mutate()">
      <LsFormSection title="活动配置">
          <LsField label="活动名称" for-id="admin-campaign-name" required
            ><NInput
              id="admin-campaign-name"
              v-model:value="form.name"
              maxlength="100" /></LsField
          ><LsField
            label="Ability 权益包"
            for-id="admin-campaign-package"
            required
            ><NSelect
              id="admin-campaign-package"
              v-model:value="form.package_id"
              :options="packages"
              :disabled="editing" /></LsField
          ><LsField label="模式" for-id="admin-campaign-mode"
            ><NSelect
              id="admin-campaign-mode"
              v-model:value="form.mode"
              :options="[
                { label: '独立卡密', value: 1 },
                { label: '公共活动码', value: 2 },
                { label: '定向团队卡', value: 3 },
              ]"
              :disabled="editing" /></LsField
          ><LsField
            label="领取互斥组"
            for-id="admin-campaign-group"
            hint="首月免费活动应长期复用稳定的互斥组。"
            ><NInput
              id="admin-campaign-group"
              v-model:value="form.claim_group"
              :disabled="editing" /></LsField
          ><LsField label="领取时间" for-id="admin-campaign-range"
            ><NDatePicker
              id="admin-campaign-range"
              v-model:value="form.range"
              type="datetimerange"
              clearable /></LsField
          ><LsField label="总领取上限" for-id="admin-campaign-limit"
            ><NInputNumber
              id="admin-campaign-limit"
              v-model:value="form.total_limit"
              :min="1"
              clearable /></LsField
          ><LsSwitchField
            id="admin-campaign-active"
            :model-value="form.is_active === 1"
            label="启用状态"
            description="停用后不能继续发放新的权益。"
            @update:model-value="(v) => (form.is_active = v ? 1 : 0)"
          /></LsFormSection
      ><LsInlineError
        v-if="detail.isError.value"
        :message="friendlyError(detail.error.value)"
      />
      <LsFormActions>
        <LsButton type="button" variant="secondary" @click="router.back()"
          >取消</LsButton
        ><LsButton
          type="submit"
          :disabled="!valid || !can('admin.entitlement.write')"
          :loading="save.isPending.value"
          >保存活动</LsButton
        >
      </LsFormActions>
    </form>
    <template v-if="editing"
      ><LsFormSection v-if="can('admin.entitlement.write')" title="发行体验码">
          <div class="issue-row">
            <NInputNumber
              v-model:value="quantity"
              :min="1"
              :max="100"
            /><NInputNumber
              v-if="form.mode === 3"
              v-model:value="targetTeam"
              :min="1"
              placeholder="目标 Team ID"
            /><LsButton
              :disabled="form.mode === 3 && !targetTeam"
              :loading="issue.isPending.value"
              @click="issue.mutate()"
              >发行</LsButton
            >
          </div>
          <div v-if="issued.length" class="issued">
            <LsButton
              v-for="row in issued"
              :key="row.id"
              class="issued-code"
              type="button"
              variant="secondary"
              @click="copy(row.code)"
            >
              <code>{{ row.code }}</code
              ><span>复制</span>
            </LsButton>
          </div>
        </LsFormSection
      ><LsAsyncState
        v-if="codes.isPending.value"
        state="loading"
        :rows="4" /><LsAsyncState
        v-else-if="codes.isError.value"
        state="error"
        title="暂时无法读取体验码"
        :description="friendlyError(codes.error.value)" /><LsEmptyState
        v-else-if="!codes.data.value?.list.length"
        title="还没有体验码"
        description="公共活动通常只需发行一个共享代码。" />
      <section v-else class="codes">
        <article v-for="row in codes.data.value.list" :key="row.id">
          <div>
            <strong>{{ revealed[row.id] || row.code_hint }}</strong
            ><small>已使用 {{ row.use_count }} 次</small>
          </div>
          <LsStatusTag
            :label="row.is_active ? '可用' : '已停用'"
            :type="row.is_active ? 'success' : 'default'"
          />
          <div>
            <LsButton
              v-if="!revealed[row.id]"
              size="sm"
              variant="secondary"
              @click="reveal(row.id)"
              >查看</LsButton
            ><LsButton
              v-else
              size="sm"
              variant="secondary"
              @click="copy(revealed[row.id])"
              >复制</LsButton
            ><LsButton
              v-if="row.is_active"
              size="sm"
              variant="danger"
              @click="disable(row.id)"
              >停用</LsButton
            >
          </div>
        </article>
      </section>
      <div v-if="codes.data.value?.total" class="pager">
        <span>第 {{ page }} / {{ pages }} 页</span
        ><NPagination v-model:page="page" :page-count="pages" /></div
    ></template>
  </div>
</template>
<style scoped>
.campaign-view,
.campaign-form {
  display: grid;
  gap: 1.25rem;
}
.issue-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}
.issued {
  display: grid;
  gap: 0.4rem;
  padding: 0.75rem;
  background: var(--cloud);
  border-radius: 10px;
}
.issued-code {
  min-height: 44px;
  justify-content: space-between;
  gap: 1rem;
}
.codes {
  display: grid;
  overflow: hidden;
  background: white;
  border: 1px solid var(--line);
  border-radius: 12px;
}
.codes article {
  min-height: 70px;
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--line);
}
.codes article:last-child {
  border-bottom: 0;
}
.codes strong,
.codes small {
  display: block;
}
.codes small {
  color: var(--muted-ink);
}
.codes article > div:last-child {
  display: flex;
  gap: 0.4rem;
}
@media (max-width: 639px) {
  .issue-row {
    align-items: stretch;
    flex-direction: column;
  }
  .codes article {
    grid-template-columns: 1fr auto;
  }
  .codes article > div:last-child {
    grid-column: 1/-1;
  }
}
</style>
