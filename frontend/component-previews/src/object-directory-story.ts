import { defineComponent, h, ref } from 'vue'
import { NPagination } from 'naive-ui'
import { Pencil, Plus } from '@lucide/vue'
import LsObjectDirectory from '@lostsky/ui/components/LsObjectDirectory.vue'
import LsDirectoryIdentity from '@lostsky/ui/components/LsDirectoryIdentity.vue'
import LsDirectoryActions from '@lostsky/ui/components/LsDirectoryActions.vue'
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import type { StoryDefinition } from './story-types'

const identity = (blocked = false) => h(LsDirectoryIdentity, {
  type: 'teamMember', name: '把秋天的落日寄给远方的朋友', slug: 'autumn-postcards',
}, { status: () => h(LsStatusTag, { label: blocked ? '已封禁' : '正常', type: blocked ? 'error' : 'success' }), context: () => h('span', '负责晚间接待与顾客资料维护') })
const actions = (disabled = false) => h(LsDirectoryActions, { label: '示例成员的更多操作', actions: [
  { key: 'chat', label: '对话' }, { key: 'block', label: '封禁', disabled, reason: disabled ? '没有封禁成员的权限' : '' }, { key: 'departure', label: '离职', danger: true },
] })
export const objectDirectoryStories: Record<string, StoryDefinition> = {
  LsObjectDirectory: {
    name: 'LsObjectDirectory', desktopWidth: 1024,
    supported: ['default', 'hover', 'focus', 'active', 'disabled', 'loading', 'error', 'mobile'],
    render: state => h(defineComponent({ setup() {
      const keyword = ref('')
      return () => h(LsObjectDirectory, { title: '成员', description: '模拟数据 · 查找成员、确认状态，进入档案处理。' }, {
        actions: () => h(LsPageLink, { to: '/member-add', icon: Plus, label: '添加成员' }),
        toolbar: () => h(LsListToolbar, { embedded: true, modelValue: keyword.value, placeholder: '搜索成员', countLabel: '2 位成员', 'onUpdate:modelValue': value => { keyword.value = value } }),
        default: () => state === 'loading' || state === 'error' ? h(LsAsyncState, { state, title: state === 'error' ? '暂时无法读取成员' : undefined }) : h(LsResourceList, null, { default: () => [
          h(LsResourceRow, { to: '/member-detail?id=1' }, { identity: () => identity(state === 'active'), actions: () => actions(state === 'disabled') }),
          h(LsResourceRow, { to: '/member-detail?id=2' }, { identity: () => h(LsDirectoryIdentity, { type: 'teamMember', name: '林间', slug: 'linjian' }, { status: () => h(LsStatusTag, { label: '正常', type: 'success' }) }), actions: () => h(LsPageLink, { to: '/member-edit?id=2', icon: Pencil, label: '管理' }) }),
        ] }),
        pagination: () => h(NPagination, { page: 1, pageCount: 3 }),
      })
    } })),
  },
  LsDirectoryIdentity: {
    name: 'LsDirectoryIdentity', supported: ['default', 'mobile'],
    reason: { hover: '焦点和悬停由外部资源行链接承载。', focus: '身份内容不创建第二个交互目标。', active: '当前项由外部链接负责。', disabled: '业务状态通过 status 插槽展示，不禁用身份文本。', loading: '加载由页面负责。', error: '错误和空态由页面负责。' },
    render: () => identity(),
  },
  LsDirectoryActions: {
    name: 'LsDirectoryActions', supported: ['default', 'hover', 'focus', 'active', 'disabled', 'mobile'],
    reason: { loading: '命令处理中的原因由对应 action.disabled/reason 表达。', error: '命令错误由业务处理器反馈。' },
    render: state => actions(state === 'disabled'),
  },
}
