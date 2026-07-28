import { auth } from '@lostsky/api/client'
import { redirectToLogin } from '@lostsky/shared/navigation'
import { createRouter, createWebHistory } from 'vue-router'
import { isCustomerReady } from './lib'

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', component: () => import('./views/HomeView.vue'), meta: { title: '商城' } },
    { path: '/product/:id(\\d+)', component: () => import('./views/ProductView.vue'), meta: { title: '商品详情' } },
    { path: '/product/:id(\\d+)/checkout', component: () => import('./views/CheckoutView.vue'), meta: { title: '确认购买', customer: true } },
    { path: '/customer/bind', component: () => import('./views/CustomerBindView.vue'), meta: { title: '领取客户身份' } },
    { path: '/orders', component: () => import('./views/OrdersView.vue'), meta: { title: '我的订单', customer: true } },
    { path: '/orders/:id(\\d+)', component: () => import('./views/OrderView.vue'), meta: { title: '订单详情', customer: true } },
    { path: '/:pathMatch(.*)*', component: () => import('./views/NotFoundView.vue'), meta: { title: '页面不存在' } },
  ],
})
let initialNavigation = true

router.beforeEach((to) => {
  if (!to.meta.customer) return true
  if (!auth.token()) {
    redirectToLogin({ redirect: location.href })
    return false
  }
  if (!isCustomerReady()) {
    return { path: '/customer/bind', query: { redirect: to.fullPath } }
  }
  return true
})

router.afterEach((to) => {
  document.title = `${String(to.meta.title ?? '商城')} · LostSky`
  if (initialNavigation) {
    initialNavigation = false
    return
  }
  requestAnimationFrame(() => document.querySelector<HTMLElement>('main h1')?.focus())
})
