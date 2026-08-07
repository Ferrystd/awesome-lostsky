import { ERROR_MESSAGES } from './error-messages'

function renderTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{(permission|permissions|app|key|keyTitle|setting|label|required|current)\}/g, (placeholder, key: string) => (
    Object.hasOwn(values, key) ? values[key] : placeholder
  ))
}

export type SettingValue = boolean | number | string
export type SettingRequirement =
  | { equals: SettingValue; min?: never; max?: never }
  | { equals?: never; min?: number; max?: number }

function formatSettingValue(value: SettingValue) {
  if (typeof value === 'boolean') return value ? '开启' : '关闭'
  return typeof value === 'string' ? `“${value}”` : String(value)
}

export function formatSettingDenied(
  appName: string,
  key: string,
  label: string,
  current: SettingValue,
  requirement: SettingRequirement,
) {
  const app = appName.trim()
  const settingKey = key.trim()
  const settingLabel = label.trim()
  if (!app || !settingKey || !settingLabel) return ''

  let required = ''
  let satisfied = false
  if (Object.hasOwn(requirement, 'equals')) {
    const expected = requirement.equals
    if (expected === undefined) return ''
    required = `设为${formatSettingValue(expected)}`
    satisfied = Object.is(current, expected)
  } else {
    const minimum = requirement.min
    const maximum = requirement.max
    if (minimum === undefined && maximum === undefined) return ''
    if ((minimum !== undefined && !Number.isFinite(minimum))
      || (maximum !== undefined && !Number.isFinite(maximum))
      || (minimum !== undefined && maximum !== undefined && minimum > maximum)) return ''

    if (minimum !== undefined && maximum !== undefined) required = `处于 ${minimum}–${maximum} 区间`
    else if (minimum !== undefined) required = `不小于 ${minimum}`
    else required = `不大于 ${maximum}`
    satisfied = typeof current === 'number'
      && (minimum === undefined || current >= minimum)
      && (maximum === undefined || current <= maximum)
  }
  if (satisfied) return ''

  const setting = `${app}.${settingKey}`
  const template = ERROR_MESSAGES.access.setting.overrides[setting]
    || ERROR_MESSAGES.access.setting.default
  return renderTemplate(template, {
    app,
    key: settingKey,
    setting,
    label: settingLabel,
    required,
    current: formatSettingValue(current),
  })
}

export function formatPermissionDenied(requiredAny: readonly string[]) {
  const permissions = [...new Set(requiredAny.map(permission => permission.trim()).filter(Boolean))]
  if (!permissions.length) return ''

  const permission = permissions.length === 1 ? permissions[0] : ''
  const template = permission
    ? ERROR_MESSAGES.access.permission.overrides[permission] || ERROR_MESSAGES.access.permission.default
    : ERROR_MESSAGES.access.permission.default

  return renderTemplate(template, {
    permission: permission || permissions.join(' / '),
    permissions: permissions.join(' / '),
  })
}

export function formatAbilityDenied(key: string, label: string) {
  const abilityKey = key.trim()
  const abilityLabel = label.trim()
  if (!abilityKey || !abilityLabel) return ''

  const template = ERROR_MESSAGES.access.ability.overrides[abilityKey]
    || ERROR_MESSAGES.access.ability.default
  return renderTemplate(template, {
    key: abilityKey,
    keyTitle: `${abilityKey.charAt(0).toUpperCase()}${abilityKey.slice(1)}`,
    label: abilityLabel,
  })
}

export function formatStructuredAccessError(data: unknown) {
  if (!data || typeof data !== 'object') return ''

  const kind = Reflect.get(data, 'kind')
  if (kind === 'permission') {
    const requiredAny = Reflect.get(data, 'required_any')
    return Array.isArray(requiredAny) && requiredAny.every(permission => typeof permission === 'string')
      ? formatPermissionDenied(requiredAny)
      : ''
  }
  if (kind === 'ability') {
    const key = Reflect.get(data, 'key')
    const label = Reflect.get(data, 'label')
    return typeof key === 'string' && typeof label === 'string'
      ? formatAbilityDenied(key, label)
      : ''
  }
  return ''
}
