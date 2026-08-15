import { auth } from '@lostsky/api/client'
import { identityUrl, redirectToLogin, shopWorkspaceUrl } from '@lostsky/shared/navigation'
import { createRouter, createWebHistory } from 'vue-router'
import { hasWorkspacePermission, loadWorkspaceAccess, serviceRedemptionReadPermissions } from './lib/workspace-access'

const TransactionsView = () => import('./views/TransactionsView.vue')
const TransactionFormView = () => import('./views/TransactionFormView.vue')
const TransactionDetailView = () => import('./views/TransactionDetailView.vue')
const StatsView = () => import('./views/StatsView.vue')
const BalancesView = () => import('./views/BalancesView.vue')
const BalanceLogsView = () => import('./views/BalanceLogsView.vue')
const RechargeView = () => import('./views/RechargeView.vue')
const ServicesView = () => import('./views/ServicesView.vue')
const ServiceDetailView = () => import('./views/ServiceDetailView.vue')
const PersonalWorkspaceView = () => import('./views/PersonalWorkspaceView.vue')
const PersonalServiceTaskView = () => import('./views/PersonalServiceTaskView.vue')
const PersonalOverviewView = () => import('./views/PersonalOverviewView.vue')
const PersonalCustomersView = () => import('./views/PersonalCustomersView.vue')
const UnavailableView = () => import('./views/UnavailableView.vue')
const TeamOverviewView = () => import('./views/TeamOverviewView.vue')
const EntitlementGrantView = () => import('./views/EntitlementGrantView.vue')
const PersonalEntitlementsView = () => import('./views/PersonalEntitlementsView.vue')

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', component: TransactionsView, meta: { title: '流水', pageWidth: 'wide', permission: 'transaction.read' } },
    { path: '/overview', component: TeamOverviewView, meta: { title: '概览', pageWidth: 'wide', accessPublic: true } },
    { path: '/unavailable', component: UnavailableView, meta: { title: '记账暂不可用', pageWidth: 'content', accessPublic: true } },
    { path: '/personal', component: PersonalOverviewView, meta: { title: '概览', pageWidth: 'wide', workspace: 'personal', accessPublic: true } },
    { path: '/personal/transactions', component: PersonalWorkspaceView, meta: { title: '我的流水', pageWidth: 'wide', workspace: 'personal', personalSection: 'transactions' } },
    { path: '/personal/transactions/new', component: TransactionFormView, meta: { title: '登记流水', pageWidth: 'form', workspace: 'personal', permission: 'transaction.write', permissionFallback: '/personal/transactions' } },
    { path: '/personal/services', component: PersonalWorkspaceView, meta: { title: '我的接单', pageWidth: 'wide', workspace: 'personal', personalSection: 'services' } },
    { path: '/personal/service-offers/:id(\\d+)', component: PersonalServiceTaskView, meta: { title: '接单邀请', pageWidth: 'content', workspace: 'personal', personalTask: 'offer' } },
    { path: '/personal/services/available/:id(\\d+)', component: PersonalServiceTaskView, meta: { title: '公开任务', pageWidth: 'content', workspace: 'personal', personalTask: 'available' } },
    { path: '/personal/services/:id(\\d+)', component: PersonalServiceTaskView, meta: { title: '我的接单任务', pageWidth: 'content', workspace: 'personal', personalTask: 'assigned' } },
    { path: '/personal/customers', component: PersonalCustomersView, meta: { title: '我的顾客', pageWidth: 'wide', workspace: 'personal' } },
    { path: '/personal/bindings', redirect: '/personal/customers' },
    { path: '/personal/entitlements', component: PersonalEntitlementsView, meta: { title: '权益下发', pageWidth: 'wide', workspace: 'personal' } },
    { path: '/personal/entitlements/new', component: EntitlementGrantView, meta: { title: '下发顾客权益', pageWidth: 'form', workspace: 'personal', permission: 'service.entitlement.grant', permissionFallback: '/personal/entitlements' } },
    { path: '/detail', component: TransactionDetailView, meta: { title: '流水详情', pageWidth: 'content', permission: 'transaction.read' } },
    { path: '/edit', component: TransactionFormView, meta: { title: '编辑流水', pageWidth: 'form', permission: 'transaction.write' } },
    { path: '/stats', component: StatsView, meta: { title: '经营统计', pageWidth: 'wide', permission: 'transaction.report.read' } },
    { path: '/services', component: ServicesView, meta: { title: '服务核销', pageWidth: 'wide', permission: serviceRedemptionReadPermissions } },
    { path: '/entitlements/new', component: EntitlementGrantView, meta: { title: '赋予顾客权益', pageWidth: 'form', permission: 'transaction.write' } },
    { path: '/services/:id(\\d+)', component: ServiceDetailView, meta: { title: '核销详情', pageWidth: 'content', permission: serviceRedemptionReadPermissions } },
    { path: '/balances', component: BalancesView, meta: { title: '顾客余额', pageWidth: 'wide', permission: 'transaction.read' } },
    { path: '/balance', component: BalanceLogsView, meta: { title: '余额明细', pageWidth: 'content', permission: 'transaction.read' } },
    { path: '/recharge', component: RechargeView, meta: { title: '顾客充值', pageWidth: 'form', permission: 'transaction.write' } },
  ],
})

router.beforeEach(async (to) => {
  document.title = `${String(to.meta.title ?? '记账')} · LostSky`
  if (!auth.token()) {
    redirectToLogin()
    return false
  }
  const entityType = String(auth.entity()?.type ?? '')
  if (!['team', 'teamMember', 'teamVirtual'].includes(entityType)) {
    location.replace(entityType === 'teamCustomer'
      ? shopWorkspaceUrl('/customer/profile')
      : identityUrl(location.href))
    return false
  }
  try {
    const access = await loadWorkspaceAccess()
    if (!access.abilities?.transaction?.enabled && to.path !== '/unavailable') return '/unavailable'
    if (access.abilities?.transaction?.enabled && to.path === '/unavailable') return '/'
    const permission = to.meta.permission
    if (permission && !hasWorkspacePermission(access.permissions, permission as string | readonly string[])) {
      return String(to.meta.permissionFallback ?? (to.meta.workspace === 'personal' ? '/personal' : '/overview'))
    }
  } catch {
    if (to.path !== '/unavailable') return '/unavailable'
  }
})
