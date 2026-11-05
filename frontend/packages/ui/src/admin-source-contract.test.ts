import { readFileSync, readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

const repository = process.cwd()
const applicationNames = ['account', 'team', 'chat', 'transaction', 'admin', 'weibo']
const sourceRoots = [...applicationNames.map((name) => join(repository, 'frontend', 'apps', name, 'src')), join(repository, 'frontend', 'packages', 'ui', 'src')]

function filesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? filesUnder(path) : [path]
  })
}

// Team resolves @lostsky/ui to this primitive library, not to business callers.
function isTeamUiPrimitive(path: string) {
  return path.startsWith(join(repository, 'frontend', 'apps', 'team', 'src', 'ui') + sep)
}

function sourceFiles() {
  return sourceRoots.flatMap(filesUnder).filter((path) => /\.(?:ts|vue|css)$/.test(path) && !path.endsWith('.test.ts'))
}

const componentCallerRoots = readdirSync(join(repository, 'frontend', 'apps'), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(repository, 'frontend', 'apps', entry.name, 'src'))

describe('后台源码设计契约', () => {
  it('微博点单与预设页面复用公共页面、异步和列表原语', () => {
    const feed = readFileSync(join(repository, 'frontend/apps/weibo/src/views/FeedView.vue'), 'utf8')
    const presets = readFileSync(join(repository, 'frontend/apps/weibo/src/views/CommentPresetsView.vue'), 'utf8')
    const editor = readFileSync(join(repository, 'frontend/apps/weibo/src/views/CommentPresetFormView.vue'), 'utf8')
    for (const source of [feed, presets, editor]) {
      expect(source).toMatch(/<Ls(?:PageHeader|ObjectDirectory|FormPage)\b/)
      expect(source).not.toMatch(/<LsPage[ >]/)
      expect(source).toContain('<LsAsyncState')
      expect(source).not.toMatch(/<(?:NAlert|NSkeleton)\b/)
    }
    expect(readFileSync(join(repository, 'frontend/apps/weibo/src/App.vue'), 'utf8')).toContain('<LsPage id="workspace"')
    expect(feed).toContain('<LsEmptyState')
    expect(feed).toContain('<article v-for="item in displayedItems"')
    expect(feed).toContain(':aria-label="`${item.author_name')
    expect(feed).toContain('class="feed-summary"')
    expect(feed).not.toContain('LsListToolbar')
    expect(feed).not.toContain('NPagination')
    expect(feed).not.toContain('route.query.page')
    expect(feed).toContain('useInfiniteQuery({')
    expect(feed).toContain('new IntersectionObserver(')
    expect(feed).toContain('fetchNextPage({ cancelRefetch: false })')
    expect(feed).toContain(':aria-expanded="Boolean(drafts[item.id]?.expanded)"')
    expect(feed).not.toContain('<NButton')
    expect(feed).not.toContain('.feed-comment-link')
    expect(feed).not.toContain('last_error')
    expect(feed).not.toContain('.feed-list')
    expect(editor).toContain('<LsFormList')
    expect(editor).toContain('<LsFormActions>')
    expect(feed).toContain('<form')
    expect(feed).toContain('api.post')
    const interaction = readFileSync(join(repository, 'frontend/apps/weibo/src/views/InteractionView.vue'), 'utf8')
    for (const source of [feed, interaction]) {
      expect(source).toContain('<WeiboAccountField')
      expect(source).not.toContain('<NSelect')
    }
    expect(feed).toContain('<WeiboFeedCommentComposer')
    expect(interaction).toContain('<WeiboCommentFields')
    expect(presets).not.toContain('<form')
    expect(presets).toContain('path: `${listPath}/new`')
    expect(presets).not.toContain(':disabled=')
    expect(editor).not.toMatch(/draft\.(?:push|splice)/)
  })

  it('锁定 Naive UI 2.44.1 且不引入其他组件体系', () => {
    const manifest = JSON.parse(readFileSync(join(repository, 'package.json'), 'utf8')) as { dependencies: Record<string, string> }
    expect(manifest.dependencies['naive-ui']).toBe('2.44.1')
    const sources = sourceFiles()
      .map((path) => readFileSync(path, 'utf8'))
      .join('\n')
    expect(sources).not.toMatch(/from\s+['"](?:primevue|shadcn-vue|@shadcn)/i)
  })

  it('仅应用根与已登记独立流程场景注入主题 Provider', () => {
    const providerFiles = sourceFiles()
      .filter((path) => readFileSync(path, 'utf8').includes('NConfigProvider'))
      .map((path) => relative(repository, path).replaceAll('\\', '/'))
      .sort()
    expect(providerFiles).toEqual([
      ...applicationNames.map((name) => `frontend/apps/${name}/src/App.vue`),
      'frontend/apps/account/src/components/AccountFlowPage.vue',
      'frontend/apps/chat/src/components/ChatScene.vue',
      'frontend/apps/team/src/views/JoinView.vue',
    ].sort())
  })

  it('原生标准控件只存在于已登记的浏览器实现例外', () => {
    const controls = sourceFiles().filter((path) => !isTeamUiPrimitive(path)).flatMap((path) => {
      const source = readFileSync(path, 'utf8')
      return [...source.matchAll(/<(button|input|select|textarea)\b/gi)].map((match) => ({
        file: relative(repository, path).replaceAll('\\', '/'),
        control: match[1].toLowerCase(),
      }))
    })
    expect(controls).toEqual([
      {
        file: 'frontend/apps/account/src/views/LoginView.vue',
        control: 'button',
      },
      {
        file: 'frontend/apps/account/src/views/LoginView.vue',
        control: 'button',
      },
      {
        file: 'frontend/apps/account/src/views/LoginView.vue',
        control: 'button',
      },
      {
        file: 'frontend/packages/ui/src/components/LsMarkdownEditor.vue',
        control: 'button',
      },
      {
        file: 'frontend/packages/ui/src/components/LsMarkdownEditor.vue',
        control: 'button',
      },
      {
        file: 'frontend/packages/ui/src/components/LsMarkdownEditor.vue',
        control: 'button',
      },
      {
        file: 'frontend/packages/ui/src/components/LsMarkdownEditor.vue',
        control: 'button',
      },
      {
        file: 'frontend/packages/ui/src/components/LsMarkdownEditor.vue',
        control: 'textarea',
      },
      {
        file: 'frontend/packages/ui/src/components/LsMarkdownRenderer.vue',
        control: 'button',
      },
      {
        file: 'frontend/packages/ui/src/components/LsPagePrimaryAction.vue',
        control: 'button',
      },
      {
        file: 'frontend/packages/ui/src/components/LsUploadField.vue',
        control: 'input',
      },
    ])
  })

  it('应用调用方不得穿透公共组件的 ls 私有节点', () => {
    const offenders = componentCallerRoots
      .flatMap(filesUnder)
      .filter((path) => /\.(?:vue|css)$/.test(path))
      .filter((path) => !isTeamUiPrimitive(path))
      .filter((path) => readFileSync(path, 'utf8').includes(':deep(.ls-'))
      .map((path) => relative(repository, path).replaceAll('\\', '/'))
    expect(offenders).toEqual([])
  })

  it('微博评论栏只允许一个具名圆形发送微操作', () => {
    const source = readFileSync(join(repository, 'frontend/apps/weibo/src/components/WeiboFeedCommentComposer.vue'), 'utf8')
    expect(source.match(/<NButton\b/g)).toHaveLength(1)
    expect(source).toContain('<NButton circle type="primary"')
    expect(source).toContain('aria-label="发表评论"')
    expect(source).toContain('feedback.info(reason)')
    expect(source).not.toContain('name="feed-action"')
    expect(source).toContain('<NTag')
    expect(source).not.toContain('LsButton')
    expect(source).toContain('@keydown.space.prevent=')
    expect(source).toContain('.preset-chip:focus-visible')
  })

  it('Entity 候选统一使用公共富选择器', () => {
    const pages = componentCallerRoots.flatMap(filesUnder).filter((path) => path.endsWith('.vue') && !isTeamUiPrimitive(path))
    const legacy = pages
      .filter((path) => {
        const source = readFileSync(path, 'utf8')
        return source.includes('EntitySelectOption') || source.includes('entity-select-menu')
      })
      .map((path) => relative(repository, path).replaceAll('\\', '/'))
    expect(legacy).toEqual([])

    const plainSelects = pages.flatMap((path) => {
      const source = readFileSync(path, 'utf8')
      return [...source.matchAll(/<NSelect\b[^>]*>/gs)]
        .map((match) => match[0])
        .filter((tag) => /(?:handler_entity_id|sender_entity_id|cs_entity_id|assignee_entity_id|targetEntityId|visibility_target_ids)/.test(tag))
        .map((tag) => ({
          file: relative(repository, path).replaceAll('\\', '/'),
          tag,
        }))
    })
    expect(plainSelects).toEqual([])
  })

  it('公共组件和 Wiki 板块保持可定位', () => {
    const componentRules = readFileSync(join(repository, 'docs', 'dev', 'design', 'admin', 'components.md'), 'utf8')
    for (const name of ['LsButton', 'LsInlineError', 'LsPanel', 'LsSectionHeader', 'LsFormSection', 'LsFormActions', 'LsDescriptionList', 'LsStatusTag', 'LsPage', 'LsPageHeader', 'LsPagePrimaryAction', 'LsWorkspaceHeader', 'LsWorkspaceOverview', 'LsListToolbar', 'LsFormList', 'LsEntityIdentity', 'LsEntityTag', 'LsEntityCard', 'LsEntityInput', 'LsEntitySelect', 'LsResponsiveActions', 'LsResponsiveDataTable', 'LsUploadField', 'LsMediaUploadField', 'LsEmptyState', 'LsAsyncState', 'LsRouteErrorBoundary', 'LsSearchInput', 'LsField', 'LsCheckboxGroupField', 'LsSwitch', 'LsSwitchField', 'LsInput', 'LsMarkdownEditor', 'LsMarkdownRenderer']) {
      expect(componentRules, `${name} 缺少 Wiki 契约`).toContain(`\`${name}\``)
    }
    for (const page of ['index.md', 'foundations.md', 'components.md', 'componentization.md', 'patterns.md', 'states-and-access.md', 'responsive-accessibility.md', 'applications.md', 'checklist.md']) {
      expect(() => readFileSync(join(repository, 'docs', 'dev', 'design', 'admin', page), 'utf8')).not.toThrow()
    }
  })

  it('页面标题区主操作全部复用强制图标的统一组件', () => {
    const usages = componentCallerRoots
      .flatMap(filesUnder)
      .filter((path) => path.endsWith('.vue'))
      .flatMap((path) => [...readFileSync(path, 'utf8').matchAll(/<LsPagePrimaryAction\b[^>]*>/g)].map((match) => ({ path, tag: match[0] })))
    expect(usages.length).toBeGreaterThan(0)
    for (const usage of usages) {
      const file = relative(repository, usage.path).replaceAll('\\', '/')
      expect(usage.tag, `${file} 的页面主操作缺少强制 icon`).toMatch(/:icon=/)
      expect(usage.tag, `${file} 的页面主操作缺少稳定 label`).toMatch(/(?::label|label)=/)
      expect(usage.tag, `${file} 不得穿透页面主操作宽度`).not.toMatch(/(?:width|size|variant)=/)
    }
  })

  it('Markdown 与媒体资料字段不能退化成普通输入框', () => {
    const roots = ['team', 'shop'].map((name) => join(repository, 'frontend', 'apps', name, 'src'))
    const pages = roots.flatMap(filesUnder).filter((path) => path.endsWith('.vue'))
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

  it('人员资料的普通字段统一使用 LsField 且保持单列表单', () => {
    const source = readFileSync(join(repository, 'frontend', 'apps', 'team', 'src', 'components', 'EntityProfileFields.vue'), 'utf8')
    expect(source).not.toContain('NFormItem')
    expect(source).not.toContain('entity-profile-fields__media')
    expect(source.match(/<LsField\b/g)).toHaveLength(6)
    for (const suffix of ['avatar', 'intro-image', 'intro-video', 'introduction']) {
      expect(source).toContain(`:for-id="\`${'${idPrefix}'}-${suffix}\`"`)
    }
  })

  it('后台组件化方法由规则入口共同触发', () => {
    const references = ['AGENTS.md', 'docs/dev/design/admin/index.md', 'docs/dev/development/frontend.md', 'docs/dev/design/admin/checklist.md', 'docs/dev/development/checklist.md']
    for (const file of references) {
      const source = readFileSync(join(repository, ...file.split('/')), 'utf8')
      expect(source, `${file} 未引用组件化方法`).toContain('componentization.md')
    }
    const method = readFileSync(join(repository, 'docs', 'dev', 'design', 'admin', 'componentization.md'), 'utf8')
    for (const phrase of ['同意图', '三次及以上', '出现两次且包含状态', '组件化盘点', '迁移全部同义用法', '删除旧 CSS']) {
      expect(method).toContain(phrase)
    }
  })

  it('后台业务页面不恢复已淘汰的结构类名', () => {
    const roots = ['admin', 'team', 'transaction', 'shop'].map((name) => join(repository, 'frontend', 'apps', name, 'src'))
    const forbidden = /\b(?:form-panel|form-actions|section-heading|panel-heading|section-title)\b/
    for (const path of roots.flatMap(filesUnder).filter((path) => /\.(?:vue|css)$/.test(path) && !isTeamUiPrimitive(path))) {
      const file = relative(repository, path).replaceAll('\\', '/')
      expect(readFileSync(path, 'utf8'), `${file} 恢复了旧结构`).not.toMatch(forbidden)
    }
  })

  it('普通复选组统一复用 LsCheckboxGroupField', () => {
    const allowed = ['frontend/apps/team/src/components/JoinApplicationFields.vue', 'frontend/apps/team/src/ui/components/LsCheckboxGroupField.vue', 'frontend/packages/ui/src/components/LsCheckboxGroupField.vue']
    const roots = ['admin', 'team', 'transaction', 'shop'].map((name) => join(repository, 'frontend', 'apps', name, 'src')).concat(join(repository, 'frontend', 'packages', 'ui', 'src'))
    const files = roots
      .flatMap(filesUnder)
      .filter((path) => path.endsWith('.vue') && readFileSync(path, 'utf8').includes('NCheckboxGroup'))
      .map((path) => relative(repository, path).replaceAll('\\', '/'))
      .sort()
    expect(files).toEqual(allowed.sort())
  })

  it('标准详情页面复用 LsDescriptionList', () => {
    const required = ['frontend/apps/admin/src/views/UserDetailView.vue', 'frontend/apps/admin/src/views/TeamDetailView.vue', 'frontend/apps/admin/src/views/SystemView.vue', 'frontend/apps/team/src/views/JoinReviewDetailView.vue', 'frontend/apps/team/src/views/AbilitiesView.vue']
    for (const file of required) {
      expect(readFileSync(join(repository, ...file.split('/')), 'utf8'), `${file} 未复用标准详情列表`).toContain('LsDescriptionList')
    }
  })

  it('后台页面始终显示真实纵向滚动条，避免空白槽位和跨路由顶栏横向跳动', () => {
    const styles = readFileSync(join(repository, 'frontend', 'packages', 'ui', 'src', 'styles.css'), 'utf8')
    expect(styles).toMatch(/html\s*\{[^}]*overflow-y:\s*scroll;/)
    expect(styles).not.toMatch(/html\s*\{[^}]*scrollbar-gutter:/)
  })

  it('业务工作台应用导航按实际入口数量等宽排列并可滚动', () => {
    const header = readFileSync(join(repository, 'frontend', 'packages', 'ui', 'src', 'components', 'LsWorkspaceHeader.vue'), 'utf8')
    const styles = readFileSync(join(repository, 'frontend/packages/ui/src/components/workspace-header.css'), 'utf8')
    const teamHeader = readFileSync(join(repository, 'frontend/apps/team/src/ui/components/LsWorkspaceHeader.vue'), 'utf8')
    expect(header).toContain('<style scoped src="./workspace-header.css">')
    expect(teamHeader).toContain('packages/ui/src/components/workspace-header.css')
    expect(header).not.toContain('<style scoped>')
    expect(teamHeader).not.toContain('<style scoped>')
    expect(header).toContain('ls-workspace-header--app-nav')
    expect(styles).not.toMatch(/position:(?:sticky|fixed)/)
    expect(styles).toMatch(/ls-workspace-header__desktop\{grid-column:3;/)
    expect(styles).toContain('flex:0 0 88px')
    expect(styles).toContain('overflow-x:auto')
    expect(styles).not.toMatch(/width:(472|568)px|repeat\([56],88px\)/)
    expect(styles).toMatch(/color:var\(--ink\);font-size:\.82rem/)
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
      .filter((path) => readFileSync(path, 'utf8').includes("from 'vue-draggable-plus'"))
      .map((path) => relative(repository, path).replaceAll('\\', '/'))
    expect(imports).toEqual(['frontend/apps/team/src/ui/components/LsFormList.vue', 'frontend/packages/ui/src/components/LsFormList.vue'])
  })

  it('所有布尔控件统一复用 LsSwitch 或 LsSwitchField', () => {
    const switchFiles = componentCallerRoots
      .flatMap(filesUnder)
      .filter((path) => path.endsWith('.vue') && readFileSync(path, 'utf8').includes('<NSwitch'))
      .map((path) => relative(repository, path).replaceAll('\\', '/'))
      .sort()
    expect(switchFiles).toEqual(['frontend/apps/team/src/ui/components/LsSwitch.vue'])
    const primitive = readFileSync(join(repository, 'frontend/packages/ui/src/components/LsSwitch.vue'), 'utf8')
    expect(primitive).toContain('<NSwitch')
    expect(primitive).not.toMatch(/#(?:checked|unchecked)/)
    const applicationSource = componentCallerRoots
      .flatMap(filesUnder)
      .filter((path) => path.endsWith('.vue') && !isTeamUiPrimitive(path))
      .map((path) => readFileSync(path, 'utf8'))
      .join('\n')
    expect(applicationSource).not.toMatch(/class=["'][^"']*\bswitch-(?:row|field)\b/)
    expect(applicationSource).not.toMatch(/\b(?:checked|unchecked)-text=/)
    expect(applicationSource).not.toMatch(/#(?:checked|unchecked)/)
  })

  it('Team、Shop 与 Weibo 的未保存修改守卫统一进入公共包', () => {
    const files = ['team', 'shop', 'weibo'].flatMap(app => filesUnder(join(repository, `frontend/apps/${app}/src`)))
      .filter((path) => /\.(?:ts|vue)$/.test(path) && readFileSync(path, 'utf8').includes('beforeunload'))
      .map((path) => relative(repository, path).replaceAll('\\', '/'))
    expect(files).toEqual([])
    expect(readFileSync(join(repository, 'frontend/packages/shared/src/useUnsavedChangesGuard.ts'), 'utf8')).toContain('beforeunload')
    const detail = readFileSync(join(repository, 'frontend/apps/team/src/views/EntityDetailView.vue'), 'utf8')
    expect(detail).toContain('useUnsavedChangesGuard(hasUnsavedChanges)')
    expect(detail).toContain('entityChanged || !visibilityDirty.value')
    expect(detail).toContain('entityChanged || !profileDirty.value')
  })

  it('页面级空数据状态统一复用 LsEmptyState', () => {
    const requiredPages = ['account/src/views/TeamsView.vue', 'account/src/views/IdentityView.vue', 'chat/src/views/RequestsView.vue', 'admin/src/views/UsersView.vue', 'admin/src/views/TeamsView.vue', 'admin/src/views/AdministratorsView.vue', 'admin/src/views/RolesView.vue', 'admin/src/views/AuditView.vue', 'team/src/views/EntitiesView.vue', 'team/src/views/MembersView.vue', 'team/src/views/CustomersView.vue', 'team/src/views/RolesView.vue', 'team/src/views/ChatVirtualsView.vue', 'team/src/views/DocumentsView.vue', 'team/src/views/FilesView.vue', 'team/src/views/EntityFieldsView.vue', 'team/src/views/NoticesView.vue', 'team/src/views/JoinReviewView.vue', 'team/src/views/JoinFieldsView.vue', 'team/src/views/AbilitiesView.vue', 'team/src/views/SettingsView.vue', 'transaction/src/views/TransactionsView.vue', 'transaction/src/views/BalancesView.vue', 'transaction/src/views/BalanceLogsView.vue']
    for (const page of requiredPages) {
      const source = readFileSync(join(repository, 'frontend', 'apps', page), 'utf8')
      expect(source, `${page} 未复用页面级空状态`).toContain('LsEmptyState')
    }
  })

  it('Permission 与 Ability 原因只进入 info 弹窗或按钮权限态', () => {
    const roots = ['admin', 'team', 'transaction', 'shop', 'weibo']
      .map((name) => join(repository, 'frontend', 'apps', name, 'src'))
    const pages = roots.flatMap(filesUnder).filter((path) => path.endsWith('.vue'))
    const forbiddenAttribute = /:(?:description|empty-description|hint|title|placeholder|count-label)=["'][^"']*(?:routeAccess\.reason\.value|permissionReason\(|abilityReason\()/
    const forbiddenContent = /<(?:p|span|small|dd|NAlert|NEmpty|LsEmptyState)\b[^>]*>[^<]*(?:routeAccess\.reason\.value|permissionReason\(|abilityReason\()/
    for (const path of pages) {
      const source = readFileSync(path, 'utf8')
      const file = relative(repository, path).replaceAll('\\', '/')
      expect(source, `${file} 把授权原因写进了页面属性`).not.toMatch(forbiddenAttribute)
      expect(source, `${file} 把授权原因写进了页面正文`).not.toMatch(forbiddenContent)
    }

    const client = readFileSync(join(repository, 'frontend', 'packages', 'api', 'src', 'client.ts'), 'utf8')
    expect(client).toContain('feedback.info(accessReason)')
    expect(client).toContain("if (method === 'GET') return deniedRead(accessReason) as T")
    expect(client).toContain("if (accessMessage) return ''")

    const rules = readFileSync(join(repository, 'docs', 'dev', 'design', 'admin', 'states-and-access.md'), 'utf8')
    expect(rules).toContain('受限空状态')
    expect(rules).toContain('LsEmptyState')

    for (const component of ['LsSwitch.vue', 'LsSwitchField.vue', 'LsUploadField.vue', 'LsCheckboxGroupField.vue', 'LsResponsiveActions.vue', 'LsMarkdownEditor.vue']) {
      const source = readFileSync(join(repository, 'frontend', 'packages', 'ui', 'src', 'components', component), 'utf8')
      expect(source, `${component} 不得把禁用原因写入 title`).not.toMatch(/:title=["'][^"']*(?:Reason|reason)/)
    }
    expect(readFileSync(join(repository, 'frontend/packages/ui/src/components/LsSwitchField.vue'), 'utf8')).not.toContain('ls-switch-field__reason')
    expect(readFileSync(join(repository, 'frontend/packages/ui/src/components/LsUploadField.vue'), 'utf8')).not.toContain('ls-upload-field__reason')
    expect(readFileSync(join(repository, 'frontend/packages/ui/src/components/LsCheckboxGroupField.vue'), 'utf8')).not.toContain('ls-checkbox-group-field__reason')
    expect(readFileSync(join(repository, 'frontend/packages/ui/src/components/LsMarkdownEditor.vue'), 'utf8')).not.toContain('markdown-upload-reason')
  })

  it('任务页面入口不使用 Permission 或 Ability 禁用态', () => {
    // A missing identifier may block navigation only when that exact value is
    // interpolated into the destination; permission and ability guards may not.
    const missingRouteTarget = (tag: string) => {
      const condition = tag.match(/:disabled=(["'])(.*?)\1/)?.[2]
      const target = condition?.match(/^!([\w$]+(?:\.[\w$]+)+)$/)?.[1]
      const action = tag.match(/@click=(["'])(.*?)\1/)?.[2]
      return Boolean(target && action?.includes('${' + target + '}') && !/:disabled-reason=/.test(tag))
    }
    expect(missingRouteTarget('<LsButton @click="router.push(`/entity?id=${row.entity_id}`)" :disabled="!row.entity_id">')).toBe(true)
    expect(missingRouteTarget('<LsButton @click="router.push(`/entity?id=${row.entity_id}`)" :disabled="!access.canRead">')).toBe(false)
    expect(missingRouteTarget('<LsButton @click="router.push(`/entity?id=${row.entity_id}`)" :disabled="!row.entity_id || !canRead">')).toBe(false)
    const roots = ['admin', 'team', 'transaction', 'shop', 'weibo']
      .map((name) => join(repository, 'frontend', 'apps', name, 'src'))
    const pages = roots.flatMap(filesUnder).filter((path) => path.endsWith('.vue'))
    for (const path of pages) {
      const source = readFileSync(path, 'utf8')
      const file = relative(repository, path).replaceAll('\\', '/')
      for (const match of source.matchAll(/<LsPagePrimaryAction\b[\s\S]*?\/>/g)) {
        const tag = match[0]
        if (!/(?:\bto=|\bhref=|:to=|:href=)/.test(tag)) continue
        expect(tag, `${file} 的任务页面入口被设置为禁用`).not.toMatch(/:disabled(?:-reason)?=/)
      }
      for (const match of source.matchAll(/<LsButton\b[\s\S]*?>/g)) {
        const tag = match[0]
        if (!/@click=["'][^"']*router\.(?:push|replace)\(/.test(tag)) continue
        if (missingRouteTarget(tag)) continue
        expect(tag, `${file} 的路由跳转按钮被设置为禁用`).not.toMatch(/:disabled(?:-reason)?=/)
      }
    }
  })

  it('后台页面不恢复已经废弃的页面级皮肤和重复表格', () => {
    const roots = ['admin', 'team', 'transaction'].map((name) => join(repository, 'frontend', 'apps', name, 'src'))
    const pages = roots.flatMap(filesUnder).filter((path) => path.endsWith('.vue'))
    const forbidden = [
      { pattern: /<table\b/i, label: '原生 table' },
      {
        pattern: /class=["'][^"']*\bloading-list\b/i,
        label: '页面级 loading-list',
      },
      {
        pattern: /class=["'][^"']*\bfeedback\s+error\b/i,
        label: '手写行内错误',
      },
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
    const allowed = new Set(['frontend/apps/admin/src/components/AdminShell.vue', 'frontend/apps/admin/src/views/DashboardView.vue', 'frontend/apps/team/src/components/TeamShell.vue', 'frontend/apps/team/src/views/RoleDetailView.vue', 'frontend/apps/transaction/src/components/TransactionShell.vue'])
    const offenders = ['admin', 'team', 'transaction']
      .flatMap((name) => filesUnder(join(repository, 'frontend', 'apps', name, 'src')))
      .filter((path) => !isTeamUiPrimitive(path))
      .filter((path) => path.endsWith('.vue') && readFileSync(path, 'utf8').includes('<NButton'))
      .map((path) => relative(repository, path).replaceAll('\\', '/'))
      .filter((path) => !allowed.has(path))
    expect(offenders).toEqual([])
  })

  it('Team 分类导航原语封闭视觉并保留标准控件语义', () => {
    const item = readFileSync(join(repository, 'frontend/apps/team/src/ui/components/LsCategoryNavigationItem.vue'), 'utf8')
    const navigation = readFileSync(join(repository, 'frontend/apps/team/src/components/TeamCategoryNavigation.vue'), 'utf8')
    expect(item).toContain("import { NButton } from 'naive-ui'")
    expect(item).toContain('<RouterLink v-if="to"')
    expect(item).toContain('<NButton v-else')
    expect(item).not.toMatch(/<button\b/)
    expect(item.match(/defineProps<([\s\S]*?)>\(\)/)?.[1]).not.toMatch(/(?:variant|size|appearance|className)\??:/)
    expect(navigation).toContain('<LsCategoryNavigationItem')
    expect(navigation).not.toMatch(/:deep\(|:is\(button,\s*a\)/)
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
      expect(source, `${name} 缺少身份入口`).toMatch(/<NButton\s+class=["']logout["']/)
      expect(styles, `${name} 身份入口没有左对齐`).toMatch(/\.logout\s*\{[^}]*justify-content:\s*flex-start/)
      expect(source, `${name} 侧栏应进入身份切换页`).toContain('identityUrl()')
      expect(source, `${name} 侧栏应标明切换身份`).toContain('切换身份')
      expect(source, `${name} 侧栏不应直接退出登录`).not.toContain('退出登录')
    }
  })

  it('Team 个人概览提供团队入口与使用文档', () => {
    const source = readFileSync(join(repository, 'frontend', 'apps', 'team', 'src', 'views', 'PersonalView.vue'), 'utf8')
    expect(source).toContain('<LsPageLink to="/" :icon="House" label="进入团队工作台"')
    expect(source).toContain('<LsPageLink href="//doc.lostsky.work" :icon="BookOpen" label="使用文档"')
    expect(source).not.toContain("{ key: 'identity', label: '切换身份'")
  })

  it('Team 侧栏全部入口使用可导航链接', () => {
    const source = readFileSync(join(repository, 'frontend', 'apps', 'team', 'src', 'components', 'TeamShell.vue'), 'utf8')
    expect(source).not.toContain('nav-disabled')
    expect(source).not.toContain('item.permission')
  })

  it('Team 设置分组保存按钮由业务组件统一紧凑宽度', () => {
    const page = readFileSync(join(repository, 'frontend', 'apps', 'team', 'src', 'views', 'SettingsView.vue'), 'utf8')
    const button = readFileSync(join(repository, 'frontend', 'apps', 'team', 'src', 'views', 'settings', 'SettingsSaveButton.vue'), 'utf8')
    expect(page).toContain('<TeamSettingsGroup')
    const group = readFileSync(join(repository, 'frontend/apps/team/src/components/TeamSettingsGroup.vue'), 'utf8')
    expect(group).toContain('<SettingsSaveButton')
    expect(page).not.toMatch(/settings-header[^}]*width:/)
    expect(button).toContain("import LsButton from '@lostsky/ui/components/LsButton.vue'")
    expect(button).toContain('.settings-save-button { width: min(9rem, 100%); }')
    expect(button).toContain('.settings-save-button { width: 100%; }')
    expect(button).not.toContain('width?:')
  })
})
