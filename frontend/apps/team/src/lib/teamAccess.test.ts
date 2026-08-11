import { describe, expect, it } from 'vitest'
import { ERROR_MESSAGES } from '@lostsky/api/error-messages'
import {
  abilityReason,
  fileUploadReason,
  fileAvailabilityReason,
  hasPermission,
  permissionReason,
  resourceUploadReason,
  settingReason,
  type AccessSnapshotLike,
} from './teamAccessReason'

function snapshot(overrides: Partial<AccessSnapshotLike> = {}): AccessSnapshotLike {
  return {
    permissions: [],
    abilities: {
      file: { enabled: false, label: '文件上传' },
      doc: { enabled: true, label: '文档' },
    },
    ...overrides,
  }
}

describe('team access helpers', () => {
  it('keeps Permission and Ability reasons stable and explicit', () => {
    expect(permissionReason('team.entity.profile.manage')).toBe(
      '您缺少该团队权限(Permission): team.entity.profile.manage,请联系团队管理员开通。',
    )
    expect(abilityReason('file', '文件上传')).toBe(
      '该团队能力(Ability)缺失: 文件上传(File),管理员可按需购买。',
    )
  })

  it('does not block resource uploads when File is at the implicit level 0', () => {
    expect(resourceUploadReason(snapshot())).toBe('')
  })

  it('reports the file library upload Permission independently from File level', () => {
    const value = snapshot()
    expect(fileUploadReason(value)).toBe('您缺少该团队权限(Permission): file.upload,请联系团队管理员开通。')

    value.permissions!.push('file.upload')
    expect(fileUploadReason(value)).toBe('')
    expect(hasPermission(value, 'file.upload')).toBe(true)
  })

  it('resource uploads depend on capacity but not file.upload', () => {
    const value = snapshot()
    expect(resourceUploadReason(value)).toBe('')
    expect(value.permissions).not.toContain('file.upload')
  })

  it('uses the shared quota message for file and resource uploads', () => {
    const fileUpload = {
      count: 99,
      total_size: 524288000,
      size_limit: 524288000,
      remaining_size: 0,
      available: false,
      reason: 'quota' as const,
    }
    const value = snapshot({
      permissions: ['file.upload'],
      abilities: { file: { enabled: true, label: '文件上传' } },
      file_upload: fileUpload,
    })
    expect(fileAvailabilityReason(fileUpload)).toBe(ERROR_MESSAGES.file.quota)
    expect(resourceUploadReason(value)).toBe(ERROR_MESSAGES.file.quota)
    expect(fileUploadReason(value)).toBe(ERROR_MESSAGES.file.quota)
  })

  it('treats parent and wildcard Permission scopes like the backend gate', () => {
    expect(hasPermission(snapshot({ permissions: ['team'] }), 'team.ability.redeem')).toBe(true)
    expect(hasPermission(snapshot({ permissions: ['team.ability'] }), 'team.ability.redeem')).toBe(true)
    expect(hasPermission(snapshot({ permissions: ['team.ability'] }), 'team.notice.read')).toBe(false)
    expect(hasPermission(snapshot({ permissions: ['team.entity.virtual.*'] }), 'team.entity.virtual.support.manage')).toBe(true)
    expect(hasPermission(snapshot({ permissions: ['chat.virtual.*.act'] }), 'chat.virtual.support.act')).toBe(true)
    expect(hasPermission(snapshot({ permissions: ['team.entity.virtual.support'] }), 'team.entity.virtual.*.manage')).toBe(false)
  })

  it('shares access message overrides with API errors', () => {
    const key = 'test.permission'
    const previous = ERROR_MESSAGES.access.permission.overrides[key]
    ERROR_MESSAGES.access.permission.overrides[key] = '请申请 {permission}'
    try {
      expect(permissionReason(key)).toBe('请申请 test.permission')
    } finally {
      if (previous === undefined) delete ERROR_MESSAGES.access.permission.overrides[key]
      else ERROR_MESSAGES.access.permission.overrides[key] = previous
    }
  })

  it('reports an unmet TeamSetting entry requirement', () => {
    expect(settingReason(
      'member',
      'departure_mode',
      '成员自助离队',
      'disabled',
      { equals: 'review' },
    )).toBe('需要“成员自助离队”（member.departure_mode）设为“review”，现在为“disabled”，请联系团队管理员设置。')
  })
})
