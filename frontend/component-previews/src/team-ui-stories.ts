import { h } from 'vue'
import { NConfigProvider, NSelect } from 'naive-ui'
import { FileText, Bot } from '@lucide/vue'
import TeamPageHeader from '../../apps/team/src/ui/components/LsPageHeader.vue'
import TeamListToolbar from '../../apps/team/src/ui/components/LsListToolbar.vue'
import TeamPageLink from '../../apps/team/src/ui/components/LsPageLink.vue'
import { workspaceSceneProviderProps } from '../../apps/team/src/ui/workspace-scene-theme'
import type { StoryDefinition } from './story-types'

const stage = (content: ReturnType<typeof h>) => h(NConfigProvider, workspaceSceneProviderProps(true), { default: () => h('div', { class: 'story-stage' }, [content]) })
export const teamUiStories: Record<string, StoryDefinition> = {
  TeamPageHeader: {
    name: 'TeamPageHeader', supported: ['default', 'hover', 'focus', 'active', 'mobile'],
    reason: { disabled: '导航入口始终可访问。', loading: '标题不管理业务加载状态。', error: '错误由业务内容展示。' },
    render: () => stage(h(TeamPageHeader, { title: '人员', description: '查看团队内有权查看的人员。' }, { actions: () => [h(TeamPageLink, { to: '/fields', icon: FileText, label: '对象字段' }), h(TeamPageLink, { to: '/virtuals', icon: Bot, label: '虚拟人员' })] })),
  },
  TeamListToolbar: {
    name: 'TeamListToolbar', supported: ['default', 'hover', 'focus', 'active', 'disabled', 'mobile'],
    reason: { loading: '搜索工具栏不管理业务加载状态。', error: '错误由业务内容展示。' },
    render: state => stage(h(TeamListToolbar, { placeholder: '搜索人员名称或 slug', ariaLabel: '搜索人员', countLabel: '12 位人员' }, { filters: () => h(NSelect, { value: 'all', disabled: state === 'disabled', options: [{ value: 'all', label: '全部类型' }, { value: 'member', label: '成员' }] }) })),
  },
}
