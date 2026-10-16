<script setup lang="ts">
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsRadioGroupField from '@lostsky/ui/components/LsRadioGroupField.vue'
import LsSwitchField from '@lostsky/ui/components/LsSwitchField.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormFields from '@lostsky/ui/components/LsFormFields.vue'
import LsFormContent from '@lostsky/ui/components/LsFormContent.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import SettingsSaveButton from '../views/settings/SettingsSaveButton.vue'
import { NInput, NInputNumber, NSelect } from 'naive-ui'
import { abilityReason } from '../lib/teamAccessReason'
import type { SettingApp, SettingField, SettingValue } from '../views/settings/types'

const props = defineProps<{
  app: SettingApp
  values: Record<string, SettingValue>
  loading: boolean
  disabled: boolean
  saved: boolean
  error: string
  restricted: boolean
}>()
const emit = defineEmits<{
  update: [key: string, value: SettingValue]
  submit: []
}>()
function settingValue(setting: SettingField): SettingValue {
  return props.values[setting.key] === undefined ? setting.default : props.values[setting.key]
}
function choiceValue(setting: SettingField): string | number | null {
  const value = settingValue(setting)
  return typeof value === 'boolean' ? String(Number(value)) : value
}
function settingId(appName: string, key: string): string {
  return `setting-${appName}-${key}`
}

function abilityDisabledReason(setting: SettingField): string {
  const requirement = setting.ability_requirement
  if (!requirement || requirement.satisfied) return ''
  const base = abilityReason(requirement.key, requirement.label)
  if (requirement.reason === 'expired') return `${base}（当前授权已过期）`
  if (requirement.reason === 'level') return `${base}（需要等级 ${requirement.minimum_level}）`
  return base
}

function switchDisabled(setting: SettingField): boolean {
  return Boolean(abilityDisabledReason(setting)) && !Boolean(settingValue(setting))
}
</script>

<template>
  <LsPanel class="settings-panel" :aria-labelledby="`settings-${app.app_name}`">
    <template #header>
        <LsSectionHeader :id="`settings-${app.app_name}`" :title="app.label" :description="app.description" />
    </template>
    <form class="settings-form" @submit.prevent="!disabled && emit('submit')">
      <LsFormFields>
      <section v-for="setting in app.settings" :key="setting.key" :class="['setting-row', { 'setting-row--choices': setting.control === 'radio', 'setting-row--switch': setting.control === 'switch' }]">
        <LsFormContent v-if="setting.control === 'radio'">
          <LsRadioGroupField :id="settingId(app.app_name, setting.key)" :model-value="choiceValue(setting)" :label="setting.label" :hint="setting.description" :options="setting.options ?? []" :disabled="restricted" @update:model-value="emit('update', setting.key, $event)" />
        </LsFormContent>
        <LsSwitchField v-else-if="setting.control === 'switch'" :id="settingId(app.app_name, setting.key)" :model-value="Boolean(settingValue(setting))" :label="setting.label" :description="setting.description" :disabled="switchDisabled(setting)" :disabled-reason="abilityDisabledReason(setting)" @update:model-value="emit('update', setting.key, $event)" />
        <LsField v-else :label="setting.label" :for-id="settingId(app.app_name, setting.key)" :hint="setting.description" v-slot="{ describedBy }">
          <div class="setting-control">
          <NSelect v-if="setting.control === 'select'" :id="settingId(app.app_name, setting.key)" :value="choiceValue(setting)" :options="setting.options ?? []" :aria-label="setting.label" :aria-describedby="describedBy" :input-props="{ id: settingId(app.app_name, setting.key), 'aria-label': setting.label, 'aria-describedby': describedBy }" @update:value="emit('update', setting.key, $event)" />
          <NInputNumber v-else-if="setting.control === 'number'" :value="settingValue(setting) === null ? null : Number(settingValue(setting))" :clearable="setting.nullable === true" :precision="0" :min="setting.min" :max="setting.max" :step="setting.step" :input-props="{ id: settingId(app.app_name, setting.key), 'aria-label': setting.label, 'aria-describedby': describedBy }" @update:value="emit('update', setting.key, $event)" />
          <NInput v-else :value="String(settingValue(setting))" :maxlength="setting.max_length" :input-props="{ id: settingId(app.app_name, setting.key), 'aria-label': setting.label, 'aria-describedby': describedBy }" @update:value="emit('update', setting.key, $event)" />
          </div>
        </LsField>
      </section>
      </LsFormFields>

    <div class="settings-feedback" v-if="error || saved">
      <LsInlineError
        v-if="error"
        :message="error"
      />
      <p v-if="saved" class="feedback success" role="status">
        {{ app.label }}设置已保存。
      </p>
    </div>
    <div class="settings-actions"><LsFormActions><SettingsSaveButton :loading="loading" :disabled="disabled">保存{{ app.label }}设置</SettingsSaveButton></LsFormActions></div>
    </form>
  </LsPanel>
</template>

<style scoped>

.settings-form { display: grid; min-width: 0; margin: 0; }
.setting-row, .setting-control { min-width: 0; }
.settings-feedback { display: grid; gap: 1rem; padding: 1rem .25rem 0; }
.settings-actions { margin: 1rem .25rem .25rem; }
.feedback { margin: 0; font-size: .875rem; line-height: 1.5; overflow-wrap: anywhere; }
.success { color: var(--success); }
@media (max-width: 639px) {
  .settings-feedback { padding-inline: 0; }
  .settings-actions { margin-inline: 0; margin-bottom: 0; }
}
@container team-category-layout (min-width: 48rem) {
  .settings-panel { display: grid; grid-template-rows: auto 1fr; min-height: 520px; }
  .settings-form { display: flex; flex-direction: column; height: 100%; }
  .setting-row, .settings-feedback, .settings-actions { flex-shrink: 0; }
  .settings-actions { margin-top: auto; padding-top: 1rem; }
}
</style>
