import { api, auth } from '@lostsky/api/client'
import { identityUrl, redirectToLogin, redirectToMemberIdentity, redirectToWorkspaceWarning, redirectWorkspaceRoleError } from '@lostsky/shared/navigation'
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteLocationGeneric } from 'vue-router'
import { managerScopeOptions, visibilityOptions } from './lib/access'
import { abilityReason, hasPermission, permissionReason, type TeamAccessSnapshot } from './lib/teamAccess'
const DashboardView = () => import('./views/DashboardView.vue')
const DocumentView = () => import('./views/DocumentView.vue')
const DocumentsView = () => import('./views/DocumentsView.vue')
const DocumentFormView = () => import('./views/DocumentFormView.vue')
const JoinView = () => import('./views/JoinView.vue')
const JoinFieldsView = () => import('./views/JoinFieldsView.vue')
const JoinFieldFormView = () => import('./views/JoinFieldFormView.vue')
const JoinReviewView = () => import('./views/JoinReviewView.vue')
const JoinReviewDetailView = () => import('./views/JoinReviewDetailView.vue')
const MemberDepartureView = () => import('./views/MemberDepartureView.vue')
const MemberDepartureDetailView = () => import('./views/MemberDepartureDetailView.vue')
const MembersView = () => import('./views/MembersView.vue')
const MemberFormView = () => import('./views/MemberFormView.vue')
const MemberDetailView = () => import('./views/MemberDetailView.vue')
const FilesView = () => import('./views/FilesView.vue')
const NoticeDetailView = () => import('./views/NoticeDetailView.vue')
const NoticesView = () => import('./views/NoticesView.vue')
const NoticeSendView = () => import('./views/NoticeSendView.vue')
const ResourceView = () => import('./views/ResourceView.vue')
const EntityRolesView = () => import('./views/EntityRolesView.vue')
const RoleDetailView = () => import('./views/RoleDetailView.vue')
const RoleFormView = () => import('./views/RoleFormView.vue')
const RolesView = () => import('./views/RolesView.vue')
const SettingsView = () => import('./views/SettingsView.vue')
const ChatVirtualsView = () => import('./views/ChatVirtualsView.vue')
const ChatVirtualFormView = () => import('./views/ChatVirtualFormView.vue')
const ChatIntegrationFormView = () => import('./views/ChatIntegrationFormView.vue')
const EntityFieldsView = () => import('./views/EntityFieldsView.vue')
const EntityFieldFormView = () => import('./views/EntityFieldFormView.vue')
const EntitiesView = () => import('./views/EntitiesView.vue')
const EntityDetailView = () => import('./views/EntityDetailView.vue')
const CustomersView = () => import('./views/CustomersView.vue')
const CustomerDetailView = () => import('./views/CustomerDetailView.vue')
const AbilitiesView = () => import('./views/AbilitiesView.vue')
const PersonalView = () => import('./views/PersonalView.vue')
const AuditView = () => import('./views/AuditView.vue')
const AuditDetailView = () => import('./views/AuditDetailView.vue')

export interface ResourceFormField {
  key: string
  label: string
  type?: 'text' | 'textarea' | 'number' | 'select' | 'checkbox'
  required?: boolean
  createOnly?: boolean
  defaultValue?: string | number | boolean
  options?: Array<{ label: string; value: string | number }>
}
export interface ResourceMeta {
  title: string
  description: string
  endpoint: string
  fields: string[]
  empty: string
  createEndpoint?: string
  editEndpoint?: string
  deleteEndpoint?: string
  idKey?: string
  deleteKey?: string
  formFields?: ResourceFormField[]
}

