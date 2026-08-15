import type { PublicField } from './types'

export function entityTypeLabel(type: string) {
  return type === 'teamVirtual' ? '虚拟实体（Virtual Entity）' : type === 'teamMember' ? '成员' : '团队'
}

export function formatMoney(value: string | number) {
  return `¥${Number(value).toFixed(2)}`
}

function optionLabel(options: unknown[] | null | undefined, value: unknown) {
  const found = options?.find((item) => {
    if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>
      return String(record.value ?? record.label ?? record.name ?? '') === String(value)
    }
    return String(item) === String(value)
  })
  if (found && typeof found === 'object') {
    const record = found as Record<string, unknown>
    return String(record.label ?? record.name ?? record.value ?? value)
  }
  return found == null ? String(value) : String(found)
}

export function formatPublicField(field: PublicField) {
  const value = field.value
  if (field.value_type === 'bool') return Number(value) ? '是' : '否'
  if (field.value_type === 'date' || field.value_type === 'datetime') {
    const date = new Date(Number(value) * 1000)
    if (Number.isNaN(date.getTime())) return String(value)
    return new Intl.DateTimeFormat('zh-CN', field.value_type === 'date'
      ? { year: 'numeric', month: '2-digit', day: '2-digit' }
      : { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
    ).format(date)
  }
  if (field.value_type === 'select') return optionLabel(field.options, value)
  if (field.value_type === 'multi_select' && Array.isArray(value)) {
    return value.map(item => optionLabel(field.options, item)).join('、')
  }
  if (field.value_type === 'json') {
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  }
  return Array.isArray(value) ? value.join('、') : String(value)
}
