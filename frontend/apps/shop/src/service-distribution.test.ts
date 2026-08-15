import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { calculateDefaultServiceDistribution, calculateServiceTeamCut } from './service-distribution'

const serviceFormSource = readFileSync(new URL('./views/manage/ServiceFormView.vue', import.meta.url), 'utf8')
const packageFormSource = readFileSync(new URL('./views/manage/PackageFormView.vue', import.meta.url), 'utf8')
const productFormSource = readFileSync(new URL('./views/manage/ProductFormView.vue', import.meta.url), 'utf8')
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
    expect(serviceFormSource).toContain('() => [form.default_total_price, form.default_cost] as const')
    expect(serviceFormSource).toContain('calculateDefaultServiceDistribution(')
    expect(serviceFormSource).toMatch(/id="service-price"[^>]+:step="0\.01"[^>]+:precision="2"/)
    expect(serviceFormSource).toMatch(/id="service-cost"[^>]+:step="0\.01"[^>]+:precision="2"/)
    expect(serviceFormSource).toMatch(/id="service-handler-cut"[^>]+:precision="2"/)
    expect(serviceFormSource).toMatch(/id="service-sender-cut"[^>]+:precision="2"/)
    expect(serviceFormSource).toMatch(/id="service-cs-cut"[^>]+:precision="2"/)
    expect(serviceFormSource).toMatch(/id="service-team-cut" :value="teamCut" :precision="2" disabled/)
    expect(packageFormSource).toContain('calculateDefaultServiceDistribution(item.unit_price, item.unit_cost')
    expect(packageFormSource).toContain('unit_price: Number(service.default_total_price ?? 0)')
    expect(packageFormSource).toContain('unit_handler_cut: Number(service.default_handler_cut ?? 0)')
    expect(packageFormSource).not.toContain('按可分配金额比例')
    expect(packageFormSource).not.toContain('label="分成方式"')
    expect(packageFormSource).toMatch(/id="`package-price-\$\{item\.key\}`"[^>]+:step="0\.01"[^>]+:precision="2"/)
    expect(packageFormSource).toMatch(/id="`package-cost-\$\{item\.key\}`"[^>]+:step="0\.01"[^>]+:precision="2"/)
    expect(productFormSource).toContain('() => [form.price, form.cost] as const')
    expect(productFormSource).toContain('calculateDefaultServiceDistribution(form.price, form.cost, distributionRates)')
    expect(productFormSource).toMatch(/title="默认分成"[\s\S]+label="成本"[\s\S]+id="product-cost"[^>]+:step="0\.01"[^>]+:precision="2"/)
    expect(productFormSource).toMatch(/id="product-team-cut" :value="teamCut" :precision="2" disabled/)
  })

  it('removes configurable quantity precision and leaves the minimum step as the only user input', () => {
    expect(serviceFormSource).not.toContain('label="数量精度"')
    expect(serviceFormSource).not.toContain('service-scale')
    expect(serviceFormSource).toMatch(/id="service-step"[^>]+:min="0\.0001"[^>]+:step="0\.0001"[^>]+:validator="isValidQuantityStep"/)
    expect(serviceFormSource).not.toMatch(/id="service-step"[^>]+:precision=/)
    expect(teamSettingSource).not.toContain("'default_quantity_scale' =>")
    for (const source of [schemaSource, serviceModelSource, entitlementModelSource, shopTypesSource]) {
      expect(source).not.toContain('quantity_scale')
    }
  })

  it('uses the page primary action to open the storefront from an existing service', () => {
    expect(serviceFormSource).toContain('LsPagePrimaryAction')
    expect(serviceFormSource).toMatch(/v-if="editing" :icon="Eye" label="预览商品" href="\/" target="_blank" rel="noopener noreferrer"/)
    expect(serviceFormSource).not.toContain('停用服务')
  })
})
