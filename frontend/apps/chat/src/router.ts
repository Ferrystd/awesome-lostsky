import { auth } from '@lostsky/api/client'
import { redirectToLogin } from '@lostsky/shared/navigation'
import { createRouter, createWebHistory } from 'vue-router'

const TeamPickerView = () => import('./views/TeamPickerView.vue')
const ChatView = () => import('./views/ChatView.vue')
const NewConversationView = () => import('./views/NewConversationView.vue')
const CustomerProfileView = () => import('./views/CustomerProfileView.vue')
const IdentityView = () => import('./views/IdentityView.vue')
const labels = location.hostname.split('.')
const workspaceHost = import.meta.env.DEV || (labels.length > 3 && labels.at(-3) === 'chat')

export const router = createRouter({
  history: createWebHistory(),
  routes: workspaceHost
    ? [
        { path: '/', component: ChatView, meta: { title: '消息' } },
        { path: '/new', component: NewConversationView, meta: { title: '新会话' } },
        { path: '/profile', component: CustomerProfileView, meta: { title: '客户资料' } },
        { path: '/identity', component: IdentityView, meta: { title: '选择身份' } },
      ]
    : [
        { path: '/identity', component: IdentityView, meta: { title: '选择身份' } },
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
