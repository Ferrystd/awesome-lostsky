import { describe, expect, it } from 'vitest'
import { coveringPermission, minimalPermissions, permissionCovers, permissionsForSave, selectPermissionScope } from './permissionHierarchy'

describe('permission hierarchy', () => {
  it('matches exact, parent and wildcard scopes without matching siblings', () => {
    expect(permissionCovers('team.ability.redeem', 'team.ability.redeem')).toBe(true)
    expect(permissionCovers('team.ability', 'team.ability.redeem')).toBe(true)
    expect(permissionCovers('team', 'team.ability.redeem')).toBe(true)
    expect(permissionCovers('team.entity.virtual.*', 'team.entity.virtual.bot.manage')).toBe(true)
    expect(permissionCovers('chat.virtual.*.act', 'chat.virtual.bot.act')).toBe(true)
    expect(permissionCovers('team.entity.virtual.bot', 'team.entity.virtual.*.manage')).toBe(false)
    expect(permissionCovers('team.ability', 'team.notice.read')).toBe(false)
  })

  it('keeps the most specific covering parent for explanations', () => {
    expect(coveringPermission(['team', 'team.ability'], 'team.ability.redeem')).toBe('team.ability')
    expect(coveringPermission(['team.ability'], 'team.notice.read')).toBeUndefined()
  })

  it('selecting a parent removes redundant descendants and never widens an existing parent', () => {
    expect(selectPermissionScope(['team.ability.redeem', 'team.notice.read'], 'team.ability')).toEqual([
      'team.ability',
      'team.notice.read',
    ])
    expect(selectPermissionScope(['team'], 'team.ability')).toEqual(['team'])
  })

  it('normalizes wildcard, parent and exact scopes before saving', () => {
    expect(minimalPermissions([
      'identity.member.member-2.assume',
      'identity.member.*.assume',
      'team.ability.redeem',
      'team.ability',
      'team.notice.read',
    ])).toEqual([
      'identity.member.*.assume',
      'team.ability',
      'team.notice.read',
    ])
  })

  it('keeps unrelated sibling scopes', () => {
    expect(minimalPermissions([
      'team.entity.virtual.helper.manage',
      'chat.virtual.helper.act',
      'team.entity.virtual.other.manage',
    ])).toEqual([
      'chat.virtual.helper.act',
      'team.entity.virtual.helper.manage',
      'team.entity.virtual.other.manage',
    ])
  })

  it('minimizes entity management and chat virtual scopes before saving', () => {
    expect(permissionsForSave([
      'team.entity.virtual.*.manage',
      'team.entity.virtual.helper.manage',
      'chat.virtual.*.act',
      'chat.virtual.helper.act',
    ])).toEqual([
      'chat.virtual.*.act',
      'team.entity.virtual.*.manage',
    ])
  })

  it('does not let a specific slug remove a broader wildcard grant', () => {
    expect(minimalPermissions([
      'identity.member.member-2',
      'identity.member.*.assume',
    ])).toEqual([
      'identity.member.*.assume',
      'identity.member.member-2',
    ])
  })
})
