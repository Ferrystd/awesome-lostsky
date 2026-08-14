import { defineComponent, h } from 'vue'
import { NInput, NSelect, NTag } from 'naive-ui'
import { House, Pencil, Plus, ReceiptText, Save, ShoppingBag, Trash2, UserRound } from '@lucide/vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsCheckboxGroupField from '@lostsky/ui/components/LsCheckboxGroupField.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsEntityCard from '@lostsky/ui/components/LsEntityCard.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsEntityInput from '@lostsky/ui/components/LsEntityInput.vue'
import LsEntitySelect from '@lostsky/ui/components/LsEntitySelect.vue'
import LsEntityTag from '@lostsky/ui/components/LsEntityTag.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormList from '@lostsky/ui/components/LsFormList.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsInput from '@lostsky/ui/components/LsInput.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsMarkdownEditor from '@lostsky/ui/components/LsMarkdownEditor.vue'
import LsMarkdownRenderer from '@lostsky/ui/components/LsMarkdownRenderer.vue'
import LsMediaUploadField from '@lostsky/ui/components/LsMediaUploadField.vue'
import LsPage from '@lostsky/ui/components/LsPage.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsResponsiveActions from '@lostsky/ui/components/LsResponsiveActions.vue'
import LsResponsiveDataTable from '@lostsky/ui/components/LsResponsiveDataTable.vue'
import LsRouteErrorBoundary from '@lostsky/ui/components/LsRouteErrorBoundary.vue'
import LsSearchInput from '@lostsky/ui/components/LsSearchInput.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import LsSwitch from '@lostsky/ui/components/LsSwitch.vue'
import LsSwitchField from '@lostsky/ui/components/LsSwitchField.vue'
import LsUploadField from '@lostsky/ui/components/LsUploadField.vue'
import LsWorkspaceHeader from '@lostsky/ui/components/LsWorkspaceHeader.vue'
import LsWorkspaceOverview from '@lostsky/ui/components/LsWorkspaceOverview.vue'
import type { EntityDisplay } from '@lostsky/ui/entity'
import { previewStates, type PreviewState, type StoryDefinition } from './story-types'

const allInteractive: PreviewState[] = ['default', 'hover', 'focus', 'active', 'disabled', 'loading', 'error', 'mobile']
const interactive: PreviewState[] = ['default', 'hover', 'focus', 'active', 'disabled', 'mobile']
const passive: PreviewState[] = ['default', 'mobile']
const stage = (children: unknown, className = '') => h('div', { class: ['story-stage', className] }, children as never)
const unsupportedDefaults: Record<PreviewState, string> = {
  default: '默认状态为必选项。', hover: '该组件没有可悬停的交互目标。', focus: '该组件不接收键盘焦点。',
  active: '该组件没有激活或选中状态。', disabled: '该组件没有整体禁用或只读状态。', loading: '该组件不负责表达加载状态。',
  error: '该组件不负责表达错误或空状态。', mobile: '移动端状态为必选项。',
}
const story = (name: string, supported: PreviewState[], render: StoryDefinition['render'], reason: StoryDefinition['reason'] = {}): StoryDefinition => ({
  name, supported, render,
  reason: Object.fromEntries(previewStates.filter(state => !supported.includes(state)).map(state => [state, reason[state] || unsupportedDefaults[state]])),
})

