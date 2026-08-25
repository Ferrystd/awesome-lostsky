<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { feedback } from '@lostsky/ui/feedback'
import { NButton, NFormItem, NInput } from 'naive-ui'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiPrefix, expectedEntity, loadAccess } from '../lib/workspace'

const route=useRoute();const router=useRouter();const personal=computed(()=>route.meta.workspace==='personal');const prefix=computed(()=>apiPrefix(personal.value));const phone=ref('');const code=ref('');const challenge=ref('');const kind=ref('');const pending=ref(false)
async function start(){pending.value=true;try{const access=await loadAccess();const result=await api.post<{challenge_id:string;kind:string}>(`${prefix.value}/accounts/login/start`,{phone:phone.value,...expectedEntity(access,personal.value)});challenge.value=result.challenge_id;kind.value=result.kind;feedback.success(result.kind==='weibo'?'微博验证码已发送':'LostSky 验证码已发送')}catch(e){feedback.error(friendlyError(e))}finally{pending.value=false}}
async function confirm(){pending.value=true;try{const access=await loadAccess();await api.post(`${prefix.value}/accounts/login/confirm`,{challenge_id:challenge.value,code:code.value,...expectedEntity(access,personal.value)});feedback.success('账号已绑定');void router.push(`${prefix.value}/accounts`)}catch(e){feedback.error(friendlyError(e))}finally{pending.value=false}}
</script>
<template><div class="weibo-stack"><LsPageHeader title="绑定微博账号" description="新账号或失效账号使用微博短信；已保存且检查有效的账号使用 LostSky 短信复核。" :back-to="`${prefix}/accounts`" /><LsPanel><form class="weibo-form" @submit.prevent="challenge ? confirm() : start()"><NFormItem label="手机号"><NInput v-model:value="phone" :disabled="Boolean(challenge)" placeholder="输入微博绑定手机号" /></NFormItem><template v-if="challenge"><NFormItem :label="kind==='weibo'?'微博验证码':'LostSky 验证码'"><NInput v-model:value="code" inputmode="numeric" placeholder="4–8 位数字" /></NFormItem></template><NButton type="primary" attr-type="submit" :loading="pending">{{ challenge ? '确认绑定' : '发送验证码' }}</NButton></form></LsPanel></div></template>
