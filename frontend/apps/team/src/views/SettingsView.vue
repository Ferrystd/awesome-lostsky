<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { KeyRound } from '@lucide/vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, reactive, ref, watch } from 'vue'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'

import TeamSettingsGroup from '../components/TeamSettingsGroup.vue'
import TeamSettingsCenter from '../components/TeamSettingsCenter.vue'
import type { SettingApp, SettingField, SettingSchema, SettingValue } from './settings/types'

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
const selected = ref('')
const currentApp = computed(() => apps.value.find(app => app.app_name === selected.value) ?? apps.value[0])
const navigationItems = computed(() => apps.value.map(app => ({ key: app.app_name, label: app.label, dirty: appDirty(app.app_name) })))

watch(apps, (groups) => {
  if (!groups.some(group => group.app_name === selected.value)) selected.value = groups[0]?.app_name ?? ''
  for (const key of Object.keys(values)) if (!groups.some(group => group.app_name === key)) {
    delete values[key]
    delete baselines[key]
  }
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
    if (!apps.value.some(group => group.app_name === app.app_name)) return
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

function isSaving(appName: string): boolean {
  return save.isPending.value && save.variables.value?.app_name === appName
}

</script>

<template>
  <div class="settings-view">
    <AdminPageHeader
      title="团队设置"
      description="按业务分类管理团队的运行方式。"
    ><template #actions><RouterLink class="settings-abilities" to="/abilities"><KeyRound :size="16" aria-hidden="true" />团队能力</RouterLink></template></AdminPageHeader>

    <LsAsyncState v-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取团队设置" :description="friendlyError(query.error.value)" />
    <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="4" />
    <LsEmptyState :source="query.data.value" v-else-if="routeAccess.restricted.value || !apps.length" :title="routeAccess.restricted.value ? '没有可显示的团队设置' : '当前没有可配置项'" description="还没有可配置的设置项。" />

    <TeamSettingsCenter v-else-if="currentApp" :items="navigationItems" :current="currentApp.app_name" @select="selected = $event">
      <TeamSettingsGroup
        :key="currentApp.app_name"
        :app="currentApp"
        :values="values[currentApp.app_name] ?? {}"
        :loading="isSaving(currentApp.app_name)"
        :disabled="save.isPending.value || !validApp(currentApp) || !appDirty(currentApp.app_name)"
        :saved="savedApp === currentApp.app_name && !appDirty(currentApp.app_name)"
        :error="save.isError.value && save.variables.value?.app_name === currentApp.app_name ? friendlyError(save.error.value) : ''"
        :restricted="routeAccess.restricted.value"
        @update="(key, value) => setSettingValue(currentApp!.app_name, key, value)"
        @submit="save.mutate(currentApp!)"
      />
    </TeamSettingsCenter>
  </div>
</template>

<style scoped>
.settings-view { min-width: 0; display: grid; gap: 1.5rem; }
.settings-abilities { min-height: 44px; display: inline-flex; align-items: center; gap: .5rem; color: var(--text-secondary); font-size: .875rem; text-decoration: none; }
.settings-abilities:hover { color: var(--primary); }
.settings-abilities:focus-visible { outline: 2px solid var(--primary); outline-offset: 4px; }
</style>
