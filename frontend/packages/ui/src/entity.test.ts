import { describe, expect, it } from 'vitest'
import { entityMatchesKeyword, entityTypeTone } from './entity'

describe('entityTypeTone', () => {
  it.each([
    ['team', 'team'],
    ['entity', 'member'],
    ['teamMember', 'member'],
    ['customer', 'customer'],
    ['teamCustomer', 'customer'],
    ['virtual', 'virtual'],
    ['teamVirtual', 'virtual'],
    ['unknown', 'unknown'],
  ] as const)('maps %s to %s', (type, tone) => {
    expect(entityTypeTone(type)).toBe(tone)
  })
})

describe('entityMatchesKeyword', () => {
  const entity = { type: 'teamMember', slug: 'lost-sky', name: '迷失天空' } as const

  it('matches both the global slug and display name without case sensitivity', () => {
    expect(entityMatchesKeyword(entity, 'LOST')).toBe(true)
    expect(entityMatchesKeyword(entity, '天空')).toBe(true)
    expect(entityMatchesKeyword(entity, 'other')).toBe(false)
  })
})
