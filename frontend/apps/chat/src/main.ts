import '@lostsky/ui/styles.css'
import { lostskyQueryPluginOptions } from '@lostsky/api/query'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'

createApp(App).use(VueQueryPlugin, lostskyQueryPluginOptions).use(router).mount('#app')
