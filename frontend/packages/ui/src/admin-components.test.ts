import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

const feedbackInfo = vi.hoisted(() => vi.fn())

vi.mock('./feedback', () => ({
  feedback: { info: feedbackInfo },
}))

vi.mock('naive-ui', async () => {
  const actual = await vi.importActual<typeof import('naive-ui')>('naive-ui')
  const { defineComponent, h: createNode } = await import('vue')
  return {
    ...actual,
    NDropdown: defineComponent({
      name: 'NDropdownStub',
      setup(_props, { slots }) {
        return () => createNode('div', { class: 'n-dropdown-stub' }, slots.default?.())
      },
    }),
  }
})
import LsAsyncState from './components/LsAsyncState.vue'
import LsButton from './components/LsButton.vue'
import LsCheckboxGroupField from './components/LsCheckboxGroupField.vue'
import LsDescriptionList from './components/LsDescriptionList.vue'
import LsFormActions from './components/LsFormActions.vue'
import LsInput from './components/LsInput.vue'
import LsField from './components/LsField.vue'
import LsFormSection from './components/LsFormSection.vue'
import LsInlineError from './components/LsInlineError.vue'
import LsPanel from './components/LsPanel.vue'
import LsStatusTag from './components/LsStatusTag.vue'
import LsSwitch from './components/LsSwitch.vue'
import LsSectionHeader from './components/LsSectionHeader.vue'
import LsSwitchField from './components/LsSwitchField.vue'
import LsEmptyState from './components/LsEmptyState.vue'
import LsEntityIdentity from './components/LsEntityIdentity.vue'
import LsEntityTag from './components/LsEntityTag.vue'
import LsFormList from './components/LsFormList.vue'
import LsListToolbar from './components/LsListToolbar.vue'
import LsMediaUploadField from './components/LsMediaUploadField.vue'
import LsMarkdownRenderer from './components/LsMarkdownRenderer.vue'
import LsPageHeader from './components/LsPageHeader.vue'
import LsPagePrimaryAction from './components/LsPagePrimaryAction.vue'
import LsResponsiveActions from './components/LsResponsiveActions.vue'
import LsResponsiveDataTable from './components/LsResponsiveDataTable.vue'
import LsUploadField from './components/LsUploadField.vue'
import LsAppSwitcher from './components/LsAppSwitcher.vue'
import LsWorkspaceHeader from './components/LsWorkspaceHeader.vue'
import LsWorkspaceOverview from './components/LsWorkspaceOverview.vue'
import { House, ReceiptText, Save, ShoppingBag, UserRound } from '@lucide/vue'
import { lostskyNaiveTheme } from './naive-theme'

async function render(component: Parameters<typeof h>[0], props: Record<string, unknown> = {}, slots: Record<string, () => ReturnType<typeof h>> = {}) {
  const app = createSSRApp({ render: () => h(component, props, slots) })
  app.component(
    'RouterLink',
    defineComponent({
      props: { to: { type: [String, Object], required: true } },
      setup(linkProps, { slots: linkSlots }) {
        return () =>
          h(
            'a',
            {
              'data-to': typeof linkProps.to === 'string' ? linkProps.to : JSON.stringify(linkProps.to),
            },
            linkSlots.default?.(),
          )
      },
    }),
  )
  return renderToString(app)
}

