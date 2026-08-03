import { describe, expect, it } from 'vitest'
import { memberStatusCode, memberStatusLabel, memberStatusType } from './memberStatus'

describe('成员生命周期状态', () => {
  it.each([
    [{ status_code: 'active' }, 'active', '正常', 'success'],
    [{ status_code: 'blocked' }, 'blocked', '已封禁', 'error'],
    [{ status_code: 'departed' }, 'departed', '已离队', 'warning'],
  ] as const)('稳定代码 %s 映射到可见状态', (member, code, label, type) => {
    expect(memberStatusCode(member)).toBe(code)
    expect(memberStatusLabel(member)).toBe(label)
    expect(memberStatusType(member)).toBe(type)
  })

  it('兼容旧 is_blocked 响应', () => {
    expect(memberStatusCode({ is_blocked: 1 })).toBe('blocked')
    expect(memberStatusCode({ is_blocked: 0 })).toBe('active')
  })
})
