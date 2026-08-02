import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const repository = process.cwd()
const applicationNames = ['account', 'team', 'chat', 'transaction', 'admin']
const sourceRoots = [
  ...applicationNames.map(name => join(repository, 'frontend', 'apps', name, 'src')),
  join(repository, 'frontend', 'packages', 'ui', 'src'),
]

function filesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? filesUnder(path) : [path]
  })
}

function sourceFiles() {
  return sourceRoots.flatMap(filesUnder).filter(path => /\.(?:ts|vue|css)$/.test(path) && !path.endsWith('.test.ts'))
}

describe('后台源码设计契约', () => {
  it('锁定 Naive UI 2.44.1 且不引入其他组件体系', () => {
    const manifest = JSON.parse(readFileSync(join(repository, 'package.json'), 'utf8')) as { dependencies: Record<string, string> }
    expect(manifest.dependencies['naive-ui']).toBe('2.44.1')
    const sources = sourceFiles().map(path => readFileSync(path, 'utf8')).join('\n')
    expect(sources).not.toMatch(/from\s+['"](?:primevue|shadcn-vue|@shadcn)/i)
  })

  it('只允许五个应用根节点注入主题 Provider', () => {
    const providerFiles = sourceFiles()
      .filter(path => readFileSync(path, 'utf8').includes('NConfigProvider'))
      .map(path => relative(repository, path).replaceAll('\\', '/'))
      .sort()
    expect(providerFiles).toEqual(applicationNames.map(name => `frontend/apps/${name}/src/App.vue`).sort())
  })

  it('原生标准控件只存在于已登记的浏览器实现例外', () => {
    const controls = sourceFiles().flatMap(path => {
      const source = readFileSync(path, 'utf8')
      return [...source.matchAll(/<(button|input|select|textarea)\b/gi)].map(match => ({
        file: relative(repository, path).replaceAll('\\', '/'),
        control: match[1].toLowerCase(),
      }))
    })
    expect(controls).toEqual([
      { file: 'frontend/packages/ui/src/components/LsMarkdownEditor.vue', control: 'button' },
      { file: 'frontend/packages/ui/src/components/LsMarkdownEditor.vue', control: 'button' },
      { file: 'frontend/packages/ui/src/components/LsMarkdownEditor.vue', control: 'button' },
      { file: 'frontend/packages/ui/src/components/LsMarkdownEditor.vue', control: 'button' },
      { file: 'frontend/packages/ui/src/components/LsMarkdownEditor.vue', control: 'textarea' },
      { file: 'frontend/packages/ui/src/components/LsMarkdownRenderer.vue', control: 'button' },
      { file: 'frontend/packages/ui/src/components/LsUploadField.vue', control: 'input' },
    ])
  })

  it('公共组件和 Wiki 板块保持可定位', () => {
    const componentRules = readFileSync(join(repository, 'docs', 'design', 'admin', 'components.md'), 'utf8')
    for (const name of ['LsButton', 'LsInlineError', 'LsPanel', 'LsStatusTag', 'LsPage', 'LsPageHeader', 'LsWorkspaceHeader', 'LsListToolbar', 'LsEntityIdentity', 'LsEntityCard', 'LsEntityInput', 'LsResponsiveActions', 'LsResponsiveDataTable', 'LsUploadField', 'LsEmptyState', 'LsAsyncState', 'LsRouteErrorBoundary', 'LsSearchInput', 'LsField', 'LsInput', 'LsMarkdownEditor', 'LsMarkdownRenderer']) {
      expect(componentRules, `${name} 缺少 Wiki 契约`).toContain(`\`${name}\``)
    }
    for (const page of ['index.md', 'foundations.md', 'components.md', 'patterns.md', 'states-and-access.md', 'responsive-accessibility.md', 'applications.md', 'checklist.md']) {
      expect(() => readFileSync(join(repository, 'docs', 'design', 'admin', page), 'utf8')).not.toThrow()
    }
  })

  it('页面级空数据状态统一复用 LsEmptyState', () => {
    const requiredPages = [
      'account/src/views/TeamsView.vue',
      'account/src/views/IdentityView.vue',
      'chat/src/views/TeamPickerView.vue',
      'admin/src/views/UsersView.vue',
      'admin/src/views/TeamsView.vue',
      'admin/src/views/AdministratorsView.vue',
      'admin/src/views/RolesView.vue',
      'admin/src/views/AuditView.vue',
      'team/src/views/EntitiesView.vue',
      'team/src/views/MembersView.vue',
      'team/src/views/CustomersView.vue',
      'team/src/views/RolesView.vue',
      'team/src/views/ChatVirtualsView.vue',
      'team/src/views/DocumentsView.vue',
      'team/src/views/FilesView.vue',
      'team/src/views/EntityFieldsView.vue',
      'team/src/views/NoticesView.vue',
      'team/src/views/JoinReviewView.vue',
      'team/src/views/ResourceView.vue',
      'team/src/views/SettingsView.vue',
      'transaction/src/views/TransactionsView.vue',
      'transaction/src/views/BindingsView.vue',
      'transaction/src/views/BalancesView.vue',
      'transaction/src/views/BalanceLogsView.vue',
    ]
    for (const page of requiredPages) {
      const source = readFileSync(join(repository, 'frontend', 'apps', page), 'utf8')
      expect(source, `${page} 未复用页面级空状态`).toContain('LsEmptyState')
    }
  })

  it('后台页面不恢复已经废弃的页面级皮肤和重复表格', () => {
    const roots = ['admin', 'team', 'transaction'].map(name => join(repository, 'frontend', 'apps', name, 'src'))
    const pages = roots.flatMap(filesUnder).filter(path => path.endsWith('.vue'))
    const forbidden = [
      { pattern: /<table\b/i, label: '原生 table' },
      { pattern: /class=["'][^"']*\bloading-list\b/i, label: '页面级 loading-list' },
      { pattern: /class=["'][^"']*\bfeedback\s+error\b/i, label: '手写行内错误' },
    ]
    for (const path of pages) {
      const source = readFileSync(path, 'utf8')
      const file = relative(repository, path).replaceAll('\\', '/')
      for (const rule of forbidden) expect(source, `${file} 出现${rule.label}`).not.toMatch(rule.pattern)
      for (const match of source.matchAll(/class=["']([^"']+)["']/gi)) {
        expect(match[1].split(/\s+/), `${file} 出现页面级 panel`).not.toContain('panel')
      }
      for (const match of source.matchAll(/<label\b[^>]*class=["']([^"']+)["']/gi)) {
        expect(match[1].split(/\s+/), `${file} 出现手写字段容器`).not.toContain('field')
      }
    }
  })

  it('直接 NButton 只用于壳层、平台命令搜索和纯图标微操作', () => {
    const allowed = new Set([
      'frontend/apps/admin/src/components/AdminShell.vue',
      'frontend/apps/admin/src/views/DashboardView.vue',
      'frontend/apps/team/src/components/TeamShell.vue',
      'frontend/apps/team/src/views/RoleDetailView.vue',
      'frontend/apps/transaction/src/components/TransactionShell.vue',
    ])
    const offenders = ['admin', 'team', 'transaction']
      .flatMap(name => filesUnder(join(repository, 'frontend', 'apps', name, 'src')))
      .filter(path => path.endsWith('.vue') && readFileSync(path, 'utf8').includes('<NButton'))
      .map(path => relative(repository, path).replaceAll('\\', '/'))
      .filter(path => !allowed.has(path))
    expect(offenders).toEqual([])
  })
})
