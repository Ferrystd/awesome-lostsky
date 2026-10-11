import '@lostsky/ui/styles.css'
import { lostskyQueryPluginOptions } from '@lostsky/api/query'
import { lostskyAuroraTheme, lostskyNaiveTheme } from '@lostsky/ui/naive-theme'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import { createApp, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { darkTheme, NConfigProvider, NDialogProvider, NMessageProvider, zhCN } from 'naive-ui'
import PreviewHost from './PreviewHost.vue'
import { adminSession } from '../../apps/admin/src/session'

const id = new URLSearchParams(location.search).get('id') || ''
const auroraScene = ['team-category-layout', 'team-category-navigation', 'team-settings-group'].includes(id)
if (id.startsWith('admin-')) await import('../../apps/admin/src/app.css')
else if (id.startsWith('display-')) await import('../../apps/display/src/app.css')
else if (id.startsWith('shop-')) {
  document.documentElement.dataset.shopSurface = 'manage'
  await import('../../apps/shop/src/app.css')
}
else if (id.startsWith('transaction-')) await import('../../apps/transaction/src/app.css')

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
  render: () => h(NConfigProvider, { class: auroraScene ? 'ls-theme-aurora' : undefined, theme: auroraScene ? darkTheme : null, themeOverrides: auroraScene ? lostskyAuroraTheme : lostskyNaiveTheme, locale: zhCN }, {
    default: () => h(NDialogProvider, null, {
      default: () => h(NMessageProvider, null, { default: () => h(PreviewHost) }),
    }),
  }),
}

createApp(Root).use(createPinia()).use(VueQueryPlugin, lostskyQueryPluginOptions).use(router).mount('#app')
