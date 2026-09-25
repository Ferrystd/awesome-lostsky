import { beforeEach, describe, expect, it } from 'vitest'
import { clearInteractionDrafts, interactionPresetQuery, interactionReturnTarget, interactionScopeKey, parseInteractionQuery, storeInteractionDraft, takeInteractionDraft, validStatusUrl } from './interactionDraft'
import type { WorkspaceAccess } from '../types'
import type { LocationQuery } from 'vue-router'

const access: WorkspaceAccess = { team: { id: 1, slug: 'one', name: 'One' }, identity: { entity_id: 3, name: 'Member', type: 'teamMember', belongs_to_team: true, is_external: false }, permissions: ['weibo.personal.use'], abilities: {} }
beforeEach(clearInteractionDrafts)

describe('interaction query', () => {
  it('defaults to like and accepts only a single explicit target', () => {
    expect(parseInteractionQuery({}, true)).toMatchObject({ action: 'like', error: '' })
    expect(parseInteractionQuery({ action: 'comment', feed_post_id: '21', from: 'feed' }, true)).toMatchObject({ feedPostId: 21, fromFeed: true, error: '' })
    expect(parseInteractionQuery({ action: 'comment', feed_post_id: '21', status_url: 'https://weibo.com/1/Ab3' }, true).error).toBeTruthy()
  })
  it.each([
    { action: ['like', 'comment'] }, { action: '' }, { action: 'delete' }, { feed_post_id: '0' }, { feed_post_id: '-2' },
    { feed_post_id: '1.5' }, { feed_post_id: '9007199254740992' }, { action: 'comment', feed_post_id: ['1', '2'] },
    { status_url: ['https://weibo.com/1/Ab3'] }, { from: 'https://evil.example' }, { draft: '../other' },
  ] as LocationQuery[])('rejects malformed query %j', (query) => expect(parseInteractionQuery(query, true).error).toBeTruthy())
  it('rejects feed targets in team scope and unsupported feed actions', () => {
    expect(parseInteractionQuery({ action: 'comment', feed_post_id: '1' }, false).error).toBeTruthy()
    expect(parseInteractionQuery({ feed_post_id: '1' }, true).error).toBeTruthy()
  })
  it('allows status pages but rejects arbitrary domains, executable links and credentials', () => {
    expect(validStatusUrl('https://weibo.com/123/Ab12')).toBe(true)
    expect(validStatusUrl('https://m.weibo.cn/detail/123')).toBe(true)
    for (const value of ['javascript:alert(1)', 'https://weibo.com.evil.test/123/Ab12', 'https://weibo.com/login', 'https://user:pass@weibo.com/123/Ab12']) expect(validStatusUrl(value)).toBe(false)
  })
})

describe('interaction draft return', () => {
  it('restores browser Back by task identity and rejects a token attached to another target', () => {
    const task = parseInteractionQuery({ action: 'comment', feed_post_id: '21' }, true)
    const key = interactionScopeKey(access, true)
    const value = { action: 'comment' as const, statusUrl: '', comment: 'draft', accountId: 5 }
    storeInteractionDraft(key, {}, task, value, '')
    expect(takeInteractionDraft(undefined, key, task)?.draft).toEqual(value)
    const token = storeInteractionDraft(key, {}, task, value, '')
    expect(takeInteractionDraft(token, key, { ...task, feedPostId: 22 })).toBeUndefined()
  })
  it('restores the original task once and isolates team, identity and workspace', () => {
    const query = { action: 'comment', feed_post_id: '21', from: 'feed' }
    const task = parseInteractionQuery(query, true)
    const draft = { action: 'comment' as const, statusUrl: '', comment: 'unsent text', accountId: 5 }
    const key = interactionScopeKey(access, true)
    const token = storeInteractionDraft(key, query, task, draft, 'baseline')
    const childQuery = { from: 'interaction', draft: token }
    expect(interactionPresetQuery(childQuery)).toEqual(childQuery)
    expect(interactionReturnTarget(childQuery, access, true)).toEqual({ path: '/personal/interactions', query: { ...query, draft: token } })
    expect(interactionReturnTarget(childQuery, access, false)).toEqual({ path: '/interactions' })
    expect(interactionReturnTarget(childQuery, { ...access, identity: { ...access.identity, entity_id: 4 } }, true)).toEqual({ path: '/personal/interactions' })
    expect(interactionReturnTarget(childQuery, { ...access, team: { ...access.team!, id: 2 } }, true)).toEqual({ path: '/personal/interactions' })
    expect(takeInteractionDraft(token, key)?.draft).toEqual(draft)
    expect(takeInteractionDraft(token, key)).toBeUndefined()
  })
  it('uses stable parent for direct visits and cleared session memory', () => {
    expect(interactionReturnTarget({}, access, true)).toEqual({ path: '/personal/interactions' })
    expect(interactionPresetQuery({ from: 'interaction', draft: ['bad', 'token'] })).toEqual({})
    const token = storeInteractionDraft(interactionScopeKey(access, true), {}, parseInteractionQuery({}, true), { action: 'like', statusUrl: '', comment: '', accountId: null }, '')
    clearInteractionDrafts()
    expect(interactionReturnTarget({ from: 'interaction', draft: token }, access, true)).toEqual({ path: '/personal/interactions' })
  })
})
