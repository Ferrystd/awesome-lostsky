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

  it('拒绝缺失或未知的状态代码', () => {
    expect(() => memberStatusCode({})).toThrow('成员状态代码不正确')
    expect(() => memberStatusCode({ status_code: 'unknown' })).toThrow('成员状态代码不正确')
  })
})