const member: EntityDisplay = { type: 'teamMember', name: '青空成员', slug: 'qingkong' }
const customer: EntityDisplay = { type: 'teamCustomer', name: '长期客户', slug: 'customer-one' }
const virtual: EntityDisplay = { type: 'teamVirtual', name: '协作助手', slug: 'helper' }
const entities = [member, customer, virtual]
const selectEntities = [
  { entity_id: 1, type: 'team', name: '青空团队', slug: 'demo' },
  { entity_id: 2, type: 'teamMember', name: '一个名称很长用于验证省略显示的协作成员', slug: 'qingkong' },
  { entity_id: 3, type: 'teamVirtual', name: '协作助手', slug: 'helper' },
]
const markdown = '## 今日安排\n\n请联系 [@青空成员](lostsky://entity/qingkong) 确认任务。\n\n- 核对资料\n- 回复通知'
const markdownEntities = entities.map(entity => ({
  slug: entity.slug,
  type: entity.type,
  display_name: entity.name,
  avatar: entity.avatar ?? null,
  team: null,
  available: true,
  href: entity.slug === 'qingkong' ? '/member-detail?id=1' : null,
}))
const searchMarkdownEntities = async () => markdownEntities
const resolveEntities = async (slugs: string[]) => markdownEntities.filter(entity => slugs.includes(entity.slug))

const ThrowingPreview = defineComponent({
  name: 'ThrowingPreview',
  setup() { throw new Error('用于预览错误边界的确定性异常') },
  render: () => null,
})

const button = story('LsButton', allInteractive, state => stage(h(LsButton, {
  variant: state === 'error' ? 'danger' : 'primary',
  disabled: state === 'disabled',
  loading: state === 'loading',
}, { icon: () => h(Save, { size: 17 }), default: () => state === 'error' ? '删除记录' : '保存修改' })))

const pagePrimaryAction = story('LsPagePrimaryAction', ['default', 'hover', 'focus', 'active', 'disabled', 'loading', 'mobile'], state => stage(h(LsPagePrimaryAction, {
  icon: Plus,
  label: '新建文档',
  disabled: state === 'disabled',
  disabledReason: state === 'disabled' ? '当前身份缺少文档创建权限' : '',
  loading: state === 'loading',
})), { error: '页面主操作不负责表达业务错误。' })

const checkboxGroupField = story('LsCheckboxGroupField', ['default', 'hover', 'focus', 'active', 'disabled', 'error', 'mobile'], state => stage(h(LsCheckboxGroupField, {
  modelValue: state === 'active' ? [1, 2] : [1],
  label: '可分配角色',
  hint: state === 'default' ? '保存后立即应用到当前实体。' : undefined,
  error: state === 'error' ? '请至少选择一个角色。' : undefined,
  disabled: state === 'disabled',
  options: [
    { value: 1, label: '商品经理', meta: 'shop-manager', description: '维护商品、接单人与核销字段。' },
    { value: 2, label: '订单协作者', meta: 'order-helper', description: '查看并推进团队订单。', disabled: state === 'disabled', disabledReason: state === 'disabled' ? '当前身份不能分配此角色' : undefined },
  ],
})), { loading: '复选组字段不负责异步加载。' })

const descriptionList = story('LsDescriptionList', passive, () => stage(h(LsDescriptionList, null, {
  default: () => [h('dt', '所属团队'), h('dd', '青空协作组'), h('dt', '说明'), h('dd', '这是一段用于验证长内容自然换行且不会横向溢出的详情说明。')],
})))

const formActions = story('LsFormActions', interactive, state => stage(h(LsFormActions, null, {
  default: () => [
    h(LsButton, { variant: 'secondary', disabled: state === 'disabled' }, { default: () => '取消' }),
    h(LsButton, { disabled: state === 'disabled' }, { default: () => '保存修改' }),
  ],
})), { loading: '动作容器不管理按钮加载状态。', error: '动作容器不负责错误状态。' })

const sectionHeader = story('LsSectionHeader', ['default', 'hover', 'focus', 'active', 'disabled', 'mobile'], state => stage(h(LsSectionHeader, {
  eyebrow: 'PRODUCT', title: '基本信息', description: '维护商品名称、价格与公开说明。', headingLevel: 3,
}, { aside: () => h(LsButton, { variant: 'secondary', disabled: state === 'disabled' }, { default: () => '查看说明' }) })), { loading: '区块标题不负责加载状态。', error: '区块错误由内容区域表达。' })

