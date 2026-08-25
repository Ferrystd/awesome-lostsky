import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const repository = process.cwd()
const applicationNames = ['account', 'team', 'chat', 'transaction', 'admin', 'weibo']
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

const componentCallerRoots = readdirSync(join(repository, 'frontend', 'apps'), { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => join(repository, 'frontend', 'apps', entry.name, 'src'))

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
      { file: 'frontend/apps/account/src/views/LoginView.vue', control: 'button' },
      { file: 'frontend/apps/account/src/views/LoginView.vue', control: 'button' },
      { file: 'frontend/apps/account/src/views/LoginView.vue', control: 'button' },
      { file: 'frontend/packages/ui/src/components/LsMarkdownEditor.vue', control: 'button' },
      { file: 'frontend/packages/ui/src/components/LsMarkdownEditor.vue', control: 'button' },
      { file: 'frontend/packages/ui/src/components/LsMarkdownEditor.vue', control: 'button' },
      { file: 'frontend/packages/ui/src/components/LsMarkdownEditor.vue', control: 'button' },
      { file: 'frontend/packages/ui/src/components/LsMarkdownEditor.vue', control: 'textarea' },
      { file: 'frontend/packages/ui/src/components/LsMarkdownRenderer.vue', control: 'button' },
      { file: 'frontend/packages/ui/src/components/LsPagePrimaryAction.vue', control: 'button' },
      { file: 'frontend/packages/ui/src/components/LsUploadField.vue', control: 'input' },
      { file: 'frontend/packages/ui/src/components/LsWorkspaceOverview.vue', control: 'button' },
    ])
  })

  it('应用调用方不得穿透公共组件的 ls 私有节点', () => {
    const offenders = componentCallerRoots.flatMap(filesUnder)
      .filter(path => /\.(?:vue|css)$/.test(path))
      .filter(path => readFileSync(path, 'utf8').includes(':deep(.ls-'))
      .map(path => relative(repository, path).replaceAll('\\', '/'))
    expect(offenders).toEqual([])
  })

  it('Entity 候选统一使用公共富选择器', () => {
    const pages = componentCallerRoots.flatMap(filesUnder).filter(path => path.endsWith('.vue'))
    const legacy = pages.filter(path => {
      const source = readFileSync(path, 'utf8')
      return source.includes('EntitySelectOption') || source.includes('entity-select-menu')
    }).map(path => relative(repository, path).replaceAll('\\', '/'))
    expect(legacy).toEqual([])

    const plainSelects = pages.flatMap(path => {
      const source = readFileSync(path, 'utf8')
      return [...source.matchAll(/<NSelect\b[^>]*>/gs)]
        .map(match => match[0])
        .filter(tag => /(?:handler_entity_id|sender_entity_id|cs_entity_id|assignee_entity_id|targetEntityId|visibility_target_ids)/.test(tag))
        .map(tag => ({ file: relative(repository, path).replaceAll('\\', '/'), tag }))
    })
    expect(plainSelects).toEqual([])
  })

  it('公共组件和 Wiki 板块保持可定位', () => {
    const componentRules = readFileSync(join(repository, 'docs', 'design', 'admin', 'components.md'), 'utf8')
    for (const name of ['LsButton', 'LsInlineError', 'LsPanel', 'LsSectionHeader', 'LsFormSection', 'LsFormActions', 'LsDescriptionList', 'LsStatusTag', 'LsPage', 'LsPageHeader', 'LsPagePrimaryAction', 'LsWorkspaceHeader', 'LsWorkspaceOverview', 'LsListToolbar', 'LsFormList', 'LsEntityIdentity', 'LsEntityTag', 'LsEntityCard', 'LsEntityInput', 'LsEntitySelect', 'LsResponsiveActions', 'LsResponsiveDataTable', 'LsUploadField', 'LsMediaUploadField', 'LsEmptyState', 'LsAsyncState', 'LsRouteErrorBoundary', 'LsSearchInput', 'LsField', 'LsCheckboxGroupField', 'LsSwitch', 'LsSwitchField', 'LsInput', 'LsMarkdownEditor', 'LsMarkdownRenderer']) {
      expect(componentRules, `${name} 缺少 Wiki 契约`).toContain(`\`${name}\``)
    }
    for (const page of ['index.md', 'foundations.md', 'components.md', 'componentization.md', 'patterns.md', 'states-and-access.md', 'responsive-accessibility.md', 'applications.md', 'checklist.md']) {
      expect(() => readFileSync(join(repository, 'docs', 'design', 'admin', page), 'utf8')).not.toThrow()
    }
  })

  it('页面标题区主操作全部复用强制图标的统一组件', () => {
    const usages = componentCallerRoots.flatMap(filesUnder)
      .filter(path => path.endsWith('.vue'))
      .flatMap(path => [...readFileSync(path, 'utf8').matchAll(/<LsPagePrimaryAction\b[^>]*>/g)].map(match => ({ path, tag: match[0] })))
    expect(usages).toHaveLength(31)
    for (const usage of usages) {
      const file = relative(repository, usage.path).replaceAll('\\', '/')
      expect(usage.tag, `${file} 的页面主操作缺少强制 icon`).toMatch(/:icon=/)
      expect(usage.tag, `${file} 的页面主操作缺少稳定 label`).toMatch(/(?::label|label)=/)
      expect(usage.tag, `${file} 不得穿透页面主操作宽度`).not.toMatch(/(?:width|size|variant)=/)
    }
  })

  it('Markdown 与媒体资料字段不能退化成普通输入框', () => {
    const roots = ['team', 'shop']
      .map(name => join(repository, 'frontend', 'apps', name, 'src'))
    const pages = roots.flatMap(filesUnder).filter(path => path.endsWith('.vue'))
    for (const path of pages) {
      const source = readFileSync(path, 'utf8')
      const file = relative(repository, path).replaceAll('\\', '/')
      expect(source, `${file} 的 Markdown 字段退化成了 NInput`).not.toMatch(/<NInput\b[^>]*(?:introduction_markdown|markdown)[^>]*>/i)
      expect(source, `${file} 的媒体字段只剩 URL 输入`).not.toMatch(/<NInput\b[^>]*(?:avatar|intro_image|intro_video|cover_image)[^>]*>/i)
      for (const editor of source.matchAll(/<LsMarkdownEditor\b[^>]*>/gi)) {
        expect(editor[0], `${file} 的 Markdown 编辑器缺少强制图片上传接口`).toContain(':upload-image=')
      }
    }

    const editor = readFileSync(join(repository, 'frontend', 'packages', 'ui', 'src', 'components', 'LsMarkdownEditor.vue'), 'utf8')
    expect(editor).toContain('uploadImage: MarkdownImageUpload')
    expect(editor).toContain('[Crepe.Feature.ImageBlock]: true')
    expect(editor).not.toContain('Boolean(props.uploadImage)')
  })

  it('实体（Entity）资料的普通字段统一使用 LsField 且保持单列表单', () => {
    const source = readFileSync(join(repository, 'frontend', 'apps', 'team', 'src', 'components', 'EntityProfileFields.vue'), 'utf8')
    expect(source).not.toContain('NFormItem')
    expect(source).not.toContain('entity-profile-fields__media')
    expect(source.match(/<LsField\b/g)).toHaveLength(6)
    for (const suffix of ['avatar', 'intro-image', 'intro-video', 'introduction']) {
      expect(source).toContain(`:for-id="\`${'${idPrefix}'}-${suffix}\`"`)
    }
  })

  it('后台组件化方法由规则入口共同触发', () => {
    const references = [
      'AGENTS.md',
      'docs/design/admin/index.md',
      'docs/development/frontend.md',
      'docs/design/admin/checklist.md',
      'docs/development/checklist.md',
    ]
    for (const file of references) {
      const source = readFileSync(join(repository, ...file.split('/')), 'utf8')
      expect(source, `${file} 未引用组件化方法`).toContain('componentization.md')
    }
    const method = readFileSync(join(repository, 'docs', 'design', 'admin', 'componentization.md'), 'utf8')
    for (const phrase of ['同意图', '三次及以上', '出现两次且包含状态', '组件化盘点', '迁移全部同义用法', '删除旧 CSS']) {
      expect(method).toContain(phrase)
    }
  })

  it('后台业务页面不恢复已淘汰的结构类名', () => {
    const roots = ['admin', 'team', 'transaction', 'shop']
      .map(name => join(repository, 'frontend', 'apps', name, 'src'))
    const forbidden = /\b(?:form-panel|form-actions|section-heading|panel-heading|section-title)\b/
    for (const path of roots.flatMap(filesUnder).filter(path => /\.(?:vue|css)$/.test(path))) {
      const file = relative(repository, path).replaceAll('\\', '/')
      expect(readFileSync(path, 'utf8'), `${file} 恢复了旧结构`).not.toMatch(forbidden)
    }
  })

  it('普通复选组统一复用 LsCheckboxGroupField', () => {
    const allowed = [
      'frontend/apps/admin/src/views/RoleFormView.vue',
      'frontend/apps/team/src/views/JoinView.vue',
      'frontend/packages/ui/src/components/LsCheckboxGroupField.vue',
    ]
    const roots = ['admin', 'team', 'transaction', 'shop']
      .map(name => join(repository, 'frontend', 'apps', name, 'src'))
      .concat(join(repository, 'frontend', 'packages', 'ui', 'src'))
    const files = roots.flatMap(filesUnder)
      .filter(path => path.endsWith('.vue') && readFileSync(path, 'utf8').includes('NCheckboxGroup'))
      .map(path => relative(repository, path).replaceAll('\\', '/'))
      .sort()
    expect(files).toEqual(allowed.sort())
  })

  it('标准详情页面复用 LsDescriptionList', () => {
    const required = [
      'frontend/apps/admin/src/views/UserDetailView.vue',
      'frontend/apps/admin/src/views/TeamDetailView.vue',
      'frontend/apps/admin/src/views/SystemView.vue',
      'frontend/apps/team/src/views/DetailView.vue',
      'frontend/apps/team/src/views/JoinReviewDetailView.vue',
      'frontend/apps/team/src/views/ResourceView.vue',
      'frontend/apps/team/src/views/AbilitiesView.vue',
    ]
    for (const file of required) {
      expect(readFileSync(join(repository, ...file.split('/')), 'utf8'), `${file} 未复用标准详情列表`).toContain('LsDescriptionList')
    }
  })

  it('后台页面始终显示真实纵向滚动条，避免空白槽位和跨路由顶栏横向跳动', () => {
    const styles = readFileSync(join(repository, 'frontend', 'packages', 'ui', 'src', 'styles.css'), 'utf8')
    expect(styles).toMatch(/html\s*\{[^}]*overflow-y:\s*scroll;/)
    expect(styles).not.toMatch(/html\s*\{[^}]*scrollbar-gutter:/)
  })

  it('业务工作台统一使用共享五等宽应用导航', () => {
    const header = readFileSync(join(repository, 'frontend', 'packages', 'ui', 'src', 'components', 'LsWorkspaceHeader.vue'), 'utf8')
    expect(header).toContain('ls-workspace-header--app-nav')
    expect(header).not.toMatch(/position:(?:sticky|fixed)/)
    expect(header).toMatch(/ls-workspace-header__desktop\{grid-column:3;/)
    expect(header).toMatch(/grid-template-columns:repeat\(5,88px\)/)
    expect(header).toMatch(/width:472px/)
    expect(header).toMatch(/color:var\(--ink\);font-size:\.82rem/)
    for (const source of [
      ['team', 'TeamShell.vue'],
      ['shop', 'ShopManageShell.vue'],
      ['transaction', 'TransactionShell.vue'],
      ['weibo', 'WeiboShell.vue'],
    ] as const) {
      const shell = readFileSync(join(repository, 'frontend', 'apps', source[0], 'src', 'components', source[1]), 'utf8')
      expect(shell, `${source[0]} 未启用共享应用导航`).toMatch(/<LsWorkspaceHeader[^>]*app-navigation/)
    }
  })

  it('拖拽实现只存在于公共表单列表组件', () => {
    const imports = sourceFiles()
      .filter(path => readFileSync(path, 'utf8').includes("from 'vue-draggable-plus'"))
      .map(path => relative(repository, path).replaceAll('\\', '/'))
    expect(imports).toEqual(['frontend/packages/ui/src/components/LsFormList.vue'])
  })

  it('所有布尔控件统一复用 LsSwitch 或 LsSwitchField', () => {
    const switchFiles = componentCallerRoots
      .flatMap(filesUnder)
      .filter(path => path.endsWith('.vue') && readFileSync(path, 'utf8').includes('<NSwitch'))
      .map(path => relative(repository, path).replaceAll('\\', '/'))
      .sort()
    expect(switchFiles).toEqual([])
    const primitive = readFileSync(join(repository, 'frontend/packages/ui/src/components/LsSwitch.vue'), 'utf8')
    expect(primitive).toContain('<NSwitch')
    expect(primitive).not.toMatch(/#(?:checked|unchecked)/)
    const applicationSource = componentCallerRoots
      .flatMap(filesUnder)
      .filter(path => path.endsWith('.vue'))
      .map(path => readFileSync(path, 'utf8'))
      .join('\n')
    expect(applicationSource).not.toMatch(/class=["'][^"']*\bswitch-(?:row|field)\b/)
    expect(applicationSource).not.toMatch(/\b(?:checked|unchecked)-text=/)
    expect(applicationSource).not.toMatch(/#(?:checked|unchecked)/)
  })

  it('未保存修改守卫在 Team 应用只有一个实现', () => {
    const files = filesUnder(join(repository, 'frontend/apps/team/src'))
      .filter(path => /\.(?:ts|vue)$/.test(path) && readFileSync(path, 'utf8').includes('beforeunload'))
      .map(path => relative(repository, path).replaceAll('\\', '/'))
    expect(files).toEqual(['frontend/apps/team/src/composables/useUnsavedChangesGuard.ts'])
    const detail = readFileSync(join(repository, 'frontend/apps/team/src/views/EntityDetailView.vue'), 'utf8')
    expect(detail).toContain('useUnsavedChangesGuard(hasUnsavedChanges)')
    expect(detail).toContain('entityChanged || !visibilityDirty.value')
    expect(detail).toContain('entityChanged || !profileDirty.value')
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
      'team/src/views/JoinFieldsView.vue',
      'team/src/views/ResourceView.vue',
      'team/src/views/SettingsView.vue',
      'transaction/src/views/TransactionsView.vue',
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

  it('三个业务工作台的侧栏身份入口保持导航式左对齐', () => {
    const shells = [
      ['team', 'frontend/apps/team/src/components/TeamShell.vue', 'frontend/apps/team/src/components/TeamShell.vue'],
      ['shop', 'frontend/apps/shop/src/components/ShopManageShell.vue', 'frontend/apps/shop/src/components/ShopManageShell.vue'],
      ['transaction', 'frontend/apps/transaction/src/components/TransactionShell.vue', 'frontend/apps/transaction/src/app.css'],
    ] as const
    for (const [name, shellPath, stylePath] of shells) {
      const source = readFileSync(join(repository, shellPath), 'utf8')
      const styles = readFileSync(join(repository, stylePath), 'utf8')
      expect(source, `${name} 缺少身份入口`).toContain('<NButton class="logout"')
      expect(styles, `${name} 身份入口没有左对齐`).toMatch(/\.logout\s*\{[^}]*justify-content:\s*flex-start/)
      expect(source, `${name} 侧栏应进入身份切换页`).toContain('identityUrl()')
      expect(source, `${name} 侧栏应标明切换身份`).toContain('切换身份')
      expect(source, `${name} 侧栏不应直接退出登录`).not.toContain('退出登录')
    }
  })

  it('Team 个人概览的身份入口前往 Account 身份页', () => {
    const source = readFileSync(join(repository, 'frontend', 'apps', 'team', 'src', 'views', 'PersonalView.vue'), 'utf8')
    expect(source).toContain("import { identityUrl } from '@lostsky/shared/navigation'")
    expect(source).toContain("{ key: 'identity', label: '切换身份', href: identityUrl()")
    expect(source).toContain("{ key: 'team', label: '进入团队工作台', to: '/'")
    expect(source).not.toContain('to="/personal/profile">切换身份')
  })

  it('Team 侧栏禁用入口保持与链接一致的三列布局', () => {
    const source = readFileSync(join(repository, 'frontend', 'apps', 'team', 'src', 'components', 'TeamShell.vue'), 'utf8')
    expect(source).toMatch(/\.sidebar nav \.nav-disabled :deep\(\.n-button__content\)\{[^}]*grid-column:1\/-1;[^}]*width:100%;[^}]*display:grid;[^}]*grid-template-columns:24px minmax\(0,1fr\) auto/)
  })

  it('Team 设置分组保存按钮由业务组件统一紧凑宽度', () => {
    const page = readFileSync(join(repository, 'frontend', 'apps', 'team', 'src', 'views', 'SettingsView.vue'), 'utf8')
    const button = readFileSync(join(repository, 'frontend', 'apps', 'team', 'src', 'views', 'settings', 'SettingsSaveButton.vue'), 'utf8')
    expect(page).toContain('<SettingsSaveButton')
    expect(page).not.toMatch(/settings-header[^}]*width:/)
    expect(button).toContain("import LsButton from '@lostsky/ui/components/LsButton.vue'")
    expect(button).toContain('.settings-save-button { width: 9rem; }')
    expect(button).toContain('.settings-save-button { width: 100%; }')
    expect(button).not.toContain('width?:')
  })
})
