import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const repository = process.cwd()
const source = (path: string) => readFileSync(join(repository, path), 'utf8')

describe('成员邀请来源前端契约', () => {
  it('加入申请同步 ref 并使用 inviter_slug 提交只读邀请人', () => {
    const view = source('frontend/apps/team/src/views/JoinView.vue')
    expect(view).toContain("import { syncReferral } from '@lostsky/shared/referral'")
    expect(view).toContain('inviter_slug: inviterSlug.value')
    expect(view).toContain('<div v-if="inviterSlug && !isReinstate" class="referral-confirmation"')
    expect(view).toContain('aria-label="当前邀请人"')
    expect(view).not.toContain("'未指定'")
    expect(view).not.toMatch(/v-model[^\n]+inviterSlug/)
  })

  it('顾客领取身份只读展示既有邀请来源，不改变绑定请求逻辑', () => {
    const view = source('frontend/apps/shop/src/views/CustomerBindView.vue')
    const api = source('frontend/apps/shop/src/lib.ts')
    expect(view).toContain('const inviterSlug = storedReferral()')
    expect(view).toContain('<div v-if="inviterSlug" class="referral-confirmation"')
    expect(view).toContain('aria-label="当前邀请人"')
    expect(view).not.toContain("'未指定'")
    expect(view).not.toMatch(/v-model[^\n]+inviterSlug/)
    expect(api).toContain('...(inviterSlug ? { inviter_slug: inviterSlug } : {})')
  })

  it('经营统计页不再提供获取邀请链接入口', () => {
    const view = source('frontend/apps/transaction/src/views/StatsView.vue')
    expect(view).not.toContain('/transaction/invite')
    expect(view).not.toContain('复制邀请链接')
  })

  it('成员详情显示加入时间和可跨团队的邀请人', () => {
    const view = source('frontend/apps/team/src/views/MemberDetailView.vue')
    expect(view).toContain('加入时间')
    expect(view).toContain('邀请人')
    expect(view).toContain("inviter.is_external ? '来自其他团队 · ' : ''")
  })
})