const formSection = story('LsFormSection', ['default', 'hover', 'focus', 'active', 'disabled', 'mobile'], state => stage(h(LsFormSection, {
  title: '基本信息', description: '字段保持单列，保存逻辑仍由页面表单负责。',
}, {
  default: () => h(LsField, { label: '商品名称', forId: `form-section-${state}` }, { default: () => h(NInput, { id: `form-section-${state}`, value: '会员服务', disabled: state === 'disabled' }) }),
})), { loading: '表单区块不负责加载状态。', error: '校验错误由内部字段表达。' })

const asyncState = story('LsAsyncState', ['default', 'loading', 'error', 'mobile'], state => stage(h(LsAsyncState, state === 'error'
  ? { state: 'error', title: '暂时无法读取', description: '网络连接失败，请稍后重新进入。' }
  : { state: 'loading', rows: state === 'mobile' ? 2 : 4 })))

const emptyState = story('LsEmptyState', passive, () => stage(h(LsEmptyState, { title: '还没有客户', description: '客户领取团队身份后会出现在这里。' })))

const entityCard = story('LsEntityCard', interactive, state => stage(h(LsEntityCard, {
  entity: member,
  clearable: true,
  clearLabel: '移除青空成员',
  chatEnabled: state !== 'disabled',
  profileEnabled: state !== 'disabled',
})))

const entityIdentity = story('LsEntityIdentity', passive, () => stage(h(LsEntityIdentity, {
  type: 'teamMember', name: '青空成员', slug: 'qingkong', fallback: 'initial', size: 'lg',
}, { status: () => h(NTag, { size: 'small', type: 'success', bordered: false }, { default: () => '正常' }) })))

const entityTag = story('LsEntityTag', ['default', 'disabled', 'mobile'], state => stage(h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px' }, [
  h(LsEntityTag, { type: 'team', name: '青空团队', slug: 'demo' }),
  h(LsEntityTag, { type: 'teamMember', name: '一个名称很长用于验证省略显示的协作成员', slug: 'qingkong', closable: true, disabled: state === 'disabled' }),
  h(LsEntityTag, { type: 'teamVirtual', name: '协作助手', slug: 'helper' }),
])), { hover: '只读胶囊没有悬停动作。', focus: '只读胶囊不接收键盘焦点。', active: 'Entity 胶囊不表达选中状态。', loading: 'Entity 胶囊不负责加载状态。', error: 'Entity 胶囊不负责错误状态。' })

const entitySelect = story('LsEntitySelect', ['default', 'hover', 'focus', 'active', 'disabled', 'loading', 'mobile'], state => stage(h(LsEntitySelect, {
  modelValue: [1, 2, 3],
  entities: selectEntities,
  multiple: true,
  clearable: true,
  placeholder: '选择接单 Entity',
  disabled: state === 'disabled',
  loading: state === 'loading',
  show: state === 'active',
  to: false,
})), { error: '候选读取错误由页面附近的错误区域表达。' })

const entityInput = story('LsEntityInput', ['default', 'hover', 'focus', 'active', 'error', 'mobile'], state => stage(h(LsEntityInput, {
  modelValue: state === 'active' ? [member] : [],
  query: state === 'error' ? '不存在' : '青空',
  candidates: state === 'error' ? [] : entities,
  recent: entities,
  multiple: true,
  placeholder: '搜索名称或 slug',
})), { disabled: '组件没有整体禁用参数。', loading: '候选搜索在输入后异步发生，不暴露独立加载参数。' })

const field = story('LsField', allInteractive, state => stage(h(LsField, {
  label: '团队昵称', forId: `preview-field-${state}`, required: true,
  hint: state === 'default' ? '最多 50 个字符。' : undefined,
  error: state === 'error' ? '团队昵称不能为空。' : undefined,
}, { default: () => h(NInput, { id: `preview-field-${state}`, value: '青空协作组', disabled: state === 'disabled', loading: state === 'loading', status: state === 'error' ? 'error' : undefined }) })))

