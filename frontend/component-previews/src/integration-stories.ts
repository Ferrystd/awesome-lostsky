import { defineComponent, h, ref, type Component } from 'vue'
import { NConfigProvider, NInput, NPagination } from 'naive-ui'
import { FileText, Plus, Save, Users } from '@lucide/vue'
import { previewStates, type PreviewState, type StoryDefinition } from './story-types'
import AccountFlowPage from '../../apps/account/src/components/AccountFlowPage.vue'
import ChatScene from '../../apps/chat/src/components/ChatScene.vue'
import ChatTaskPage from '../../apps/chat/src/components/ChatTaskPage.vue'
import LsCategoryNavigationItem from '@lostsky/ui/components/LsCategoryNavigationItem.vue'
import LsCategoryPage from '@lostsky/ui/components/LsCategoryPage.vue'
import LsCollectionPage from '@lostsky/ui/components/LsCollectionPage.vue'
import LsDetailPage from '@lostsky/ui/components/LsDetailPage.vue'
import LsDirectoryActions from '@lostsky/ui/components/LsDirectoryActions.vue'
import LsDirectoryIdentity from '@lostsky/ui/components/LsDirectoryIdentity.vue'
import LsFormContent from '@lostsky/ui/components/LsFormContent.vue'
import LsFormFields from '@lostsky/ui/components/LsFormFields.vue'
import LsFormPage from '@lostsky/ui/components/LsFormPage.vue'
import LsObjectDirectory from '@lostsky/ui/components/LsObjectDirectory.vue'
import LsOverviewLinks from '@lostsky/ui/components/LsOverviewLinks.vue'
import LsOverviewPage from '@lostsky/ui/components/LsOverviewPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsRadioGroupField from '@lostsky/ui/components/LsRadioGroupField.vue'
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsSinglePanelPage from '@lostsky/ui/components/LsSinglePanelPage.vue'
import { workspaceSceneProviderProps } from '@lostsky/ui/workspace-scene-theme'
import LsWorkspaceScene from '@lostsky/ui/components/LsWorkspaceScene.vue'
import FormFieldLayout from '@lostsky/ui/components/internal/FormFieldLayout.vue'
import PageContextLayout from '@lostsky/ui/components/internal/PageContextLayout.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'

const layout: PreviewState[] = ['default', 'mobile']
const navigation: PreviewState[] = ['default', 'hover', 'focus', 'active', 'mobile']
const reasons: Partial<Record<PreviewState, string>> = {
  hover: '布局本身没有悬停交互；内部控件由各自 Story 展示。',
  focus: '布局本身不接受焦点；内部控件由各自 Story 展示。',
  active: '组件没有整体激活或选中状态。',
  disabled: '组件没有整体禁用状态。',
  loading: '组件不拥有业务请求或加载状态。',
  error: '组件不拥有业务错误或空数据状态。',
}
function story(name: string, supported: PreviewState[], render: StoryDefinition['render']): StoryDefinition {
  return { name, supported, render, reason: Object.fromEntries(previewStates.filter(state => !supported.includes(state)).map(state => [state, reasons[state]])) }
}
const stage = (content: ReturnType<typeof h>) => h('div', { class: 'story-stage' }, [content])
const link = () => h(LsPageLink, { to: '/members', icon: Users, label: '查看成员' })
const summary = () => h(LsDescriptionList, null, { default: () => [h('dt', '所属团队'), h('dd', '青空团队'), h('dt', '状态'), h('dd', '正常')] })
const field = () => h(LsField, { label: '显示名称', forId: 'preview-display-name', hint: '保存后用于团队内展示。' }, { default: () => h(NInput, { defaultValue: '青空成员', inputProps: { id: 'preview-display-name' } }) })
const fields = () => h(LsFormFields, null, { default: () => [field(), h(LsField, { label: '简介', forId: 'preview-intro' }, { default: () => h(NInput, { type: 'textarea', defaultValue: '负责日常协作与资料整理。', inputProps: { id: 'preview-intro' } }) })] })
const formActions = () => h(LsFormActions, null, { default: () => h(LsButton, null, { icon: () => h(Save, { size: 16 }), default: () => '保存资料' }) })
const entries = [
  { key: 'members', label: '团队成员', description: '维护成员资料与角色授权。', to: '/members', icon: Users },
  { key: 'docs', label: '共享文档', description: '查看近期更新的团队文档。', to: '/docs', icon: FileText },
]
const overviewLinks = () => h(LsOverviewLinks, { label: '工作入口', entries })
const resourceRow = (unread = false) => h(LsResourceRow, { title: '协作手册', description: '包含团队协作约定与新成员使用说明。', to: '/docs/1', icon: FileText, unread }, {
  status: () => h(LsStatusTag, { label: unread ? '未读' : '已发布', type: 'info' }),
  metadata: () => h('span', '2026-10-24 · 青空成员'),
  actions: () => h(LsDirectoryActions, { label: '协作手册操作', actions: [{ key: 'edit', label: '编辑资料' }, { key: 'delete', label: '删除', danger: true }] }),
})
const resources = () => h(LsResourceList, null, { default: () => [resourceRow(), h(LsResourceRow, { title: '成员入队流程', description: '入队、资料填写与角色分配。', to: '/docs/2', icon: FileText })] })
const toolbar = () => h(LsListToolbar, { modelValue: '', placeholder: '搜索文档', ariaLabel: '搜索文档', countLabel: '2 篇文档' })
const collection = (component: Component) => stage(h(component, { title: '团队文档', description: '维护团队共享资料。' }, {
  actions: () => h(LsPageLink, { to: '/docs/new', icon: Plus, label: '新建文档' }),
  toolbar, default: resources, pagination: () => h(NPagination, { page: 1, pageCount: 3 }),
}))

