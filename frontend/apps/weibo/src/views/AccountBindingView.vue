<script setup lang="ts">
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsFormPage from '@lostsky/ui/components/LsFormPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import { ArrowLeft } from '@lucide/vue'

import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { NFormItem, NInput } from 'naive-ui'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiPrefix, expectedEntity, loadAccess } from '../lib/workspace'

const route=useRoute();const router=useRouter();const personal=computed(()=>route.meta.workspace==='personal');const prefix=computed(()=>apiPrefix(personal.value));const routeAccess=useRouteAccess();const phone=ref('');const code=ref('');const challenge=ref('');const kind=ref('');const pending=ref(false)
async function start(){if(routeAccess.reason.value)return feedback.info(routeAccess.reason.value);pending.value=true;try{const access=await loadAccess();const result=await api.post<{challenge_id:string;kind:string}>(`${prefix.value}/accounts/login/start`,{phone:phone.value,...expectedEntity(access,personal.value)});challenge.value=result.challenge_id;kind.value=result.kind;feedback.success(result.kind==='weibo'?'微博验证码已发送':'LostSky 验证码已发送')}catch(e){feedback.error(friendlyError(e))}finally{pending.value=false}}
async function confirm(){if(routeAccess.reason.value)return feedback.info(routeAccess.reason.value);pending.value=true;try{const access=await loadAccess();await api.post(`${prefix.value}/accounts/login/confirm`,{challenge_id:challenge.value,code:code.value,...expectedEntity(access,personal.value)});feedback.success('账号已绑定');void router.push(`${prefix.value}/accounts`)}catch(e){feedback.error(friendlyError(e))}finally{pending.value=false}}
</script>
<template>
  <LsFormPage title="绑定微博账号" description="新账号或失效账号使用微博短信；已保存且检查有效的账号使用 LostSky 短信复核。">
    <template #actions>
      <LsPageLink :to="`${prefix}/accounts`" :icon="ArrowLeft" label="返回账号列表" />
    </template>
    <form class="weibo-form" @submit.prevent="challenge ? confirm() : start()">
      <LsFormSection :title="challenge ? '填写验证码' : '验证账号'" :description="challenge ? '使用本次验证短信中的验证码完成绑定。' : '填写微博绑定手机号，然后获取验证码。'"><NFormItem label="手机号"><NInput v-model:value="phone" :disabled="Boolean(challenge)" placeholder="输入微博绑定手机号" /></NFormItem><template v-if="challenge"><NFormItem :label="kind==='weibo'?'微博验证码':'LostSky 验证码'"><NInput v-model:value="code" inputmode="numeric" placeholder="4–8 位数字" /></NFormItem></template></LsFormSection>
      <LsFormActions><LsButton type="submit" :loading="pending" :disabled="routeAccess.restricted.value" :disabled-reason="routeAccess.reason.value">{{ challenge ? '确认绑定' : '发送验证码' }}</LsButton></LsFormActions>
    </form>
  </LsFormPage>
</template>
