import type { RedemptionField, ServiceRedemptionFieldDraft, ServiceRedemptionFieldInput } from './types'

let draftSequence = 0

export function createServiceRedemptionFieldDraft(): ServiceRedemptionFieldDraft {
  const sequence = ++draftSequence
  return {
    key: `new-${sequence}`,
    name: '',
    value_type: 'string',
    input_type: 'text',
    options_text: '',
    fill_stage: 'manager',
    is_customer_visible: 1,
    is_required: 0,
    is_active: 1,
    sort: 0,
  }
}

export function hydrateServiceRedemptionFields(fields: RedemptionField[] = []): ServiceRedemptionFieldDraft[] {
  return fields.map(field => ({
    key: `field-${field.id}`,
    id: field.id,
    name: field.name,
    value_type: field.value_type,
    input_type: field.input_type,
    options_text: Array.isArray(field.options) ? field.options.join('\n') : '',
    fill_stage: field.fill_stage,
    is_customer_visible: field.is_customer_visible,
    is_required: field.is_required,
    is_active: field.is_active,
    sort: field.sort,
  }))
}

export function serializeServiceRedemptionFields(fields: ServiceRedemptionFieldDraft[]): ServiceRedemptionFieldInput[] {
  return fields.map((field, index) => ({
    ...(field.id ? { id: field.id } : {}),
    name: field.name.trim(),
    value_type: field.value_type,
    input_type: field.input_type,
    options: field.options_text.split(/\r?\n|,/).map(value => value.trim()).filter(Boolean),
    fill_stage: field.fill_stage,
    is_customer_visible: field.is_customer_visible,
    is_required: field.is_required,
    is_active: field.is_active,
    sort: index,
  }))
}

export function validServiceRedemptionFields(fields: ServiceRedemptionFieldDraft[]): boolean {
  const names = fields.map(field => field.name.trim().toLocaleLowerCase())
  return fields.length <= 50
    && names.every(Boolean)
    && new Set(names).size === names.length
}
