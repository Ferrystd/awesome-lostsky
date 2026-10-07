import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@lostsky/api/client'
import { goToSafeRedirect } from '@lostsky/shared/navigation'
const LoginView = () => import('./views/LoginView.vue')
const RecoveryView = () => import('./views/RecoveryView.vue')
const RegisterView = () => import('./views/RegisterView.vue')
const TeamsView = () => import('./views/TeamsView.vue')
const IdentityView = () => import('./views/IdentityView.vue')
const MemberIdentityCallbackView = () => import('./views/MemberIdentityCallbackView.vue')
const WorkspaceWarningView = () => import('./views/WorkspaceWarningView.vue')
const CurrentEntityRedirectView = () => import('./views/CurrentEntityRedirectView.vue')

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginView, meta: { public: true, title: '登录' } },
    { path: '/recovery', component: RecoveryView, meta: { public: true, title: '账号恢复' } },
    { path: '/register', component: RegisterView, meta: { public: true, title: '注册' } },
    { path: '/teams', component: TeamsView, meta: { title: '我的团队' } },
    { path: '/identity', component: IdentityView, meta: { title: '选择身份' } },
    { path: '/identity/member-callback', component: MemberIdentityCallbackView, meta: { title: '领取成员身份' } },
    { path: '/identity/workspace-warning', component: WorkspaceWarningView, meta: { title: '外部身份提醒' } },
    { path: '/identity/current/:section?', component: CurrentEntityRedirectView, meta: { title: '正在打开工作台' } },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  document.title = `${String(to.meta.title ?? '通行证')} · LostSky`
  if (!to.meta.public && !auth.token()) return { path: '/login', query: { redirect: to.fullPath } }
  if (to.meta.public && auth.token()) {
    goToSafeRedirect(to.query.redirect)
    return false
  }
})
