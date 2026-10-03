<script setup lang="ts">
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import { KeyRound } from '@lucide/vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsSwitch from '@lostsky/ui/components/LsSwitch.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NInput, NInputNumber, NRadio, NRadioGroup, NSelect } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import { abilityReason } from '../lib/teamAccessReason'
import SettingsSaveButton from './settings/SettingsSaveButton.vue'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'

type SettingValue = string | number | boolean | null

interface SettingOption extends SelectOption {
  value: string | number
  label: string
  description?: string
}

interface SettingField {
  key: string
  label: string
  description: string
  type: 'boolean' | 'integer' | 'enum' | 'string'
  control: 'switch' | 'radio' | 'select' | 'number' | 'input'
  order: number
  default: SettingValue
  value: SettingValue
  options?: SettingOption[]
  min?: number
  max?: number
  step?: number
  max_length?: number
  nullable?: boolean
  ability_requirement?: {
    key: string
    label: string
    minimum_level: number
    satisfied: boolean
    reason: 'missing' | 'level' | 'expired' | null
  }
}

interface SettingApp {
  app_name: string
  label: string
  description: string
  order: number
  settings: SettingField[]
}

interface SettingSchema {
  apps: SettingApp[]
}

const client = useQueryClient()
const routeAccess = useRouteAccess()
const values = reactive<Record<string, Record<string, SettingValue>>>({})
const baselines = reactive<Record<string, string>>({})
const appDirty = (appName: string) => JSON.stringify(values[appName]) !== baselines[appName]
useUnsavedChangesGuard(computed(() => Object.keys(values).some(appDirty)))
const savedApp = ref('')
const query = useQuery({
  queryKey: ['settings', 'schema'],
  queryFn: () => api.get<SettingSchema>('/setting/schema'),
  enabled: computed(() => !routeAccess.restricted.value),
})
const apps = computed(() => query.data.value?.apps ?? [])

watch(apps, (groups) => {
  groups.forEach((group) => {
    if (values[group.app_name] && appDirty(group.app_name)) return
    values[group.app_name] = Object.fromEntries(group.settings.map(setting => [setting.key, setting.value]))
    baselines[group.app_name] = JSON.stringify(values[group.app_name])
  })
}, { immediate: true })

const save = useMutation({
  mutationFn: async (app: SettingApp) => {
    if (!validApp(app)) throw new Error('请填写符合范围的整数；只有允许留空的设置可以清空。')
    const settings = { ...values[app.app_name] }
    await api.post('/setting', { app_name: app.app_name, settings })
    return JSON.stringify(settings)
  },
  onMutate: () => { savedApp.value = '' },
  onSuccess: async (submitted, app) => {
    baselines[app.app_name] = submitted
    savedApp.value = app.app_name
    await client.invalidateQueries({ queryKey: ['settings', 'schema'] })
  },
})

function settingValue(appName: string, setting: SettingField): SettingValue {
  return values[appName]?.[setting.key] === undefined ? setting.default : values[appName][setting.key]
}

function setSettingValue(appName: string, key: string, value: SettingValue | null): void {
  if (values[appName]) values[appName][key] = value
}

function validApp(app: SettingApp): boolean {
  return app.settings.every(setting => {
    const value = settingValue(app.app_name, setting)
    if (value === null) return setting.nullable === true
    if (setting.type !== 'integer') return true
    return typeof value === 'number' && Number.isSafeInteger(value)
      && (setting.min === undefined || value >= setting.min)
      && (setting.max === undefined || value <= setting.max)
  })
}

function choiceValue(appName: string, setting: SettingField): string | number | null {
  const value = settingValue(appName, setting)
  return typeof value === 'boolean' ? String(Number(value)) : value
}

