import { describe, expect, it } from 'vitest'
import { noticeListPath, noticeListQuery, noticeListState } from './noticeNavigation'
import type { LocationQuery } from 'vue-router'

describe('notice list URL contract', () => {
  it('round trips the three declared scalar values without passing unrelated query', () => {
    const state = noticeListState({ keyword: '维护 窗口', filter: 'unread', page: '3', return: 'https://example.org', scope: 'sent' })
    expect(state).toEqual({ keyword: '维护 窗口', filter: 'unread', page: 3 })
    expect(noticeListQuery(state)).toEqual({ keyword: '维护 窗口', filter: 'unread', page: '3' })
    expect(noticeListPath('team')).toBe('/notices/team')
    expect(noticeListPath('entity')).toBe('/personal/notices')
    expect(noticeListPath('sent')).toBe('/notices/sent')
  })
  it('rejects duplicate, oversized and invalid scalars instead of accepting the first value', () => {
    const invalid: LocationQuery[] = [
      { keyword: ['a', 'b'], filter: ['unread', 'all'], page: ['2', '3'] },
      { keyword: 'a'.repeat(201), filter: 'read', page: '100001' },
      { keyword: null, filter: null, page: 'Infinity' },
      { page: '-1' }, { page: '0' }, { page: '1.5' }, { page: '01' },
    ]
    for (const query of invalid) expect(noticeListState(query)).toEqual({ keyword: '', filter: 'all', page: 1 })
    expect(noticeListQuery(noticeListState({}))).toEqual({})
  })
})
