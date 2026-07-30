<script setup lang="ts">
import { api, auth, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsInput from '@lostsky/ui/components/LsInput.vue'
import { goToSafeRedirect } from '@lostsky/shared/navigation'
import { ref } from 'vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AuthShell from '../components/AuthShell.vue'
import SmsCodeField from '../components/SmsCodeField.vue'

const route = useRoute()
const phone = ref('')
const code = ref('')
const password = ref('')
const confirm = ref('')
const loading = ref(false)
const error = ref('')
const loginTarget = computed(() => ({
  path: '/login',
  query: route.query.redirect ? { redirect: route.query.redirect } : {},
}))

async function submit() {
  error.value = ''
  if (!/^1[3-9]\d{9}$/.test(phone.value.trim()) || !code.value.trim()) {
    error.value = '请输入正确的手机号码和短信验证码'
    return
  }
  if (password.value.length < 6) {
    error.value = '密码至少需要 6 位'
    return
  }
  if (password.value !== confirm.value) {
    error.value = '两次输入的密码不一致'
    return
  }

  loading.value = true
  try {
    const data = await api.post<{ token: string; user?: unknown }>('/register/sms', {
      phone: phone.value.trim(),
      code: code.value.trim(),
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
  <AuthShell title="创建通行证" intro="验证手机号码并设置密码，之后可使用验证码或密码登录。">
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <form class="form" @submit.prevent="submit">
      <LsField label="手机号码" for-id="register-phone" required>
        <LsInput
          id="register-phone"
          v-model="phone"
          type="tel"
          inputmode="tel"
          autocomplete="tel"
          placeholder="请输入手机号码"
        />
      </LsField>
      <SmsCodeField v-model="code" :phone="phone" purpose="register" id="register-code" />
      <LsField label="设置密码" for-id="register-password" hint="至少 6 位" required>
        <LsInput id="register-password" v-model="password" type="password" autocomplete="new-password" />
      </LsField>
      <LsField label="确认密码" for-id="register-confirm" required>
        <LsInput id="register-confirm" v-model="confirm" type="password" autocomplete="new-password" />
      </LsField>
      <LsButton type="submit" size="lg" :loading="loading">验证并创建账号</LsButton>
    </form>
    <p class="switch">已有账号？<RouterLink :to="loginTarget">直接登录</RouterLink></p>
  </AuthShell>
</template>

<style scoped>
.form { display: grid; gap: 1.25rem; }
.form :deep(.ls-button) { width: 100%; margin-top: .25rem; }
.error { padding: .75rem .85rem; color: var(--danger); background: color-mix(in oklch, var(--danger), white 93%); border-radius: 8px; font-size: .875rem; }
.switch { margin: 1.5rem 0 0; text-align: center; color: var(--muted-ink); font-size: .9rem; }
.switch a { color: var(--sky-lost-strong); font-weight: 700; }
</style>