function isSaving(appName: string): boolean {
  return save.isPending.value && save.variables.value?.app_name === appName
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

function switchDisabled(appName: string, setting: SettingField): boolean {
  return Boolean(abilityDisabledReason(setting)) && !Boolean(settingValue(appName, setting))
}
</script>

<template>
  <div class="settings-view">
    <AdminPageHeader
      title="团队设置"
      description="配置团队设置，以此更好的贴合贵团队的业务。"
    ><template #actions><LsPagePrimaryAction :icon="KeyRound" label="团队能力" to="/abilities" /></template></AdminPageHeader>

    <LsAsyncState v-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取团队设置" :description="friendlyError(query.error.value)" />
    <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="4" />
    <LsEmptyState :source="query.data.value" v-else-if="routeAccess.restricted.value || !apps.length" :title="routeAccess.restricted.value ? '没有可显示的团队设置' : '当前没有可配置项'" description="还没有可配置的设置项。" />

    <template v-else>
      <form
        v-for="app in apps"
        :key="app.app_name"
        class="settings-panel"
        @submit.prevent="!save.isPending.value && validApp(app) && appDirty(app.app_name) && save.mutate(app)"
      >
      <header class="settings-header">
        <LsSectionHeader :eyebrow="app.app_name.toUpperCase()" :title="app.label" :description="app.description">
          <template #aside><SettingsSaveButton :loading="isSaving(app.app_name)" :disabled="save.isPending.value || !validApp(app) || !appDirty(app.app_name)">保存{{ app.label }}设置</SettingsSaveButton></template>
        </LsSectionHeader>
      </header>

      <section
        v-for="setting in app.settings"
        :key="setting.key"
        :class="['setting-row', { 'setting-row--choices': setting.control === 'radio' }]"
      >
        <div class="setting-copy">
          <h3 :id="`${settingId(app.app_name, setting.key)}-label`">{{ setting.label }}</h3>
          <p :id="`${settingId(app.app_name, setting.key)}-description`">{{ setting.description }}</p>
          <code>{{ app.app_name }}.{{ setting.key }}</code>
        </div>

        <div :class="['setting-control', { 'setting-control--choices': setting.control === 'radio' }]">
          <LsSwitch
            v-if="setting.control === 'switch'"
            :model-value="Boolean(settingValue(app.app_name, setting))"
            :aria-labelledby="`${settingId(app.app_name, setting.key)}-label`"
            :aria-describedby="`${settingId(app.app_name, setting.key)}-description`"
            :disabled="switchDisabled(app.app_name, setting)"
            :disabled-reason="abilityDisabledReason(setting)"
            @update:model-value="setSettingValue(app.app_name, setting.key, $event)"
          />

          <NRadioGroup
            v-else-if="setting.control === 'radio'"
            :value="choiceValue(app.app_name, setting)"
            :aria-labelledby="`${settingId(app.app_name, setting.key)}-label`"
            :aria-describedby="`${settingId(app.app_name, setting.key)}-description`"
            @update:value="setSettingValue(app.app_name, setting.key, $event)"
          >
            <div class="radio-options">
              <NRadio v-for="option in setting.options ?? []" :key="String(option.value)" :value="option.value">
                <span class="radio-copy">
                  <strong>{{ option.label }}</strong>
                  <small v-if="option.description">{{ option.description }}</small>
                </span>
              </NRadio>
            </div>
          </NRadioGroup>

          <NSelect
            v-else-if="setting.control === 'select'"
            :value="choiceValue(app.app_name, setting)"
            :options="setting.options ?? []"
            :aria-label="setting.label"
            :aria-describedby="`${settingId(app.app_name, setting.key)}-description`"
            @update:value="setSettingValue(app.app_name, setting.key, $event)"
          />

          <NInputNumber
            v-else-if="setting.control === 'number'"
            :value="settingValue(app.app_name, setting) === null ? null : Number(settingValue(app.app_name, setting))"
            :clearable="setting.nullable === true"
            :precision="0"
            :min="setting.min"
            :max="setting.max"
            :step="setting.step"
            :input-props="{
              'aria-label': setting.label,
              'aria-describedby': `${settingId(app.app_name, setting.key)}-description`,
            }"
            @update:value="setSettingValue(app.app_name, setting.key, $event)"
          />

          <NInput
            v-else
            :value="String(settingValue(app.app_name, setting))"
            :maxlength="setting.max_length"
            :input-props="{
              'aria-label': setting.label,
              'aria-describedby': `${settingId(app.app_name, setting.key)}-description`,
            }"
            @update:value="setSettingValue(app.app_name, setting.key, $event)"
          />
        </div>
      </section>

      <LsInlineError
        v-if="save.isError.value && save.variables.value?.app_name === app.app_name"
        :message="friendlyError(save.error.value)"
      />
      <p v-if="savedApp === app.app_name" class="feedback success" role="status">
        {{ app.label }}设置已保存。
      </p>
      </form>
    </template>
  </div>
