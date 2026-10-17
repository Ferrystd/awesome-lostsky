import { h } from 'vue'
import { UserRound, ListChecks, BadgeCheck, BarChart3 } from '@lucide/vue'
import LsOverviewPage from '@lostsky/ui/components/LsOverviewPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsOverviewLinks from '@lostsky/ui/components/LsOverviewLinks.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import type { StoryDefinition } from './story-types'

export const overviewStory: StoryDefinition = {
  name: 'LsOverviewPage',
  desktopWidth: 1024,
  supported: ['default', 'hover', 'focus', 'active', 'loading', 'error', 'mobile'],
  reason: { disabled: '模板不持有禁用状态；业务命令由插槽内容负责。' },
  render: state => h(LsOverviewPage, { title: '青空协作组', description: '看清每笔收支的来处与去向，让流水、权益核销和顾客余额相互衔接。' }, {
    actions: () => h(LsPageLink, { to: '/personal', icon: UserRound, label: '进入个人工作台' }),
    default: () => [
      h(LsPanel, null, {
        header: () => h(LsSectionHeader, { title: '处理团队业务', description: '从已有业务入口继续工作。' }),
        default: () => h(LsOverviewLinks, { label: '团队业务入口', entries: [
          { key: 'transactions', label: '团队流水', description: '查看团队收入、支出与调整记录。', to: '/transactions', icon: ListChecks },
          { key: 'services', label: '权益核销', description: '处理并记录顾客核销。', to: '/services', icon: BadgeCheck },
        ] }),
        footer: () => h(LsSectionHeader, { title: '回看经营表现', headingLevel: 3 }, {
          aside: () => h(LsPageLink, { to: '/stats', icon: BarChart3, label: '查看经营统计' }),
        }),
      }),
      state === 'loading' ? h(LsAsyncState, { state: 'loading', rows: 2 })
        : state === 'error' ? h(LsAsyncState, { state: 'error', title: '团队摘要暂时不可用', description: '暂时无法连接服务，业务入口仍可使用。' }) : null,
    ],
  }),
}
