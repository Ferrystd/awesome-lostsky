import { Bell, BookOpen, Boxes, ClipboardCheck, Contact, FileClock, Files, MessageCircleMore, Settings, ShieldCheck, Users } from '@lucide/vue'

export const teamNavigation = [
  { key: 'team', title: '团队管理', description: '维护团队资源、协作与运行配置。', icon: Settings, links: [
    { to: '/entities', label: '人员管理', icon: Boxes, note: '主体资料、对象字段与虚拟人员' },
    { to: '/customers', label: '顾客管理', icon: Contact, note: '顾客资料与协作关系' },
    { to: '/chat-groups', label: '聊天管理', icon: MessageCircleMore, note: '团队群聊、成员与历史消息' },
    { to: '/communities', label: '团队社区', icon: MessageCircleMore, note: '团队社区资料、状态与管理员' },
    { to: '/docs', label: '文档管理', icon: BookOpen, note: '规范与工作资料' },
    { to: '/files', label: '文件管理', icon: Files, note: '团队上传资源' },
    { to: '/notices/sent', label: '通知中心', icon: Bell, note: '已发送通知、查看情况与平台通知' },
    { to: '/settings', label: '团队设置', icon: Settings, note: '功能设置与团队能力' },
    { to: '/audit', label: '审计日志', icon: FileClock, note: '追踪团队业务操作' },
  ] },
  { key: 'personnel', title: '人事管理', description: '管理成员状态，处理加入、复职与离队申请。', icon: Users, links: [
    { to: '/members', label: '成员管理', icon: Users, note: '成员资料与在队状态' },
    { to: '/roles', label: '角色权限', icon: ShieldCheck, note: '团队角色与人员授权' },
    { to: '/join-review', label: '人事审核', icon: ClipboardCheck, note: '加入与离队审核、申请表配置' },
  ] },
]

export const reviewSections = [
  { to: '/join-review', label: '加入与复职' },
  { to: '/departure-review', label: '离队' },
]
export const noticeSections = [
  { to: '/notices/sent', label: '已发送通知' },
  { to: '/notices/team', label: '平台通知' },
]

export function teamNavigationOwner(path: string): string {
  if (/^\/(entity|entities|fields|field-|chat-virtual|chat-integration)/.test(path)) return '/entities'
  if (/^\/(join-review|departure-review|join-fields)/.test(path)) return '/join-review'
  if (/^\/member/.test(path)) return '/members'
  if (/^\/notices\//.test(path)) return '/notices/sent'
  if (path === '/abilities') return '/settings'
  if (/^\/doc(?:s|$|-)/.test(path)) return '/docs'
  return teamNavigation.flatMap(group => group.links).find(item => path === item.to || path.startsWith(`${item.to}/`))?.to ?? path
}
