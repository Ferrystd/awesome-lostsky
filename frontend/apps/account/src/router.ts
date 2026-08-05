import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@lostsky/api/client'
import { goToSafeRedirect } from '@lostsky/shared/navigation'
const LoginView = () => import('./views/LoginView.vue')
const RegisterView = () => import('./views/RegisterView.vue')
const TeamsView = () => import('./views/TeamsView.vue')
const IdentityView = () => import('./views/IdentityView.vue')
const MemberIdentityCallbackView = () => import('./views/MemberIdentityCallbackView.vue')
const CurrentEntityShell = () => import('./views/CurrentEntityShell.vue')
const CurrentEntityProfileView = () => import('./views/CurrentEntityProfileView.vue')
const CurrentEntityFieldsView = () => import('./views/CurrentEntityFieldsView.vue')
const CurrentEntityAccessView = () => import('./views/CurrentEntityAccessView.vue')

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginView, meta: { public: true, title: '登录' } },
    { path: '/register', component: RegisterView, meta: { public: true, title: '注册' } },
    { path: '/teams', component: TeamsView, meta: { title: '我的团队' } },
    { path: '/identity', component: IdentityView, meta: { title: '选择身份' } },
    { path: '/identity/member-callback', component: MemberIdentityCallbackView, meta: { title: '领取成员身份' } },
    {
      path: '/identity/current',
      component: CurrentEntityShell,
      children: [
        { path: '', redirect: to => ({ path: '/identity/current/profile', query: to.query }) },
        { path: 'profile', component: CurrentEntityProfileView, meta: { title: '当前实体资料' } },
        { path: 'fields', component: CurrentEntityFieldsView, meta: { title: '当前实体对象字段' } },
        { path: 'access', component: CurrentEntityAccessView, meta: { title: '当前实体角色权限' } },
      ],
    },
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
