import { describe, expect, it } from 'vitest'
import { appendFormListItem, moveFormListItem, removeFormListItem } from './form-list'

describe('form list changes', () => {
  it('adds and removes items without mutating the source list', () => {
    const source = [{ key: 1 }, { key: 2 }]
    const added = appendFormListItem(source, () => ({ key: 3 }))
    const removed = removeFormListItem(added, 1)
    expect(source.map(item => item.key)).toEqual([1, 2])
    expect(added.map(item => item.key)).toEqual([1, 2, 3])
    expect(removed.map(item => item.key)).toEqual([1, 3])
  })

  it('moves items in both directions and ignores invalid boundaries', () => {
    const source = ['a', 'b', 'c']
    expect(moveFormListItem(source, 2, 0)).toEqual(['c', 'a', 'b'])
    expect(moveFormListItem(source, 0, 2)).toEqual(['b', 'c', 'a'])
    expect(moveFormListItem(source, 0, -1)).toBe(source)
    expect(moveFormListItem(source, 2, 3)).toBe(source)
  })
})
