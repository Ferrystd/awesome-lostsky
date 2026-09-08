import { auth } from '@lostsky/api/client'
import { formatPermissionDenied } from '@lostsky/api/error-format'
import { identityUrl, redirectToLogin, redirectToMemberIdentity, redirectToWorkspaceWarning, redirectWorkspaceRoleError } from '@lostsky/shared/navigation'
import { createRouter, createWebHistory } from 'vue-router'
import { hasWeiboPermission, loadAccess } from './lib/workspace'

const Overview = () => import('./views/OverviewView.vue')
const Accounts = () => import('./views/AccountsView.vue')
const AccountBinding = () => import('./views/AccountBindingView.vue')
const Operation = () => import('./views/OperationView.vue')
const Tasks = () => import('./views/TasksView.vue')
const TaskForm = () => import('./views/TaskFormView.vue')
const Logs = () => import('./views/LogsView.vue')

const scoped = (prefix: '' | '/personal', workspace: 'team' | 'personal') => {
  const permission = workspace === 'team' ? 'weibo.team.manage' : 'weibo.personal.use'
  return [
    { path: prefix || '/overview', component: Overview, meta: { title: '概览', workspace, pageWidth: 'wide', accessPublic: true } },
    { path: `${prefix}/accounts`, component: Accounts, meta: { title: '账号', workspace, pageWidth: 'wide', permission, accessMode: 'list' } },
    { path: `${prefix}/accounts/bind`, component: AccountBinding, meta: { title: '绑定账号', workspace, pageWidth: 'form', permission } },
    { path: `${prefix}/compose`, component: Operation, meta: { title: '超话发帖', workspace, operation: 'post', pageWidth: 'form', permission } },
    { path: `${prefix}/interactions`, component: Operation, meta: { title: '点赞与评论', workspace, operation: 'interaction', pageWidth: 'form', permission } },
    { path: `${prefix}/tasks`, component: Tasks, meta: { title: '持续任务', workspace, pageWidth: 'wide', permission, accessMode: 'list' } },
    { path: `${prefix}/tasks/new`, component: TaskForm, meta: { title: '新建任务', workspace, pageWidth: 'form', permission } },
    { path: `${prefix}/tasks/:id(\\d+)`, component: TaskForm, meta: { title: '编辑任务', workspace, pageWidth: 'form', permission } },
    { path: `${prefix}/logs`, component: Logs, meta: { title: '执行日志', workspace, pageWidth: 'wide', permission, accessMode: 'list' } },
  ]
}

export const router = createRouter({ history: createWebHistory(), scrollBehavior: () => ({ top: 0 }), routes: [
  { path: '/', redirect: '/overview' }, ...scoped('', 'team'), ...scoped('/personal', 'personal'),
] })
router.beforeEach(async (to) => {
  document.title = `${String(to.meta.title ?? '微博')} · LostSky`
  if (!auth.token()) { redirectToLogin(); return false }
  const entityType = String(auth.entity()?.type ?? '')
  if (!['team', 'teamMember', 'teamCustomer', 'teamVirtual'].includes(entityType)) { location.replace(identityUrl(location.href)); return false }
  if (to.meta.workspace === 'personal' && !['team', 'teamMember', 'teamVirtual'].includes(entityType)) { location.replace(identityUrl(location.href)); return false }
  try {
    const access = await loadAccess()
    if (to.meta.workspace === 'personal' && access.identity.is_external) {
      redirectToMemberIdentity(String(access.team?.slug ?? ''), 'team_mismatch')
      return false
    }
    if (to.meta.workspace !== 'personal' && redirectToWorkspaceWarning(access)) return false
    const permission = to.meta.permission as 'weibo.personal.use' | 'weibo.team.manage' | undefined
    to.meta.accessReason = permission && !hasWeiboPermission(access, permission)
      ? formatPermissionDenied([permission])
      : ''
  } catch (error) {
    if (redirectWorkspaceRoleError(error)) return false
  }
})
