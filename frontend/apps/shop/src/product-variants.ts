import type { components } from '@lostsky/api/generated/shop'
import { toRaw } from 'vue'
import type { ServiceRedemptionFieldInput } from './types'
import { validPurchaseFields } from './purchase-fields'

type GeneratedVariantInput = components['schemas']['ProductVariantInput']
type VariantInput = Omit<GeneratedVariantInput, 'redemption'> & {
  redemption?: Omit<NonNullable<GeneratedVariantInput['redemption']>, 'redemption_fields'> & {
    redemption_fields?: ServiceRedemptionFieldInput[]
  }
}
type Product = components['schemas']['Product']

export type ProductVariantDraft = VariantInput & { name: string; kind: 1 | 2 | 3 | 4; draftKey?: string }
let draftSequence = 0
export function newProductVariant(autoCompleteAfterMinutes: number | null = null): ProductVariantDraft {
  return { draftKey: `variant-new-${++draftSequence}`, name: '', kind: 1, price: '0.00', cost: '0.00', handler_cut: '0.00', sender_cut: '0.00', cs_cut: '0.00', is_active: 1,
    redemption: { unit_name: '次', quantity: '1', quantity_step: '1', valid_days: 0, auto_complete_after_minutes: autoCompleteAfterMinutes, unused_auto_complete_after_minutes: null, handler_entity_ids: [], redemption_fields: [] } }
}

export function validAutoCompleteAfterMinutes(value: unknown): boolean {
  return value == null || (typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= 5256000)
}

const kinds: Record<string, 1 | 2 | 3 | 4> = { 普通商品: 1, 套餐: 2, 卡密: 3, 核销商品: 4 }

export function validProductVariant(draft: ProductVariantDraft): boolean {
  if (!draft.name.trim() || !validPurchaseFields(draft.purchase_fields ?? [])) return false
  if (draft.kind === 2 || draft.kind === 3) {
    return Boolean(draft.items?.length && (draft.kind !== 3 || draft.items.length === 1)
      && draft.items.every(item => Number.isInteger(item.product_id) && item.product_id > 0
        && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 10000))
  }
  const amounts = [draft.price, draft.cost, draft.handler_cut, draft.sender_cut, draft.cs_cut]
  if (!amounts.every(value => typeof value === 'string' && /^\d{1,10}(?:\.\d{1,2})?$/.test(value))) return false
  const cents = amounts.map(value => Math.round(Number(value) * 100))
  if (cents[0] < cents.slice(1).reduce((sum, value) => sum + value, 0)) return false
  if (draft.kind !== 4) return true
  const redemption = draft.redemption
  if (!redemption?.unit_name?.trim()) return false
  const quantity = Number(redemption.quantity)
  const step = Number(redemption.quantity_step)
  if (!Number.isFinite(quantity) || !Number.isFinite(step) || quantity <= 0 || step <= 0) return false
  const units = Math.round(quantity * 10000)
  const stepUnits = Math.round(step * 10000)
  if (!stepUnits || units % stepUnits !== 0) return false
  if (!Number.isInteger(redemption.valid_days) || (redemption.valid_days ?? -1) < 0) return false
  if (!validAutoCompleteAfterMinutes(redemption.unused_auto_complete_after_minutes) || !validAutoCompleteAfterMinutes(redemption.auto_complete_after_minutes)) return false
  return (redemption.redemption_fields ?? []).every(field => field.name.trim())
}

export function hydrateProductVariant(product: Product): ProductVariantDraft {
  const rawKind: unknown = product.kind
  const kind = typeof rawKind === 'number' && rawKind >= 1 && rawKind <= 4
    ? rawKind as 1 | 2 | 3 | 4 : kinds[String(rawKind)]
  if (!kind) throw new Error('规格类型无效')
  const result: ProductVariantDraft = {
    draftKey: `variant-${product.id}`,
    id: product.id, name: product.name ?? '', kind,
    description: product.description, cover_image: product.cover_image ?? undefined,
    introduction_markdown: product.introduction_markdown,
    price: product.price, cost: product.cost ?? '0.00',
    handler_cut: product.handler_cut, sender_cut: product.sender_cut,
    cs_cut: product.cs_cut, team_cut: product.team_cut,
    is_active: product.is_active,
    purchase_fields: structuredClone(toRaw(product.purchase_fields ?? [])),
    handler_entity_ids: (product.handlers ?? []).flatMap(handler => handler.entity_id ? [handler.entity_id] : []),
  }
  if (kind === 4 && product.redemption) result.redemption = {
    ...structuredClone(toRaw(product.redemption)),
    redemption_fields: product.redemption.redemption_fields?.map(field => ({ ...field, options: [...(field.options ?? [])] })),
  }
  if (kind === 2 || kind === 3) result.items = product.items ? structuredClone(toRaw(product.items)) : undefined
  return result
}

export function serializeProductVariant(draft: ProductVariantDraft): VariantInput {
  const result = structuredClone(toRaw(draft))
  delete result.draftKey
  // 团队分成由售价、成本和人员金额重新计算，不能回传旧详情中的余额。
  delete result.team_cut
  result.name = result.name?.trim()
  if (!result.id && !result.cover_image?.trim()) delete result.cover_image
  if (draft.kind === 2 || draft.kind === 3) {
    for (const key of ['price', 'cost', 'handler_cut', 'sender_cut', 'cs_cut', 'team_cut', 'handler_entity_ids'] as const) delete result[key]
    delete result.redemption
  } else if (draft.kind === 4) {
    delete result.items
    delete result.handler_entity_ids
  } else {
    delete result.items
    delete result.redemption
  }
  delete result.benefit_package_id
  delete result.redemption_campaign_id
  return result
}
