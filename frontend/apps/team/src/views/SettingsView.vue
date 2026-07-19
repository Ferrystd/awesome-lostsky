<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NInput, NInputNumber, NRadio, NRadioGroup, NSelect, NSwitch } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import AdminPageHeader from '../components/AdminPageHeader.vue'

type SettingValue = string | number | boolean

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
const values = reactive<Record<string, Record<string, SettingValue>>>({})
const savedApp = ref('')
const query = useQuery({
  queryKey: ['settings', 'schema'],
  queryFn: () => api.get<SettingSchema>('/setting/schema'),
})
const apps = computed(() => query.data.value?.apps ?? [])

watch(apps, (groups) => {
  Object.keys(values).forEach(key => delete values[key])
  groups.forEach((group) => {
    values[group.app_name] = Object.fromEntries(group.settings.map(setting => [setting.key, setting.value]))
  })
}, { immediate: true })

const save = useMutation({
  mutationFn: (app: SettingApp) => api.post('/setting', {
    app_name: app.app_name,
    settings: { ...values[app.app_name] },
  }),
  onMutate: () => { savedApp.value = '' },
  onSuccess: async (_, app) => {
    savedApp.value = app.app_name
    await client.invalidateQueries({ queryKey: ['settings', 'schema'] })
  },
})

function settingValue(appName: string, setting: SettingField): SettingValue {
  return values[appName]?.[setting.key] ?? setting.default
}

function setSettingValue(appName: string, key: string, value: SettingValue | null): void {
  if (value !== null && values[appName]) values[appName][key] = value
}

function choiceValue(appName: string, setting: SettingField): string | number {
  const value = settingValue(appName, setting)
  return typeof value === 'boolean' ? String(Number(value)) : value
}

function isSaving(appName: string): boolean {
  return save.isPending.value && save.variables.value?.app_name === appName
}
</script>

<template>
  <div class="settings-view">
    <AdminPageHeader
      title="团队设置"
      description="配置团队级行为。设置项、输入类型和可选值均由服务端统一定义。"
    />

    <p v-if="query.isError.value" class="feedback error" role="alert">
      {{ friendlyError(query.error.value) }}
    </p>
    <div v-else-if="query.isPending.value" class="loading-panel" role="status">正在加载团队设置…</div>
    <div v-else-if="!apps.length" class="empty-panel">
      <h2>当前没有可配置项</h2>
      <p>应用登记团队设置后会自动显示在这里。</p>
    </div>

    <template v-else>
      <form
        v-for="app in apps"
        :key="app.app_name"
        class="settings-panel"
        @submit.prevent="save.mutate(app)"
      >
      <header class="panel-heading">
        <div>
          <p>{{ app.app_name.toUpperCase() }}</p>
          <h2>{{ app.label }}</h2>
          <span>{{ app.description }}</span>
        </div>
        <LsButton type="submit" :loading="isSaving(app.app_name)" :disabled="save.isPending.value">
          保存{{ app.label }}设置
        </LsButton>
      </header>

      <section
        v-for="setting in app.settings"
        :key="setting.key"
        :class="['setting-row', { 'setting-row--stacked': setting.control === 'radio' }]"
      >
        <div class="setting-copy">
          <h3>{{ setting.label }}</h3>
          <p>{{ setting.description }}</p>
          <code>{{ app.app_name }}.{{ setting.key }}</code>
        </div>

        <NSwitch
          v-if="setting.control === 'switch'"
          :value="Boolean(settingValue(app.app_name, setting))"
          :aria-label="setting.label"
          @update:value="setSettingValue(app.app_name, setting.key, $event)"
        />

        <NRadioGroup
          v-else-if="setting.control === 'radio'"
          :value="choiceValue(app.app_name, setting)"
          :aria-label="setting.label"
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
          @update:value="setSettingValue(app.app_name, setting.key, $event)"
        />

        <NInputNumber
          v-else-if="setting.control === 'number'"
          :value="Number(settingValue(app.app_name, setting))"
          :min="setting.min"
          :max="setting.max"
          :step="setting.step"
          :aria-label="setting.label"
          @update:value="setSettingValue(app.app_name, setting.key, $event)"
        />

        <NInput
          v-else
          :value="String(settingValue(app.app_name, setting))"
          :maxlength="setting.max_length"
          :aria-label="setting.label"
          @update:value="setSettingValue(app.app_name, setting.key, $event)"
        />
      </section>

      <p
        v-if="save.isError.value && save.variables.value?.app_name === app.app_name"
        class="feedback error"
        role="alert"
      >
        {{ friendlyError(save.error.value) }}
      </p>
      <p v-if="savedApp === app.app_name" class="feedback success" role="status">
        {{ app.label }}设置已保存。
      </p>
      </form>
    </template>
  </div>
