import '@lostsky/ui/styles.css'
import './app.css'
import { lostskyQueryPluginOptions } from '@lostsky/api/query'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'

createApp(App).use(createPinia()).use(VueQueryPlugin, lostskyQueryPluginOptions).use(router).mount('#app')
