import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { calculateDefaultServiceDistribution, calculateServiceTeamCut } from './service-distribution'

const productFormSource = readFileSync(new URL('./views/manage/ProductFormView.vue', import.meta.url), 'utf8')
const variantEditorSource = readFileSync(new URL('./components/ProductVariantEditor.vue', import.meta.url), 'utf8')
const teamSettingSource = readFileSync(new URL('../../../../config/teamsetting.php', import.meta.url), 'utf8')
const schemaSource = readFileSync(new URL('../../../../sql/schema.sql', import.meta.url), 'utf8')
const serviceModelSource = readFileSync(new URL('../../../../app/model/TeamService.php', import.meta.url), 'utf8')
const entitlementModelSource = readFileSync(new URL('../../../../app/model/TeamServiceEntitlement.php', import.meta.url), 'utf8')
const shopTypesSource = readFileSync(new URL('./types.ts', import.meta.url), 'utf8')

describe('service default distribution', () => {
  it('recalculates personnel cuts from the distributable amount and assigns rounding remainder to the team', () => {
    expect(calculateDefaultServiceDistribution(10, 0.01, {
      handler: 80,
      sender: 15,
      customerService: 0,
    })).toEqual({
      handler: 7.99,
      sender: 1.49,
      customerService: 0,
      team: 0.51,
    })
  })

  it('keeps the team cut equal to the exact remaining cents after manual personnel adjustments', () => {
    expect(calculateServiceTeamCut(12, 2, 3, 1, 0.5)).toBe(5.5)
    expect(calculateServiceTeamCut(10, 2, 8, 1, 0)).toBe(-1)
  })

  it('keeps monetary inputs at two decimals and recalculates personnel distribution from price or cost changes', () => {
    expect(productFormSource).toContain('() => [form.price, form.cost] as const')
    expect(productFormSource).toContain('calculateDefaultServiceDistribution(form.price, form.cost, distributionRates)')
    expect(productFormSource).toMatch(/id="product-price"[^>]+:step="0\.01"[^>]+:precision="2"/)
    expect(productFormSource).toMatch(/id="product-pricing"[\s\S]+label="成本"[\s\S]+id="product-cost"[^>]+:step="0\.01"[^>]+:precision="2"/)
    for (const person of ['handler', 'sender', 'cs']) {
      expect(productFormSource).toMatch(new RegExp(`id="product-${person}-cut"[^>]+:precision="2"`))
    }
    expect(productFormSource).toMatch(/id="product-team-cut" :value="teamCut" :precision="2" disabled/)
    expect(variantEditorSource).toContain('watch(() => [draft.value.price, draft.value.cost], recalculateDistribution')
    expect(variantEditorSource).toContain('calculateDefaultServiceDistribution(amount(draft.value.price), amount(draft.value.cost), props.distributionRates)')
  })

  it('removes configurable quantity precision and leaves the minimum step as the only user input', () => {
    for (const source of [productFormSource, variantEditorSource]) {
      expect(source).not.toContain('label="数量精度"')
      expect(source).not.toContain('quantity_scale')
      expect(source).toContain('label="最小核销单位"')
    }
    expect(productFormSource).toMatch(/id="product-step"[^>]+v-model:value="redemption.quantity_step"[^>]+:min="0\.0001"/)
    expect(teamSettingSource).not.toContain("'default_quantity_scale' =>")
    for (const source of [schemaSource, serviceModelSource, entitlementModelSource, shopTypesSource]) {
      expect(source).not.toContain('quantity_scale')
    }
  })

  it('uses the page link to open the current product in the storefront', () => {
    expect(productFormSource).toMatch(/<LsPageLink v-if="editing" :icon="Eye"[^>]+:href="`\/product\/\$\{id\}`" target="_blank" rel="noopener noreferrer"/)
  })
})
