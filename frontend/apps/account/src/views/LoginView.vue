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
import SmsCodeField from '../components/SmsCodeField.vue'

const route = useRoute()
const mode = ref<'sms' | 'password'>('sms')
const phone = ref('')
const code = ref('')
const account = ref('')
const password = ref('')
const visible = ref(false)
const loading = ref(false)
const error = ref('')
const expired = computed(() => route.query.expired === '1')
const registerTarget = computed(() => ({
  path: '/register',
  query: route.query.redirect ? { redirect: route.query.redirect } : {},
}))

async function submit() {
  error.value = ''
  if (mode.value === 'sms') {
    if (!/^1[3-9]\d{9}$/.test(phone.value.trim()) || !code.value.trim()) {
      error.value = '请输入正确的手机号码和短信验证码'
      return
    }
  } else if (!account.value.trim() || password.value.length < 6) {
    error.value = '请输入账号，密码不少于 6 位'
    return
  }

  loading.value = true
  try {
    const data = mode.value === 'sms'
      ? await api.post<{ token: string; user?: unknown }>('/login/sms', {
          phone: phone.value.trim(),
          code: code.value.trim(),
        })
      : await api.post<{ token: string; user?: unknown }>('/login/password', {
          account: account.value.trim(),
          password: password.value,
        })
    auth.save(data)
    goToSafeRedirect(route.query.redirect)
  } catch (reason) {
    error.value = friendlyError(reason)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthShell title="欢迎回来" intro="使用短信验证码或密码继续进入你的工作空间。">
    <div class="mode" role="tablist" aria-label="登录方式">
      <button type="button" role="tab" :aria-selected="mode === 'sms'" @click="mode = 'sms'">验证码登录</button>
      <button type="button" role="tab" :aria-selected="mode === 'password'" @click="mode = 'password'">密码登录</button>
    </div>
    <p v-if="expired" class="notice">登录状态已过期，请重新登录。</p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <form class="form" @submit.prevent="submit">
      <template v-if="mode === 'sms'">
        <LsField label="手机号码" for-id="login-phone" required>
          <LsInput
            id="login-phone"
            v-model="phone"
            type="tel"
            inputmode="tel"
            autocomplete="tel"
            placeholder="请输入手机号码"
          />
        </LsField>
        <SmsCodeField v-model="code" :phone="phone" purpose="login" id="login-code" />
      </template>
      <template v-else>
        <LsField label="手机号 / 用户名 / 邮箱" for-id="login-account" required>
          <LsInput
            id="login-account"
            v-model="account"
            type="text"
            autocomplete="username"
            placeholder="请输入手机号、用户名或邮箱"
          />
        </LsField>
        <LsField label="密码" for-id="login-password" required>
          <div class="password">
            <LsInput
              id="login-password"
              v-model="password"
              :type="visible ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="至少 6 位"
            />
            <button type="button" :aria-label="visible ? '隐藏密码' : '显示密码'" @click="visible = !visible">
              <EyeOff v-if="visible" :size="19" />
              <Eye v-else :size="19" />
            </button>
          </div>
        </LsField>
      </template>
      <LsButton type="submit" size="lg" :loading="loading">
        {{ mode === 'sms' ? '验证码登录' : '密码登录' }}
      </LsButton>
    </form>
    <p class="switch">还没有账号？<RouterLink :to="registerTarget">创建通行证</RouterLink></p>
  </AuthShell>
</template>

<style scoped>
.mode { display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 1.5rem; padding: 3px; background: var(--cloud); border-radius: 10px; }
.mode button { min-height: 44px; border: 0; border-radius: 8px; color: var(--muted-ink); background: transparent; cursor: pointer; }
.mode button[aria-selected='true'] { color: var(--ink); background: white; box-shadow: 0 2px 7px color-mix(in oklch, var(--ink), transparent 92%); }
.form { display: grid; gap: 1.25rem; }
.form :deep(.ls-button) { width: 100%; margin-top: .25rem; }
.password { position: relative; }
.password :deep(input) { padding-right: 3rem; }
.password button { position: absolute; right: .2rem; top: .1rem; width: 44px; height: 44px; display: grid; place-items: center; color: var(--muted-ink); background: transparent; border: 0; cursor: pointer; }
.error, .notice { padding: .75rem .85rem; border-radius: 8px; font-size: .875rem; }
.error { color: var(--danger); background: color-mix(in oklch, var(--danger), white 93%); }
.notice { color: var(--sky-lost-strong); background: color-mix(in oklch, var(--sky-lost), white 91%); }
.switch { margin: 1.5rem 0 0; text-align: center; color: var(--muted-ink); font-size: .9rem; }
.switch a { color: var(--sky-lost-strong); font-weight: 700; }
</style>
