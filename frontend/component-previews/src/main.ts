import '@lostsky/ui/styles.css'
import { lostskyQueryPluginOptions } from '@lostsky/api/query'
import { lostskyNaiveTheme } from '@lostsky/ui/naive-theme'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import { createApp, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { NConfigProvider, NDialogProvider, NMessageProvider, zhCN } from 'naive-ui'
import PreviewHost from './PreviewHost.vue'
import { adminSession } from '../../apps/admin/src/session'

const id = new URLSearchParams(location.search).get('id') || ''
if (id.startsWith('display-')) await import('../../apps/display/src/app.css')

adminSession.data = {
  user: {
    id: 1,
    username: 'preview-admin',
    email_masked: 'pre***@example.com',
    phone_masked: '138****8000',
  },
  roles: [],
  is_super_admin: true,
  permissions: ['*'],
}
adminSession.loaded = true

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/:pathMatch(.*)*', component: { render: () => h('div') }, meta: { title: '组件预览' } }],
})

const Root = {
  render: () => h(NConfigProvider, { themeOverrides: lostskyNaiveTheme, locale: zhCN }, {
    default: () => h(NDialogProvider, null, {
      default: () => h(NMessageProvider, null, { default: () => h(PreviewHost) }),
    }),
  }),
}

createApp(Root).use(createPinia()).use(VueQueryPlugin, lostskyQueryPluginOptions).use(router).mount('#app')
