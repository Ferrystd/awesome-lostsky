import '@fontsource/barlow-condensed/latin-600.css'
import '@fontsource/barlow-condensed/latin-700.css'
import '@lostsky/ui/styles.css'
import './app.css'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'

const app = createApp(App).use(VueQueryPlugin).use(router)
// Do not render the storefront while the initial manage route is still resolving.
void router.isReady().then(() => app.mount('#app'))
