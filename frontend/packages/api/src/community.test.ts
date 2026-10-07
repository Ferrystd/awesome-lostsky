import { describe, expect, it, vi } from 'vitest'
import { api } from './client'
import { communityInteractionReason, uploadCommunityImage, type Community } from './community'
const community = { id: 1, entity_id: 9, status: 'Active', is_joined: true, is_muted: false, mute_reason: '', team_available: true } as Community
describe('社区互动边界', () => {
  it('加入、点赞与发言分别解释当前限制', () => {
    expect(communityInteractionReason({ ...community, entity_id: null })).toContain('登录')
    expect(communityInteractionReason({ ...community, status: 'Paused' }, 'join')).toContain('暂停')
    expect(communityInteractionReason({ ...community, is_joined: false }, 'post')).toContain('加入')
    expect(communityInteractionReason({ ...community, is_joined: false }, 'join')).toBe('')
    expect(communityInteractionReason({ ...community, is_muted: true, mute_reason: '广告' }, 'post')).toContain('广告')
    expect(communityInteractionReason({ ...community, is_muted: true }, 'like')).toBe('')
    expect(communityInteractionReason(community)).toBe('')
    expect(communityInteractionReason({ ...community, team_available: false }, 'join')).toContain('团队当前不可用')
  })
  it('Markdown上传绑定当前人员并使用Community上传入口', async () => {
    const upload = vi.spyOn(api, 'uploadTo').mockResolvedValue({ url: 'https://assets.example.test/image.png' })
    const file = {} as File
    expect(await uploadCommunityImage(file, 9)).toBe('https://assets.example.test/image.png')
    expect(upload).toHaveBeenCalledWith(file, '/upload', { source: 'markdown', expected_entity_id: 9 })
    await expect(uploadCommunityImage(file, null)).rejects.toThrow('请先在通行证选择有效人员身份')
    expect(upload).toHaveBeenCalledTimes(1)
    upload.mockRestore()
  })
})