const formListItems = [{ id: 1, name: '指南' }, { id: 2, name: '精选' }]
const formList = story('LsFormList', ['default', 'hover', 'focus', 'active', 'disabled', 'error', 'mobile'], state => stage(h(LsFormList as never, {
  modelValue: state === 'error' ? [] : formListItems,
  itemKey: (item: { id: number }) => item.id,
  createItem: () => ({ id: 3, name: '' }),
  itemLabel: '标签', addLabel: '添加标签', emptyText: '还没有标签', disabled: state === 'disabled',
}, { item: ({ item, index }: { item: { name: string }; index: number }) => h(NInput, { value: item.name, placeholder: `标签 ${index + 1}` }) })), { loading: '表单列表不负责异步加载。' })

const inlineError = story('LsInlineError', ['default', 'error', 'mobile'], () => stage(h(LsInlineError, { message: '保存失败：字段标识已经被使用。' })))

const input = story('LsInput', ['default', 'hover', 'focus', 'active', 'disabled', 'error', 'mobile'], state => stage(h(LsInput, {
  modelValue: '青空协作组', placeholder: '输入团队名称', disabled: state === 'disabled', invalid: state === 'error',
})), { loading: '文本输入框没有加载状态。' })

const listToolbar = story('LsListToolbar', ['default', 'hover', 'focus', 'active', 'disabled', 'mobile'], state => stage(h(LsListToolbar, {
  modelValue: '', placeholder: '搜索字段名称或标识', ariaLabel: '搜索对象字段', countLabel: '12 个字段',
}, {
  filters: () => h(NSelect, { value: 'entity', disabled: state === 'disabled', options: [{ label: '人员', value: 'entity' }, { label: '客户', value: 'customer' }] }),
  actions: () => h(LsButton, { disabled: state === 'disabled' }, { default: () => '创建字段' }),
})), { loading: '列表工具栏不负责加载状态。', error: '错误由列表内容区域表达。' })

const markdownEditor = story('LsMarkdownEditor', ['default', 'hover', 'focus', 'active', 'disabled', 'mobile'], state => stage(h(LsMarkdownEditor, {
  modelValue: markdown,
  draftKey: '',
  searchEntities: searchMarkdownEntities,
  resolveEntities,
  uploadImage: async () => '//assets.lostsky.work/markdown-image.png',
  uploadDisabledReason: state === 'disabled' ? '当前团队未开通文件上传' : '',
}), 'story-stage--editor'), { loading: '编辑器没有整体加载状态。', error: '保存错误由所属表单表达。' })

const mediaUploadField = story('LsMediaUploadField', ['default', 'hover', 'focus', 'active', 'disabled', 'error', 'mobile'], state => stage(h(LsMediaUploadField, {
  modelValue: state === 'error' ? '' : '//assets.lostsky.work/avatar.png',
  upload: async () => '//assets.lostsky.work/avatar.png',
  accept: 'image/*',
  buttonLabel: '上传头像',
  disabled: state === 'disabled' || state === 'error',
  disabledReason: state === 'error' ? '当前团队未开通文件上传' : '',
  showReason: state === 'error',
})), { loading: '加载状态由选择真实文件后自动表达。' })

const markdownRenderer = story('LsMarkdownRenderer', ['default', 'hover', 'focus', 'active', 'mobile'], () => stage(h(LsMarkdownRenderer, { content: markdown, resolveEntities, chatEnabled: true }), 'story-stage--markdown'), { disabled: '只读渲染器没有禁用状态。', loading: '实体解析在内容内渐进完成。', error: '无效 Markdown 会安全降级为可读内容。' })

const page = story('LsPage', passive, () => h(LsPage, { width: 'content' }, { default: () => stage([h('strong', '详情内容'), h('p', '页面容器控制内容宽度和纵向节奏。')]) }))

const pageHeader = story('LsPageHeader', ['default', 'hover', 'focus', 'active', 'disabled', 'mobile'], state => stage(h(LsPageHeader, {
  title: '对象字段', description: '统一定义人员、客户和虚拟实体的团队内部资料。', backTo: '/', backLabel: '返回工作台',
}, { actions: () => h(LsButton, { disabled: state === 'disabled' }, { default: () => '创建字段' }) })), { loading: '页面标题不负责加载状态。', error: '页面错误由内容区域表达。' })

