import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('product save boundary', () => {
  it('submits handlers with the product and waits for candidate refresh', () => {
    const source = readFileSync(new URL('./views/manage/ProductFormView.vue', import.meta.url), 'utf8')
    expect(source).toContain('handler_entity_ids: [...form.handler_entity_ids]')
    expect(source).not.toContain('management.value.setProductHandlers(')
    expect(source).toContain("await queryClient.invalidateQueries({ queryKey: ['manage-product-options'] })")
  })
})
