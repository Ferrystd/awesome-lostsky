import type { ManageProductCandidate } from './types'
import { calculateDefaultServiceDistribution, calculateServiceTeamCut, type ServiceDistributionRates } from './service-distribution'

export const compositionMoneyFields = [
  { key: 'unit_price', label: '每份售价' }, { key: 'unit_cost', label: '每份成本' },
  { key: 'unit_handler_cut', label: '每份接单分成' }, { key: 'unit_sender_cut', label: '每份发单分成' },
  { key: 'unit_cs_cut', label: '每份客服分成' },
] as const
export type CompositionMoneyField = typeof compositionMoneyFields[number]['key']
export type CompositionDraftItem = { product_id: number | null; quantity: number | null } & Partial<Record<CompositionMoneyField, string | number | null>>

export function compositionIsNested(items: CompositionDraftItem[], products: ManageProductCandidate[]) {
  return items.some(item => {
    const kind = products.find(product => product.id === item.product_id)?.kind
    return Number(kind) === 2 || Number(kind) === 3 || kind === '套餐' || kind === '卡密'
  })
}

export function compositionItemAmount(item: CompositionDraftItem, field: CompositionMoneyField, products: ManageProductCandidate[], rates: ServiceDistributionRates): number | null {
  if (item[field] !== undefined) return item[field] === null || item[field] === '' ? null : Number(item[field])
  const product = products.find(product => product.id === item.product_id)
  if (!product) return null
  const defaults = calculateDefaultServiceDistribution(Number(product.price), Number(product.cost), rates)
  const amounts = { unit_price: product.price, unit_cost: product.cost,
    unit_handler_cut: product.handler_cut ?? defaults.handler,
    unit_sender_cut: product.sender_cut ?? defaults.sender, unit_cs_cut: product.cs_cut ?? defaults.customerService }
  return Number(amounts[field])
}

export function compositionItemLocked(item: CompositionDraftItem, field: CompositionMoneyField, products: ManageProductCandidate[], nested: boolean, distributionLocked: boolean) {
  const product = products.find(product => product.id === item.product_id)
  return nested || !product || (distributionLocked && (product.entity_id === null || !['unit_price', 'unit_cost'].includes(field)))
}

export function compositionItemTeamCut(item: CompositionDraftItem, products: ManageProductCandidate[], rates: ServiceDistributionRates) {
  return calculateServiceTeamCut(...compositionMoneyFields.map(field => compositionItemAmount(item, field.key, products, rates)) as [number | null, number | null, number | null, number | null, number | null])
}

export function compositionItemValid(item: CompositionDraftItem, products: ManageProductCandidate[], rates: ServiceDistributionRates) {
  return compositionMoneyFields.every(field => {
    const value = compositionItemAmount(item, field.key, products, rates)
    return value !== null && Number.isFinite(value) && value >= 0
  }) && compositionItemTeamCut(item, products, rates) >= 0
}

// 服务端按同一商品的出现顺序匹配旧分项；进入嵌套模式时恢复同一基线。
export function restoreCompositionAmounts(items: CompositionDraftItem[], saved: CompositionDraftItem[]) {
  const occurrence = new Map<number, number>()
  for (const item of items) {
    if (item.product_id === null) continue
    const index = occurrence.get(item.product_id) ?? 0
    occurrence.set(item.product_id, index + 1)
    const baseline = saved.filter(entry => entry.product_id === item.product_id)[index]
    for (const { key } of compositionMoneyFields) {
      if (baseline?.[key] !== undefined) item[key] = baseline[key]
      else delete item[key]
    }
  }
}
