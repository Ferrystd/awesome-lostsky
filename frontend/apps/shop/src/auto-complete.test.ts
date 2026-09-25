import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { hydrateProductVariant, newProductVariant, serializeProductVariant, validAutoCompleteAfterMinutes, validProductVariant } from './product-variants'

describe('automatic completion configuration', () => {
  it('accepts an empty duration and rejects non-positive, fractional and non-finite values', () => {
    for (const value of [null, 1, 60, 5256000]) expect(validAutoCompleteAfterMinutes(value)).toBe(true)
    for (const value of [0, -1, 0.5, Infinity, NaN, 5256001, '60']) expect(validAutoCompleteAfterMinutes(value)).toBe(false)
  })

  it('captures the create default and sends an explicitly cleared duration as null', () => {
    const draft = newProductVariant(60)
    draft.name = '小时'
    draft.kind = 4
    expect(draft.redemption?.auto_complete_after_minutes).toBe(60)
    draft.redemption!.auto_complete_after_minutes = null
    expect(validProductVariant(draft)).toBe(true)
    expect(serializeProductVariant(draft).redemption?.auto_complete_after_minutes).toBeNull()
    draft.redemption!.auto_complete_after_minutes = 0
    expect(validProductVariant(draft)).toBe(false)
  })

  it('hydrates saved settings without reapplying team defaults', () => {
    for (const duration of [null, 90]) {
      const draft = hydrateProductVariant({ id: 1, name: '核销规格', kind: 4, redemption: { auto_complete_after_minutes: duration } })
      expect(serializeProductVariant(draft).redemption?.auto_complete_after_minutes).toBe(duration)
    }
    expect(serializeProductVariant(newProductVariant(60))).not.toHaveProperty('redemption')
  })

  it('guards create-only defaults and provides clearable inputs in all editors', () => {
    for (const path of ['./views/manage/ProductFormView.vue', './views/manage/ServiceFormView.vue']) {
      const source = readFileSync(new URL(path, import.meta.url), 'utf8')
      expect(source).toContain('!autoCompleteDefaultApplied')
      expect(source).toContain('!autoCompleteTouched')
      expect(source).toContain('autoCompleteDefaultApplied = true')
      expect(source).toContain('data.redemption.auto_complete_after_minutes ?? null'.replace('data.redemption', path.includes('Product') ? 'data.redemption' : 'data'))
      expect(source).toContain('clearable placeholder="不自动结单"')
      expect(source).toContain('validAutoCompleteAfterMinutes(')
    }
    const settings = readFileSync(new URL('../../team/src/views/SettingsView.vue', import.meta.url), 'utf8')
    expect(settings).toContain(':clearable="setting.nullable === true"')
    expect(settings).toContain('=== null ? null : Number(')
    expect(settings).toContain('if (values[appName]) values[appName][key] = value')
    expect(settings).toContain('if (values[group.app_name] && appDirty(group.app_name)) return')
  })
})
