<script setup lang="ts">
import { friendlyError } from "@lostsky/api/client";
import LsAsyncState from "@lostsky/ui/components/LsAsyncState.vue";
import LsButton from "@lostsky/ui/components/LsButton.vue";
import LsPageHeader from "@lostsky/ui/components/LsPageHeader.vue";
import LsPagePrimaryAction from "@lostsky/ui/components/LsPagePrimaryAction.vue";
import LsPanel from "@lostsky/ui/components/LsPanel.vue";
import LsStatusTag from "@lostsky/ui/components/LsStatusTag.vue";
import { feedback } from "@lostsky/ui/feedback";
import { useRouteAccess } from "@lostsky/ui/useRouteAccess";
import { useDialog } from "naive-ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { CheckCheck } from "@lucide/vue";
import { computed } from "vue";
import { useRoute } from "vue-router";
import {
  canManage,
  formatDate,
  formatMoney,
  manageApi,
  managePermissionReason,
} from "../../lib";
const route = useRoute();
const routeAccess = useRouteAccess();
const id = computed(() => Number(route.params.id));
const client = useQueryClient();
const dialog = useDialog();
const query = useQuery({
  queryKey: computed(() => ["manage-order", id.value]),
  queryFn: () => routeAccess.read(() => manageApi.order(id.value)),
  enabled: computed(() => !routeAccess.restricted.value),
});
const action = useMutation({
  mutationFn: (name: "cancel" | "complete") =>
    manageApi.orderAction(id.value, name),
  onSuccess: async () => {
    feedback.success("订单状态已更新");
    await client.invalidateQueries({ queryKey: ["manage-order", id.value] });
  },
  onError: (e) => feedback.error(friendlyError(e)),
});
const status = (v: number) =>
  ({ 1: "处理中", 2: "已完成", 3: "已取消" })[v] ?? "未知";
function run(name: "cancel" | "complete") {
  dialog.warning({
    title: name === "complete" ? "确认完成订单" : "确认取消订单",
    content:
      name === "complete"
        ? "完成后将按商品类型交付服务或卡密，不能普通撤回。"
        : "取消后会按既有规则处理退款。",
    positiveText: "确认",
    negativeText: "返回",
    onPositiveClick: () => action.mutate(name),
  });
}
</script>
<template>
  <div class="manage-page">
    <LsPageHeader
      :title="query.data.value?.product_name || '订单详情'"
      :description="
        routeAccess.restricted.value
          ? '订单 #- · -'
          : query.data.value
          ? `订单 #${query.data.value.id} · ${formatDate(query.data.value.create_time)}`
          : '正在读取'
      "
      back-to="/manage/orders"
      back-label="返回订单"
      ><template #actions
        ><template
          v-if="routeAccess.restricted.value || query.data.value?.status === 1"
          ><LsButton
            variant="secondary"
            :loading="action.isPending.value"
            :disabled="routeAccess.restricted.value || !canManage('shop.order.write')"
            :disabled-reason="routeAccess.reason.value || managePermissionReason('shop.order.write')"
            @click="run('cancel')"
            >取消订单</LsButton
          ><LsPagePrimaryAction
            :icon="CheckCheck"
            label="完成订单"
            :loading="action.isPending.value"
            :disabled="routeAccess.restricted.value || !canManage('shop.order.write')"
            :disabled-reason="routeAccess.reason.value || managePermissionReason('shop.order.write')"
            @click="run('complete')" /></template></template></LsPageHeader
    ><LsAsyncState
      v-if="!routeAccess.restricted.value && query.isPending.value"
      state="loading"
      :rows="5"
    /><LsAsyncState
      v-else-if="!routeAccess.restricted.value && query.isError.value"
      state="error"
      title="暂时无法读取订单"
      :description="friendlyError(query.error.value)"
    /><template v-else-if="routeAccess.restricted.value"><LsPanel><dl class="manage-facts"><div><dt>状态</dt><dd>-</dd></div><div><dt>数量</dt><dd>-</dd></div><div><dt>单价</dt><dd>-</dd></div><div><dt>总价</dt><dd>-</dd></div><div><dt>现金</dt><dd>-</dd></div><div><dt>预存款</dt><dd>-</dd></div><div><dt>成本</dt><dd>-</dd></div><div><dt>关联流水</dt><dd>-</dd></div></dl></LsPanel><LsPanel><div class="manage-detail"><h2>参与方与冻结分配</h2><dl class="manage-facts"><div><dt>顾客</dt><dd>-</dd></div><div><dt>接单人</dt><dd>-</dd></div><div><dt>接单分配</dt><dd>-</dd></div><div><dt>发单分配</dt><dd>-</dd></div><div><dt>客服分配</dt><dd>-</dd></div><div><dt>团队分配</dt><dd>-</dd></div></dl></div></LsPanel></template><template v-else-if="query.data.value"
      ><LsPanel
        ><dl class="manage-facts">
          <div>
            <dt>状态</dt>
            <dd>
              <LsStatusTag
                :label="status(query.data.value.status)"
                :type="
                  query.data.value.status === 2
                    ? 'success'
                    : query.data.value.status === 3
                      ? 'default'
                      : 'warning'
                "
              />
            </dd>
          </div>
          <div>
            <dt>数量</dt>
            <dd>{{ query.data.value.quantity }}</dd>
          </div>
          <div>
            <dt>单价</dt>
            <dd>{{ formatMoney(query.data.value.unit_price) }}</dd>
          </div>
          <div>
            <dt>总价</dt>
            <dd>{{ formatMoney(query.data.value.total_price) }}</dd>
          </div>
          <div>
            <dt>现金</dt>
            <dd>{{ formatMoney(query.data.value.cash) }}</dd>
          </div>
          <div>
            <dt>预存款</dt>
            <dd>{{ formatMoney(query.data.value.prepaid) }}</dd>
          </div>
          <div>
            <dt>成本</dt>
            <dd>{{ formatMoney(query.data.value.cost) }}</dd>
          </div>
          <div>
            <dt>关联流水</dt>
            <dd>
              {{
                query.data.value.trans_id
                  ? `#${query.data.value.trans_id}`
                  : "未生成"
              }}
            </dd>
          </div>
        </dl></LsPanel
      ><LsPanel
        ><div class="manage-detail">
          <h2>参与方与冻结分配</h2>
          <dl class="manage-facts">
            <div>
              <dt>顾客</dt>
              <dd>{{ query.data.value.customer?.nickname ?? "未关联" }}</dd>
            </div>
            <div>
              <dt>接单人</dt>
              <dd>{{ query.data.value.handler?.name ?? "团队" }}</dd>
            </div>
            <div>
              <dt>接单分配</dt>
              <dd>{{ formatMoney(query.data.value.handler_cut) }}</dd>
            </div>
            <div>
              <dt>发单分配</dt>
              <dd>{{ formatMoney(query.data.value.sender_cut) }}</dd>
            </div>
            <div>
              <dt>客服分配</dt>
              <dd>{{ formatMoney(query.data.value.cs_cut) }}</dd>
            </div>
            <div>
              <dt>团队分配</dt>
              <dd>{{ formatMoney(query.data.value.team_cut) }}</dd>
            </div>
          </dl>
          <p v-if="query.data.value.memo">{{ query.data.value.memo }}</p>
        </div></LsPanel
      ></template
    >
  </div>
</template>
