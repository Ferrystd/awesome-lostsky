import { auth } from '@lostsky/api/client'
import { redirectToLogin } from '@lostsky/shared/navigation'
import { createRouter, createWebHistory } from 'vue-router'
import { managerScopeOptions, visibilityOptions } from './lib/access'
const DashboardView = () => import('./views/DashboardView.vue')
const DocumentView = () => import('./views/DocumentView.vue')
const DocumentsView = () => import('./views/DocumentsView.vue')
const DocumentFormView = () => import('./views/DocumentFormView.vue')
const JoinView = () => import('./views/JoinView.vue')
const JoinReviewView = () => import('./views/JoinReviewView.vue')
const JoinReviewDetailView = () => import('./views/JoinReviewDetailView.vue')
const MembersView = () => import('./views/MembersView.vue')
const MemberFormView = () => import('./views/MemberFormView.vue')
const MemberDetailView = () => import('./views/MemberDetailView.vue')
const FilesView = () => import('./views/FilesView.vue')
const NoticeDetailView = () => import('./views/NoticeDetailView.vue')
const NoticesView = () => import('./views/NoticesView.vue')
const ProfileView = () => import('./views/ProfileView.vue')
const ResourceView = () => import('./views/ResourceView.vue')
const RoleFormView = () => import('./views/RoleFormView.vue')
const RolesView = () => import('./views/RolesView.vue')
const SettingsView = () => import('./views/SettingsView.vue')
const ChatVirtualsView = () => import('./views/ChatVirtualsView.vue')
const ChatVirtualFormView = () => import('./views/ChatVirtualFormView.vue')
const ChatIntegrationFormView = () => import('./views/ChatIntegrationFormView.vue')
const EntityFieldsView = () => import('./views/EntityFieldsView.vue')
const EntityFieldFormView = () => import('./views/EntityFieldFormView.vue')

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
    createEndpoint: '/member/add', editEndpoint: '/member/edit', deleteEndpoint: '/member/remove', idKey: 'member_id', deleteKey: 'member_id',
    formFields: [
      { key: 'user_id', label: '用户 ID', type: 'number', required: true, createOnly: true }, { key: 'nickname', label: '团队昵称', required: true },
      { key: 'avatar', label: '头像地址' }, { key: 'description', label: '简介', type: 'textarea' }, { key: 'intro_image', label: '介绍图片地址' },
      { key: 'intro_video', label: '介绍视频地址' }, { key: 'introduction_markdown', label: '详细介绍', type: 'textarea' },
    ],
  },
  roles: {
    title: '角色', description: '建立角色、维护权限并分配给成员。', endpoint: '/role/index', fields: ['name', 'role_key', 'description', 'sort'], empty: '还没有自定义角色',
    createEndpoint: '/role/add', editEndpoint: '/role/edit', deleteEndpoint: '/role/delete',
    formFields: [{ key: 'role_key', label: '角色标识', required: true, createOnly: true }, { key: 'name', label: '角色名称', required: true }, { key: 'description', label: '说明', type: 'textarea' }, { key: 'sort', label: '顺序', type: 'number', defaultValue: 0 }],
  },
  posts: {
    title: '岗位类型', description: '维护团队内部使用的岗位分类。', endpoint: '/postType/index', fields: ['name', 'description', 'sort', 'create_time'], empty: '还没有岗位类型',
    createEndpoint: '/postType/add', editEndpoint: '/postType/edit', deleteEndpoint: '/postType/delete',
    formFields: [{ key: 'name', label: '岗位名称', required: true }, { key: 'description', label: '说明', type: 'textarea' }, { key: 'sort', label: '顺序', type: 'number', defaultValue: 0 }],
  },
  notice: { title: '站内信', description: '集中处理系统提醒和团队消息。', endpoint: '/notice/index', fields: ['title', 'content', 'is_read', 'create_time'], empty: '目前没有站内信' },
  'join-review': { title: '加入审核', description: '审核加入申请并跟踪入队任务。', endpoint: '/joinReview/index', fields: ['user_id', 'status', 'memo', 'create_time'], empty: '没有待处理的加入申请' },
  files: { title: '文件', description: '查找和管理上传到团队空间的文件。', endpoint: '/file/index', fields: ['name', 'mime_type', 'size', 'create_time'], deleteEndpoint: '/file/delete', empty: '团队空间还没有文件' },
  fields: {
    title: '成员字段', description: '定义成员资料中需要维护的业务信息。', endpoint: '/memberField/index', fields: ['name', 'field_key', 'value_type', 'input_type', 'is_required'], empty: '还没有自定义字段',
    createEndpoint: '/memberField/add', editEndpoint: '/memberField/edit', deleteEndpoint: '/memberField/delete',
    formFields: [
      { key: 'name', label: '字段名称', required: true }, { key: 'field_key', label: '字段标识', required: true, createOnly: true },
      { key: 'value_type', label: '值类型', type: 'select', required: true, defaultValue: 'string', options: ['string', 'text', 'int', 'decimal', 'bool', 'date', 'datetime', 'select', 'multi_select', 'json'].map((value) => ({ label: value, value })) },
      { key: 'input_type', label: '输入控件', type: 'select', required: true, defaultValue: 'text', options: ['text', 'textarea', 'radio', 'checkbox', 'select', 'date', 'datetime', 'upload'].map((value) => ({ label: value, value })) },
      { key: 'is_required', label: '必填', type: 'checkbox' }, { key: 'is_editable', label: '允许编辑', type: 'checkbox', defaultValue: true }, { key: 'is_searchable', label: '允许搜索', type: 'checkbox' },
      { key: 'source', label: '来源', defaultValue: 'custom' }, { key: 'visibility', label: '可见范围', type: 'select', defaultValue: 1, options: visibilityOptions }, { key: 'manager_scope', label: '管理范围', type: 'select', defaultValue: 1, options: managerScopeOptions }, { key: 'sort', label: '顺序', type: 'number', defaultValue: 0 },
    ],
  },
  docs: {
    title: '文档', description: '组织团队流程、规范和长期知识。', endpoint: '/doc', fields: ['title', 'target_type', 'visibility', 'update_time'], empty: '文档库还是空的',
    createEndpoint: '/doc/create', editEndpoint: '/doc/edit', deleteEndpoint: '/doc/delete',
    formFields: [
      { key: 'title', label: '标题', required: true }, { key: 'content', label: 'Markdown 内容', type: 'textarea' }, { key: 'target_type', label: '归属类型', type: 'select', required: true, defaultValue: 'team', options: [{ label: '团队', value: 'team' }, { label: '成员', value: 'teamMember' }] },
      { key: 'target_id', label: '成员 ID', type: 'number' }, { key: 'manager_scope', label: '管理范围', type: 'select', defaultValue: 1, options: managerScopeOptions }, { key: 'visibility', label: '可见范围', type: 'select', defaultValue: 1, options: visibilityOptions }, { key: 'sort', label: '顺序', type: 'number', defaultValue: 0 },
    ],
  },
}

