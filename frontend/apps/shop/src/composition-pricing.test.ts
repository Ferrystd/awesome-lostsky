import { describe, expect, it } from 'vitest'
import { compositionIsNested, compositionItemAmount, compositionItemLocked, compositionItemTeamCut, compositionItemValid, restoreCompositionAmounts, type CompositionDraftItem } from './composition-pricing'
import type { ManageProductCandidate } from './types'

const rates = { handler: 80, sender: 15, customerService: 0 }
const products: ManageProductCandidate[] = [
  { id: 1, team_id: 1, entity_id: 71, name: '本人商品', kind: 1, price: '10.00', cost: '0.00', handler_cut: null, sender_cut: null, cs_cut: null, team_cut: null, is_active: 1 },
  { id: 2, team_id: 1, entity_id: null, name: '公用套餐', kind: '套餐', price: '20.00', cost: '0.00', handler_cut: '12.00', sender_cut: '3.00', cs_cut: '0.00', team_cut: '5.00', is_active: 1 },
]
const item = { product_id: 1, quantity: 1 }

describe('shared composition pricing', () => {
  it('uses source defaults and integer cents for the team remainder', () => {
    expect(compositionItemAmount(item, 'unit_handler_cut', products, rates)).toBe(8)
    expect(compositionItemTeamCut(item, products, rates)).toBe(0.5)
    expect(compositionItemValid(item, products, rates)).toBe(true)
    expect(compositionItemValid({ ...item, unit_price: '' }, products, rates)).toBe(false)
    expect(compositionItemValid({ ...item, unit_cost: '9.00' }, products, rates)).toBe(false)
  })
  it('locks all nested amounts and respects personal repricing permissions', () => {
    expect(compositionIsNested([item, { product_id: 2, quantity: 1 }], products)).toBe(true)
    expect(compositionItemLocked(item, 'unit_price', products, false, true)).toBe(false)
    expect(compositionItemLocked(item, 'unit_handler_cut', products, false, true)).toBe(true)
    expect(compositionItemLocked({ product_id: 2, quantity: 1 }, 'unit_price', products, false, true)).toBe(true)
    expect(compositionItemLocked(item, 'unit_price', products, true, false)).toBe(true)
  })
  it('restores repeated references by occurrence and removes unsaved overrides', () => {
    const items: CompositionDraftItem[] = [
      { ...item, unit_price: '40.00' }, { ...item, unit_price: '50.00' },
      { product_id: 2, quantity: 1, unit_price: '90.00' },
    ]
    restoreCompositionAmounts(items, [{ ...item, unit_price: '11.00' }, { ...item, unit_price: '12.00' }])
    expect(items.map(row => row.unit_price)).toEqual(['11.00', '12.00', undefined])
  })
})
