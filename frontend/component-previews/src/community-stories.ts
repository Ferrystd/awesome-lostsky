import { h } from 'vue'
import CommunityManagement from '@lostsky/ui/community/CommunityManagement.vue'
import CommunityGovernance from '@lostsky/ui/community/CommunityGovernance.vue'
import CommunityPostList from '@lostsky/ui/community/CommunityPostList.vue'
import CommunityContentState from '@lostsky/ui/community/CommunityContentState.vue'
import { previewStates, type StoryDefinition } from './story-types'

const post = { id: 1, community_id: 1, board_id: 1, author_entity_id: 9, title: '分享你的工作室协作经验', content: '讨论从一个好问题开始。', status: 'Visible' as const, hidden_reason: '', pinned: true, like_count: 12, comment_count: 4, is_liked: false, can_edit: false, author: { id: 9, slug: 'sky-person', name: '青空', is_valid: true }, create_time: 1791331200, update_time: 1791331200 }
const unavailableUpload = async () => { throw new Error('组件预览不上传文件') }
export const communityStories: Record<string, StoryDefinition> = {
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
  CommunityContentState: {
    name: 'CommunityContentState', supported: ['default', 'disabled', 'error', 'mobile'],
    reason: { hover: '状态说明无悬停操作。', focus: '状态说明无可聚焦操作。', active: '状态说明无激活操作。', loading: '状态说明不发出请求。' },
    render: state => h(CommunityContentState, { status: state === 'disabled' ? 'Deleted' : 'Hidden', reason: '包含不适合此板块的推广信息，请联系社区管理员了解处理结果。' }),
  },
}
