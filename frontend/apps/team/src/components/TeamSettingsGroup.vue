<script setup lang="ts">
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsRadioGroupField from '@lostsky/ui/components/LsRadioGroupField.vue'
import LsSwitch from '@lostsky/ui/components/LsSwitch.vue'
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
  <LsPanel :aria-labelledby="`settings-${app.app_name}`">
    <template #header>
        <LsSectionHeader :id="`settings-${app.app_name}`" :title="app.label" :description="app.description" />
    </template>
    <form class="settings-form" @submit.prevent="!disabled && emit('submit')">
      <section
        v-for="setting in app.settings"
        :key="setting.key"
        :class="['setting-row', { 'setting-row--choices': setting.control === 'radio', 'setting-row--switch': setting.control === 'switch' }]"
      >
        <div v-if="setting.control !== 'radio'" class="setting-copy">
          <h3 :id="`${settingId(app.app_name, setting.key)}-label`">{{ setting.label }}</h3>
          <p :id="`${settingId(app.app_name, setting.key)}-description`">{{ setting.description }}</p>
        </div>

        <div :class="['setting-control', { 'setting-control--choices': setting.control === 'radio' }]">
          <LsSwitch
            v-if="setting.control === 'switch'"
            :model-value="Boolean(settingValue(setting))"
            :aria-labelledby="`${settingId(app.app_name, setting.key)}-label`"
            :aria-describedby="`${settingId(app.app_name, setting.key)}-description`"
            :disabled="switchDisabled(setting)"
            :disabled-reason="abilityDisabledReason(setting)"
            @update:model-value="emit('update', setting.key, $event)"
          />

          <LsRadioGroupField
            v-else-if="setting.control === 'radio'"
            :id="settingId(app.app_name, setting.key)"
            :model-value="choiceValue(setting)"
            :label="setting.label"
            :hint="setting.description"
            :options="setting.options ?? []"
            :disabled="restricted"
            @update:model-value="emit('update', setting.key, $event)"
          />

          <NSelect
            v-else-if="setting.control === 'select'"
            :value="choiceValue(setting)"
            :options="setting.options ?? []"
            :aria-label="setting.label"
            :aria-describedby="`${settingId(app.app_name, setting.key)}-description`"
            @update:value="emit('update', setting.key, $event)"
          />

          <NInputNumber
            v-else-if="setting.control === 'number'"
            :value="settingValue(setting) === null ? null : Number(settingValue(setting))"
            :clearable="setting.nullable === true"
            :precision="0"
            :min="setting.min"
            :max="setting.max"
            :step="setting.step"
            :input-props="{
              'aria-label': setting.label,
              'aria-describedby': `${settingId(app.app_name, setting.key)}-description`,
            }"
            @update:value="emit('update', setting.key, $event)"
          />

          <NInput
            v-else
            :value="String(settingValue(setting))"
            :maxlength="setting.max_length"
            :input-props="{
              'aria-label': setting.label,
              'aria-describedby': `${settingId(app.app_name, setting.key)}-description`,
            }"
            @update:value="emit('update', setting.key, $event)"
          />
        </div>
      </section>

    <div class="settings-feedback" v-if="error || saved">
      <LsInlineError
        v-if="error"
        :message="error"
      />
      <p v-if="saved" class="feedback success" role="status">
        {{ app.label }}设置已保存。
      </p>
    </div>
    <LsFormActions><SettingsSaveButton :loading="loading" :disabled="disabled">保存{{ app.label }}设置</SettingsSaveButton></LsFormActions>
    </form>
  </LsPanel>
</template>

<style scoped>

.settings-form { display: grid; min-width: 0; margin: 0; gap: 1.75rem; }
.setting-row { display: grid; min-width: 0; gap: .75rem; }
.setting-row--switch { grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 1rem; }
.setting-row--choices { margin-top: .25rem; }
.setting-copy { min-width: 0; }
.setting-copy h3, .setting-copy p { margin: 0; overflow-wrap: anywhere; }
.setting-copy h3 { font-size: .9375rem; line-height: 1.5; }
.setting-copy p { margin-top: .25rem; color: var(--text-secondary); font-size: .875rem; line-height: 1.5; }
.setting-control { min-width: 0; }
.settings-feedback { display: grid; gap: 1rem; }
.feedback { margin: 0; font-size: .875rem; line-height: 1.5; overflow-wrap: anywhere; }
.success { color: var(--success); }
@media (max-width: 639px) {
  .settings-form { gap: 1.5rem; }
}
</style>
