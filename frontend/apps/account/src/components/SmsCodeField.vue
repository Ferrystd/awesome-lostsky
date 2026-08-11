<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsInput from '@lostsky/ui/components/LsInput.vue'
import { computed, onBeforeUnmount, ref } from 'vue'

const props = withDefaults(defineProps<{
  phone: string
  purpose: 'register' | 'login'
  id?: string
}>(), { id: 'sms-code' })

const code = defineModel<string>({ required: true })
const sending = ref(false)
const cooldown = ref(0)
const message = ref('')
const error = ref('')
let timer: ReturnType<typeof setInterval> | undefined

const phoneValid = computed(() => /^1[3-9]\d{9}$/.test(props.phone.trim()))
const buttonText = computed(() => cooldown.value > 0 ? `${cooldown.value} 秒后重发` : '获取验证码')

function startCountdown(seconds: number) {
  if (timer) clearInterval(timer)
  cooldown.value = Math.max(0, seconds)
  if (cooldown.value === 0) return
  timer = setInterval(() => {
    cooldown.value -= 1
    if (cooldown.value <= 0 && timer) {
      clearInterval(timer)
      timer = undefined
    }
  }, 1000)
}

async function send() {
  error.value = ''
  message.value = ''
  if (!phoneValid.value) {
    error.value = '请先输入正确的手机号码'
    return
  }

  sending.value = true
  try {
    const result = await api.post<{ retry_after: number; debug_bypass?: boolean }>('/verification/sms', {
      phone: props.phone.trim(),
      purpose: props.purpose,
    })
    startCountdown(result.retry_after)
    message.value = result.debug_bypass
      ? '开发调试已跳过短信发送，输入任意内容即可继续。'
      : '验证码已发送，请注意查收。'
  } catch (reason) {
    error.value = friendlyError(reason)
  } finally {
    sending.value = false
  }
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <LsField label="短信验证码" :for-id="id" required>
    <div class="code-row">
      <LsInput
        :id="id"
        v-model="code"
        type="text"
        inputmode="numeric"
        autocomplete="one-time-code"
        maxlength="8"
        placeholder="请输入验证码"
      />
      <LsButton
        class="code-submit"
        variant="secondary"
        :loading="sending"
        :disabled="!phoneValid || cooldown > 0"
        :aria-label="buttonText"
        @click="send"
      >
        {{ buttonText }}
      </LsButton>
    </div>
    <p v-if="message" class="field-message" role="status">{{ message }}</p>
    <p v-if="error" class="field-error" role="alert">{{ error }}</p>
  </LsField>
</template>

<style scoped>
.code-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-auto-rows: var(--control-md); align-items: center; gap: .65rem; }
.code-submit { min-width: 7.5rem; white-space: nowrap; }
.field-message, .field-error { margin: .5rem 0 0; font-size: .82rem; }
.field-message { color: var(--sky-lost-strong); }
.field-error { color: var(--danger); }
@media (max-width: 360px) {
  .code-row { grid-template-columns: 1fr; }
  .code-submit { width: 100%; }
}
</style>
