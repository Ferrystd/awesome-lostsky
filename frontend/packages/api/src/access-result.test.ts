import { replaceEqualDeep } from '@tanstack/query-core'
import { describe, expect, it } from 'vitest'
import { deniedRead, readAccessReason } from './access-result'

describe('denied read results', () => {
  it('retains denial through query cache updates and clears it after successful empty reads', () => {
    const denied = replaceEqualDeep([], deniedRead('Permission：weibo.personal.use'))
    expect(readAccessReason(denied)).toBe('Permission：weibo.personal.use')
    expect(denied).toHaveLength(0)
    expect(denied.list).toEqual([])
    expect(denied.total).toBe(0)
    expect(readAccessReason(replaceEqualDeep(denied, []))).toBe('')
    expect(readAccessReason(replaceEqualDeep(denied, { list: [], total: 0 }))).toBe('')
  })
})
