import '@lostsky/ui/styles.css'
import { lostskyQueryPluginOptions } from '@lostsky/api/query'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { isNavigationFailure, NavigationFailureType } from 'vue-router'
import App from './App.vue'
import { router } from './router'
const app = createApp(App).use(createPinia()).use(VueQueryPlugin, lostskyQueryPluginOptions).use(router)
// A guard may leave this document for login; do not mount after that normal abort.
void router.isReady().then(
  () => app.mount('#app'),
  error => {
    if (!isNavigationFailure(error, NavigationFailureType.aborted)) throw error
  },
)
