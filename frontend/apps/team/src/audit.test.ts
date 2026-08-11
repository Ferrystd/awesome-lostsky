import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { actorLabel, displayAuditValue } from './lib/audit'

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), 'utf8')
}

describe('Team 审计日志', () => {
  it('导航入口、列表和详情路由均受独立页面承载', () => {
    const shell = source('./components/TeamShell.vue')
    const router = source('./router.ts')
    expect(shell).toContain("permission: 'team.audit.read'")
    expect(router).toContain("path: '/audit'")
    expect(router).toContain("path: '/audit/:id(\\\\d+)'")
    expect(router).toContain("pageWidth: 'wide'")
  })

  it('列表包含筛选、异步状态、空状态、响应式记录与分页', () => {
    const view = source('./views/AuditView.vue')
    expect(view).toContain("api.get<AuditFilterCatalog>('/audit/catalog')")
    expect(view).toContain("api.get<AuditPage>('/audit/index'")
    expect(view).toContain('<LsListToolbar')
    expect(view).toContain('<LsResponsiveDataTable')
    expect(view).toContain('<LsAsyncState')
    expect(view).toContain('<LsEmptyState')
    expect(view).toContain('<NPagination')
    expect(view).toContain("showAdvanced = ref(false)")
    expect(view).toContain("'更多筛选'")
    expect(view).toContain('advancedFilterCount')
    expect(view.indexOf('<NSelect v-model:value="filters.application"'))
      .toBeLessThan(view.indexOf('id="audit-advanced-filters"'))
    expect(view).not.toContain(':deep(')
  })

  it('详情通过安全接口读取并保留返回路径', () => {
    const detail = source('./views/AuditDetailView.vue')
    expect(detail).toContain("api.get<AuditEventDetail>('/audit/get'")
    expect(detail).toContain('back-to="/audit"')
    expect(detail).toContain('认证账号 ID')
    expect(detail).toContain('请求 ID')
  })

  it('兼容无 acting Entity 的认证账号并隐藏脱敏值', () => {
    expect(actorLabel({ authenticated_user_id: 7, username: 'alice', entity_id: null })).toBe('alice')
    expect(displayAuditValue({ changed: true, redacted: true })).toBe('已变更（内容不记录）')
  })
})
