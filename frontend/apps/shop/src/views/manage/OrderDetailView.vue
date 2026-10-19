<script setup lang="ts">
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import { friendlyError } from "@lostsky/api/client";
import LsAsyncState from "@lostsky/ui/components/LsAsyncState.vue";
import LsButton from "@lostsky/ui/components/LsButton.vue";
import LsDetailPage from "@lostsky/ui/components/LsDetailPage.vue";
import LsPagePrimaryAction from "@lostsky/ui/components/LsPagePrimaryAction.vue";
import LsStatusTag from "@lostsky/ui/components/LsStatusTag.vue";
import { feedback } from "@lostsky/ui/feedback";
import { useRouteAccess } from "@lostsky/ui/useRouteAccess";
import { useDialog } from "naive-ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { CheckCheck } from "@lucide/vue";
import { computed } from "vue";
import { useRoute } from "vue-router";
import { formatPurchaseValue } from '../../purchase-fields';
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
  <LsDetailPage aside-label="订单已保存概况"
    :title="query.data.value?.product_name || '订单详情'"
    :description="routeAccess.restricted.value ? '订单 #- · -' : query.data.value ? `订单 #${query.data.value.id} · ${formatDate(query.data.value.create_time)}` : '正在读取'"
    back-to="/manage/orders"
    back-label="返回订单"
  >
    <template #actions>
      <template v-if="routeAccess.restricted.value || query.data.value?.status === 1">
        <LsButton
          variant="secondary"
          :loading="action.isPending.value"
          :disabled="routeAccess.restricted.value || !canManage('shop.order.write')"
          :disabled-reason="routeAccess.reason.value || managePermissionReason('shop.order.write')"
          @click="run('cancel')"
        >取消订单</LsButton>
        <LsPagePrimaryAction
          :icon="CheckCheck"
          label="完成订单"
          :loading="action.isPending.value"
          :disabled="routeAccess.restricted.value || !canManage('shop.order.write')"
          :disabled-reason="routeAccess.reason.value || managePermissionReason('shop.order.write')"
          @click="run('complete')"
        />
      </template>
    </template>
    <div class="manage-page">
      <LsAsyncState v-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="5" />
      <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取订单" :description="friendlyError(query.error.value)" />
      <LsFormSection v-else-if="routeAccess.restricted.value" title="参与方与冻结分成"><p>-</p></LsFormSection>
      <template v-else-if="query.data.value">
        <LsFormSection title="参与方与冻结分成" description="订单创建时保存的参与方与分成金额。">
          <LsDescriptionList>
            <dt>顾客</dt><dd>{{ query.data.value.customer?.nickname ?? '未关联' }}</dd>
            <dt>接单人</dt><dd>{{ query.data.value.handler?.name ?? '团队' }}</dd>
            <dt>成本</dt><dd>{{ formatMoney(query.data.value.cost) }}</dd>
            <dt>接单分成</dt><dd>{{ formatMoney(query.data.value.handler_cut) }}</dd>
            <dt>发单分成</dt><dd>{{ formatMoney(query.data.value.sender_cut) }}</dd>
            <dt>客服分成</dt><dd>{{ formatMoney(query.data.value.cs_cut) }}</dd>
            <dt>团队分成</dt><dd>{{ formatMoney(query.data.value.team_cut) }}</dd>
          </LsDescriptionList>
          <p v-if="query.data.value.memo">{{ query.data.value.memo }}</p>
        </LsFormSection>
        <LsFormSection v-if="query.data.value.purchase_fields?.length" title="购买资料">
          <LsDescriptionList><template v-for="field in query.data.value.purchase_fields" :key="field.id"><dt>{{ field.name }}</dt><dd>{{ formatPurchaseValue(field) }}</dd></template></LsDescriptionList>
        </LsFormSection>
      </template>
    </div>
    <template #aside>
      <LsFormSection title="订单概况" description="已保存的订单与支付金额。">
        <p v-if="routeAccess.restricted.value">暂无可查看的订单资料。</p>
        <p v-else-if="query.isPending.value">正在读取订单…</p>
        <p v-else-if="query.isError.value">订单读取失败。</p>
        <LsDescriptionList v-else-if="query.data.value">
          <dt>状态</dt><dd><LsStatusTag :label="status(query.data.value.status)" :type="query.data.value.status === 2 ? 'success' : query.data.value.status === 3 ? 'default' : 'warning'" /></dd>
          <dt>数量</dt><dd>{{ query.data.value.quantity }}</dd>
          <dt>单价</dt><dd>{{ formatMoney(query.data.value.unit_price) }}</dd>
          <dt>总价</dt><dd>{{ formatMoney(query.data.value.total_price) }}</dd>
          <dt>现金</dt><dd>{{ formatMoney(query.data.value.cash) }}</dd>
          <dt>预存款</dt><dd>{{ formatMoney(query.data.value.prepaid) }}</dd>
          <dt>关联流水</dt><dd>{{ query.data.value.trans_id ? '#' + query.data.value.trans_id : '未生成' }}</dd>
        </LsDescriptionList>
        <p v-else>暂无订单资料。</p>
      </LsFormSection>
    </template>
  </LsDetailPage>
</template>
