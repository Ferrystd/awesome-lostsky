import { auth } from '@lostsky/api/client'
import { formatPermissionDenied } from '@lostsky/api/error-format'
import { identityUrl, redirectToLogin, redirectToMemberIdentity, redirectToWorkspaceWarning, redirectWorkspaceRoleError } from '@lostsky/shared/navigation'
import { syncReferral } from '@lostsky/shared/referral'
import { createRouter, createWebHistory } from 'vue-router'
import { hasManagePermission, isCustomerReady, loadManageAccess, verifyCustomer } from './lib'

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', component: () => import('./views/HomeView.vue'), meta: { title: '商城' } },
    { path: '/product/:id(\\d+)', component: () => import('./views/ProductView.vue'), meta: { title: '商品详情' } },
    { path: '/product/:id(\\d+)/checkout', component: () => import('./views/CheckoutView.vue'), meta: { title: '确认购买', customer: true } },
    { path: '/customer/bind', component: () => import('./views/CustomerBindView.vue'), meta: { title: '领取顾客身份' } },
    { path: '/customer/profile', component: () => import('./views/CustomerProfileView.vue'), meta: { title: '我的资料', customer: true } },
    { path: '/orders', component: () => import('./views/OrdersView.vue'), meta: { title: '我的订单', customer: true } },
    { path: '/orders/:id(\\d+)', component: () => import('./views/OrderView.vue'), meta: { title: '订单详情', customer: true } },
    { path: '/services', component: () => import('./views/ServicesView.vue'), meta: { title: '我的服务', customer: true } },
    { path: '/services/:id(\\d+)', component: () => import('./views/ServiceView.vue'), meta: { title: '服务核销', customer: true } },
    { path: '/cards', component: () => import('./views/CardsView.vue'), meta: { title: '我的卡密', customer: true } },
    { path: '/manage', component: () => import('./views/manage/ManageOverviewView.vue'), meta: { workspaceScene: true, title: '概览', manage: true, managePublic: true, width: 'wide' } },
    { path: '/manage/personal', component: () => import('./views/manage/PersonalOverviewView.vue'), meta: { workspaceScene: true, title: '概览', manage: true, managePublic: true, workspace: 'personal', width: 'wide' } },
    { path: '/manage/personal/products', component: () => import('./views/manage/ProductsView.vue'), meta: { workspaceScene: true, title: '我的商品', manage: true, workspace: 'personal', permission: 'shop.product.self.manage', accessMode: 'list' } },
    { path: '/manage/personal/products/new', component: () => import('./views/manage/ProductFormView.vue'), meta: { workspaceScene: true, title: '新建本人商品', manage: true, workspace: 'personal', permission: 'shop.product.self.manage', width: 'content' } },
    { path: '/manage/personal/products/:id(\\d+)', component: () => import('./views/manage/ProductFormView.vue'), meta: { workspaceScene: true, title: '编辑本人商品', manage: true, workspace: 'personal', permission: 'shop.product.self.manage', width: 'content' } },
    { path: '/manage/personal/orders', component: () => import('./views/manage/PersonalOrdersView.vue'), meta: { workspaceScene: true, title: '我的业务订单', manage: true, workspace: 'personal', permission: 'shop.order.read', accessMode: 'list' } },
    { path: '/manage/products', component: () => import('./views/manage/ProductsView.vue'), meta: { workspaceScene: true, title: '商品', manage: true, permission: 'shop.product.read', accessMode: 'list' } },
    { path: '/manage/products/new', component: () => import('./views/manage/ProductFormView.vue'), meta: { workspaceScene: true, title: '新建商品', manage: true, permission: 'shop.product.write', width: 'content' } },
    { path: '/manage/products/:id(\\d+)', component: () => import('./views/manage/ProductFormView.vue'), meta: { workspaceScene: true, title: '编辑商品', manage: true, permission: 'shop.product.read', width: 'content' } },
    { path: '/manage/orders', component: () => import('./views/manage/OrdersView.vue'), meta: { workspaceScene: true, title: '订单', manage: true, permission: 'shop.order.read', accessMode: 'list' } },
    { path: '/manage/orders/new', component: () => import('./views/manage/OrderFormView.vue'), meta: { workspaceScene: true, title: '新建订单', manage: true, permission: 'shop.order.write', width: 'content' } },
    { path: '/manage/orders/:id(\\d+)', component: () => import('./views/manage/OrderDetailView.vue'), meta: { workspaceScene: true, title: '订单详情', manage: true, permission: 'shop.order.read', width: 'content' } },
    { path: '/manage/:pathMatch(.*)*', component: () => import('./views/NotFoundView.vue'), meta: { workspaceScene: true, manage: true, managePublic: true, title: '404', width: 'content' } },
    { path: '/:pathMatch(.*)*', component: () => import('./views/NotFoundView.vue'), meta: { title: '页面不存在' } },
  ],
})
let initialNavigation = true

router.beforeEach(async (to) => {
  if (to.meta.manage) {
    if (!auth.token()) { redirectToLogin({ redirect: location.href }); return false }
    const entityType = String(auth.entity()?.type ?? '')
    if (!['team', 'teamMember', 'teamCustomer', 'teamVirtual'].includes(entityType)) {
      location.replace(identityUrl(location.href))
      return false
    }
    if (to.meta.workspace === 'personal' && !['team', 'teamMember', 'teamVirtual'].includes(entityType)) {
      location.replace(identityUrl(location.href))
      return false
    }
    try {
      const access = await loadManageAccess()
      if (to.meta.workspace === 'personal' && access.identity?.is_external) {
        redirectToMemberIdentity(String(access.team?.slug ?? ''), 'team_mismatch')
        return false
      }
      if (to.meta.workspace !== 'personal' && redirectToWorkspaceWarning(access)) return false
      if (to.meta.managePublic) return true
      const permission = String(to.meta.permission ?? '')
      to.meta.accessReason = permission && !hasManagePermission(access.permissions, permission)
        ? formatPermissionDenied([permission])
        : ''
    } catch (error) {
      if (redirectWorkspaceRoleError(error)) return false
      throw error
    }
    return true
  }
  const referral = syncReferral(to.query.ref)
  if (referral && to.query.ref !== referral) {
    return {
      path: to.path,
      query: { ...to.query, ref: referral },
      hash: to.hash,
      replace: true,
    }
  }
  if (!to.meta.customer) return true
  if (!auth.token()) {
    redirectToLogin({ redirect: location.href })
    return false
  }
  if (auth.entity()?.type !== 'teamCustomer') {
    return { path: '/customer/bind', query: { redirect: to.fullPath } }
  }
  if (!isCustomerReady()) {
    try {
      await verifyCustomer()
    } catch {
      return { path: '/customer/bind', query: { redirect: to.fullPath } }
    }
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
