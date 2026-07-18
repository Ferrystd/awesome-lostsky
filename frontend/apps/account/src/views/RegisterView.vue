<script setup lang="ts">
import { api, auth, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsInput from '@lostsky/ui/components/LsInput.vue'
import { safeRedirect } from '@lostsky/shared/navigation'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthShell from '../components/AuthShell.vue'
const route = useRoute(); const router = useRouter(); const phone = ref(''); const password = ref(''); const confirm = ref(''); const loading = ref(false); const error = ref('')
async function submit() {
  error.value = ''
  if (!phone.value.trim() || password.value.length < 6) { error.value = '请输入手机号码，密码至少6位'; return }
  if (password.value !== confirm.value) { error.value = '两次输入的密码不一致'; return }
  loading.value = true
  try { const data = await api.post<{ token: string; user?: unknown }>('/register/phone', { phone: phone.value.trim(), password: password.value }); auth.save(data); const redirect=safeRedirect(route.query.redirect); if(redirect.startsWith('https://'))location.href=redirect;else await router.replace(redirect) }
  catch (reason) { error.value = friendlyError(reason) } finally { loading.value = false }
}
</script>
<template><AuthShell title="创建通行证" intro="从一个个人空间开始，之后再邀请团队成员。"><p v-if="error" class="error" role="alert">{{ error }}</p><form class="form" @submit.prevent="submit"><LsField label="手机号码" for-id="register-phone" required><LsInput id="register-phone" v-model="phone" type="tel" autocomplete="tel" placeholder="请输入手机号码" /></LsField><LsField label="设置密码" for-id="register-password" hint="至少6位" required><LsInput id="register-password" v-model="password" type="password" autocomplete="new-password" /></LsField><LsField label="确认密码" for-id="register-confirm" required><LsInput id="register-confirm" v-model="confirm" type="password" autocomplete="new-password" /></LsField><LsButton type="submit" size="lg" :loading="loading">创建账号</LsButton></form><p class="switch">已有账号？<RouterLink to="/login">直接登录</RouterLink></p></AuthShell></template>
<style scoped>.form{display:grid;gap:1.25rem}.form :deep(.ls-button){width:100%;margin-top:.25rem}.error{padding:.75rem .85rem;color:var(--danger);background:color-mix(in oklch,var(--danger),white 93%);border-radius:8px;font-size:.875rem}.switch{margin:1.5rem 0 0;text-align:center;color:var(--muted-ink);font-size:.9rem}.switch a{color:var(--sky-lost-strong);font-weight:700}</style>
