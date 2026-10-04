import { describe, expect, it } from 'vitest'
import { purchaseValuesValid, reconcilePurchaseValues, serializePurchaseValues, type PurchaseField } from './purchase-fields'

const field = (id: number, patch: Partial<PurchaseField> = {}): PurchaseField => ({ id, name: `字段 ${id}`, value_type: 'string', input_type: 'text', options: [], is_required: 0, sort: id, ...patch })

describe('purchase draft schema refresh', () => {
  it('keeps existing input, including an intentionally cleared default, and initializes only new IDs', () => {
    const values = { 1: '本地草稿', 2: '', 3: null }
    expect(reconcilePurchaseValues([
      field(1, { default_value: '远端修改' }), field(2, { default_value: '默认' }),
      field(3, { default_value: '默认' }), field(4, { value_type: 'int', default_value: '5' }),
    ], values)).toEqual({ ...values, 4: 5 })
  })

  it('removes obsolete IDs from both draft and submission', () => {
    const schema = [field(2)]
    const values = reconcilePurchaseValues(schema, { 1: '旧字段', 2: '保留' })
    expect(values).toEqual({ 2: '保留' })
    expect(serializePurchaseValues(schema, values)).toEqual({ 2: '保留' })
  })

  it('revalidates required and selection rules without replacing the entered value', () => {
    const values = { 1: '', 2: '旧选项' }
    const schema = [field(1, { is_required: 1 }), field(2, { value_type: 'select', options: ['新选项'] })]
    expect(reconcilePurchaseValues(schema, values)).toEqual(values)
    expect(purchaseValuesValid(schema, values)).toBe(false)
    expect(purchaseValuesValid(schema, { 1: '已补齐', 2: '旧选项' })).toBe(false)
    expect(purchaseValuesValid(schema, { 1: '已补齐', 2: '新选项' })).toBe(true)
  })

  it('revalidates a changed number type and keeps date defaults in UI units', () => {
    expect(purchaseValuesValid([field(1, { value_type: 'int' })], { 1: '文字' })).toBe(false)
    const schema = [field(2, { value_type: 'datetime', default_value: 100 })]
    const values = reconcilePurchaseValues(schema, {})
    expect(values).toEqual({ 2: 100000 })
    expect(purchaseValuesValid(schema, values)).toBe(true)
    expect(serializePurchaseValues(schema, values)).toEqual({ 2: 100 })
  })
})
