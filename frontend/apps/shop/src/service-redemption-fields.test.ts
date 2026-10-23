import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createServiceRedemptionFieldDraft, hydrateServiceRedemptionFields, serializeServiceRedemptionFields, validServiceRedemptionFields } from './service-redemption-fields'

const productFormSource = readFileSync(new URL('./views/manage/ProductFormView.vue', import.meta.url), 'utf8')
const variantEditorSource = readFileSync(new URL('./components/ProductVariantEditor.vue', import.meta.url), 'utf8')
const routerSource = readFileSync(new URL('./router.ts', import.meta.url), 'utf8')
const editorSource = readFileSync(new URL('./components/ServiceFieldsEditor.vue', import.meta.url), 'utf8')

describe('service redemption fields', () => {
  it('hydrates persisted service fields and serializes their current order', () => {
    const drafts = hydrateServiceRedemptionFields([{
      id: 7,
      name: '预约说明',
      value_type: 'string',
      input_type: 'textarea',
      options: ['上午', '下午'],
      fill_stage: 'customer',
      is_customer_visible: 1,
      is_required: 1,
      is_active: 1,
      sort: 9,
    }])

    expect(drafts[0]).toMatchObject({ key: 'field-7', options_text: '上午\n下午' })
    expect(serializeServiceRedemptionFields(drafts)[0]).toMatchObject({
      id: 7,
      options: ['上午', '下午'],
      sort: 0,
    })
  })

  it('rejects duplicate field names before saving', () => {
    const drafts = hydrateServiceRedemptionFields([{
      id: 7,
      name: '联系方式',
      value_type: 'string',
      input_type: 'text',
      fill_stage: 'customer',
      is_customer_visible: 1,
      is_required: 0,
      is_active: 1,
      sort: 0,
    }])
    expect(validServiceRedemptionFields(drafts)).toBe(true)
    drafts.push({ ...drafts[0], key: 'new-1', id: undefined, name: '联系方式' })
    expect(validServiceRedemptionFields(drafts)).toBe(false)
  })

  it('asks for one field name and uses customer-facing Chinese stage labels', () => {
    expect(editorSource).toContain('label="字段名称"')
    expect(editorSource).not.toContain('label="字段标识"')
    expect(editorSource).not.toContain('label="显示名称"')
    expect(editorSource).toContain("label: '核销接单时'")
    expect(editorSource).toContain('顾客可见</label>')
    expect(editorSource).not.toContain('Customer 可见</label>')
    expect(editorSource).toContain("{ label: '图片', value: 'image' }")
    expect(editorSource).toContain("{ label: '图片上传', value: 'upload' }")
  })

  it('creates list drafts with UI-only keys and no persisted field identifier', () => {
    const first = createServiceRedemptionFieldDraft()
    const second = createServiceRedemptionFieldDraft()
    expect(first.key).toMatch(/^new-\d+$/)
    expect(second.key).not.toBe(first.key)
    expect(first.fill_stage).toBe('manager')
    expect(first).not.toHaveProperty('field_key')
  })

  it('saves redemption fields inside the unified product form', () => {
    expect(productFormSource).toContain('<ServiceFieldsEditor v-if="form.kind === 4" v-model="redemptionFields" />')
    expect(productFormSource).toContain('redemption_fields: serializeServiceRedemptionFields(redemptionFields.value)')
    expect(variantEditorSource).toContain('<ServiceFieldsEditor v-if="draft.kind === 4" v-model="redemptionFields" />')
    expect(variantEditorSource).toContain('draft.value.redemption.redemption_fields = serializeServiceRedemptionFields(fields)')
    expect(routerSource).not.toContain('/products/:id(\\d+)/fields')
  })
})
