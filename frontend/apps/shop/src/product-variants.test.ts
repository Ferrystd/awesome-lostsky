import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import { hydrateProductVariant, serializeProductVariant, validProductVariant, newProductVariant } from './product-variants'

describe('product variant drafts', () => {
  it('keeps stable distinct editor identities outside the write contract', () => {
    const first = newProductVariant()
    const second = newProductVariant()
    expect(first.draftKey).not.toBe(second.draftKey)
    expect(serializeProductVariant(second)).not.toHaveProperty('draftKey')
  })
  it('omits an empty new variant cover so the server can inherit the parent cover', () => {
    expect(serializeProductVariant({ name: '体验', kind: 1, price: '10.00', cover_image: '' })).not.toHaveProperty('cover_image')
    expect(serializeProductVariant({ id: 4, name: '体验', kind: 1, price: '10.00', cover_image: '' })).toHaveProperty('cover_image', '')
  })
  it('rejects cleared prices and unbalanced distributions', () => {
    const draft = { name: '体验', kind: 1 as const, price: '10.00', cost: '1.00', handler_cut: '5.00', sender_cut: '0.00', cs_cut: '0.00' }
    expect(validProductVariant(draft)).toBe(true)
    expect(validProductVariant({ ...draft, price: '' })).toBe(false)
    expect(validProductVariant({ ...draft, cost: '9.00' })).toBe(false)
    expect(validProductVariant({ ...draft, kind: 3, items: [] })).toBe(false)
  })
  it('serializes reactive form state without sharing the draft', () => {
    const draft = reactive({ name: '体验', kind: 1 as const, price: '10.00' })
    const body = serializeProductVariant(draft)
    body.name = '已提交'
    expect(draft.name).toBe('体验')
    expect(body.price).toBe('10.00')
  })
  it('keeps redemption field identity without sharing mutable server data', () => {
    const product = { id: 10, name: '十次', kind: 4 as const, price: '25.00', redemption: { redemption_fields: [{
      id: 3, name: '账号', value_type: 'string' as const, input_type: 'text' as const,
      fill_stage: 'customer' as const, is_customer_visible: 1 as const,
      is_required: 1 as const, is_active: 1 as const, sort: 0,
    }] } }
    const draft = hydrateProductVariant(product)
    draft.redemption!.redemption_fields![0].name = '区服'
    expect(product.redemption.redemption_fields[0].name).toBe('账号')
    expect(serializeProductVariant(draft).redemption!.redemption_fields![0].id).toBe(3)
  })
  it('submits composition prices only on child items', () => {
    const body = serializeProductVariant({ name: ' 套餐 ', kind: 2, price: '99.00', handler_cut: '50.00', items: [{ product_id: 7, quantity: 2, unit_price: '12.00' }] })
    expect(body.name).toBe('套餐')
    expect(body).not.toHaveProperty('price')
    expect(body).not.toHaveProperty('handler_cut')
    expect(body.items![0].unit_price).toBe('12.00')
  })
})
