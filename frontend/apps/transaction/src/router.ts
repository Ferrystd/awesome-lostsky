import { auth } from '@lostsky/api/client'
import { formatPermissionDenied } from '@lostsky/api/error-format'
import { identityUrl, redirectToLogin, redirectToMemberIdentity, redirectToWorkspaceWarning, redirectWorkspaceRoleError } from '@lostsky/shared/navigation'
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
const TeamOverviewView = () => import('./views/TeamOverviewView.vue')
const EntitlementGrantView = () => import('./views/EntitlementGrantView.vue')
const PersonalEntitlementsView = () => import('./views/PersonalEntitlementsView.vue')

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', redirect: '/overview' },
    { path: '/overview', component: TeamOverviewView, meta: { workspaceScene: true, title: '概览', pageWidth: 'wide', accessPublic: true } },
    { path: '/transactions', component: TransactionsView, meta: { workspaceScene: true, title: '团队流水', pageWidth: 'wide', permission: 'transaction.read', accessMode: 'list' } },
    { path: '/personal', component: PersonalOverviewView, meta: { workspaceScene: true, title: '概览', pageWidth: 'wide', workspace: 'personal', accessPublic: true } },
    { path: '/personal/transactions', component: PersonalWorkspaceView, meta: { workspaceScene: true, title: '我的流水', pageWidth: 'wide', workspace: 'personal', personalSection: 'transactions' } },
    { path: '/personal/transactions/new', component: TransactionFormView, meta: { workspaceScene: true, title: '登记流水', pageWidth: 'content', workspace: 'personal', permission: 'transaction.write', permissionFallback: '/personal/transactions' } },
    { path: '/personal/transactions/:id(\\d+)', component: TransactionDetailView, meta: { workspaceScene: true, title: '流水详情', pageWidth: 'content', workspace: 'personal', personalTransaction: true } },
    { path: '/personal/services', component: PersonalWorkspaceView, meta: { workspaceScene: true, title: '我的接单', pageWidth: 'wide', workspace: 'personal', personalSection: 'services' } },
    { path: '/personal/service-offers/:id(\\d+)', component: PersonalServiceTaskView, meta: { workspaceScene: true, title: '接单邀请', pageWidth: 'content', workspace: 'personal', personalTask: 'offer' } },
    { path: '/personal/services/available/:id(\\d+)', component: PersonalServiceTaskView, meta: { workspaceScene: true, title: '公开任务', pageWidth: 'content', workspace: 'personal', personalTask: 'available' } },
    { path: '/personal/services/:id(\\d+)', component: PersonalServiceTaskView, meta: { workspaceScene: true, title: '我的接单任务', pageWidth: 'content', workspace: 'personal', personalTask: 'assigned' } },
    { path: '/personal/customers', component: PersonalCustomersView, meta: { workspaceScene: true, title: '我的顾客', pageWidth: 'wide', workspace: 'personal' } },
    { path: '/personal/bindings', redirect: '/personal/customers' },
    { path: '/personal/entitlements', component: PersonalEntitlementsView, meta: { workspaceScene: true, title: '权益下发', pageWidth: 'wide', workspace: 'personal' } },
    { path: '/personal/entitlements/new', component: EntitlementGrantView, meta: { workspaceScene: true, title: '下发顾客权益', pageWidth: 'content', workspace: 'personal', permission: 'service.entitlement.grant', permissionFallback: '/personal/entitlements' } },
    { path: '/detail', component: TransactionDetailView, meta: { workspaceScene: true, title: '流水详情', pageWidth: 'content', permission: 'transaction.read' } },
    { path: '/edit', component: TransactionFormView, meta: { workspaceScene: true, title: '编辑流水', pageWidth: 'content', permission: 'transaction.write' } },
    { path: '/stats', component: StatsView, meta: { workspaceScene: true, title: '经营统计', pageWidth: 'wide', permission: 'transaction.report.read', accessMode: 'data' } },
    { path: '/services', component: ServicesView, meta: { workspaceScene: true, title: '权益核销', pageWidth: 'wide', permission: serviceRedemptionReadPermissions, accessMode: 'list' } },
    { path: '/entitlements/new', component: EntitlementGrantView, meta: { workspaceScene: true, title: '赋予顾客权益', pageWidth: 'content', permission: 'transaction.write' } },
    { path: '/services/:id(\\d+)', component: ServiceDetailView, meta: { workspaceScene: true, title: '核销详情', pageWidth: 'content', permission: serviceRedemptionReadPermissions } },
    { path: '/balances', component: BalancesView, meta: { workspaceScene: true, title: '顾客余额', pageWidth: 'wide', permission: 'transaction.read', accessMode: 'list' } },
    { path: '/balance', component: BalanceLogsView, meta: { workspaceScene: true, title: '余额明细', pageWidth: 'content', permission: 'transaction.read', accessMode: 'list' } },
    { path: '/recharge', component: RechargeView, meta: { workspaceScene: true, title: '顾客充值', pageWidth: 'content', permission: 'transaction.write' } },
  ],
})

router.beforeEach(async (to) => {
  document.title = `${String(to.meta.title ?? '记账')} · LostSky`
  if (!auth.token()) {
    redirectToLogin()
    return false
  }
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
    const access = await loadWorkspaceAccess()
    if (to.meta.workspace === 'personal' && access.identity?.is_external) {
      redirectToMemberIdentity(String(access.team?.slug ?? ''), 'team_mismatch')
      return false
    }
    if (to.meta.workspace !== 'personal' && redirectToWorkspaceWarning(access)) return false
    const permission = to.meta.permission
    to.meta.accessReason = permission && !hasWorkspacePermission(access.permissions, permission as string | readonly string[])
      ? formatPermissionDenied(typeof permission === 'string' ? [permission] : permission as readonly string[])
      : ''
  } catch (error) {
    if (redirectWorkspaceRoleError(error)) return false
  }
})