describe('后台设计系统组件契约', () => {
  it('固定后台控件高度和圆角令牌', () => {
    expect(lostskyNaiveTheme.Button).toMatchObject({
      heightSmall: '40px',
      heightMedium: '44px',
      heightLarge: '48px',
    })
    expect(lostskyNaiveTheme.Input).toMatchObject({
      heightSmall: '40px',
      heightMedium: '44px',
      heightLarge: '48px',
      borderRadius: '10px',
    })
    expect(lostskyNaiveTheme.InternalSelection).toMatchObject({
      heightSmall: '40px',
      heightMedium: '44px',
      heightLarge: '48px',
    })
  })

  it('LsButton 保留旧 API 并渲染 Naive UI 按钮', async () => {
    const html = await render(LsButton, { variant: 'danger', size: 'lg', disabled: true }, { default: () => h('span', '删除') })
    expect(html).toContain('n-button')
    expect(html).toContain('disabled')
    expect(html).toContain('删除')
  })

  it('LsButton 在公共层统一解释不可用原因', () => {
    expect(Object.keys((LsButton as any).props).sort()).toEqual(['disabled', 'disabledReason', 'loading', 'size', 'type', 'variant'])
    const source = readFileSync(new URL('./components/LsButton.vue', import.meta.url), 'utf8')
    expect(source).toContain('feedback.info(props.disabledReason.trim())')
    expect(source).toContain('event.preventDefault()')
    expect(source).not.toContain(':title="disabledReason || undefined"')
  })

  it('LsButton 的低强调危险动作保留危险语义而不改变实心危险动作', async () => {
    const ghost = await render(LsButton, { variant: 'danger-ghost' }, { default: () => h('span', '删除') })
    const solid = await render(LsButton, { variant: 'danger' }, { default: () => h('span', '确认删除') })
    expect(ghost).toContain('n-button--error-type')
    expect(ghost).toContain('--n-color:#0000;')
    expect(solid).toContain('n-button--error-type')
    expect(solid).not.toContain('--n-color:#0000;')
  })

  it('LsSwitch 是唯一 Naive UI 开关原语且不在轨道内放文字', async () => {
    expect(Object.keys((LsSwitch as any).props).sort()).toEqual(['disabled', 'disabledReason', 'loading', 'modelValue', 'readOnly'])
    const source = readFileSync(new URL('./components/LsSwitch.vue', import.meta.url), 'utf8')
    expect(source).toContain('<NSwitch')
    expect(source).not.toMatch(/#(?:checked|unchecked)/)
    expect(source).toContain('feedback.info(props.disabledReason.trim())')
    expect(source).toContain("'ls-switch--explainable-disabled'")
    expect(source).toContain(':disabled="(disabled || readOnly) && !explainableUnavailable"')
    expect(source).not.toContain(':title=')
    expect(source).toContain(".ls-switch[aria-disabled='true'] :deep(.n-switch__rail)")
    expect(source).toContain(".ls-switch[aria-disabled='true'] :deep(.n-switch__button)")
    expect(source).toContain('background-color: var(--line)')
    const html = await render(LsSwitch, {
      modelValue: true,
      'aria-label': '公开展示',
    })
    expect(html).toContain('n-switch')
    const readOnlyHtml = await render(LsSwitch, {
      modelValue: false,
      readOnly: true,
      'aria-label': '固定状态',
    })
    expect(readOnlyHtml).toContain('aria-disabled="true"')
    expect(readOnlyHtml).toContain('aria-readonly="true"')
  })

  it('LsButton 将命令图标交给固定 icon 插槽', async () => {
    const html = await render(LsButton, {}, { icon: () => h('span', '图标'), default: () => h('span', '保存') })
    expect(html).toContain('图标')
    expect(html).toContain('保存')
  })

  it('LsPagePrimaryAction 强制图标和标签并统一标题区主操作尺寸', async () => {
    expect((LsPagePrimaryAction as any).props.icon.required).toBe(true)
    expect((LsPagePrimaryAction as any).props.label.required).toBe(true)
    const html = await render(LsPagePrimaryAction, {
      icon: Save,
      label: '保存资料',
      disabled: true,
      disabledReason: '当前资料不可保存',
    })
    expect(html).toContain('ls-page-primary-action')
    expect(html).toContain('保存资料')
    expect(html).toContain('aria-disabled="true"')
    expect(html).not.toContain('title=')
    const loadingHtml = await render(LsPagePrimaryAction, {
      icon: Save,
      label: '保存资料',
      loading: true,
    })
    expect(loadingHtml).toContain('disabled')
    expect(loadingHtml).toContain('aria-busy="true"')
    const source = readFileSync(new URL('./components/LsPagePrimaryAction.vue', import.meta.url), 'utf8')
    expect(source).toContain('width: 8.5rem;')
    expect(source).toContain('max-width: 100%;')
    expect(source).toContain('height: var(--touch-target);')
    expect(source).toContain('border-radius: var(--radius-sm);')
    expect(source).not.toContain('.ls-page-primary-action { width: 100%;')
    expect(source).toContain('<RouterLink v-if="to && !disabled && !loading"')
  })

  it('LsInlineError 固定行内错误语义且仅接收 message', async () => {
    expect(Object.keys((LsInlineError as any).props)).toEqual(['message'])
    const html = await render(LsInlineError, { message: '保存失败' })
    expect(html).toContain('role="alert"')
    expect(html).toContain('保存失败')
    expect(await render(LsInlineError, { message: '' })).not.toContain('role="alert"')
  })

  it('LsMediaUploadField 强制接收真实上传函数并保留 URL 回填', async () => {
    expect((LsMediaUploadField as any).props.upload.required).toBe(true)
    const html = await render(LsMediaUploadField, {
      modelValue: '/avatar.png',
      upload: async () => '/uploaded.png',
      accept: 'image/*',
      buttonLabel: '上传头像',
    })
    expect(html).toContain('/avatar.png')
    expect(html).toContain('上传头像')
  })

  it('LsUploadField 仅在上传语义内固定紧凑宽度并在移动端铺满', () => {
    const source = readFileSync(new URL('./components/LsUploadField.vue', import.meta.url), 'utf8')
    expect(source).toContain('grid-template-columns:minmax(0,1fr) 8.5rem')
    expect(source).toContain('grid-template-columns:8.5rem')
    expect(source).toContain('<LsButton')
    expect(source).toContain('<slot name="trigger"')
    expect(source).toContain('grid-template-columns:minmax(0,1fr) max-content')
    expect(source).toContain('@media(max-width:639px){.ls-upload-field__controls,.ls-upload-field__controls--without-url')
  })

  it('不同命令按语义自主管理尺寸，页面主操作独立等宽', () => {
    const styles = readFileSync(new URL('./styles.css', import.meta.url), 'utf8')
    const upload = readFileSync(new URL('./components/LsUploadField.vue', import.meta.url), 'utf8')
    const list = readFileSync(new URL('./components/LsFormList.vue', import.meta.url), 'utf8')
    const actions = readFileSync(new URL('./components/LsFormActions.vue', import.meta.url), 'utf8')
    const pageAction = readFileSync(new URL('./components/LsPagePrimaryAction.vue', import.meta.url), 'utf8')
    expect(styles).not.toContain('--form-command-width')
    expect(upload).not.toContain('var(--form-command-width)')
    expect(list).toContain('.ls-form-list__add { justify-self: start;')
    expect(list).toContain('min-width: 7rem;')
    expect(list).toContain('.ls-form-list__add { width: 100%; }')
    expect(actions).toContain('.ls-form-actions :deep(.ls-button) { min-width: min(7rem, 100%); }')
    expect(actions).toContain('.ls-form-actions :deep(.ls-button) { width: 100%; }')
    expect(pageAction).toContain('width: 8.5rem;')
    expect(pageAction).not.toContain('width?:')
  })

  it('LsMarkdownRenderer 只提供具名阅读上下文，不暴露视觉尺寸入口', () => {
    expect(Object.keys((LsMarkdownRenderer as any).props).sort()).toEqual(['chatEnabled', 'content', 'context', 'resolveEntities'])
    const source = readFileSync(new URL('./components/LsMarkdownRenderer.vue', import.meta.url), 'utf8')
    expect(source).toContain("context?: 'inline' | 'document'")
    expect(source).toContain('.ls-markdown-renderer--document')
  })

  it('LsPanel 只提供结构插槽，不暴露视觉参数', async () => {
    expect((LsPanel as any).props).toBeUndefined()
    const html = await render(
      LsPanel,
      {},
      {
        header: () => h('h2', '标题'),
        default: () => h('p', '正文'),
        footer: () => h('span', '页脚'),
      },
    )
    expect(html).toContain('ls-panel__header')
    expect(html).toContain('ls-panel__body')
    expect(html).toContain('ls-panel__footer')
  })

  it('LsSectionHeader 统一标题层级、说明和末端内容', async () => {
    const html = await render(
      LsSectionHeader,
      {
        id: 'profile-section',
        title: '公开资料',
        description: '展示在当前团队中的名称和介绍。',
        eyebrow: 'ENTITY',
        headingLevel: 3,
      },
      { aside: () => h('span', '本人可见') },
    )
    expect(html).toContain('<h3 id="profile-section"')
    expect(html).toContain('展示在当前团队中的名称和介绍。')
    expect(html).toContain('本人可见')
  })

  it('LsFormSection 组合面板和区块标题但不接管表单', async () => {
    const html = await render(
      LsFormSection,
      { id: 'product-basic', title: '基本信息', description: '填写商品资料。' },
      {
        default: () => h('label', '商品名称'),
      },
    )
    expect(html).toContain('ls-panel')
    expect(html).toContain('aria-labelledby="product-basic"')
    expect(html).toContain('ls-form-section')
    expect(html).toContain('商品名称')
    expect(html).not.toContain('<form')
  })

  it('LsField 固定控件轨道并阻止提示文字拉开相邻控件', async () => {
    expect(Object.keys((LsField as any).props).sort()).toEqual(['error', 'forId', 'hint', 'label', 'required'])
    const html = await render(
      LsField,
      { label: '授予额度', forId: 'quantity', hint: '单位：次；最小步长 1' },
      {
        default: () => h('input', { id: 'quantity' }),
      },
    )
    expect(html).toContain('ls-field__control')
    expect(html).toContain('单位：次；最小步长 1')
    const source = readFileSync(new URL('./components/LsField.vue', import.meta.url), 'utf8')
    expect(source).toContain('min-width: 0; display: grid; align-content: start;')
    expect(source).toContain('.ls-field__control :deep(> *) { min-width: 0; width: 100%; max-width: 100%; }')
  })

  it('LsFormActions 和 LsDescriptionList 只提供稳定结构', async () => {
    expect((LsFormActions as any).props).toBeUndefined()
    expect((LsDescriptionList as any).props).toBeUndefined()
    const actions = await render(LsFormActions, {}, { default: () => h(LsButton, {}, { default: () => '保存' }) })
    const details = await render(LsDescriptionList, {}, { default: () => [h('dt', '状态'), h('dd', '正常')] as any })
    expect(actions).toContain('ls-form-actions')
    expect(actions).not.toContain('ls-form-actions__destructive')
    const separated = await render(LsFormActions, {}, {
      destructive: () => h(LsButton, { variant: 'danger-ghost' }, { default: () => '删除角色' }),
      default: () => h(LsButton, {}, { default: () => '保存资料' }),
    })
    expect(separated).toContain('ls-form-actions__destructive')
    expect(separated.indexOf('删除角色')).toBeLessThan(separated.indexOf('保存资料'))
    expect(details).toContain('<dl class="ls-description-list"')
    expect(details).toContain('<dt>状态</dt><dd>正常</dd>')
  })

  it('LsCheckboxGroupField 关联字段提示且不常驻显示禁用原因', async () => {
    const html = await render(LsCheckboxGroupField, {
      id: 'role-options',
      modelValue: [1],
      label: '团队角色',
      required: true,
      hint: '选择一个或多个角色。',
      options: [
        {
          value: 1,
          label: '运营',
          meta: 'operator',
          description: '维护日常业务。',
        },
        {
          value: 2,
          label: '财务',
          disabled: true,
          disabledReason: '当前角色不可分配',
        },
      ],
    })
    expect(html).toContain('<fieldset')
    expect(html).toContain('<legend id="role-options-label"')
    expect(html).toContain('aria-describedby="role-options-hint"')
    expect(html).toContain('维护日常业务。')
    expect(html).not.toContain('当前角色不可分配')
    const source = readFileSync(new URL('./components/LsCheckboxGroupField.vue', import.meta.url), 'utf8')
    expect(source).toContain('min-height: 60px')
    expect(source).toContain('@media (max-width: 639px)')
  })

  it('LsStatusTag 固定 small 和无边框外观', async () => {
    const html = await render(LsStatusTag, { label: '正常', type: 'success' })
    expect(html).toContain('正常')
    expect(html).toContain('--n-text-color:#18a058')
  })

  it('工具栏统一搜索、筛选、动作和结果数量', async () => {
    const html = await render(
      LsListToolbar,
      { modelValue: '天空', placeholder: '搜索成员', countLabel: '2 位成员' },
      {
        filters: () => h('span', '全部成员'),
        actions: () => h('button', '新建'),
      },
    )
    expect(html).toContain('role="search"')
    expect(html).toContain('搜索成员')
    expect(html).toContain('全部成员')
    expect(html).toContain('新建')
    expect(html).toContain('2 位成员')

    const filtersOnly = await render(
      LsListToolbar,
      { searchable: false, countLabel: '4 条订单' },
      {
        filters: () => h('span', '全部状态'),
      },
    )
    expect(filtersOnly).toContain('ls-list-toolbar--filters-only')
    expect(filtersOnly).not.toContain('ls-search-input')
    expect(filtersOnly).toContain('4 条订单')
  })

  it('表单列表提供稳定键值、等价排序动作和只读状态', async () => {
    const items = [
      { key: 1, name: '指南' },
      { key: 2, name: '精选' },
    ]
    const html = await render(
      LsFormList as any,
      {
        modelValue: items,
        itemKey: (item: (typeof items)[number]) => item.key,
        createItem: () => ({ key: 3, name: '' }),
        itemLabel: '标签',
        addLabel: '添加标签',
        disabled: true,
      },
      { item: () => h('span', '标签字段') },
    )
    expect(html).toContain('标签 1')
    expect(html).toContain('上移标签 1')
    expect(html).toContain('下移标签 2')
    expect(html).toContain('删除标签 1')
    expect(html).toContain('添加标签')
    expect(html).toContain('aria-live="polite"')
    expect(html).toContain('disabled')
    expect(html).toMatch(/ls-form-list__label[^]*ls-form-list__actions[^]*ls-form-list__content/)
    const source = readFileSync(new URL('./components/LsFormList.vue', import.meta.url), 'utf8')
    expect(source).toContain('.ls-form-list__content { min-width: 0; grid-column: 2 / -1;')
  })

  it('主体身份优先真实头像，并保留类型、名称和 slug', async () => {
    const html = await render(
      LsEntityIdentity,
      {
        type: 'teamMember',
        name: '青空',
        slug: 'sky',
        imageUrl: '/avatar.png',
      },
      { status: () => h('span', '正常') },
    )
    expect(html).toContain('src="/avatar.png"')
    expect(html).toContain('成员')
    expect(html).toContain('青空')
    expect(html).toContain('@sky')
    expect(html).toMatch(/ls-entity-identity__name-row[^]*青空[^]*正常/)
  })

  it('Entity 胶囊统一显示类型图标、名称和完整身份提示', async () => {
    const html = await render(LsEntityTag, {
      type: 'teamMember',
      name: '青空成员',
      slug: 'qingkong',
      closable: true,
    })
    const virtualHtml = await render(LsEntityTag, {
      type: 'teamVirtual',
      name: '协作助手',
      slug: 'helper',
    })
    expect(html).toContain('ls-entity-tag')
    expect(html).toContain('data-entity-tone="member"')
    expect(html).toContain('青空成员 · 成员 · @qingkong')
    expect(html).toContain('ls-entity-tag__name')
    expect(html).toContain('n-tag__close')
    expect(virtualHtml).toContain('data-entity-tone="virtual"')
    expect(virtualHtml).toContain('协作助手 · 虚拟人员 · @helper')
  })

  it('Entity 下拉统一提供类型、slug 与多字段搜索', () => {
    const source = readFileSync(new URL('./components/LsEntitySelect.vue', import.meta.url), 'utf8')
    expect(source).toContain('class="ls-entity-select"')
    expect(source).toContain('ls-entity-select-option__type')
    expect(source).toContain('entityTypeLabel(entity.entityType)')
    expect(source).toContain('[entity.name, entity.slug, entityTypeLabel(entity.entityType), entity.value]')
    expect(source).toContain('h(LsEntityTag')
    expect(source).toContain("class: 'ls-entity-select-value'")
    expect(source).toContain(':render-tag="renderTag"')
    expect(source).not.toContain('ls-entity-select-tag__name')
    expect(source).toContain(':max-tag-count="multiple ? \'responsive\' : undefined"')
    expect(source).toContain('min-height:54px')
    expect(source).toContain('.n-base-select-option--selected.n-base-select-option--pending')
    expect(source).toContain('color:color-mix(in oklch,var(--ink),transparent 38%)')
  })

  it('应用切换与通用命令使用不同语义，当前应用由调用方声明', async () => {
    expect(Object.keys((LsAppSwitcher as any).props).sort()).toEqual(['actions', 'currentApp'])
    expect(Object.keys((LsWorkspaceHeader as any).props).sort()).toEqual(['actions', 'appNavigation', 'contextLabel', 'contextual', 'currentApp', 'scene', 'showMenu', 'title'])
    const source = readFileSync(new URL('./components/LsAppSwitcher.vue', import.meta.url), 'utf8')
    expect(source).toContain('aria-label="切换应用"')
    expect(source).toContain('action.key === currentApp')
    expect(source).toContain('@keydown.esc.stop.prevent="closeApps"')
    expect(source).toContain('grid-template-columns:repeat(2,minmax(0,1fr))')
    for (const app of ['team', 'shop', 'transaction', 'weibo']) {
      const shell = app === 'shop' ? 'ShopManageShell' : `${app[0].toUpperCase()}${app.slice(1)}Shell`
      expect(readFileSync(new URL(`../../../apps/${app}/src/components/${shell}.vue`, import.meta.url), 'utf8')).toContain(`current-app="${app}"`)
    }
  })

  it('页面标题、工作区标题和响应式动作始终保留可读文字', async () => {
    const pageHeader = await render(LsPageHeader, {
      title: '成员',
      description: '团队成员目录',
    })
    const pageHeaderSource = readFileSync(new URL('./components/LsPageHeader.vue', import.meta.url), 'utf8')
    const workspaceHeader = await render(LsWorkspaceHeader, {
      contextLabel: 'TEAM WORKSPACE',
      title: '成员',
      actions: [{ key: 'notice', label: '通知' }],
    })
    const actions = await render(LsResponsiveActions, {
      primaryKey: 'manage',
      actions: [
        { key: 'manage', label: '管理' },
        { key: 'remove', label: '移出' },
      ],
    })
    expect(pageHeader).toContain('团队成员目录')
    expect(pageHeader).toContain('ls-page-header__copy')
    expect(pageHeaderSource).toContain('.ls-page-header__copy{display:contents}')
    expect(pageHeaderSource).toContain('.ls-page-header p{grid-column:1;grid-row:2;margin-top:0}')
    expect(pageHeaderSource).toContain('.ls-page-header__content--described .ls-page-header__actions{grid-row:2}')
    expect(workspaceHeader).toContain('TEAM WORKSPACE')
    expect(workspaceHeader).toContain('操作')
    expect(workspaceHeader).toContain('ls-workspace-header__mobile')
    expect(workspaceHeader).toMatch(/ls-workspace-header__mobile[^]*n-dropdown-stub/)
    expect(actions).toContain('管理')
    expect(actions).toContain('更多')
    expect(actions).toContain('--n-color:#0000')
    expect(actions).toContain('--n-border:none')
    expect(actions).not.toContain('n-button--primary-type')
  })

  it('LsWorkspaceOverview 保留双向操作、入口顺序、开放入口与区域语义', async () => {
    const html = await render(LsWorkspaceOverview, {
      eyebrow: '商品个人工作台',
      title: '管理自己的商品与业务订单',
      description: '当前范围固定为已领取的人员。',
      actions: [
        {
          key: 'team',
          label: '进入团队工作台',
          to: '/manage',
          icon: House,
          primary: true,
        },
        {
          key: 'identity',
          label: '切换身份',
          href: 'https://account.lostsky.work/identity',
          icon: UserRound,
        },
      ],
      entries: [
        {
          key: 'products',
          label: '我的商品',
          description: '管理本人商品。',
          to: '/manage/personal/products',
          icon: ShoppingBag,
        },
        {
          key: 'orders',
          label: '我的业务订单',
          description: '查看关联订单。',
          to: '/manage/personal/orders',
          icon: ReceiptText,
        },
        {
          key: 'team-orders',
          label: '团队订单',
          description: '查看全部订单。',
          to: '/manage/orders',
          icon: ReceiptText,
        },
      ],
      scopeNotes: ['服务端按 acting_entity 强制过滤。'],
    })
    expect(html).toContain('aria-label="工作台切换"')
    expect(html).toContain('aria-label="工作入口"')
    expect(html).toContain('data-to="/manage"')
    expect(html).toContain('href="https://account.lostsky.work/identity"')
    expect(html).toMatch(/primary[^]*进入团队工作台/)
    expect(html).toMatch(/secondary[^]*切换身份/)
    expect(html.indexOf('我的商品')).toBeLessThan(html.indexOf('我的业务订单'))
    expect(html.indexOf('我的业务订单')).toBeLessThan(html.indexOf('团队订单'))
    expect(html).toContain('data-to="/manage/orders"')
    expect(html).not.toContain('aria-disabled="true"')
    expect(html).not.toContain('lucide-lock-keyhole')
    expect(html).not.toContain('title=')
    expect(html).not.toContain('<small')
    expect(html).toContain('aria-labelledby="workspace-scope-title"')
    const source = readFileSync(new URL('./components/LsWorkspaceOverview.vue', import.meta.url), 'utf8')
    expect(source).toContain('background: color-mix(in oklch, white, var(--cloud) 28%)')
    expect(source).not.toContain('border-style: dashed')
    expect(source).toContain('block-size: 11.75rem')
  })

  it('响应式数据表在移动端切换为同一份数据的记录结构', () => {
    const props = (LsResponsiveDataTable as unknown as { props: Record<string, unknown> }).props
    expect(Object.keys(props).sort()).toEqual(['columns', 'data', 'rowKey', 'scrollX'])
    const source = readFileSync(new URL('./components/LsResponsiveDataTable.vue', import.meta.url), 'utf8')
    expect(source).toContain('v-for="row in data"')
    expect(source).toContain('@media (max-width: 719px)')
    expect(source).toContain('.ls-responsive-data-table__desktop { display: none; }')
  })

  it('上传禁用入口不常驻渲染原因，错误状态不渲染刷新或重试按钮', async () => {
    const upload = await render(LsUploadField, {
      disabled: true,
      disabledReason: '当前团队未开通文件上传',
      showUrl: false,
    })
    const error = await render(LsAsyncState, {
      state: 'error',
      title: '暂时无法读取',
      description: '网络连接失败',
    })
    const empty = await render(LsEmptyState, {
      title: '还没有顾客',
      description: '顾客领取身份后会出现在这里。',
    })
    expect(upload).not.toContain('当前团队未开通文件上传')
    expect(upload).toContain('disabled')
    expect(upload).not.toContain('ls-upload-field__reason')
    expect(error).toContain('网络连接失败')
    expect(error).not.toMatch(/刷新|重试/)
    expect(empty).toContain('还没有顾客')
    expect(empty).toContain('顾客领取身份后会出现在这里。')
  })

  it('LsUploadField 可说明的禁用入口只提示原因，不打开文件选择', () => {
    const source = readFileSync(new URL('./components/LsUploadField.vue', import.meta.url), 'utf8')
    expect(source).toContain(':disabled-reason="disabledReason"')
    expect(source).toContain('if (props.disabled)')
    expect(source).toMatch(/if \(props\.disabled\)[^]*return[^]*emit\('choose'\)[^]*input\.value\?\.click\(\)/)
    const button = readFileSync(new URL('./components/LsButton.vue', import.meta.url), 'utf8')
    expect(button).toContain('feedback.info(props.disabledReason.trim())')
  })

  it('响应式操作与复选选项只通过信息弹窗解释禁用原因', () => {
    const actions = readFileSync(new URL('./components/LsResponsiveActions.vue', import.meta.url), 'utf8')
    const checkboxes = readFileSync(new URL('./components/LsCheckboxGroupField.vue', import.meta.url), 'utf8')
    expect(actions).toContain('feedback.info(action.reason.trim())')
    expect(actions).not.toContain('`${action.label}（${action.reason}）`')
    expect(actions).not.toContain(':title=')
    expect(checkboxes).toContain('feedback.info(reason(changed))')
    expect(checkboxes).not.toContain('ls-checkbox-group-field__reason')
    expect(checkboxes).not.toContain(':title=')
  })

  it('LsEmptyState 保留普通空状态并支持语义授权来源', async () => {
    const props = (LsEmptyState as unknown as { props: Record<string, unknown> }).props
    expect(Object.keys(props).sort()).toEqual(['accessReason', 'description', 'source', 'title'])
    const html = await render(LsEmptyState, {
      title: '没有匹配结果',
      description: '调整筛选条件后查看。',
    })
    expect(html).toContain('n-empty')
    expect(html).toContain('没有匹配结果')
    expect(html).toContain('调整筛选条件后查看。')
  })

  it('LsEmptyState 的受限结果覆盖正常空文案，恢复后保留正常空状态', async () => {
    const { deniedRead } = await import('@lostsky/api/access-result')
    for (const reason of ['缺少 Permission：weibo.personal.use', '缺少 Ability：weibo']) {
      const html = await render(LsEmptyState, {
        title: '暂无任务', description: '请创建任务', source: deniedRead(reason),
      })
      expect(html).toContain(reason)
      expect(html).not.toContain('暂无任务')
      expect(html).not.toContain('请创建任务')
    }
    const html = await render(LsEmptyState, { title: '暂无任务', description: '请创建任务', source: [] })
    expect(html).toContain('暂无任务')
  })

  it('LsEmptyState 保持 192px 紧凑基准且不随视口宽度增高', () => {
    const source = readFileSync(new URL('./components/LsEmptyState.vue', import.meta.url), 'utf8')
    expect(source).toContain("textColor: 'var(--text-secondary)'")
    expect(source).toContain('min-height: 12rem')
    expect(source).toContain('padding: 2rem 1.25rem')
    expect(source).not.toMatch(/padding:\s*clamp\([^;]*vw/)
  })

  it('LsFormList 封闭契约只接受业务内容与可解释禁用状态', () => {
    expect(Object.keys((LsFormList as any).props).sort()).toEqual(['modelValue', 'modelModifiers', 'itemKey', 'createItem', 'itemLabel', 'addLabel', 'emptyText', 'disabled', 'disabledReason'].sort())
    const source = readFileSync(new URL('./components/LsFormList.vue', import.meta.url), 'utf8')
    expect(source).not.toContain('NButton')
    expect(source.match(/:disabled-reason=/g)).toHaveLength(4)
    expect(source).toContain('已经是第一项')
    expect(source).toContain('已经是最后一项')
  })

  it('LsFormList 固定触控尺寸、移动换行和减少动态', () => {
    const source = readFileSync(new URL('./components/LsFormList.vue', import.meta.url), 'utf8')
    expect(source).toContain('width: 44px; height: 44px')
    expect(source).toContain('@media (max-width: 639px)')
    expect(source).toContain('@media (prefers-reduced-motion: reduce)')
    expect(source).toContain(':animation="animation"')
  })

  it('LsSwitchField 统一标签关联、弹窗解释禁用原因和触控尺寸', async () => {
    expect(Object.keys((LsSwitchField as any).props).sort()).toEqual(['ariaLabel', 'description', 'disabled', 'disabledReason', 'headingLevel', 'id', 'loading', 'modelValue', 'readOnly', 'label'].sort())
    const html = await render(LsSwitchField, {
      id: 'product-active',
      modelValue: true,
      label: '上架状态',
      ariaLabel: '设置商品上架状态',
      headingLevel: 2,
      description: '关闭后商品不会在商城展示。',
      disabled: true,
      disabledReason: '缺少商品管理权限（Permission）',
    })
    expect(html).toContain('id="product-active-label"')
    expect(html).toContain('<h2 id="product-active-label"')
    expect(html).toContain('aria-label="设置商品上架状态"')
    expect(html).not.toContain('aria-labelledby="product-active-label"')
    expect(html).toContain('aria-describedby="product-active-description"')
    expect(html).not.toContain('缺少商品管理权限（Permission）')
    const source = readFileSync(new URL('./components/LsSwitchField.vue', import.meta.url), 'utf8')
    expect(source).toContain(':disabled-reason="disabledReason"')
    expect(source).not.toContain('ls-switch-field__reason')
    expect(source).not.toContain(':title=')
    expect(source).toContain('min-height:56px')
    expect(source).toContain('min-height:44px')
    expect(source).toContain('@media(max-width:639px)')
    expect(source).not.toContain('checkedText')
    expect(source).not.toContain('uncheckedText')
  })
})


it('LsInput forwards disabled to the Naive owner and keeps default inputs editable', async () => {
  const normal = await render(LsInput, { modelValue: 'draft' })
  const disabled = await render(LsInput, { modelValue: 'draft', disabled: true })
  expect(normal).not.toMatch(/<input[^>]*\sdisabled(?:[\s=>])/)
  expect(disabled).toMatch(/<input[^>]*\sdisabled(?:[\s=>])/)
  expect(disabled).toContain('draft')
})
