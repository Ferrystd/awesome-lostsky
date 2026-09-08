import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const repository = process.cwd()
const source = (path: string) => readFileSync(join(repository, path), 'utf8')

describe('管理员办理成员离职', () => {
  it('列表与详情统一直接办理离职', () => {
    const members = source('frontend/apps/team/src/views/MembersView.vue')
    const memberForm = source('frontend/apps/team/src/views/MemberFormView.vue')

    expect(members).toContain("label: '离职'")
    expect(members).toContain("mutate('/memberDeparture/depart'")
    expect(members).toContain('现有会话会立即失效')
    expect(memberForm).toMatch(/<div>\s*<strong>离职<\/strong>/)
    expect(memberForm).toMatch(/confirmAction\(\s*["']\/memberDeparture\/depart["']/)
    expect(memberForm).toContain('不再等待审核')
  })

  it('不再保留管理员发起离队申请的入口', () => {
    const sources = [
      source('frontend/apps/team/src/views/MembersView.vue'),
      source('frontend/apps/team/src/views/MemberFormView.vue'),
    ].join('\n')

    expect(sources).not.toContain('/memberDeparture/create')
    expect(sources).not.toContain('发起离队申请')
  })
})
