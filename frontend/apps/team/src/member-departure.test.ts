import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const repository = process.cwd()
const source = (path: string) => readFileSync(join(repository, path), 'utf8')

describe('管理员办理成员离职', () => {
  it('自助离职只保留公共按钮和确认框，不再渲染独立卡片', () => {
    const content = source('frontend/apps/team/src/components/MemberSelfDeparture.vue')
    expect(content).toContain('<LsButton')
    expect(content).not.toContain('<LsPanel')
    expect(content).not.toContain('<LsSectionHeader')
    expect(content).toContain('dialog.warning(')
    expect(content).not.toContain('window.confirm')
    expect(content).not.toContain('<style')
  })
  it('个人资料与本人详情共用自助离职组件，不复制请求或样式', () => {
    for (const view of ['PersonalView', 'MemberDetailView']) {
      const content = source(`frontend/apps/team/src/views/${view}.vue`)
      expect(content).toContain('<MemberSelfDeparture v-if=')
      expect(content).toMatch(/<template #actions>[\s\S]*?<MemberSelfDeparture[\s\S]*?<\/template>/)
      expect(content).not.toContain('/memberDeparture/apply')
      expect(content).not.toContain('.self-departure{')
    }
  })
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


describe('成员资料统一入口', () => {
  it('管理页不再提交旧资料接口，同时保留入队与成员管理能力', () => {
    const content = source('frontend/apps/team/src/views/MemberFormView.vue')
    expect(content).not.toContain("'/member/edit'")
    expect(content).not.toContain('EntityProfileFields')
    expect(content).not.toContain('nickname')
    expect(content).toContain('/entity?id=')
    expect(content).toContain('detail.data.value.entity_id')
    expect(content).toContain("api.post('/member/add'")
    expect(content).toContain('<EntityFieldsCard')
    expect(content).toContain('<EntityPermissionsCard')
    expect(content).toContain("'/member/search'")
  })
})
