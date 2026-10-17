import { h } from 'vue'
import { ListChecks, BadgeCheck, CircleDollarSign } from '@lucide/vue'
import LsOverviewLinks from '@lostsky/ui/components/LsOverviewLinks.vue'
import type { StoryDefinition } from './story-types'

export const overviewLinksStory: StoryDefinition = {
  name: 'LsOverviewLinks',
  desktopWidth: 1024,
  supported: ['default', 'hover', 'focus', 'active', 'mobile'],
  reason: {
    disabled: '导航入口始终可进入，目标页面解释业务权限。',
    loading: '导航来自固定配置，不依赖统计请求。',
    error: '错误由所在页面的数据区域显示，导航保持可用。',
  },
  render: () => h(LsOverviewLinks, { label: '团队业务入口', entries: [
    { key: 'transactions', label: '团队流水', description: '查看团队收入、支出与调整记录。', to: '/transactions', icon: ListChecks },
    { key: 'services', label: '权益核销', description: '处理并记录顾客核销。', to: '/services', icon: BadgeCheck },
    { key: 'balances', label: '顾客余额', description: '查看顾客余额和流水明细，继续处理顾客预存业务。', to: '/balances', icon: CircleDollarSign },
  ] }),
}
