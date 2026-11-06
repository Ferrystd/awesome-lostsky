import { createApp, h } from 'vue'
import { NConfigProvider } from 'naive-ui'
import SharedHeader from '../frontend/packages/ui/src/components/LsWorkspaceHeader.vue'
import TeamHeader from '../frontend/apps/team/src/ui/components/LsWorkspaceHeader.vue'
import '../frontend/packages/ui/src/styles.css'

export function mountHeader(kind: 'team' | 'shared', count: number) {
  const actions = Array.from({ length: count }, (_, index) => ({ key: `app-${index}`, label: `应用 ${index + 1}` }))
  const header = kind === 'team' ? TeamHeader : SharedHeader
  createApp({ render: () => h(NConfigProvider, null, {
    default: () => h(header, { contextLabel: '测试工作台', title: '入口数量随业务增长', actions, appNavigation: true, currentApp: 'app-0' }, {
      actions: () => actions.map(action => h('a', { href: `#${action.key}` }, action.label)),
    }),
  }) }).mount('#app')
}
