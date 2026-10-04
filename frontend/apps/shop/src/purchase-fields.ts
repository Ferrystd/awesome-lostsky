import type { components } from '@lostsky/api/generated/shop'
import type { ServiceRedemptionFieldDraft } from './types'

export type PurchaseField = components['schemas']['ProductPurchaseField']
export type PurchaseFieldInput = components['schemas']['ProductPurchaseFieldInput']
export type OrderPurchaseField = components['schemas']['OrderPurchaseField']
export type PurchaseFieldDraft = ServiceRedemptionFieldDraft & { default_value?: unknown }

export function hydratePurchaseFields(fields: PurchaseFieldInput[] = []): PurchaseFieldDraft[] {
  return fields.map((field, index) => ({
    key: `purchase-${field.id ?? index}`, id: field.id, name: field.name,
    value_type: field.value_type ?? 'string', input_type: field.input_type ?? 'text',
    options_text: (field.options ?? []).join('\n'), default_value: field.default_value,
    is_required: field.is_required ?? 0, sort: index, fill_stage: 'customer', is_customer_visible: 1, is_active: 1,
  }))
}

export function serializePurchaseFields(fields: PurchaseFieldDraft[]): PurchaseFieldInput[] {
  return fields.map(field => ({
    ...(field.id ? { id: field.id } : {}), name: field.name.trim(),
    value_type: field.value_type as PurchaseFieldInput['value_type'], input_type: field.input_type as PurchaseFieldInput['input_type'],
    options: field.options_text.split('\n').map(value => value.trim()).filter(Boolean),
    default_value: field.default_value, is_required: field.is_required,
  }))
}

export function validPurchaseFields(fields: PurchaseFieldInput[]): boolean {
  const names = fields.map(field => field.name.trim().toLocaleLowerCase())
  return names.every(name => name.length > 0) && new Set(names).size === names.length
    && fields.every(field => !['select', 'multi_select'].includes(field.value_type ?? '') || Boolean(field.options?.length))
}

export const purchaseInputFields = (fields: PurchaseField[]) => fields.map(field => ({ ...field, fill_stage: 'customer' as const }))
const empty = (value: unknown) => value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)
export function purchaseDefaults(fields: PurchaseField[]): Record<number, unknown> {
  return Object.fromEntries(fields.filter(field => !empty(field.default_value)).map(field => {
    let value = field.default_value
    if (['int', 'decimal', 'bool'].includes(field.value_type)) value = Number(value)
    if (['date', 'datetime'].includes(field.value_type)) value = typeof value === 'number' ? value * 1000 : Date.parse(String(value))
    if (field.value_type === 'json' && typeof value !== 'string') value = JSON.stringify(value)
    return [field.id, value]
  }))
}
export function reconcilePurchaseValues(fields: PurchaseField[], values: Record<number, unknown>): Record<number, unknown> {
  const defaults = purchaseDefaults(fields)
  return Object.fromEntries(fields.flatMap(field => Object.prototype.hasOwnProperty.call(values, field.id)
    ? [[field.id, values[field.id]]]
    : Object.prototype.hasOwnProperty.call(defaults, field.id) ? [[field.id, defaults[field.id]]] : []))
}
export const purchaseValuesValid = (fields: PurchaseField[], values: Record<number, unknown>) => fields.every(field => {
  const value = values[field.id]
  if (empty(value)) return !field.is_required
  if (field.value_type === 'select') return field.options.includes(String(value))
  if (field.value_type === 'multi_select') return Array.isArray(value) && value.every(item => field.options.includes(String(item)))
  if (field.value_type === 'int') return (typeof value === 'number' || typeof value === 'string') && Number.isSafeInteger(Number(value))
  if (field.value_type === 'decimal') return (typeof value === 'number' || typeof value === 'string') && Number.isFinite(Number(value))
  if (field.value_type === 'bool') return [0, 1, '0', '1', false, true].includes(value as number)
  if (['date', 'datetime'].includes(field.value_type)) return typeof value === 'number' && Number.isFinite(value)
  if (field.value_type === 'json') {
    try { JSON.parse(String(value)); return true } catch { return false }
  }
  return typeof value === 'string'
})
export function serializePurchaseValues(fields: PurchaseField[], values: Record<number, unknown>) {
  return Object.fromEntries(fields.filter(field => Object.prototype.hasOwnProperty.call(values, field.id)).map(field => {
    const value = values[field.id]
    return [field.id, ['date', 'datetime'].includes(field.value_type) && typeof value === 'number' ? Math.floor(value / 1000) : value]
  }))
}
export function formatPurchaseValue(field: OrderPurchaseField): string {
  if (empty(field.value)) return '未填写'
  if (field.value_type === 'bool') return Number(field.value) ? '是' : '否'
  if (['date', 'datetime'].includes(field.value_type)) {
    const date = new Date(typeof field.value === 'number' ? field.value * 1000 : String(field.value))
    return Number.isNaN(date.getTime()) ? String(field.value) : date.toLocaleString('zh-CN')
  }
  return typeof field.value === 'object' ? JSON.stringify(field.value) : String(field.value)
}
