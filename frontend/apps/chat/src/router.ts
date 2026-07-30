import { auth } from '@lostsky/api/client'
import { redirectToLogin } from '@lostsky/shared/navigation'
import { createRouter, createWebHistory } from 'vue-router'
import { redirectLegacyProfile } from './lib/profile-navigation'

const TeamPickerView = () => import('./views/TeamPickerView.vue')
const ChatView = () => import('./views/ChatView.vue')
const NewConversationView = () => import('./views/NewConversationView.vue')
const labels = location.hostname.split('.')
const workspaceHost = import.meta.env.DEV || (labels.length > 3 && labels.at(-3) === 'chat')

export const router = createRouter({
  history: createWebHistory(),
  routes: workspaceHost
    ? [
        { path: '/', component: ChatView, meta: { title: '消息' } },
        { path: '/new', component: NewConversationView, meta: { title: '新会话' } },
        {
          path: '/profile',
          component: ChatView,
          beforeEnter: () => {
            redirectLegacyProfile()
            return false
          },
          meta: { title: '身份入口' },
        },
      ]
    : [
        { path: '/:pathMatch(.*)*', component: TeamPickerView, meta: { title: '选择团队' } },
      ],
})

router.beforeEach((to) => {
  document.title = `${String(to.meta.title ?? 'Chat')} · LostSky`
  if (!auth.token()) {
    redirectToLogin()
    return false
  }
})
