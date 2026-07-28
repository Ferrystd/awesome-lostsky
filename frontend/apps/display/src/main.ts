import '@fontsource/barlow-condensed/latin-600.css'
import '@fontsource/barlow-condensed/latin-700.css'
import '@lostsky/ui/styles.css'
import './app.css'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'

createApp(App).use(VueQueryPlugin).use(router).mount('#app')
