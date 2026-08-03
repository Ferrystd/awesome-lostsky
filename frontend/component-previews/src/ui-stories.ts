import { defineComponent, h } from 'vue'
import { NInput, NSelect, NTag } from 'naive-ui'
import { Pencil, Save, Trash2 } from '@lucide/vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsEntityCard from '@lostsky/ui/components/LsEntityCard.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsEntityInput from '@lostsky/ui/components/LsEntityInput.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormList from '@lostsky/ui/components/LsFormList.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsInput from '@lostsky/ui/components/LsInput.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsMarkdownEditor from '@lostsky/ui/components/LsMarkdownEditor.vue'
import LsMarkdownRenderer from '@lostsky/ui/components/LsMarkdownRenderer.vue'
import LsPage from '@lostsky/ui/components/LsPage.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsResponsiveActions from '@lostsky/ui/components/LsResponsiveActions.vue'
import LsResponsiveDataTable from '@lostsky/ui/components/LsResponsiveDataTable.vue'
import LsRouteErrorBoundary from '@lostsky/ui/components/LsRouteErrorBoundary.vue'
import LsSearchInput from '@lostsky/ui/components/LsSearchInput.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import LsUploadField from '@lostsky/ui/components/LsUploadField.vue'
import LsWorkspaceHeader from '@lostsky/ui/components/LsWorkspaceHeader.vue'
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
  uploadDisabledReason: state === 'disabled' ? '当前团队未开通文件上传' : '',
}), 'story-stage--editor'), { loading: '编辑器没有整体加载状态。', error: '保存错误由所属表单表达。' })

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

const uploadField = story('LsUploadField', allInteractive, state => stage(h(LsUploadField, {
  modelValue: state === 'error' ? '' : '//assets.lostsky.work/avatar.png',
  disabled: state === 'disabled' || state === 'error',
  disabledReason: state === 'error' ? '当前团队未开通文件上传' : '',
  loading: state === 'loading', progress: state === 'loading' ? 62 : null,
  showReason: state === 'error', buttonLabel: '选择文件',
})))

const workspaceHeader = story('LsWorkspaceHeader', interactive, state => stage(h(LsWorkspaceHeader, {
  contextLabel: 'TEAM WORKSPACE', title: '对象字段', actions: [
    { key: 'display', label: '查看公开主页' },
    { key: 'notice', label: '通知', disabled: state === 'disabled', reason: '当前身份无权查看' },
  ],
})))

export const uiStories: Record<string, StoryDefinition> = {
  LsAsyncState: asyncState, LsButton: button, LsEmptyState: emptyState, LsEntityCard: entityCard,
  LsEntityIdentity: entityIdentity, LsEntityInput: entityInput, LsField: field, LsFormList: formList,
  LsInlineError: inlineError, LsInput: input, LsListToolbar: listToolbar, LsMarkdownEditor: markdownEditor,
  LsMarkdownRenderer: markdownRenderer, LsPage: page, LsPageHeader: pageHeader, LsPanel: panel,
  LsResponsiveActions: responsiveActions, LsResponsiveDataTable: responsiveDataTable,
  LsRouteErrorBoundary: routeBoundary, LsSearchInput: searchInput, LsStatusTag: statusTag,
  LsUploadField: uploadField, LsWorkspaceHeader: workspaceHeader,
}
