import { h } from 'vue'
import CommunityParticipation from '../../apps/community/src/components/CommunityParticipation.vue'
import CommunityShell from '../../apps/community/src/components/CommunityShell.vue'
import type { Community } from '@lostsky/api/community'
import CommunityManagement from '@lostsky/ui/community/CommunityManagement.vue'
import CommunityGovernance from '@lostsky/ui/community/CommunityGovernance.vue'
import CommunityPostList from '@lostsky/ui/community/CommunityPostList.vue'
import CommunityTabs from '@lostsky/ui/community/CommunityTabs.vue'
import CommunityPostMeta from '@lostsky/ui/community/CommunityPostMeta.vue'
import CommunityContentState from '@lostsky/ui/community/CommunityContentState.vue'
import { previewStates, type StoryDefinition } from './story-types'

const post = { id: 1, community_id: 1, board_id: 1, author_entity_id: 9, title: '分享你的工作室协作经验', content: '讨论从一个好问题开始。', status: 'Visible' as const, hidden_reason: '', pinned: true, like_count: 12, comment_count: 4, is_liked: false, can_edit: false, author: { id: 9, slug: 'sky-person', name: '青空', is_valid: true }, create_time: 1791331200, update_time: 1791331200 }
const unavailableUpload = async () => { throw new Error('组件预览不上传文件') }
export const communityStories: Record<string, StoryDefinition> = {
  CommunityParticipation: {
    name: 'CommunityParticipation', supported: ['default', 'hover', 'focus', 'active', 'disabled', 'mobile'],
    reason: { loading: '请求中状态由真实加入操作管理。', error: '请求错误由反馈系统展示。' },
    render: state => h(CommunityParticipation, { community: { id: 1, slug: 'lostsky', name: 'LostSky 社区', entity_id: null, status: state === 'disabled' ? 'Paused' : 'Active', team_available: true, is_joined: false, is_muted: false } as unknown as Community }),
  },
  CommunityShell: {
    name: 'CommunityShell', supported: ['default', 'hover', 'focus', 'active', 'mobile'],
    reason: { loading: '外壳不发出读取请求。', error: '错误状态由内容区管理。', disabled: '导航始终可用。' },
    render: () => h(CommunityShell, { identityHref: '/identity', identityLabel: '选择人员身份' }, { default: () => h('p', '公开社区内容区域') }),
  },
  CommunityManagement: {
    name: 'CommunityManagement', supported: [...previewStates],
    render: state => h(CommunityManagement, { scope: 'admin', canRead: true, canWrite: state !== 'disabled', canModerate: state !== 'disabled', readReason: '', writeReason: '缺少平台社区资料管理权限', moderateReason: '缺少平台社区内容治理权限' }),
  },
  CommunityGovernance: {
    name: 'CommunityGovernance', supported: [...previewStates],
    render: state => h(CommunityGovernance, { apiBase: '/preview-community', routeBase: '/preview-community/manage', backTo: '/', communityName: 'LostSky 官方社区', canRead: true, canModerate: state !== 'disabled', deniedReason: '缺少社区日常治理权限', uploadImage: unavailableUpload, uploadDisabledReason: '组件预览不上传文件' }),
  },
  CommunityPostList: {
    name: 'CommunityPostList', supported: ['default', 'hover', 'focus', 'active', 'error', 'mobile'],
    reason: { disabled: '阅读入口始终开放。', loading: '加载状态由调用页面的 LsAsyncState 提供。' },
    render: state => h(CommunityPostList, { posts: state === 'error' ? [] : [post], basePath: '/c/lostsky' }),
  },
  CommunityTabs: {
    name: 'CommunityTabs', supported: ['default', 'hover', 'focus', 'active', 'mobile'],
    reason: { disabled: '导航保持可用。', loading: '加载由页面处理。', error: '错误由页面处理。' },
    render: () => h(CommunityTabs, { value: 'all', items: [{ key: 'all', label: '全部讨论' }, { key: 'chat', label: '日常交流' }, { key: 'help', label: '问题与建议' }], label: '社区板块' }),
  },
  CommunityPostMeta: {
    name: 'CommunityPostMeta', supported: ['default', 'mobile'],
    reason: { hover: '只读作者信息。', focus: '无交互操作。', active: '无选择操作。', disabled: '作者信息保持可见。', loading: '加载由页面处理。', error: '错误由页面处理。' },
    render: () => h(CommunityPostMeta, { author: post.author, time: post.create_time }),
  },
  CommunityContentState: {
    name: 'CommunityContentState', supported: ['default', 'disabled', 'error', 'mobile'],
    reason: { hover: '状态说明无悬停操作。', focus: '状态说明无可聚焦操作。', active: '状态说明无激活操作。', loading: '状态说明不发出请求。' },
    render: state => h(CommunityContentState, { status: state === 'disabled' ? 'Deleted' : 'Hidden', reason: '包含不适合此板块的推广信息，请联系社区管理员了解处理结果。' }),
  },
}
