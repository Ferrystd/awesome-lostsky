import { api, ApiError, auth } from './client'

import type { components } from './generated/community'
export type CommunityEntity = components['schemas']['CommunityEntity']
export type Community = components['schemas']['CommunityData']
export type CommunityBoard = components['schemas']['CommunityBoard']
export type CommunityAnnouncement = components['schemas']['CommunityAnnouncement']
export type CommunityPost = components['schemas']['CommunityPost']
export type CommunityComment = components['schemas']['CommunityComment']
export type CommunityMember = components['schemas']['CommunityMember']
export type CommunityAdministrator = components['schemas']['CommunityAdministrator']
export type CommunitySession = components['schemas']['CommunitySession']
export interface CommunityPage<T> { list: T[]; total: number; page: number; limit: number }

export const communityPath = (slug: string) => `/communities/${encodeURIComponent(slug)}`
export const communityActorKey = () => `${location.host}:${auth.entity()?.id ?? `user-${auth.user()?.id ?? 'visitor'}`}`
export function communityInteractionReason(community: Community | undefined, action: 'join' | 'post' | 'like' = 'post') {
  if (!community) return '正在读取社区信息'
  if (!community.entity_id) return '请先登录并在通行证选择有效人员身份'
  if (!community.team_available) return '所属团队当前不可用，暂时不能加入或互动'
  if (community.status === 'Paused') return '社区已暂停，暂时不能加入或互动'
  if (action !== 'join' && !community.is_joined) return '请先加入社区'
  if (action === 'post' && community.is_muted) return `你在此社区被禁言：${community.mute_reason}`
  return ''
}
export async function uploadCommunityImage(file: File, entityId: number | null): Promise<string> {
  if (!entityId) throw new ApiError('请先在通行证选择有效人员身份')
  const result = await api.uploadTo<{ url?: string; path?: string }>(file, '/upload', { source: 'markdown', expected_entity_id: entityId })
  const url = result.url || result.path
  if (!url) throw new ApiError('上传结果缺少文件地址')
  return url
}
