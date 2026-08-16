import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), 'utf8')
}

describe('资料表单布局契约', () => {
  it('顾客详情使用 form 页面容器', () => {
    const view = source('./views/CustomerDetailView.vue')
    expect(view).toContain('<AdminPage width="form">')
    expect(view).toContain('v-model="form.sender_entity_ids"')
    expect(view).toContain('multiple')
    expect(view).not.toContain('/transaction/sender')
  })

  it('实体（Entity）资料使用表单容器、语义命令尺寸和唯一原子可见性保存', () => {
    const view = source('./views/EntityDetailView.vue')
    const router = source('./router.ts')
    const formList = source('../../../packages/ui/src/components/LsFormList.vue')
    const formActions = source('../../../packages/ui/src/components/LsFormActions.vue')
    expect(view).toContain('<LsFormActions>')
    expect(view).not.toContain(':deep(.ls-')
    expect(router).toContain("path: '/entity', component: EntityDetailView, meta: { title: '实体资料', pageWidth: 'form' }")
    expect(formList).toContain('.ls-form-list__add { justify-self: start;')
    expect(formActions).toContain('.ls-form-actions :deep(.ls-button) { min-width: 7rem; }')
    expect(view).toContain('class="visibility-settings"')
    expect(view.match(/title="可见性设置"/g)).toHaveLength(1)
    expect(view.match(/>保存可见性<\/LsButton>/g)).toHaveLength(1)
    expect(view).toContain("api.post<VisibilityState>('/entity/presentation'")
    expect(view).not.toMatch(/\/entity\/(?:display|visibility)/)
    expect(view).not.toMatch(/checked-text|unchecked-text/)
    expect(source('./views/CustomerDetailView.vue')).toContain('<LsFormActions v-if="canManage">')
  })
})
