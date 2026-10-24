<script setup lang="ts">
import { friendlyError } from '@lostsky/api/client'
import { isRecoveryExpired, recovery } from '@lostsky/api/recovery'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsInput from '@lostsky/ui/components/LsInput.vue'
import { feedback } from '@lostsky/ui/feedback'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AccountFlowPage from '../components/AccountFlowPage.vue'
import SmsCodeField from '../components/SmsCodeField.vue'

const route = useRoute()
const step = ref<'verify' | 'choose' | 'password' | 'phone' | 'done'>('verify')
const phone = ref('')
const code = ref('')
const password = ref('')
const confirmation = ref('')
const newPhone = ref('')
const newCode = ref('')
const token = ref('')
const expiresAt = ref(0)
const loading = ref(false)
const sending = ref(false)
const error = ref('')
const busy = computed(() => loading.value || sending.value)
const loginTarget = computed(() => ({ path: '/login', query: route.query.redirect ? { redirect: route.query.redirect } : {} }))
const title = computed(() => ({ verify: '找回账号', choose: '选择恢复方式', password: '重置密码', phone: '换绑手机号', done: '账号恢复完成' })[step.value])
const intro = computed(() => ({
  verify: '先验证当前绑定的手机号，再重置密码或更换手机号。',
  choose: '当前手机号已验证，请选择你需要完成的操作。',
  password: '设置新密码后，请返回登录页重新登录。',
  phone: '验证新手机号后完成换绑，请使用新手机号重新登录。',
  done: '修改已保存，请返回登录页重新登录。',
})[step.value])
const dirty = computed(() => step.value !== 'done' && Boolean(code.value || token.value || password.value || newCode.value))
useUnsavedChangesGuard(dirty, { message: '离开后需要重新验证手机号，确认离开？' })

function resetVerification(message = '') {
  token.value = ''
  expiresAt.value = 0
  code.value = ''
  newCode.value = ''
  step.value = 'verify'
  error.value = message
}
function handleError(reason: unknown) {
  if (isRecoveryExpired(reason)) resetVerification('验证已失效，请重新验证当前绑定手机号。')
  else error.value = friendlyError(reason)
}
function handleSmsError(reason: unknown) {
  if (isRecoveryExpired(reason)) handleError(reason)
}
function ensureCredential() {
  if (token.value && Date.now() < expiresAt.value) return true
  resetVerification('验证已失效，请重新验证当前绑定手机号。')
  return false
}
const timer = setInterval(() => {
  if (token.value && !busy.value && Date.now() >= expiresAt.value) ensureCredential()
}, 1000)
onBeforeUnmount(() => { clearInterval(timer); token.value = '' })
watch(step, async () => {
  await nextTick()
  const focusId = { verify: 'recovery-phone', choose: 'recovery-password-choice', password: 'recovery-password', phone: 'recovery-new-phone', done: 'recovery-login' }[step.value]
  document.getElementById(focusId)?.focus()
})

async function verify() {
  if (busy.value) return
  error.value = ''
  if (!/^1[3-9]\d{9}$/.test(phone.value.trim()) || !code.value.trim()) {
    error.value = '请输入正确的手机号码和短信验证码'
    return
  }
  loading.value = true
  try {
    const result = await recovery.verify(phone.value.trim(), code.value.trim())
    token.value = result.recovery_token
    expiresAt.value = Date.now() + result.expires_in * 1000
    code.value = ''
    step.value = 'choose'
  } catch (reason) { handleError(reason) }
  finally { loading.value = false }
}
function choose(value: 'password' | 'phone') {
  if (busy.value || !ensureCredential()) return
  error.value = ''
  step.value = value
}
async function sendPhoneCode(value: string) {
  return recovery.sendPhoneCode(token.value, value)
}
async function submit() {
  if (busy.value || !ensureCredential()) return
  error.value = ''
  if (step.value === 'password') {
    if (password.value.length < 6 || password.value.length > 32) { error.value = '新密码需要 6–32 位'; return }
    if (password.value !== confirmation.value) { error.value = '两次输入的密码不一致'; return }
  } else if (!/^1[3-9]\d{9}$/.test(newPhone.value.trim()) || !newCode.value.trim()) {
    error.value = '请输入正确的新手机号码和短信验证码'
    return
  } else if (newPhone.value.trim() === phone.value.trim()) {
    error.value = '新手机号不能与当前绑定手机号相同'
    return
  }
  loading.value = true
  try {
    if (step.value === 'password') await recovery.resetPassword(token.value, password.value)
    else await recovery.changePhone(token.value, newPhone.value.trim(), newCode.value.trim())
    token.value = ''
    password.value = ''
    confirmation.value = ''
    newCode.value = ''
    step.value = 'done'
    feedback.success('修改成功，请重新登录')
  } catch (reason) { handleError(reason) }
  finally { loading.value = false }
}
</script>