const routes = [
  { path: '/', component: DashboardView, meta: { title: '概览' } },
  { path: '/notice', component: NoticesView, meta: { title: '站内信' } },
  { path: '/notice-detail', component: NoticeDetailView, meta: { title: '阅读站内信', pageWidth: 'content' } },
  { path: '/files', component: FilesView, meta: { title: '文件' } },
  { path: '/settings', component: SettingsView, meta: { title: '团队设置', pageWidth: 'content' } },
  { path: '/chat-virtuals', component: ChatVirtualsView, meta: { title: '虚拟实体' } },
  { path: '/chat-virtual-new', component: ChatVirtualFormView, meta: { title: '创建虚拟实体', pageWidth: 'content' } },
  { path: '/chat-virtual', component: ChatVirtualFormView, meta: { title: '编辑虚拟实体', pageWidth: 'content' } },
  { path: '/chat-integration-new', component: ChatIntegrationFormView, meta: { title: '创建 Webhook 集成', pageWidth: 'form' } },
  { path: '/chat-integration', component: ChatIntegrationFormView, meta: { title: '编辑 Webhook 集成', pageWidth: 'form' } },
  { path: '/fields', component: EntityFieldsView, meta: { title: '对象字段' } },
  { path: '/field-new', component: EntityFieldFormView, meta: { title: '创建对象字段', pageWidth: 'form' } },
  { path: '/field-edit', component: EntityFieldFormView, meta: { title: '编辑对象字段', pageWidth: 'form' } },
  { path: '/roles/new', component: RoleFormView, meta: { title: '新建角色', pageWidth: 'form' } },
  { path: '/roles', component: RolesView, meta: { title: '角色权限' } },
  { path: '/join-review/review', component: JoinReviewDetailView, meta: { title: '审核加入申请', pageWidth: 'content' } },
  { path: '/join-review', component: JoinReviewView, meta: { title: '加入审核' } },
  { path: '/members', component: MembersView, meta: { title: '成员' } },
  { path: '/member-add', component: MemberFormView, meta: { title: '添加成员', pageWidth: 'form' } },
  { path: '/member-edit', component: MemberFormView, meta: { title: '编辑成员', pageWidth: 'form' } },
  { path: '/docs', component: DocumentsView, meta: { title: '文档' } },
  { path: '/doc-create', component: DocumentFormView, meta: { title: '新建文档', pageWidth: 'content' } },
  { path: '/doc-edit', component: DocumentFormView, meta: { title: '编辑文档', pageWidth: 'content' } },
  ...Object.entries(resources).filter(([path]) => !['notice', 'files', 'roles', 'join-review', 'members', 'fields', 'docs'].includes(path)).map(([path, resource]) => ({ path: `/${path}`, component: ResourceView, props: { resource }, meta: { title: resource.title } })),
  { path: '/member-detail', component: MemberDetailView, meta: { title: '成员详情' } },
  { path: '/doc', component: DocumentView, meta: { title: '文档' } },
  { path: '/me', component: ProfileView, meta: { title: '我的资料' } },
  { path: '/join', component: JoinView, meta: { public: true, title: '申请加入' } },
]

export const router = createRouter({ history: createWebHistory(), routes, scrollBehavior: () => ({ top: 0 }) })
router.beforeEach((to) => {
  document.title = `${String(to.meta.title ?? '工作台')} · LostSky`
  if (!to.meta.public && !auth.token()) {
    redirectToLogin()
    return false
  }
})