const panel = story('LsPanel', passive, () => stage(h(LsPanel, null, {
  header: () => h('div', [h('strong', '客户资料'), h('p', '经营资料与当前状态')]),
  default: () => h('p', '当前归属：青空成员'),
  footer: () => h('small', '更新于今天 14:30'),
})))

const actions = [
  { key: 'edit', label: '编辑', icon: Pencil },
  { key: 'save', label: '保存', icon: Save },
  { key: 'remove', label: '移出', danger: true, icon: Trash2 },
]
const responsiveActions = story('LsResponsiveActions', interactive, state => stage(h(LsResponsiveActions, {
  actions: state === 'disabled' ? actions.map(item => ({ ...item, disabled: true, reason: '当前身份无权操作' })) : actions,
  primaryKey: 'edit',
})))

const tableRows = [{ id: 1, name: '青空成员', status: '正常' }, { id: 2, name: '协作助手', status: '正常' }]
const responsiveDataTable = story('LsResponsiveDataTable', ['default', 'hover', 'focus', 'active', 'mobile'], () => stage(h(LsResponsiveDataTable as never, {
  columns: [{ title: '名称', key: 'name' }, { title: '状态', key: 'status' }], data: tableRows, rowKey: (row: { id: number }) => row.id,
}, {
  'mobile-title': ({ row }: { row: { name: string } }) => h('strong', row.name),
  'mobile-status': ({ row }: { row: { status: string } }) => h(LsStatusTag, { label: row.status, type: 'success' }),
  mobile: ({ row }: { row: { status: string } }) => h('dl', [h('dt', '状态'), h('dd', row.status)]),
})), { disabled: '数据表没有整体禁用状态。', loading: '加载由 LsAsyncState 表达。', error: '错误由列表区域表达。' })

const routeBoundary = story('LsRouteErrorBoundary', ['default', 'error', 'mobile'], state => stage(h(LsRouteErrorBoundary, { resetKey: state }, {
  default: () => state === 'error' ? h(ThrowingPreview) : h('p', '页面内容正常显示。'),
})))

const searchInput = story('LsSearchInput', ['default', 'hover', 'focus', 'active', 'disabled', 'error', 'mobile'], state => stage(h(LsSearchInput, {
  modelValue: state === 'error' ? '无结果关键词' : '', placeholder: '搜索成员名称或 slug', ariaLabel: '搜索成员', disabled: state === 'disabled', status: state === 'error' ? 'error' : undefined,
})), { loading: '搜索框不负责结果加载。' })

const statusTag = story('LsStatusTag', ['default', 'active', 'error', 'mobile'], state => stage(h('div', { class: 'story-inline' }, state === 'default'
  ? [h(LsStatusTag, { label: '待处理' }), h(LsStatusTag, { label: '正常', type: 'success' }), h(LsStatusTag, { label: '需关注', type: 'warning' })]
  : [h(LsStatusTag, { label: state === 'error' ? '已失败' : '处理中', type: state === 'error' ? 'error' : 'info' })])))

const switchControl = story('LsSwitch', ['default', 'hover', 'focus', 'active', 'disabled', 'loading', 'mobile'], state => stage(h(LsSwitch, {
  modelValue: state === 'active',
  disabled: state === 'disabled', disabledReason: state === 'disabled' ? '需要有效的商城 Ability' : '',
  loading: state === 'loading',
  'aria-label': '启用公开展示',
})), { error: '开关原语不负责表达表单错误。' })

const switchField = story('LsSwitchField', ['default', 'hover', 'focus', 'active', 'disabled', 'loading', 'mobile'], state => stage(h(LsSwitchField, {
  modelValue: state === 'active',
  label: '上架状态',
  description: '关闭后商品不会在商城展示，历史订单不受影响。',
  disabled: state === 'disabled',
  disabledReason: state === 'disabled' ? '当前身份缺少商品管理权限' : '',
  loading: state === 'loading',
})), { error: '布尔设置的校验错误由所属表单区域表达。' })

