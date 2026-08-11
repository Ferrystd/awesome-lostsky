import { auth } from '@lostsky/api/client'
import { identityUrl, redirectToLogin, shopWorkspaceUrl } from '@lostsky/shared/navigation'
import { createRouter, createWebHistory } from 'vue-router'
import { hasWorkspacePermission, loadWorkspaceAccess } from './lib/workspace-access'

const TransactionsView = () => import('./views/TransactionsView.vue')
const TransactionFormView = () => import('./views/TransactionFormView.vue')
const TransactionDetailView = () => import('./views/TransactionDetailView.vue')
const StatsView = () => import('./views/StatsView.vue')
const BindingsView = () => import('./views/BindingsView.vue')
const BindingFormView = () => import('./views/BindingFormView.vue')
const BalancesView = () => import('./views/BalancesView.vue')
const BalanceLogsView = () => import('./views/BalanceLogsView.vue')
const RechargeView = () => import('./views/RechargeView.vue')
const ServicesView = () => import('./views/ServicesView.vue')
const ServiceDetailView = () => import('./views/ServiceDetailView.vue')
const PersonalWorkspaceView = () => import('./views/PersonalWorkspaceView.vue')
const PersonalServiceTaskView = () => import('./views/PersonalServiceTaskView.vue')
const PersonalOverviewView = () => import('./views/PersonalOverviewView.vue')
const UnavailableView = () => import('./views/UnavailableView.vue')
const TeamOverviewView = () => import('./views/TeamOverviewView.vue')

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', component: TransactionsView, meta: { title: '流水', pageWidth: 'wide', permission: 'transaction.read' } },
    { path: '/overview', component: TeamOverviewView, meta: { title: '概览', pageWidth: 'wide', accessPublic: true } },
    { path: '/unavailable', component: UnavailableView, meta: { title: '记账暂不可用', pageWidth: 'content', accessPublic: true } },
    { path: '/personal', component: PersonalOverviewView, meta: { title: '概览', pageWidth: 'wide', workspace: 'personal', accessPublic: true } },
    { path: '/personal/transactions', component: PersonalWorkspaceView, meta: { title: '与我相关的流水', pageWidth: 'wide', workspace: 'personal', personalSection: 'transactions', permission: 'transaction.read' } },
    { path: '/personal/stats', component: PersonalWorkspaceView, meta: { title: '我的业绩', pageWidth: 'wide', workspace: 'personal', personalSection: 'stats', permission: 'transaction.report.read' } },
    { path: '/personal/services', component: PersonalWorkspaceView, meta: { title: '我的核销', pageWidth: 'wide', workspace: 'personal', personalSection: 'services' } },
    { path: '/personal/service-offers/:id(\\d+)', component: PersonalServiceTaskView, meta: { title: '接单邀请', pageWidth: 'content', workspace: 'personal', personalTask: 'offer' } },
    { path: '/personal/services/available/:id(\\d+)', component: PersonalServiceTaskView, meta: { title: '公开任务', pageWidth: 'content', workspace: 'personal', personalTask: 'available' } },
    { path: '/personal/services/:id(\\d+)', component: PersonalServiceTaskView, meta: { title: '我的核销任务', pageWidth: 'content', workspace: 'personal', personalTask: 'assigned' } },
    { path: '/personal/bindings', component: PersonalWorkspaceView, meta: { title: '我的客户协作', pageWidth: 'wide', workspace: 'personal', personalSection: 'bindings', permission: 'transaction.read' } },
    { path: '/new', component: TransactionFormView, meta: { title: '新建流水', pageWidth: 'form', permission: 'transaction.write' } },
    { path: '/detail', component: TransactionDetailView, meta: { title: '流水详情', pageWidth: 'content', permission: 'transaction.read' } },
    { path: '/edit', component: TransactionFormView, meta: { title: '编辑流水', pageWidth: 'form', permission: 'transaction.write' } },
    { path: '/stats', component: StatsView, meta: { title: '经营统计', pageWidth: 'wide', permission: 'transaction.report.read' } },
    { path: '/services', component: ServicesView, meta: { title: '服务核销', pageWidth: 'wide' } },
    { path: '/services/:id(\\d+)', component: ServiceDetailView, meta: { title: '核销详情', pageWidth: 'content' } },
    { path: '/bindings', component: BindingsView, meta: { title: '发单绑定', pageWidth: 'wide', permission: 'transaction.read' } },
    { path: '/binding-new', component: BindingFormView, meta: { title: '新增发单绑定', pageWidth: 'form', permission: 'transaction.write' } },
    { path: '/balances', component: BalancesView, meta: { title: '客户余额', pageWidth: 'wide', permission: 'transaction.read' } },
    { path: '/balance', component: BalanceLogsView, meta: { title: '余额明细', pageWidth: 'content', permission: 'transaction.read' } },
    { path: '/recharge', component: RechargeView, meta: { title: '客户充值', pageWidth: 'form', permission: 'transaction.write' } },
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
    const permission = String(to.meta.permission ?? '')
    if (permission && !hasWorkspacePermission(access.permissions, permission)) return '/overview'
  } catch {
    if (to.path !== '/unavailable') return '/unavailable'
  }
})
