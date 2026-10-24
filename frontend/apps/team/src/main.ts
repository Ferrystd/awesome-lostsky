import '@lostsky/ui/styles.css'
import { lostskyQueryPluginOptions } from '@lostsky/api/query'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
const app = createApp(App).use(createPinia()).use(VueQueryPlugin, lostskyQueryPluginOptions).use(router)
// Resolve the initial route before rendering its scene/provider. Rejections remain observable.
void router.isReady().then(() => app.mount('#app'))
