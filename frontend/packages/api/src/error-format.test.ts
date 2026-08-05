import { describe, expect, it } from 'vitest'
import { ERROR_MESSAGES } from './error-messages'
import {
  formatAbilityDenied,
  formatPermissionDenied,
  formatStructuredAccessError,
} from './error-format'

describe('error message formatting', () => {
  it('formats the default Permission and Ability messages', () => {
    expect(formatPermissionDenied(['team.entity.profile.manage'])).toBe(
      '您缺少权限(Permission): team.entity.profile.manage,请联系团队管理员开通。',
    )
    expect(formatAbilityDenied('file', '文件上传')).toBe(
      '团队能力(Ability)缺失: 文件上传(File),管理员可按需购买。',
    )
  })

  it('uses a key-specific Permission override for a single requirement', () => {
    const key = 'test.permission'
    const previous = ERROR_MESSAGES.access.permission.overrides[key]
    ERROR_MESSAGES.access.permission.overrides[key] = '需要 {permission}，请联系管理员。'
    try {
      expect(formatPermissionDenied([key])).toBe('需要 test.permission，请联系管理员。')
    } finally {
      if (previous === undefined) delete ERROR_MESSAGES.access.permission.overrides[key]
      else ERROR_MESSAGES.access.permission.overrides[key] = previous
    }
  })

  it('uses the default template for multiple alternative Permissions', () => {
    const key = 'test.permission'
    const previous = ERROR_MESSAGES.access.permission.overrides[key]
    ERROR_MESSAGES.access.permission.overrides[key] = '不应使用这个覆盖'
    try {
      expect(formatPermissionDenied([key, 'test.other', key])).toBe(
        '您缺少权限(Permission): test.permission / test.other,请联系团队管理员开通。',
      )
    } finally {
      if (previous === undefined) delete ERROR_MESSAGES.access.permission.overrides[key]
      else ERROR_MESSAGES.access.permission.overrides[key] = previous
    }
  })

  it('uses a key-specific Ability override with supported placeholders', () => {
    const key = 'test'
    const previous = ERROR_MESSAGES.access.ability.overrides[key]
    ERROR_MESSAGES.access.ability.overrides[key] = '{label}需要 Ability：{key}/{keyTitle}'
    try {
      expect(formatAbilityDenied(key, '测试能力')).toBe('测试能力需要 Ability：test/Test')
    } finally {
      if (previous === undefined) delete ERROR_MESSAGES.access.ability.overrides[key]
      else ERROR_MESSAGES.access.ability.overrides[key] = previous
    }
  })

  it('rejects incomplete structured access details', () => {
    expect(formatStructuredAccessError({ kind: 'permission', required_any: [] })).toBe('')
    expect(formatStructuredAccessError({ kind: 'permission', required_any: [1] })).toBe('')
    expect(formatStructuredAccessError({ kind: 'ability', key: 'file' })).toBe('')
    expect(formatStructuredAccessError(null)).toBe('')
  })
})