const resources: Record<string, ResourceMeta> = {
  members: {
    title: '成员', description: '管理成员状态、公开资料与岗位信息。', endpoint: '/member/index', fields: ['nickname', 'phone', 'status', 'create_time'], empty: '团队中还没有其他成员',
    createEndpoint: '/member/add', editEndpoint: '/member/edit', idKey: 'member_id',
    formFields: [
      { key: 'user_id', label: '用户 ID', type: 'number', required: true, createOnly: true }, { key: 'nickname', label: '团队昵称', required: true },
      { key: 'avatar', label: '头像地址' }, { key: 'description', label: '简介', type: 'textarea' }, { key: 'intro_image', label: '介绍图片地址' },
      { key: 'intro_video', label: '介绍视频地址' }, { key: 'introduction_markdown', label: '详细介绍', type: 'textarea' },
    ],
  },
  roles: {
    title: '角色', description: '建立角色、维护权限（Permission）并分配给成员。', endpoint: '/role/index', fields: ['name', 'role_key', 'description', 'sort'], empty: '还没有自定义角色',
    createEndpoint: '/role/add', editEndpoint: '/role/edit', deleteEndpoint: '/role/delete',
    formFields: [{ key: 'role_key', label: '角色标识', required: true, createOnly: true }, { key: 'name', label: '角色名称', required: true }, { key: 'description', label: '说明', type: 'textarea' }, { key: 'sort', label: '顺序', type: 'number', defaultValue: 0 }],
  },
  notice: { title: '站内通知', description: '集中处理系统提醒和团队消息。', endpoint: '/notice/index', fields: ['title', 'content', 'is_read', 'create_time'], empty: '目前没有站内通知' },
  'join-review': { title: '加入审核', description: '审核加入申请并跟踪入队任务。', endpoint: '/joinReview/index', fields: ['user_id', 'status', 'memo', 'create_time'], empty: '没有待处理的加入申请' },
  files: { title: '文件', description: '查找和管理上传到团队空间的文件。', endpoint: '/file/index', fields: ['name', 'mime_type', 'size', 'create_time'], deleteEndpoint: '/file/delete', empty: '团队空间还没有文件' },
  docs: {
    title: '文档', description: '组织团队流程、规范和长期知识。', endpoint: '/doc', fields: ['title', 'entity_id', 'visibility', 'update_time'], empty: '文档库还是空的',
    createEndpoint: '/doc/create', editEndpoint: '/doc/edit', deleteEndpoint: '/doc/delete',
    formFields: [
      { key: 'title', label: '标题', required: true }, { key: 'content', label: 'Markdown 内容', type: 'textarea' }, { key: 'entity_id', label: '对象 ID', type: 'number', required: true },
      { key: 'manager_scope', label: '管理范围', type: 'select', defaultValue: 1, options: managerScopeOptions }, { key: 'visibility', label: '可见范围', type: 'select', defaultValue: 1, options: visibilityOptions }, { key: 'sort', label: '顺序', type: 'number', defaultValue: 0 },
    ],
  },
}

function legacyNoticeRedirect(to: RouteLocationGeneric, detail = false) {
  const scope = auth.entity()?.type === 'team' ? 'team' : 'entity'
  return {
    path: `${scope === 'entity' ? '/personal/notices' : '/notices/team'}${detail ? '/detail' : ''}`,
    query: to.query,
    hash: to.hash,
  }
}

