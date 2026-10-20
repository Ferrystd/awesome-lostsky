import '@lostsky/ui/styles.css'
import { createApp, h, provide, ref } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { NConfigProvider, NSelect, NFlex } from 'naive-ui'
import { FileText, Bot, Pencil, MessageCircleMore } from '@lucide/vue'
import { workspaceSceneProviderProps } from '@lostsky/ui/workspace-scene-theme'
import { workspaceSceneKey } from '@lostsky/ui/workspace-scene'
import LsCollectionPage from '@lostsky/ui/components/LsCollectionPage.vue'
import LsObjectDirectory from '@lostsky/ui/components/LsObjectDirectory.vue'
import LsCategoryPage from '@lostsky/ui/components/LsCategoryPage.vue'
import LsDetailPage from '@lostsky/ui/components/LsDetailPage.vue'
import LsFormPage from '@lostsky/ui/components/LsFormPage.vue'
import LsOverviewPage from '@lostsky/ui/components/LsOverviewPage.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsPageNavigation from '@lostsky/ui/components/LsPageNavigation.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'

const query = new URLSearchParams(location.search)
const long = query.has('long')
const state = query.get('state')
const actions = () => [
  h(LsPageLink, { to: '/fields', icon: FileText, label: long ? '查看和维护全部人员的对象资料字段' : '对象字段' }),
  h(LsPageLink, { to: '/virtuals', icon: Bot, label: long ? '查看和管理团队的所有虚拟人员' : '虚拟人员' }),
]
const toolbar = (multiple = false) => h(LsListToolbar, { embedded: true, placeholder: '搜索人员名称或 slug', countLabel: '12 位人员' }, {
  filters: () => (multiple ? [1, 2, 3] : [1]).map(id => h(NSelect, { value: 'all', disabled: state === 'disabled', options: [{ value: 'all', label: id === 1 ? '全部类型' : `分类 ${id}` }] })),
})
const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }] })
createApp({
  setup() {
    provide(workspaceSceneKey, { available: ref(true), paused: ref(false) })
    return () => h(NConfigProvider, workspaceSceneProviderProps(true), { default: () => h('main', { style: 'padding:16px;display:grid;grid-template-columns:minmax(0,1fr);gap:24px;min-width:0' }, [
      ...[LsCollectionPage, LsObjectDirectory, LsCategoryPage, LsDetailPage, LsFormPage, LsOverviewPage].map((component, index) => h('section', { 'data-template': index }, [
        h(component, { title: long ? '需要保留全部文字的人员管理页面标题' : '人员管理', description: long ? '查看团队内有权查看的人员，保留完整的人员资料说明和访问边界。放大文字后也应当紧随标题自然换行。' : '查看团队内有权查看的人员。', items: [{ key: 'all', label: '全部' }], current: 'all', label: '分类' }, {
          actions: () => query.has('navigation') ? h(LsPageNavigation, { label: 'More navigation', links: [{ to: '/fields', icon: FileText, label: 'Fields' }, { to: '/virtuals', icon: Bot, label: 'Virtual people' }] }) : actions(),
          default: () => h('p', '业务内容'),
        }),
      ])),
      h('section', { 'data-toolbar': 'single' }, [toolbar()]),
      h('section', { 'data-toolbar': 'multiple' }, [toolbar(true)]),
      h(LsResourceList, null, { default: () => h(LsResourceRow, { title: long ? '很长的人员名称'.repeat(12) : '青空成员', to: '/member' }, { actions: () => h(NFlex, { align: 'center', justify: 'end', size: 12 }, { default: () => [h(LsPageLink, { to: '/chat', icon: MessageCircleMore, label: '对话' }), h(LsPageLink, { to: '/manage', icon: Pencil, label: '管理' })] }) }) }),
      h('section', { 'data-command-pair': '' }, [h(LsFormActions, null, { default: () => [h(LsButton, { variant: 'secondary', disabled: state === 'disabled', disabledReason: '测试只读状态' }, { default: () => '取消' }), h(LsButton, { loading: state === 'loading' }, { default: () => '保存' })] })]),
      h('section', { 'data-long-commands': 'single' }, [h(LsFormActions, null, { default: () => h(LsButton, null, { default: () => '创建并发送邀请' }) })]),
      h('section', { 'data-long-commands': 'pair' }, [h(LsFormActions, null, { default: () => [h(LsButton, { variant: 'secondary' }, { default: () => '取消当前修改' }), h(LsButton, null, { default: () => '创建并发送邀请' })] })]),
      h('section', { 'data-primary': '' }, [h(LsPagePrimaryAction, { icon: Pencil, label: long ? '保存当前人员的完整资料修改' : '保存资料', disabled: state === 'disabled', disabledReason: '测试只读状态', loading: state === 'loading' })]),
    ]) })
  },
}).use(router).mount('#app')