const uploadField = story('LsUploadField', allInteractive, state => stage(h(LsUploadField, {
  modelValue: state === 'error' ? '' : '//assets.lostsky.work/avatar.png',
  disabled: state === 'disabled' || state === 'error',
  disabledReason: state === 'error' ? '当前团队未开通文件上传' : '',
  loading: state === 'loading', progress: state === 'loading' ? 62 : null,
  showReason: state === 'error', buttonLabel: '选择文件',
})))

const workspaceHeader = story('LsWorkspaceHeader', interactive, state => stage(h(LsWorkspaceHeader, {
  contextLabel: 'TEAM WORKSPACE', title: '对象字段',
  actions: [
    { key: 'team', label: '团队' },
    { key: 'shop', label: '商品' },
    { key: 'transaction', label: '记账', disabled: state === 'disabled', reason: '当前团队未启用 transaction Ability' },
    { key: 'chat', label: '聊天' },
  ],
}, {
  actions: () => ['团队', '商品', '记账', '聊天'].map(label => h('a', { href: '#', onClick: (event: Event) => event.preventDefault() }, label)),
})))

const workspaceOverview = story('LsWorkspaceOverview', allInteractive, state => stage(h(LsWorkspaceOverview, {
  eyebrow: '商品团队工作台',
  title: state === 'loading' ? '正在读取当前团队…' : state === 'error' ? '团队摘要暂时不可用' : '青空协作组',
  description: state === 'error' ? '摘要暂时无法读取，工作台切换与业务入口仍保持可用。' : '集中维护商品、订单与履约配置；不可用入口会直接说明原因。',
  actions: [
    { key: 'personal', label: '进入个人工作台', to: '/manage/personal', icon: UserRound, primary: true },
    { key: 'team', label: '进入团队工作台', to: '/manage', icon: House },
  ],
  entries: [
    { key: 'products', label: '商品', description: '维护可售商品、处理人和核销字段。', to: '/manage/products', icon: ShoppingBag },
    { key: 'orders', label: '订单', description: '查看团队订单并持续推进履约状态。', to: '/manage/orders', icon: ReceiptText, disabled: state === 'disabled', reason: state === 'disabled' ? '缺少 shop.order.read Permission' : '' },
  ],
  scopeNotes: ['概览只读取访问快照，不请求商品或订单数据。', '具体管理操作继续执行 Permission 校验。'],
}), state === 'mobile' ? 'story-stage--mobile' : ''))

export const uiStories: Record<string, StoryDefinition> = {
  LsAsyncState: asyncState, LsButton: button, LsCheckboxGroupField: checkboxGroupField, LsDescriptionList: descriptionList,
  LsEmptyState: emptyState, LsEntityCard: entityCard,
  LsEntityIdentity: entityIdentity, LsEntityInput: entityInput, LsEntitySelect: entitySelect, LsEntityTag: entityTag, LsField: field, LsFormList: formList,
  LsFormActions: formActions, LsFormSection: formSection, LsInlineError: inlineError, LsInput: input, LsListToolbar: listToolbar, LsMarkdownEditor: markdownEditor, LsMediaUploadField: mediaUploadField,
  LsMarkdownRenderer: markdownRenderer, LsPage: page, LsPageHeader: pageHeader, LsPagePrimaryAction: pagePrimaryAction, LsPanel: panel,
  LsResponsiveActions: responsiveActions, LsResponsiveDataTable: responsiveDataTable,
  LsRouteErrorBoundary: routeBoundary, LsSearchInput: searchInput, LsSectionHeader: sectionHeader, LsStatusTag: statusTag,
  LsSwitch: switchControl, LsSwitchField: switchField, LsUploadField: uploadField, LsWorkspaceHeader: workspaceHeader, LsWorkspaceOverview: workspaceOverview,
}
