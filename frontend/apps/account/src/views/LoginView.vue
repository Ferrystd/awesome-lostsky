<script setup lang="ts">
import { api, auth, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsInput from '@lostsky/ui/components/LsInput.vue'
import { goToSafeRedirect } from '@lostsky/shared/navigation'
import { Eye, EyeOff } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AuthShell from '../components/AuthShell.vue'

const route = useRoute()
const mode = ref<'phone' | 'account'>('phone'); const account = ref(''); const password = ref(''); const visible = ref(false); const loading = ref(false); const error = ref('')
const expired = computed(() => route.query.expired === '1')
async function submit() {
  error.value = ''
  if (!account.value.trim() || password.value.length < 6) { error.value = '请输入账号并确认密码不少于6位'; return }
  loading.value = true
  try {
    const path = mode.value === 'phone' ? '/login/phone' : '/login/password'
    const data = await api.post<{ token: string; user?: unknown }>(path, mode.value === 'phone' ? { phone: account.value.trim(), password: password.value } : { account: account.value.trim(), password: password.value })
    auth.save(data)
    goToSafeRedirect(route.query.redirect)
  } catch (reason) { error.value = friendlyError(reason) } finally { loading.value = false }
}
</script>
<template>
  <AuthShell title="欢迎回来" intro="使用通行证继续进入你的工作空间。">
    <div class="mode" role="tablist" aria-label="登录方式"><button v-for="item in ['phone','account']" :key="item" type="button" role="tab" :aria-selected="mode === item" @click="mode = item as typeof mode">{{ item === 'phone' ? '手机号' : '账号' }}</button></div>
    <p v-if="expired" class="notice">登录状态已过期，请重新登录。</p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <form class="form" @submit.prevent="submit">
      <LsField :label="mode === 'phone' ? '手机号码' : '账号'" for-id="login-account" required><LsInput id="login-account" v-model="account" :type="mode === 'phone' ? 'tel' : 'text'" autocomplete="username" :placeholder="mode === 'phone' ? '请输入手机号码' : '请输入账号'" /></LsField>
      <LsField label="密码" for-id="login-password" required>
        <div class="password"><LsInput id="login-password" v-model="password" :type="visible ? 'text' : 'password'" autocomplete="current-password" placeholder="至少6位" /><button type="button" :aria-label="visible ? '隐藏密码' : '显示密码'" @click="visible = !visible"><EyeOff v-if="visible" :size="19" /><Eye v-else :size="19" /></button></div>
      </LsField>
      <LsButton type="submit" size="lg" :loading="loading">登录</LsButton>
    </form>
    <p class="switch">还没有账号？<RouterLink to="/register">创建通行证</RouterLink></p>
  </AuthShell>
</template>
<style scoped>
.mode { display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 1.5rem; padding: 3px; background: var(--cloud); border-radius: 10px; }
.mode button { min-height: 42px; border: 0; border-radius: 8px; color: var(--muted-ink); background: transparent; cursor: pointer; }
.mode button[aria-selected='true'] { color: var(--ink); background: white; box-shadow: 0 2px 7px color-mix(in oklch, var(--ink), transparent 92%); }
.form { display: grid; gap: 1.25rem; }.form :deep(.ls-button) { width: 100%; margin-top: .25rem; }
.password { position: relative; }.password :deep(input) { padding-right: 3rem; }.password button { position: absolute; right: .2rem; top: .1rem; width: 44px; height: 44px; display: grid; place-items: center; color: var(--muted-ink); background: transparent; border: 0; }
.error, .notice { padding: .75rem .85rem; border-radius: 8px; font-size: .875rem; }.error { color: var(--danger); background: color-mix(in oklch, var(--danger), white 93%); }.notice { color: var(--sky-lost-strong); background: color-mix(in oklch, var(--sky-lost), white 91%); }
.switch { margin: 1.5rem 0 0; text-align: center; color: var(--muted-ink); font-size: .9rem; }.switch a { color: var(--sky-lost-strong); font-weight: 700; }
</style>
