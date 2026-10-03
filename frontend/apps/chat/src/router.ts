import { auth } from '@lostsky/api/client'
import { chatWorkspaceUrl, identityUrl, redirectToLogin } from '@lostsky/shared/navigation'
import { createRouter, createWebHistory } from 'vue-router'
import { redirectLegacyProfile } from './lib/profile-navigation'

const ChatView = () => import('./views/ChatView.vue')
const NewConversationView = () => import('./views/NewConversationView.vue')
export const router = createRouter({
  history: createWebHistory(),
  routes: [
        { path: '/', component: ChatView, meta: { title: '消息' } },
        { path: '/requests', component: () => import('./views/RequestsView.vue'), meta: { title: '邀请与屏蔽' } },
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
      ],
})

router.beforeEach((to) => {
  if (location.hostname.endsWith('.chat.lostsky.work')) {
    location.replace(chatWorkspaceUrl(`${location.pathname}${location.search}${location.hash}`))
    return false
  }
  document.title = `${String(to.meta.title ?? 'Chat')} · LostSky`
  if (!auth.token()) {
    redirectToLogin()
    return false
  }
  if (!auth.entity()) {
    location.replace(identityUrl())
    return false
  }
})
