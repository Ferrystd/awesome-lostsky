<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { ArrowLeft, UserRound } from '@lucide/vue'
import { NConfigProvider, NInput } from 'naive-ui'
import { reactive, watch } from 'vue'
import { lostskyNaiveTheme } from '@lostsky/ui/naive-theme'

interface CustomerProfile {
  nickname?: string
  avatar?: string | null
  description?: string | null
  slug?: string | null
}
const client = useQueryClient()
const form = reactive({ nickname: '', avatar: '', description: '', slug: '' })
const profile = useQuery({ queryKey: ['chat-customer-profile'], queryFn: () => api.get<CustomerProfile>('/customer/me'), retry: false })
watch(() => profile.data.value, value => {
  if (!value) return
  form.nickname = value.nickname ?? ''
  form.avatar = value.avatar ?? ''
  form.description = value.description ?? ''
  form.slug = value.slug ?? ''
}, { immediate: true })
const save = useMutation({
  mutationFn: async () => {
    await api.post('/customer/me', { nickname: form.nickname, avatar: form.avatar || null, description: form.description || null })
    if (!profile.data.value?.slug && form.slug) await api.post('/customer/slug', { slug: form.slug })
  },
  onSuccess: () => Promise.all([
    client.invalidateQueries({ queryKey: ['chat-customer-profile'] }),
    client.invalidateQueries({ queryKey: ['chat-actors'] }),
  ]),
})
</script>

<template>
  <NConfigProvider :theme-overrides="lostskyNaiveTheme">
    <main class="profile-page">
      <a class="back" href="/"><ArrowLeft :size="18" />返回消息</a>
      <header><span><UserRound /></span><div><p>CUSTOMER IDENTITY</p><h1>我的客户资料</h1><small>这份资料只属于当前团队；你在其他团队可以使用不同昵称和身份标识。</small></div></header>
      <form v-if="!profile.isError.value || profile.error.value && String(profile.error.value).includes('404')" @submit.prevent="save.mutate()">
        <label>公开昵称<NInput v-model:value="form.nickname" maxlength="50" placeholder="你希望团队看到的称呼" /></label>
        <label>身份 slug<NInput v-model:value="form.slug" :disabled="Boolean(profile.data.value?.slug)" maxlength="50" placeholder="例如 alice-customer" /><small>全局唯一且确定后永久保留，用于聊天身份和公开链接。</small></label>
        <label>头像地址<NInput v-model:value="form.avatar" maxlength="500" placeholder="https://…" /></label>
        <label>公开简介<NInput v-model:value="form.description" type="textarea" maxlength="500" :autosize="{ minRows: 3, maxRows: 7 }" /></label>
        <p v-if="save.isError.value" class="error" role="alert">{{ friendlyError(save.error.value) }}</p>
        <button type="submit" :disabled="save.isPending.value">{{ save.isPending.value ? '正在保存…' : '保存资料' }}</button>
      </form>
      <div v-else class="not-customer"><h2>当前团队没有客户身份</h2><p>如果你同时是团队成员，可以直接返回聊天并选择成员身份。</p></div>
    </main>
  </NConfigProvider>
</template>

<style scoped>
.profile-page{width:min(100% - 2rem,42rem);margin:0 auto;padding:2rem 0 4rem;display:grid;gap:1.5rem}.back{width:fit-content;min-height:44px;display:flex;align-items:center;gap:.4rem;color:var(--sky-lost-strong);font-weight:650}.profile-page>header{display:flex;align-items:center;gap:1rem}.profile-page>header>span{width:58px;height:58px;flex:0 0 auto;display:grid;place-items:center;color:white;background:var(--sky-night);border-radius:17px}.profile-page header p,.profile-page header h1,.profile-page header small{margin:0}.profile-page header p{color:var(--sky-lost-strong);font:700 .7rem/1 'Barlow Condensed',sans-serif;letter-spacing:.12em}.profile-page header h1{font-size:1.65rem}.profile-page header small{color:var(--muted-ink);font-size:.8rem}form{display:grid;gap:1rem;padding:clamp(1rem,4vw,1.75rem);background:white;border:1px solid var(--line);border-radius:14px}label{display:grid;gap:.4rem;font-size:.82rem;font-weight:650}label small{color:var(--muted-ink);font-weight:400}form>button{min-height:46px;color:white;background:var(--sky-lost-strong);border:0;border-radius:10px;font-weight:700}.error{margin:0;color:var(--danger)}.not-customer{padding:2rem;text-align:center;background:white;border:1px solid var(--line);border-radius:14px}.not-customer h2,.not-customer p{margin:0}.not-customer p{margin-top:.4rem;color:var(--muted-ink)}
</style>