const routes = [
  { path: '/', component: DashboardView, meta: { workspaceScene: true, pageWidth: 'wide', title: '概览' } },
  { path: '/personal/notices', component: NoticesView, meta: { workspaceScene: true, pageWidth: 'content', title: '收件箱', noticeScope: 'entity', workspace: 'personal' } },
  { path: '/personal/notices/detail', component: NoticeDetailView, meta: { workspaceScene: true, title: '阅读通知', noticeScope: 'entity', workspace: 'personal', pageWidth: 'content' } },
  { path: '/notices/sent', component: NoticesView, meta: { workspaceScene: true, pageWidth: 'content', title: '通知中心', noticeScope: 'sent', permission: 'team.notice.send', accessMode: 'list' } },
  { path: '/notices/sent/detail', component: NoticeDetailView, meta: { workspaceScene: true, title: '通知查看情况', noticeScope: 'sent', permission: 'team.notice.send', pageWidth: 'content' } },
  { path: '/notices/team', component: NoticesView, meta: { workspaceScene: true, pageWidth: 'content', title: '通知中心', noticeScope: 'team', permission: 'team.notice.read', accessMode: 'list' } },
  { path: '/notices/team/detail', component: NoticeDetailView, meta: { workspaceScene: true, title: '阅读站内通知', noticeScope: 'team', pageWidth: 'content', permission: 'team.notice.read' } },
  { path: '/notices/send', component: NoticeSendView, meta: { workspaceScene: true, title: '发送通知', pageWidth: 'content', permission: 'team.notice.send' } },
  { path: '/notice', redirect: (to: RouteLocationGeneric) => legacyNoticeRedirect(to) },
  { path: '/notice-detail', redirect: (to: RouteLocationGeneric) => legacyNoticeRedirect(to, true) },
  { path: '/notice-send', redirect: (to: RouteLocationGeneric) => ({ path: '/notices/send', query: to.query, hash: to.hash }) },
  { path: '/files', component: FilesView, meta: { workspaceScene: true, pageWidth: 'wide', title: '文件', permission: 'file.read', accessMode: 'list' } },
  { path: '/settings', component: SettingsView, meta: { workspaceScene: true, title: '团队设置', pageWidth: 'content', permission: 'team.setting.read' } },
  { path: '/abilities', component: AbilitiesView, meta: { workspaceScene: true, title: '团队能力', pageWidth: 'content', permission: 'team.ability.redeem' } },
  { path: '/audit', component: AuditView, meta: { workspaceScene: true, title: '审计日志', pageWidth: 'content', permission: 'team.audit.read', accessMode: 'list' } },
  { path: '/audit/:id(\\d+)', component: AuditDetailView, meta: { workspaceScene: true, title: '审计事件', pageWidth: 'content', permission: 'team.audit.read' } },
  { path: '/chat-groups', component: () => import('./views/ChatGroupsView.vue'), meta: { workspaceScene: true, pageWidth: 'wide', title: '聊天管理', accessMode: 'list', permission: 'chat.group.manage' } },
  { path: '/chat-groups/new', component: () => import('./views/ChatGroupView.vue'), meta: { workspaceScene: true, title: '创建群聊', pageWidth: 'content', permission: 'chat.group.manage' } },
  { path: '/chat-groups/:uuid', component: () => import('./views/ChatGroupView.vue'), meta: { workspaceScene: true, title: '管理群聊', pageWidth: 'content', permission: 'chat.group.manage' } },
  { path: '/chat-virtuals', component: ChatVirtualsView, meta: { workspaceScene: true, pageWidth: 'wide', title: '虚拟人员', accessMode: 'list' } },
  { path: '/chat-virtual-new', component: ChatVirtualFormView, meta: { workspaceScene: true, title: '创建虚拟人员', pageWidth: 'content', permission: 'team.entity.virtual.create' } },
  { path: '/chat-virtual', component: ChatVirtualFormView, meta: { workspaceScene: true, title: '编辑虚拟人员', pageWidth: 'content', permission: 'team.entity.virtual.<slug>.manage' } },
  { path: '/chat-integration-new', component: ChatIntegrationFormView, meta: { workspaceScene: true, title: '创建 Webhook 集成', pageWidth: 'content', permission: 'team.entity.virtual.<slug>.manage' } },
  { path: '/chat-integration', component: ChatIntegrationFormView, meta: { workspaceScene: true, title: '编辑 Webhook 集成', pageWidth: 'content', permission: 'team.entity.virtual.<slug>.manage' } },
  { path: '/fields', component: EntityFieldsView, meta: { workspaceScene: true, pageWidth: 'wide', title: '对象字段', permission: 'team.entity.field.manage', accessMode: 'list' } },
  { path: '/entities', component: EntitiesView, meta: { workspaceScene: true, pageWidth: 'wide', title: '人员' } },
  { path: '/entity', component: EntityDetailView, meta: { workspaceScene: true, title: '人员资料', pageWidth: 'content' } },
  { path: '/field-new', component: EntityFieldFormView, meta: { workspaceScene: true, title: '创建对象字段', pageWidth: 'content', permission: 'team.entity.field.manage' } },
  { path: '/field-edit', component: EntityFieldFormView, meta: { workspaceScene: true, title: '编辑对象字段', pageWidth: 'content', permission: 'team.entity.field.manage' } },
  { path: '/roles/new', component: RoleFormView, meta: { workspaceScene: true, title: '新建角色', pageWidth: 'content', permission: 'team.role.write' } },
  { path: '/roles/entities', component: EntityRolesView, meta: { workspaceScene: true, title: '人员角色分配', pageWidth: 'content', permission: 'team.role.write' } },
  { path: '/roles/:id(\\d+)', component: RoleDetailView, meta: { workspaceScene: true, title: '编辑角色权限', pageWidth: 'content', permission: 'team.role.read' } },
  { path: '/roles', component: RolesView, meta: { workspaceScene: true, pageWidth: 'wide', title: '角色权限', permission: 'team.role.read', accessMode: 'list' } },
  { path: '/join-fields/new', component: JoinFieldFormView, meta: { workspaceScene: true, title: '创建申请字段', pageWidth: 'content', permission: 'team.join_field.write' } },
  { path: '/join-fields/:id(\\d+)', component: JoinFieldFormView, meta: { workspaceScene: true, title: '申请字段', pageWidth: 'content', permission: 'team.join_field.read' } },
  { path: '/join-fields', component: JoinFieldsView, meta: { workspaceScene: true, pageWidth: 'wide', title: '申请字段', permission: 'team.join_field.read', accessMode: 'list' } },
  { path: '/join-review/review', component: JoinReviewDetailView, meta: { workspaceScene: true, title: '审核加入申请', pageWidth: 'content', permission: 'team.join_review.read' } },
  { path: '/join-review', component: JoinReviewView, meta: { workspaceScene: true, pageWidth: 'content', title: '人事审核', permission: 'team.join_review.read', accessMode: 'list' } },
  { path: '/departure-review/review', component: MemberDepartureDetailView, meta: { workspaceScene: true, title: '审核离队申请', pageWidth: 'content', permission: 'team.member.remove' } },
  { path: '/departure-review', component: MemberDepartureView, meta: { workspaceScene: true, pageWidth: 'content', title: '人事审核', permission: 'team.member.remove', accessMode: 'list' } },
  { path: '/members', component: MembersView, meta: { workspaceScene: true, pageWidth: 'wide', title: '成员' } },
  { path: '/customers', component: CustomersView, meta: { workspaceScene: true, pageWidth: 'wide', title: '顾客' } },
  { path: '/customers/:id(\\d+)', component: CustomerDetailView, meta: { workspaceScene: true, title: '顾客详情', pageWidth: 'content' } },
  { path: '/member-add', component: MemberFormView, meta: { workspaceScene: true, title: '添加成员', pageWidth: 'content' } },
  { path: '/member-edit', component: MemberFormView, meta: { workspaceScene: true, title: '编辑成员', pageWidth: 'content' } },
  { path: '/docs', component: DocumentsView, meta: { workspaceScene: true, pageWidth: 'wide', title: '文档', ability: 'doc', accessMode: 'list' } },
  { path: '/doc-create', component: DocumentFormView, meta: { workspaceScene: true, title: '新建文档', pageWidth: 'content', ability: 'doc' } },
  { path: '/doc-edit', component: DocumentFormView, meta: { workspaceScene: true, title: '编辑文档', pageWidth: 'content', ability: 'doc' } },
  ...Object.entries(resources).filter(([path]) => !['notice', 'files', 'roles', 'join-review', 'members', 'fields', 'docs'].includes(path)).map(([path, resource]) => ({ path: `/${path}`, component: ResourceView, props: { resource }, meta: { workspaceScene: true, pageWidth: 'wide', title: resource.title } })),
  { path: '/member-detail', component: MemberDetailView, meta: { workspaceScene: true, title: '成员详情', pageWidth: 'content' } },
  { path: '/doc', component: DocumentView, meta: { workspaceScene: true, title: '文档', pageWidth: 'content', ability: 'doc' } },
  { path: '/personal', component: PersonalView, meta: { workspaceScene: true, title: '概览', pageWidth: 'wide', workspace: 'personal', personalSection: 'overview' } },
  { path: '/personal/profile', component: PersonalView, meta: { workspaceScene: true, title: '资料', pageWidth: 'content', workspace: 'personal', personalSection: 'profile' } },
  { path: '/personal/fields', component: PersonalView, meta: { workspaceScene: true, title: '对象字段', pageWidth: 'content', workspace: 'personal', personalSection: 'fields' } },
  { path: '/personal/access', component: PersonalView, meta: { workspaceScene: true, title: '角色与权限', pageWidth: 'content', workspace: 'personal', personalSection: 'access' } },
  { path: '/me', redirect: '/personal/profile' },
  { path: '/join', component: JoinView, meta: { public: true, title: '申请加入' } },
]

