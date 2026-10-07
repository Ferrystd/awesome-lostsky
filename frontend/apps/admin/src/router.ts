import { auth } from '@lostsky/api/client'
import { formatPermissionDenied } from '@lostsky/api/error-format'
import { redirectToLogin } from '@lostsky/shared/navigation'
import { createRouter, createWebHistory } from 'vue-router'
import { isForbidden, loadAdminSession } from './session'

const DashboardView = () => import('./views/DashboardView.vue')
const UsersView = () => import('./views/UsersView.vue')
const UserDetailView = () => import('./views/UserDetailView.vue')
const TeamsView = () => import('./views/TeamsView.vue')
const TeamDetailView = () => import('./views/TeamDetailView.vue')
const TeamAbilityGrantView = () => import('./views/TeamAbilityGrantView.vue')
const AdministratorsView = () => import('./views/AdministratorsView.vue')
const AdministratorFormView = () => import('./views/AdministratorFormView.vue')
const RolesView = () => import('./views/RolesView.vue')
const RoleFormView = () => import('./views/RoleFormView.vue')
const AuditView = () => import('./views/AuditView.vue')
const SystemView = () => import('./views/SystemView.vue')
const ForbiddenView = () => import('./views/ForbiddenView.vue')
const EntitlementPackagesView = () => import('./views/EntitlementPackagesView.vue')
const EntitlementPackageFormView = () => import('./views/EntitlementPackageFormView.vue')
const EntitlementCampaignsView = () => import('./views/EntitlementCampaignsView.vue')
const EntitlementCampaignView = () => import('./views/EntitlementCampaignView.vue')

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/communities', component: () => import('./views/CommunitiesView.vue'), meta: { title: '平台社区', permission: 'admin.community.read', communityView: 'list', width: 'content', accessMode: 'list' } },
    { path: '/communities/new', component: () => import('./views/CommunitiesView.vue'), meta: { title: '创建社区', permission: 'admin.community.read', communityView: 'form', width: 'form', accessMode: 'data' } },
    { path: '/communities/:id(\\d+)', component: () => import('./views/CommunitiesView.vue'), meta: { title: '社区详情', permission: 'admin.community.read', communityView: 'detail', width: 'content', accessMode: 'data' } },
    { path: '/communities/:id(\\d+)/edit', component: () => import('./views/CommunitiesView.vue'), meta: { title: '编辑社区', permission: 'admin.community.read', communityView: 'form', width: 'form', accessMode: 'data' } },
    { path: '/communities/:id(\\d+)/administrators', component: () => import('./views/CommunitiesView.vue'), meta: { title: '社区管理员', permission: 'admin.community.read', communityView: 'administrators', width: 'content', accessMode: 'list' } },
    { path: '/communities/:id(\\d+)/manage/:section(boards|announcements|posts|comments|members)/:itemId?', component: () => import('./views/CommunitiesView.vue'), meta: { title: '社区管理', permission: 'admin.community.read', communityView: 'governance', width: 'content', accessMode: 'list' } },
    { path: '/', component: DashboardView, meta: { title: '平台总览', permission: 'admin.dashboard.read', accessMode: 'data' } },
    { path: '/users', component: UsersView, meta: { title: '用户', permission: 'admin.user.read', accessMode: 'list' } },
    { path: '/users/:id(\\d+)', component: UserDetailView, meta: { title: '用户详情', permission: 'admin.user.read', width: 'content' } },
    { path: '/teams', component: TeamsView, meta: { title: '团队', permission: 'admin.team.read', accessMode: 'list' } },
    { path: '/teams/:id(\\d+)', component: TeamDetailView, meta: { title: '团队详情', permission: 'admin.team.read', width: 'content' } },
    { path: '/entitlements/team-abilities', component: TeamAbilityGrantView, meta: { title: '团队能力', permission: 'admin.team.ability.write', width: 'form' } },
    { path: '/administrators', component: AdministratorsView, meta: { title: '平台管理员', permission: 'admin.access.read', accessMode: 'list' } },
    { path: '/administrators/new', component: AdministratorFormView, meta: { title: '添加平台管理员', permission: 'admin.access.write', width: 'form' } },
    { path: '/administrators/:userId(\\d+)', component: AdministratorFormView, meta: { title: '管理员角色', permission: 'admin.access.write', width: 'form' } },
    { path: '/roles', component: RolesView, meta: { title: '平台角色', permission: 'admin.access.read', accessMode: 'list' } },
    { path: '/roles/new', component: RoleFormView, meta: { title: '创建平台角色', permission: 'admin.access.write', width: 'form' } },
    { path: '/roles/:id(\\d+)', component: RoleFormView, meta: { title: '编辑平台角色', permission: 'admin.access.read', width: 'form' } },
    { path: '/audit', component: AuditView, meta: { title: '审计日志', permission: 'admin.audit.read', accessMode: 'list' } },
    { path: '/system', component: SystemView, meta: { title: '系统状态', permission: 'admin.system.read', width: 'content' } },
    { path: '/site-content', component: () => import('./views/SiteContentView.vue'), meta: { title: '官网内容', permission: 'admin.site.read', width: 'form' } },
    { path: '/entitlements/packages', component: EntitlementPackagesView, meta: { title: 'Ability 权益包', permission: 'admin.entitlement.read', accessMode: 'list' } },
    { path: '/entitlements/packages/new', component: EntitlementPackageFormView, meta: { title: '创建 Ability 权益包', permission: 'admin.entitlement.write', width: 'form' } },
    { path: '/entitlements/packages/:id(\\d+)', component: EntitlementPackageFormView, meta: { title: '编辑 Ability 权益包', permission: 'admin.entitlement.read', width: 'form' } },
    { path: '/entitlements/campaigns', component: EntitlementCampaignsView, meta: { title: 'Ability 体验活动', permission: 'admin.entitlement.read', accessMode: 'list' } },
    { path: '/entitlements/campaigns/new', component: EntitlementCampaignView, meta: { title: '创建 Ability 体验活动', permission: 'admin.entitlement.write', width: 'content' } },
    { path: '/entitlements/campaigns/:id(\\d+)', component: EntitlementCampaignView, meta: { title: 'Ability 体验活动', permission: 'admin.entitlement.read', width: 'content' } },
    { path: '/forbidden', component: ForbiddenView, meta: { title: '没有访问权限', publicAdmin: true, width: 'content' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  document.title = `${String(to.meta.title ?? '平台管理')} · LostSky`
  if (!auth.token()) {
    redirectToLogin()
    return false
  }
  if (to.meta.publicAdmin) return true
  try {
    const session = await loadAdminSession()
    const permission = String(to.meta.permission ?? '')
    to.meta.accessReason = permission && !session.is_super_admin && !session.permissions.includes(permission)
      ? formatPermissionDenied([permission])
      : ''
  } catch (error) {
    if (isForbidden(error)) return '/forbidden'
    throw error
  }
})