const CategoryPreview = defineComponent({
  setup() {
    const current = ref('profile')
    return () => h(LsCategoryPage, { title: '团队设置', label: '设置分类', current: current.value,
      items: [{ key: 'profile', label: '基本资料' }, { key: 'access', label: '权限与角色', dirty: true }],
      onSelect: (key: string) => { current.value = key },
    }, { default: () => current.value === 'profile' ? fields() : h('p', '角色修改尚未保存。') })
  },
})
const RadioPreview = defineComponent({
  props: { state: { type: String, required: true } },
  setup(props) {
    const selected = ref(props.state === 'active' ? 'private' : 'team')
    return () => h(LsRadioGroupField, { label: '展示范围', modelValue: selected.value, disabled: props.state === 'disabled',
      hint: '选择资料可见范围。', options: [{ value: 'team', label: '团队可见', description: '当前团队内成员可以查看。' }, { value: 'private', label: '仅自己', description: '仅当前人员可以查看。' }],
      'onUpdate:modelValue': (value: string | number) => { selected.value = String(value) },
    })
  },
})
const DirectoryActionsPreview = defineComponent({
  props: { state: { type: String, required: true } },
  setup(props) {
    const selected = ref('尚未选择操作')
    return () => h('div', [h(LsDirectoryActions, { label: '成员操作', actions: [
      { key: 'edit', label: '编辑资料', disabled: props.state === 'disabled', reason: props.state === 'disabled' ? '当前身份没有管理权限' : undefined },
      { key: 'delete', label: '删除', danger: true },
    ], onSelect: (key: string) => { selected.value = key === 'edit' ? '已选择编辑资料' : '已选择删除' } }), h('p', { role: 'status' }, selected.value)])
  },
})

