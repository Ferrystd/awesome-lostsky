import { describe, expect, it } from 'vitest'
import { queryPositiveInteger, queryText } from './routeQuery'

describe('scalar route query', () => {
  it('rejects ambiguous and unsafe integers', () => {
    for (const value of [null, undefined, '', ['1', '2'], '0', '-1', '1.2', '1e3', ' 1', '9007199254740992']) {
      expect(queryPositiveInteger(value)).toBeUndefined()
    }
    expect(queryPositiveInteger('123')).toBe(123)
    expect(queryText(['comment', 'like'])).toBeUndefined()
    expect(queryText('comment')).toBe('comment')
  })
})
