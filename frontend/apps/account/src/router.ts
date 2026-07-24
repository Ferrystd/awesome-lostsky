import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@lostsky/api/client'
import { safeRedirect } from '@lostsky/shared/navigation'
const LoginView = () => import('./views/LoginView.vue')
const RegisterView = () => import('./views/RegisterView.vue')
const TeamsView = () => import('./views/TeamsView.vue')

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginView, meta: { public: true, title: '登录' } },
    { path: '/register', component: RegisterView, meta: { public: true, title: '注册' } },
    { path: '/teams', component: TeamsView, meta: { title: '我的团队' } },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  document.title = `${String(to.meta.title ?? '通行证')} · LostSky`
  if (!to.meta.public && !auth.token()) return { path: '/login', query: { redirect: to.fullPath } }
  if (to.meta.public && auth.token()) {
    const redirect = safeRedirect(to.query.redirect)
    if (redirect.startsWith('https://')) {
      location.replace(redirect)
      return false
    }
    return redirect
  }
})
