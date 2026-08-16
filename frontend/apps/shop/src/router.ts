import { auth } from '@lostsky/api/client'
import { identityUrl, redirectToLogin } from '@lostsky/shared/navigation'
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
    { path: '/manage', component: () => import('./views/manage/ManageOverviewView.vue'), meta: { title: '概览', manage: true, managePublic: true, width: 'wide' } },
    { path: '/manage/personal', component: () => import('./views/manage/PersonalOverviewView.vue'), meta: { title: '概览', manage: true, managePublic: true, workspace: 'personal', width: 'wide' } },
    { path: '/manage/personal/products', component: () => import('./views/manage/ProductsView.vue'), meta: { title: '我的商品', manage: true, workspace: 'personal', permission: 'shop.product.self.manage' } },
    { path: '/manage/personal/products/new', component: () => import('./views/manage/ProductFormView.vue'), meta: { title: '新建本人商品', manage: true, workspace: 'personal', permission: 'shop.product.self.manage', width: 'form' } },
    { path: '/manage/personal/products/:id(\\d+)', component: () => import('./views/manage/ProductFormView.vue'), meta: { title: '编辑本人商品', manage: true, workspace: 'personal', permission: 'shop.product.self.manage', width: 'form' } },
    { path: '/manage/personal/products/:id(\\d+)/fields', component: () => import('./views/manage/ProductFieldsView.vue'), meta: { title: '本人商品核销字段', manage: true, workspace: 'personal', permission: 'shop.product.self.manage', width: 'content' } },
    { path: '/manage/personal/services', component: () => import('./views/manage/ServicesView.vue'), meta: { title: '我的服务', manage: true, workspace: 'personal', permission: 'shop.product.self.manage' } },
    { path: '/manage/personal/services/new', component: () => import('./views/manage/ServiceFormView.vue'), meta: { title: '新建本人服务', manage: true, workspace: 'personal', permission: 'shop.product.self.manage', width: 'form' } },
    { path: '/manage/personal/services/:id(\\d+)', component: () => import('./views/manage/ServiceFormView.vue'), meta: { title: '编辑本人服务', manage: true, workspace: 'personal', permission: 'shop.product.self.manage', width: 'form' } },
    { path: '/manage/personal/packages', component: () => import('./views/manage/PackagesView.vue'), meta: { title: '我的权益包', manage: true, workspace: 'personal', permission: 'shop.product.self.manage' } },
    { path: '/manage/personal/packages/new', component: () => import('./views/manage/PackageFormView.vue'), meta: { title: '新建本人权益包', manage: true, workspace: 'personal', permission: 'shop.product.self.manage', width: 'form' } },
    { path: '/manage/personal/packages/:id(\\d+)', component: () => import('./views/manage/PackageFormView.vue'), meta: { title: '编辑本人权益包', manage: true, workspace: 'personal', permission: 'shop.product.self.manage', width: 'form' } },
    { path: '/manage/personal/campaigns', component: () => import('./views/manage/CampaignsView.vue'), meta: { title: '我的卡活动', manage: true, workspace: 'personal', permission: 'shop.product.self.manage' } },
    { path: '/manage/personal/campaigns/new', component: () => import('./views/manage/CampaignFormView.vue'), meta: { title: '新建本人卡活动', manage: true, workspace: 'personal', permission: 'shop.product.self.manage', width: 'form' } },
    { path: '/manage/personal/campaigns/:id(\\d+)', component: () => import('./views/manage/CampaignFormView.vue'), meta: { title: '编辑本人卡活动', manage: true, workspace: 'personal', permission: 'shop.product.self.manage', width: 'form' } },
    { path: '/manage/personal/campaigns/:id(\\d+)/codes', component: () => import('./views/manage/CampaignCodesView.vue'), meta: { title: '我的卡密', manage: true, workspace: 'personal', permission: 'shop.product.self.manage', width: 'content' } },
    { path: '/manage/personal/orders', component: () => import('./views/manage/PersonalOrdersView.vue'), meta: { title: '我的业务订单', manage: true, workspace: 'personal', permission: 'shop.order.read' } },
    { path: '/manage/products', component: () => import('./views/manage/ProductsView.vue'), meta: { title: '商品', manage: true, permission: 'shop.product.read' } },
    { path: '/manage/products/new', component: () => import('./views/manage/ProductFormView.vue'), meta: { title: '新建商品', manage: true, permission: 'shop.product.write', width: 'form' } },
    { path: '/manage/products/:id(\\d+)', component: () => import('./views/manage/ProductFormView.vue'), meta: { title: '编辑商品', manage: true, permission: 'shop.product.read', width: 'form' } },
    { path: '/manage/products/:id(\\d+)/fields', component: () => import('./views/manage/ProductFieldsView.vue'), meta: { title: '核销字段', manage: true, permission: 'shop.product.read', width: 'content' } },
    { path: '/manage/orders', component: () => import('./views/manage/OrdersView.vue'), meta: { title: '订单', manage: true, permission: 'shop.order.read' } },
    { path: '/manage/orders/new', component: () => import('./views/manage/OrderFormView.vue'), meta: { title: '新建订单', manage: true, permission: 'shop.order.write', width: 'form' } },
    { path: '/manage/orders/:id(\\d+)', component: () => import('./views/manage/OrderDetailView.vue'), meta: { title: '订单详情', manage: true, permission: 'shop.order.read', width: 'content' } },
    { path: '/manage/services', component: () => import('./views/manage/ServicesView.vue'), meta: { title: '服务', manage: true, permission: 'shop.product.read' } },
    { path: '/manage/services/new', component: () => import('./views/manage/ServiceFormView.vue'), meta: { title: '新建服务', manage: true, permission: 'shop.product.write', width: 'form' } },
    { path: '/manage/services/:id(\\d+)', component: () => import('./views/manage/ServiceFormView.vue'), meta: { title: '编辑服务', manage: true, permission: 'shop.product.read', width: 'form' } },
    { path: '/manage/packages', component: () => import('./views/manage/PackagesView.vue'), meta: { title: '权益包', manage: true, permission: 'shop.product.read' } },
    { path: '/manage/packages/new', component: () => import('./views/manage/PackageFormView.vue'), meta: { title: '新建权益包', manage: true, permission: 'shop.product.write', width: 'form' } },
    { path: '/manage/packages/:id(\\d+)', component: () => import('./views/manage/PackageFormView.vue'), meta: { title: '编辑权益包', manage: true, permission: 'shop.product.read', width: 'form' } },
    { path: '/manage/campaigns', component: () => import('./views/manage/CampaignsView.vue'), meta: { title: '卡活动', manage: true, permission: 'shop.product.read' } },
    { path: '/manage/campaigns/new', component: () => import('./views/manage/CampaignFormView.vue'), meta: { title: '新建卡活动', manage: true, permission: 'shop.product.write', width: 'form' } },
    { path: '/manage/campaigns/:id(\\d+)', component: () => import('./views/manage/CampaignFormView.vue'), meta: { title: '编辑卡活动', manage: true, permission: 'shop.product.read', width: 'form' } },
    { path: '/manage/campaigns/:id(\\d+)/codes', component: () => import('./views/manage/CampaignCodesView.vue'), meta: { title: '兑换码', manage: true, permission: 'shop.product.read', width: 'content' } },
    { path: '/manage/forbidden', component: () => import('./views/manage/ForbiddenView.vue'), meta: { title: '没有访问权限', manage: true, managePublic: true, width: 'content' } },
    { path: '/:pathMatch(.*)*', component: () => import('./views/NotFoundView.vue'), meta: { title: '页面不存在' } },
  ],
})
let initialNavigation = true

router.beforeEach(async (to) => {
  if (to.meta.manage) {
    if (!auth.token()) { redirectToLogin({ redirect: location.href }); return false }
    const entityType = String(auth.entity()?.type ?? '')
    if (!['team', 'teamMember', 'teamVirtual'].includes(entityType)) {
      if (entityType === 'teamCustomer') return '/customer/profile'
      location.replace(identityUrl(location.href))
      return false
    }
    if (to.meta.managePublic) return true
    try {
      const access = await loadManageAccess()
      const permission = String(to.meta.permission ?? '')
      if (permission && !hasManagePermission(access.permissions, permission)) return '/manage/forbidden'
    } catch { return '/manage/forbidden' }
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
