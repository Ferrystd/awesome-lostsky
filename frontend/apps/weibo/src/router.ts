import { auth } from '@lostsky/api/client'
import { identityUrl, redirectToLogin } from '@lostsky/shared/navigation'
import { createRouter, createWebHistory } from 'vue-router'

const Overview = () => import('./views/OverviewView.vue')
const Accounts = () => import('./views/AccountsView.vue')
const AccountBinding = () => import('./views/AccountBindingView.vue')
const Operation = () => import('./views/OperationView.vue')
const Tasks = () => import('./views/TasksView.vue')
const TaskForm = () => import('./views/TaskFormView.vue')
const Logs = () => import('./views/LogsView.vue')

const scoped = (prefix: '' | '/personal', workspace: 'team' | 'personal') => [
  { path: prefix || '/overview', component: Overview, meta: { title: '概览', workspace, pageWidth: 'wide' } },
  { path: `${prefix}/accounts`, component: Accounts, meta: { title: '账号', workspace, pageWidth: 'wide' } },
  { path: `${prefix}/accounts/bind`, component: AccountBinding, meta: { title: '绑定账号', workspace, pageWidth: 'form' } },
  { path: `${prefix}/compose`, component: Operation, meta: { title: '超话发帖', workspace, operation: 'post', pageWidth: 'form' } },
  { path: `${prefix}/interactions`, component: Operation, meta: { title: '点赞与评论', workspace, operation: 'interaction', pageWidth: 'form' } },
  { path: `${prefix}/tasks`, component: Tasks, meta: { title: '持续任务', workspace, pageWidth: 'wide' } },
  { path: `${prefix}/tasks/new`, component: TaskForm, meta: { title: '新建任务', workspace, pageWidth: 'form' } },
  { path: `${prefix}/tasks/:id(\\d+)`, component: TaskForm, meta: { title: '编辑任务', workspace, pageWidth: 'form' } },
  { path: `${prefix}/logs`, component: Logs, meta: { title: '执行日志', workspace, pageWidth: 'wide' } },
]

export const router = createRouter({ history: createWebHistory(), scrollBehavior: () => ({ top: 0 }), routes: [
  { path: '/', redirect: '/overview' }, ...scoped('', 'team'), ...scoped('/personal', 'personal'),
] })
router.beforeEach((to) => {
  document.title = `${String(to.meta.title ?? '微博')} · LostSky`
  if (!auth.token()) { redirectToLogin(); return false }
  if (!['team', 'teamMember', 'teamVirtual'].includes(String(auth.entity()?.type ?? ''))) { location.replace(identityUrl(location.href)); return false }
})
