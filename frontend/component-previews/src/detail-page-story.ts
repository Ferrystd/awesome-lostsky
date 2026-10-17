import { h } from 'vue'
import { MessageCircleMore } from '@lucide/vue'
import { NConfigProvider } from 'naive-ui'
import { workspaceSceneProviderProps } from '@lostsky/ui/workspace-scene-theme'
import LsDetailPage from '@lostsky/ui/components/LsDetailPage.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsMetricGrid from '@lostsky/ui/components/LsMetricGrid.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import { previewStates, type StoryDefinition } from './story-types'

export const detailPageStory: StoryDefinition = {
  name: 'LsDetailPage',
  desktopWidth: 1024,
  supported: [...previewStates],
  render: state => h(NConfigProvider, workspaceSceneProviderProps(true), { default: () => h(LsDetailPage, {
    title: '青空顾客',
    description: '查看顾客归属、余额和经营摘要；历史订单与流水保留创建时的发单归属。',
    backTo: '/customers',
    backLabel: '返回顾客列表',
  }, {
    aside: () => h(LsPanel, null, { default: () => [h('h2', '已保存的经营摘要'), h(LsDescriptionList, null, { default: () => [h('dt', '所属人员'), h('dd', '青空成员'), h('dt', '公开范围'), h('dd', '团队内部可见，保存后生效')] })] }),
    actions: () => h(LsPageLink, { icon: MessageCircleMore, label: '发起对话', href: 'https://chat.lostsky.work/new?participant=customer-518' }),
    summary: state === 'loading' || state === 'error' ? undefined : () => h(LsMetricGrid, { items: [
      { key: 'balance', label: '可用余额', value: '¥ 1,280.00', hint: '累计充值 ¥ 2,000.00' },
      { key: 'transactions', label: '流水', value: '12 笔', hint: '¥ 720.00' },
      { key: 'orders', label: '订单', value: '8 笔', hint: '¥ 560.00' },
    ] }),
    default: () => state === 'loading' || state === 'error'
      ? h(LsAsyncState, { state, title: '暂时无法读取顾客详情', description: '数据暂时不可用，返回入口与页面操作仍保留。', rows: 5 })
      : h(LsPanel, null, { default: () => h(LsDescriptionList, null, { default: () => [
        h('dt', '顾客昵称'), h('dd', '青空顾客'),
        h('dt', '当前归属人'), h('dd', '青空成员'),
        h('dt', '协作发单人'), h('dd', '青空助手、值班成员'),
      ] }) }),
  }) }),
}
