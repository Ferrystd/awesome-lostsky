import { h } from 'vue'
import { UserRound, ListChecks } from '@lucide/vue'
import LsSinglePanelPage from '@lostsky/ui/components/LsSinglePanelPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import type { StoryDefinition } from './story-types'

export const singlePanelPageStory: StoryDefinition = {
  name: 'LsSinglePanelPage',
  desktopWidth: 1200,
  supported: ['default', 'hover', 'focus', 'loading', 'error', 'mobile'],
  reason: {
    active: '页面模板不持有选中状态。',
    disabled: '页面模板不禁用内容，业务控件自行解释受限原因。',
  },
  render: state => h(LsSinglePanelPage, {
    title: '记账团队工作台（模拟数据）',
    description: '当前团队：青空工作室 · 当前身份：财务协作。正文与标题共同左对齐，右侧自然留白。',
  }, {
    actions: () => h(LsPageLink, { to: '/personal', icon: UserRound, label: '进入个人工作台' }),
    default: () => state === 'loading'
      ? h(LsAsyncState, { state: 'loading', title: '正在读取当前团队…', rows: 2 })
      : state === 'error'
        ? h(LsAsyncState, { state: 'error', title: '团队摘要暂时不可用', description: '暂时无法连接服务。' })
        : h(LsResourceList, null, { default: () => h(LsResourceRow, {
          title: '团队流水', description: '查看团队收入、支出与调整记录。', to: '/transactions', icon: ListChecks,
        }) }),
  }),
}