export const router = createRouter({ history: createWebHistory(), routes, scrollBehavior: () => ({ top: 0 }) })
let routeAccess: { value: TeamAccessSnapshot; expiresAt: number } | null = null
router.beforeEach(async (to) => {
  document.title = `${String(to.meta.title ?? '工作台')} · LostSky`
  if (!to.meta.public && !auth.token()) {
    redirectToLogin()
    return false
  }
  if (to.meta.public) return true
  if (to.meta.workspace === 'personal' && !['team', 'teamMember', 'teamVirtual'].includes(String(auth.entity()?.type ?? ''))) {
    location.replace(identityUrl(location.href))
    return false
  }
  try {
    if (!routeAccess || routeAccess.expiresAt < Date.now()) {
      routeAccess = {
        value: await api.get<TeamAccessSnapshot>('/access'),
        expiresAt: Date.now() + 30_000,
      }
    }
    const access = routeAccess.value
    if (to.meta.workspace === 'personal' && access.identity?.is_external) {
      redirectToMemberIdentity(String(access.team?.slug ?? ''), 'team_mismatch')
      return false
    }
    if (to.meta.workspace !== 'personal' && redirectToWorkspaceWarning(access)) return false
    const permission = String(to.meta.permission ?? '').replace('<slug>', String(to.query.slug ?? '').trim().toLowerCase())
    if (permission && !hasPermission(access, permission)) {
      to.meta.accessReason = permissionReason(permission)
      return true
    }
    if (to.meta.ability === 'doc') {
      const state = access.abilities?.doc
      if (state && !state.enabled) {
        to.meta.accessReason = abilityReason('doc', state?.label ?? '文档')
        return true
      }
    }
    to.meta.accessReason = ''
  } catch (error) {
    if (redirectWorkspaceRoleError(error)) return false
    // 请求失败时交给页面自己的可恢复错误状态，避免路由守卫形成死路。
  }
})
