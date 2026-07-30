import { describe, expect, it } from 'vitest'
import {
  abilityReason,
  fileUploadReason,
  hasPermission,
  permissionReason,
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
      '缺少权限(Permission): team.entity.profile.manage',
    )
    expect(abilityReason('file', '文件上传')).toBe(
      '当前团队缺失能力(Ability): 文件上传(File)',
    )
  })

  it('prioritizes missing File Ability over upload Permission', () => {
    expect(fileUploadReason(snapshot())).toBe(
      '当前团队缺失能力(Ability): 文件上传(File)',
    )
  })

  it('reports upload Permission only after File Ability is available', () => {
    const value = snapshot()
    value.abilities.file!.enabled = true
    expect(fileUploadReason(value)).toBe('缺少权限(Permission): file.upload')

    value.permissions.push('file.upload')
    expect(fileUploadReason(value)).toBe('')
    expect(hasPermission(value, 'file.upload')).toBe(true)
  })
})
