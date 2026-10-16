<script setup lang="ts">
import LsFormFields from '@lostsky/ui/components/LsFormFields.vue'
import LsCollectionPage from '@lostsky/ui/components/LsCollectionPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import { ArrowLeft } from '@lucide/vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NInput, useDialog } from 'naive-ui'
import { computed, ref } from 'vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'

type Ability={key:string;label:string;enabled:boolean;level:number;expire_time:number;reason:string|null;source:string}
type Preview={campaign:{id:number;name:string;mode:number|string};abilities:Array<{ability_key:string;level:number;duration_days:number}>}
const code=ref('');const preview=ref<Preview|null>(null);const client=useQueryClient();const dialog=useDialog();const routeAccess=useRouteAccess()
const query=useQuery({queryKey:['team-abilities'],queryFn:()=>api.get<Ability[]>('/ability'),enabled:computed(()=>!routeAccess.restricted.value)})
const inspect=useMutation({mutationFn:()=>api.post<Preview>('/ability/card/inspect',{code:code.value.trim()}),onSuccess:data=>{preview.value=data},onError:()=>{preview.value=null}})
const redeem=useMutation({mutationFn:()=>api.post('/ability/card/redeem',{code:code.value.trim()}),onSuccess:async()=>{feedback.success('Ability 已解锁');code.value='';preview.value=null;await Promise.all([client.invalidateQueries({queryKey:['team-abilities']}),client.invalidateQueries({queryKey:['team-access']})])}})
const expires=(value:number)=>value?new Intl.DateTimeFormat('zh-CN',{dateStyle:'medium',timeStyle:'short'}).format(value*1000):'永久';const ready=computed(()=>Boolean(code.value.trim()))
function inspectCode(){if(routeAccess.restricted.value)return;inspect.mutate()}
function confirm(){if(routeAccess.restricted.value||!preview.value)return;dialog.warning({title:'确认兑换 Ability',content:`将为当前团队领取“${preview.value.campaign.name}”。同一公共活动每个团队只能领取一次。`,positiveText:'确认兑换',negativeText:'返回',onPositiveClick:()=>redeem.mutate()})}
</script>
<template>
  <div class="abilities-view">
    <LsCollectionPage title="团队能力" description="查看与兑换团队能力。">
      <template #actions>
        <LsPageLink to="/settings" label="返回团队设置" :icon="ArrowLeft" />
      </template>
      <LsEmptyState :source="query.data.value" v-if="routeAccess.restricted.value" title="暂无可显示的数据" description="当前列表为空。"/>
      <LsAsyncState v-else-if="query.isPending.value" state="loading" :rows="3"/>
      <LsAsyncState v-else-if="query.isError.value" state="error" title="暂时无法读取团队能力" :description="friendlyError(query.error.value)"/>
      <LsResourceList v-else-if="query.data.value?.length" aria-label="团队能力列表">
        <LsResourceRow v-for="item in query.data.value" :key="item.key" :title="item.label" :description="`${item.source==='grant'?'权益授权':item.source==='legacy'?'兼容授权':item.source==='base'?'基础容量':'尚未获得'} · ${item.expire_time?`有效至 ${expires(item.expire_time)}`:'永久'}`">
          <template #status>
            <LsStatusTag :label="item.enabled?'可用':item.reason==='expired'?'已过期':'未解锁'" :type="item.enabled?'success':item.reason==='expired'?'warning':'default'"/>
          </template>
          <template #metadata>
            <span>等级 {{item.level}}</span>
          </template>
        </LsResourceRow>
      </LsResourceList>
      <LsEmptyState v-else :source="query.data.value" title="暂无团队能力" description="兑换能力后可在这里查看授权和有效期。"/>
      <LsPanel>
        <form class="redeem-form" @submit.prevent="inspectCode">
          <LsSectionHeader title="兑换能力卡密" description="查看兑换码对应的能力权益，确认后应用到当前团队。" />
          <LsFormFields>
            <LsField label="兑换码" for-id="ability-code" required>
              <NInput :input-props="{ id: 'ability-code' }" v-model:value="code" autocomplete="off" placeholder="LS-XXXX-XXXX-…" @update:value="preview=null"/>
            </LsField>
          </LsFormFields>
          <LsInlineError v-if="inspect.isError.value && !routeAccess.restricted.value" :message="friendlyError(inspect.error.value)"/>
          <LsInlineError v-if="redeem.isError.value && !routeAccess.restricted.value" :message="friendlyError(redeem.error.value)"/>
          <LsButton type="submit" :disabled="routeAccess.restricted.value || !ready" :disabled-reason="routeAccess.reason.value" :loading="inspect.isPending.value">检查兑换码</LsButton>
        </form>
      </LsPanel>
      <LsPanel v-if="preview">
        <div class="preview">
          <LsSectionHeader :title="preview.campaign.name" description="确认后立即应用到当前团队。" />
          <LsDescriptionList>
            <template v-for="item in preview.abilities" :key="item.ability_key">
              <dt>{{item.ability_key}}</dt>
              <dd>等级 {{item.level}} · {{item.duration_days?`${item.duration_days} 天`:'永久'}}</dd>
            </template>
          </LsDescriptionList>
          <LsButton :disabled="routeAccess.restricted.value" :disabled-reason="routeAccess.reason.value" :loading="redeem.isPending.value" @click="confirm">确认兑换</LsButton>
        </div>
      </LsPanel>
    </LsCollectionPage>
  </div>
</template>
<style scoped>

.redeem-form, .preview { display: grid; gap: 1rem; }

</style>
