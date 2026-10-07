<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsInput from '@lostsky/ui/components/LsInput.vue'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { SmsDelivery } from '@lostsky/api/recovery'

const props = withDefaults(defineProps<{
  phone: string
  purpose: 'register' | 'login' | 'recovery'
  disabled?: boolean
  sendCode?: (phone: string) => Promise<SmsDelivery>
  id?: string
}>(), { id: 'sms-code' })

const emit = defineEmits<{ sending: [value: boolean]; failed: [reason: unknown] }>()
const code = defineModel<string>({ required: true })
const sending = ref(false)
const cooldown = ref(0)
const message = ref('')
const error = ref('')
let generation = 0
let disposed = false
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

watch(() => props.phone.trim(), () => {
  generation += 1
  code.value = ''
  message.value = ''
  error.value = ''
})

async function send() {
  if (sending.value || props.disabled || cooldown.value > 0) return
  const currentGeneration = generation
  error.value = ''
  message.value = ''
  if (!phoneValid.value) {
    error.value = '请先输入正确的手机号码'
    return
  }

  sending.value = true
  emit('sending', true)
  try {
    const result = props.sendCode ? await props.sendCode(props.phone.trim()) : await api.post<SmsDelivery>('/verification/sms', {
      phone: props.phone.trim(),
      purpose: props.purpose,
    })
    if (disposed) return
    startCountdown(result.retry_after)
    if (generation !== currentGeneration) return
    message.value = result.debug_bypass
      ? '开发调试已跳过短信发送，输入任意内容即可继续。'
      : '验证码已发送，请注意查收。'
  } catch (reason) {
    if (generation === currentGeneration) {
      error.value = friendlyError(reason)
      emit('failed', reason)
    }
  } finally {
    sending.value = false
    emit('sending', false)
  }
}

onBeforeUnmount(() => {
  disposed = true
  generation += 1
  if (timer) clearInterval(timer)
})
</script>

<template>
  <LsField label="短信验证码" :for-id="id" required>
    <div class="code-row">
      <LsInput
        :id="id"
        v-model="code"
        :disabled="disabled"
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
        :disabled="disabled || sending || !phoneValid || cooldown > 0"
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
