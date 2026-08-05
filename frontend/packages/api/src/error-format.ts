import { ERROR_MESSAGES } from './error-messages'

function renderTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{(permission|permissions|key|keyTitle|label)\}/g, (placeholder, key: string) => (
    Object.hasOwn(values, key) ? values[key] : placeholder
  ))
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
