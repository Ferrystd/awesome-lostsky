import { h } from 'vue'
import { UserRound } from '@lucide/vue'
import LsOverviewPage from '@lostsky/ui/components/LsOverviewPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import type { StoryDefinition } from './story-types'

export const overviewStory: StoryDefinition = {
  name: 'LsOverviewPage',
  desktopWidth: 1024,
  supported: ['default', 'hover', 'focus', 'active', 'loading', 'error', 'mobile'],
  reason: { disabled: '模板不持有禁用状态；业务命令由插槽内容负责。' },
  render: state => h(LsOverviewPage, { title: '青空协作组', description: '看清每笔收支的来处与去向，让流水、权益核销和顾客余额相互衔接。' }, {
    actions: () => h(LsPageLink, { to: '/personal', icon: UserRound, label: '进入个人工作台' }),
    summary: () => state === 'loading'
      ? h(LsAsyncState, { state: 'loading', rows: 2 })
      : state === 'error'
        ? h(LsAsyncState, { state: 'error', title: '团队摘要暂时不可用', description: '暂时无法连接服务。' })
        : h(LsPanel, null, { default: () => h(LsDescriptionList, null, { default: () => [h('dt', '当前团队'), h('dd', '青空协作组'), h('dt', '当前身份'), h('dd', '青空接单人')] }) }),
    default: () => h(LsEmptyState, { title: '暂无待核对记录', description: '业务内容由页面放入正文插槽。' }),
  }),
}