</template>

<style scoped>
.settings-view{display:grid;gap:1.5rem}.settings-panel,.loading-panel,.empty-panel{border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--surface);overflow:hidden}
.panel-heading{display:flex;align-items:center;justify-content:space-between;gap:1.5rem;padding:1.4rem;border-bottom:1px solid var(--border)}
.panel-heading p,.panel-heading h2,.panel-heading span,.setting-copy h3,.setting-copy p{margin:0}
.panel-heading p{margin-bottom:.25rem;color:var(--primary);font-size:.7rem;font-weight:800;letter-spacing:.13em}
.panel-heading h2{font-size:1.08rem}
.panel-heading span{display:block;max-width:38rem;margin-top:.35rem;color:var(--text-secondary);font-size:.82rem;line-height:1.55}
.setting-row{min-height:88px;display:grid;grid-template-columns:minmax(0,1fr) minmax(220px,320px);align-items:center;gap:1.5rem;padding:1.15rem 1.4rem;border-bottom:1px solid var(--border)}
.setting-row:last-of-type{border-bottom:0}.setting-row--stacked{grid-template-columns:1fr;align-items:start}
.setting-copy h3{font-size:.92rem}.setting-copy p{margin-top:.3rem;color:var(--text-secondary);font-size:.8rem;line-height:1.55}
.setting-copy code{display:inline-block;margin-top:.35rem;color:var(--primary);font-size:.7rem}
.setting-row>.n-switch{justify-self:end}.setting-row>.n-radio-group{width:100%}
.radio-options{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:.65rem}
.radio-options :deep(.n-radio){min-height:68px;display:flex;align-items:flex-start;padding:.85rem;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--surface);transition:border-color .18s ease,background-color .18s ease}
.radio-options :deep(.n-radio:hover),.radio-options :deep(.n-radio--checked){border-color:var(--primary);background:color-mix(in srgb,var(--primary) 6%,var(--surface))}
.radio-copy strong,.radio-copy small{display:block}.radio-copy strong{font-size:.86rem}.radio-copy small{margin-top:.25rem;color:var(--text-secondary);font-size:.75rem;line-height:1.45}
.feedback{margin:1rem 1.4rem;padding:.75rem .85rem;border-radius:var(--radius-md)}
.error{color:var(--danger);background:color-mix(in srgb,var(--danger) 9%,transparent)}
.success{color:var(--success);background:color-mix(in srgb,var(--success) 9%,transparent)}
.loading-panel,.empty-panel{padding:2rem;color:var(--text-secondary)}.empty-panel h2{margin:0;color:var(--text);font-size:1rem}.empty-panel p{margin:.4rem 0 0}
@media(max-width:640px){.panel-heading{align-items:flex-start;flex-direction:column;padding:1rem}.panel-heading :deep(button){width:100%}.setting-row{grid-template-columns:1fr;gap:.85rem;padding:1rem}.setting-row>.n-switch{justify-self:start}.radio-options{grid-template-columns:1fr}}
</style>