<template>
  <AccountFlowPage :title="title" :intro="intro">
    <ol class="recovery-progress" aria-label="恢复进度"><li :aria-current="step === 'verify' ? 'step' : undefined">验证手机号</li><li :aria-current="['choose', 'password', 'phone'].includes(step) ? 'step' : undefined">更新账号信息</li><li :aria-current="step === 'done' ? 'step' : undefined">重新登录</li></ol>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <form v-if="step === 'verify'" class="form" aria-label="验证当前手机号" @submit.prevent="verify">
      <LsField label="当前绑定手机号" for-id="recovery-phone" required>
        <LsInput id="recovery-phone" v-model="phone" type="tel" inputmode="tel" autocomplete="tel" :disabled="busy" placeholder="请输入当前绑定的手机号" />
      </LsField>
      <SmsCodeField id="recovery-code" v-model="code" :phone="phone" purpose="recovery" :disabled="loading" @sending="sending = $event" />
      <LsButton type="submit" :loading="loading" :disabled="busy">验证手机号</LsButton>
    </form>
    <div v-else-if="step === 'choose'" class="form" aria-label="恢复方式">
      <LsButton id="recovery-password-choice" @click="choose('password')">重置密码</LsButton>
      <LsButton variant="secondary" @click="choose('phone')">换绑手机号</LsButton>
    </div>
    <form v-else-if="step === 'password' || step === 'phone'" class="form" :aria-label="title" @submit.prevent="submit">
      <template v-if="step === 'password'">
        <LsField label="新密码" for-id="recovery-password" hint="6–32 位" required>
          <LsInput id="recovery-password" v-model="password" type="password" autocomplete="new-password" :disabled="busy" maxlength="32" />
        </LsField>
        <LsField label="确认新密码" for-id="recovery-confirmation" required>
          <LsInput id="recovery-confirmation" v-model="confirmation" type="password" autocomplete="new-password" :disabled="busy" maxlength="32" />
        </LsField>
      </template>
      <template v-else>
        <LsField label="新手机号" for-id="recovery-new-phone" required>
          <LsInput id="recovery-new-phone" v-model="newPhone" type="tel" inputmode="tel" autocomplete="tel" :disabled="busy" placeholder="请输入新的手机号码" />
        </LsField>
        <SmsCodeField id="recovery-new-code" v-model="newCode" :phone="newPhone" purpose="recovery" :send-code="sendPhoneCode" :disabled="loading" @sending="sending = $event" @failed="handleSmsError" />
      </template>
      <LsButton type="submit" :loading="loading" :disabled="busy">{{ step === 'password' ? '保存新密码' : '确认换绑' }}</LsButton>
      <LsButton variant="secondary" :disabled="busy" @click="step = 'choose'; error = ''">选择其他恢复方式</LsButton>
    </form>
    <LsButton v-if="token" class="reverify" variant="ghost" :disabled="busy" @click="resetVerification()">重新验证当前手机号</LsButton>
    <p v-if="step === 'done'" role="status">你可以使用新的账号信息登录。</p>
    <p class="back"><RouterLink id="recovery-login" :to="loginTarget">返回登录</RouterLink></p>
  </AccountFlowPage>
</template>

<style scoped>
.recovery-progress{display:flex;flex-wrap:wrap;gap:.75rem 1.5rem;list-style:none;padding:0 0 1rem;margin:0;border-bottom:1px solid var(--line);color:var(--muted-ink);font-size:.875rem}.recovery-progress [aria-current]{color:var(--ink);font-weight:700}
.form { display: grid; gap: 1.25rem; }
.error { padding: .75rem .85rem; border-radius: 8px; font-size: .875rem; color: var(--danger); background: color-mix(in oklch, var(--danger), var(--surface) 93%); }
.reverify { width: 100%; margin-top: 1rem; }
.back { margin: 1.5rem 0 0; text-align: center; }
.back a { display: inline-flex; align-items: center; min-height: 44px; color: var(--sky-lost-strong); font-weight: 700; }
</style>