</template>

<style scoped>
.settings-view{display:grid;gap:1.5rem}.settings-panel,.loading-panel,.empty-panel{border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--surface);overflow:hidden}
.settings-header{padding:1rem;border-bottom:1px solid var(--border)}
.setting-copy h3,.setting-copy p{margin:0}
.setting-row{min-height:96px;display:grid;grid-template-columns:1fr;align-items:center;gap:.9rem;padding:1rem;border-bottom:1px solid var(--border)}
.setting-row:last-of-type{border-bottom:0}.setting-row--choices{align-items:start;gap:1rem}
.setting-copy h3{font-size:.92rem}.setting-copy p{margin-top:.3rem;color:var(--text-secondary);font-size:.8rem;line-height:1.55}
.setting-copy code{display:inline-block;margin-top:.35rem;color:var(--primary);font-size:.7rem}
.setting-control{width:100%;min-height:44px;display:flex;align-items:center;justify-content:flex-start}.setting-control--choices{display:block}
.setting-control>.n-input,.setting-control>.n-input-number,.setting-control>.n-select{width:100%}.setting-control>.n-radio-group{width:100%}
.radio-options{display:grid;grid-template-columns:1fr;gap:.75rem}
.radio-options :deep(.n-radio){min-height:80px;display:flex;align-items:flex-start;box-sizing:border-box;padding:1rem;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--surface);transition:border-color .18s ease,background-color .18s ease,box-shadow .18s ease}
.radio-options :deep(.n-radio:hover),.radio-options :deep(.n-radio--checked){border-color:var(--primary);background:color-mix(in srgb,var(--primary) 6%,var(--surface))}
.radio-options :deep(.n-radio:focus-within){border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 16%,transparent)}
.radio-copy{display:block;padding-right:.25rem}.radio-copy strong,.radio-copy small{display:block}.radio-copy strong{font-size:.86rem;line-height:1.4}.radio-copy small{margin-top:.3rem;color:var(--text-secondary);font-size:.75rem;line-height:1.5}
.feedback{margin:1rem 1.4rem;padding:.75rem .85rem;border-radius:var(--radius-md)}
.error{color:var(--danger);background:color-mix(in srgb,var(--danger) 9%,transparent)}
.success{color:var(--success);background:color-mix(in srgb,var(--success) 9%,transparent)}
.loading-panel,.empty-panel{padding:2rem;color:var(--text-secondary)}.empty-panel h2{margin:0;color:var(--text);font-size:1rem}.empty-panel p{margin:.4rem 0 0}
@media(min-width:641px){.settings-header{padding:1.5rem}.setting-row{grid-template-columns:minmax(0,1fr) minmax(220px,320px);gap:1.5rem;padding:1.25rem 1.5rem}.setting-row--choices{grid-template-columns:1fr}.setting-control{justify-content:flex-end}.radio-options{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}}
@media(prefers-reduced-motion:reduce){.radio-options :deep(.n-radio){transition:none}}
</style>
