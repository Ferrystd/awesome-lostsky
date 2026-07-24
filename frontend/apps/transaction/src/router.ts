import { auth } from '@lostsky/api/client'
import { redirectToLogin } from '@lostsky/shared/navigation'
import { createRouter, createWebHistory } from 'vue-router'

const TransactionsView = () => import('./views/TransactionsView.vue')
const TransactionFormView = () => import('./views/TransactionFormView.vue')
const TransactionDetailView = () => import('./views/TransactionDetailView.vue')
const StatsView = () => import('./views/StatsView.vue')
const BindingsView = () => import('./views/BindingsView.vue')
const BindingFormView = () => import('./views/BindingFormView.vue')
const BalancesView = () => import('./views/BalancesView.vue')
const BalanceLogsView = () => import('./views/BalanceLogsView.vue')
const RechargeView = () => import('./views/RechargeView.vue')

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', component: TransactionsView, meta: { title: '流水', pageWidth: 'wide' } },
    { path: '/new', component: TransactionFormView, meta: { title: '新建流水', pageWidth: 'form' } },
    { path: '/detail', component: TransactionDetailView, meta: { title: '流水详情', pageWidth: 'content' } },
    { path: '/edit', component: TransactionFormView, meta: { title: '编辑流水', pageWidth: 'form' } },
    { path: '/stats', component: StatsView, meta: { title: '经营统计', pageWidth: 'wide' } },
    { path: '/bindings', component: BindingsView, meta: { title: '发单绑定', pageWidth: 'wide' } },
    { path: '/binding-new', component: BindingFormView, meta: { title: '新增发单绑定', pageWidth: 'form' } },
    { path: '/balances', component: BalancesView, meta: { title: '客户余额', pageWidth: 'wide' } },
    { path: '/balance', component: BalanceLogsView, meta: { title: '余额明细', pageWidth: 'content' } },
    { path: '/recharge', component: RechargeView, meta: { title: '客户充值', pageWidth: 'form' } },
  ],
})

router.beforeEach((to) => {
  document.title = `${String(to.meta.title ?? '记账')} · LostSky`
  if (!auth.token()) {
    redirectToLogin()
    return false
  }
})