export const integrationStories: Record<string, StoryDefinition> = {
  AccountFlowPage: story('AccountFlowPage', layout, () => h(AccountFlowPage, { title: '确认身份', intro: '确认当前身份后继续前往工作台。' }, { default: () => [summary(), link()] })),
  ChatScene: story('ChatScene', layout, () => h(ChatScene, null, { default: () => stage(h(LsPanel, null, { default: () => [h('h2', '团队会话'), h('p', '与协作成员保持联系。'), link()] })) })),
  ChatTaskPage: story('ChatTaskPage', navigation, () => h(ChatTaskPage, { title: '新会话', description: '选择团队内的协作成员。' }, { default: () => [field(), link()] })),
  LsCategoryNavigationItem: story('LsCategoryNavigationItem', navigation, state => stage(h(LsCategoryNavigationItem, { label: '基本资料', current: state === 'active', dirty: state === 'active', panelId: 'category-preview-panel' }))),
  LsCategoryPage: story('LsCategoryPage', navigation, () => stage(h(CategoryPreview))),
  LsCollectionPage: story('LsCollectionPage', layout, () => collection(LsCollectionPage)),
  LsDetailPage: story('LsDetailPage', layout, () => stage(h(LsDetailPage, { title: '成员详情', description: '查看资料及可见范围。', backTo: '/members', asideLabel: '成员身份摘要' }, { actions: link, summary, default: fields, aside: () => h(LsPanel, null, { default: summary }) }))),
  LsDirectoryActions: story('LsDirectoryActions', [...navigation, 'disabled'], state => stage(h(DirectoryActionsPreview, { state }))),
  LsDirectoryIdentity: story('LsDirectoryIdentity', layout, () => stage(h(LsDirectoryIdentity, { type: 'teamMember', name: '负责跨团队协作与资料整理的青空成员', slug: 'qingkong' }, { status: () => h(LsStatusTag, { label: '在职', type: 'success' }), context: () => h('span', '运营组') }))),
  LsFormContent: story('LsFormContent', layout, () => stage(h(LsFormContent, { title: '个人介绍', description: '资料随当前表单一起保存。' }, { default: field }))),
  LsFormFields: story('LsFormFields', layout, () => stage(fields())),
  LsFormPage: story('LsFormPage', layout, () => stage(h(LsFormPage, { title: '编辑成员资料', description: '修改后统一保存。', asideLabel: '已保存身份' }, { actions: link, default: fields, footer: formActions, aside: summary }))),
  LsObjectDirectory: story('LsObjectDirectory', layout, () => collection(LsObjectDirectory)),
  LsOverviewLinks: story('LsOverviewLinks', navigation, () => stage(overviewLinks())),
  LsOverviewPage: story('LsOverviewPage', layout, () => stage(h(LsOverviewPage, { title: '团队概览', description: '查看当前身份与工作入口。' }, { actions: link, summary, default: overviewLinks }))),
  LsPageLink: story('LsPageLink', navigation, () => stage(h('div', [link(), h(LsPageLink, { href: '//doc.lostsky.work', icon: FileText, label: '使用文档', target: '_blank', rel: 'noopener noreferrer' })]))),
  LsRadioGroupField: story('LsRadioGroupField', [...navigation, 'disabled'], state => stage(h(RadioPreview, { state }))),
  LsResourceList: story('LsResourceList', layout, () => stage(resources())),
  LsResourceRow: story('LsResourceRow', navigation, state => stage(h(LsResourceList, null, { default: () => resourceRow(state === 'active') }))),
  LsSinglePanelPage: story('LsSinglePanelPage', layout, () => stage(h(LsSinglePanelPage, { title: '商品工作台', description: '集中查看商品管理范围。' }, { actions: link, default: () => [summary(), overviewLinks()] }))),
  LsWorkspaceScene: story('LsWorkspaceScene', layout, () => h(NConfigProvider, workspaceSceneProviderProps(true), { default: () => h(LsWorkspaceScene, null, { default: () => stage(h(LsPanel, null, { default: () => [h('h2', '团队工作空间'), summary()] })) }) })),
  FormFieldLayout: story('FormFieldLayout', layout, () => stage(h(FormFieldLayout, null, { label: () => h('label', { for: 'preview-layout-input' }, '显示名称'), default: () => h(NInput, { defaultValue: '青空成员', inputProps: { id: 'preview-layout-input', 'aria-describedby': 'preview-layout-feedback' } }), feedback: () => h('p', { id: 'preview-layout-feedback' }, '名称用于团队内人员列表。') }))),
  PageContextLayout: story('PageContextLayout', layout, () => stage(h(PageContextLayout, { asideLabel: '当前身份信息' }, { default: fields, aside: summary }))),
}
