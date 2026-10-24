import '@lostsky/ui/styles.css'
import { createApp, h, ref } from 'vue'
import { NConfigProvider } from 'naive-ui'
import { workspaceSceneProviderProps } from '@lostsky/ui/workspace-scene-theme'
import LsWorkspaceHeader from '@lostsky/ui/components/LsWorkspaceHeader.vue'

const actions = [
  { key: 'team', label: '团队' },
  { key: 'shop', label: '商品' },
  { key: 'transaction', label: '记账', disabled: true, reason: '当前人员暂不可用' },
  { key: 'chat', label: '聊天' },
  { key: 'weibo', label: '微博' },
]
createApp({
  setup() {
    const selected = ref('')
    return () => h(NConfigProvider, workspaceSceneProviderProps(true), { default: () => [
      h(LsWorkspaceHeader, { title: '示例团队', contextLabel: '团队', appNavigation: true, currentApp: 'team', actions, onAction: (key: string) => { selected.value = key } }, {
        actions: () => actions.map(action => h('a', { href: `/${action.key}` }, action.label)),
      }),
      h('output', { 'data-selected': '' }, selected.value),
    ] })
  },
}).mount('#app')
