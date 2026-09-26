import { beforeEach, expect, it } from 'vitest'
import { clearFeedDraft, saveFeedDraft, takeFeedDraft } from './feedNavigation'

beforeEach(clearFeedDraft)
it('copies feed drafts and restores them once in the same scope', () => {
  const drafts = { 1: { text: 'unsent', baseline: '', expanded: true, pending: false, error: '' } }
  saveFeedDraft('team:person:personal', 2, drafts)
  drafts[1].text = 'newer'
  expect(takeFeedDraft('team:person:personal')).toMatchObject({ accountId: 2, drafts: { 1: { text: 'unsent' } } })
  expect(takeFeedDraft('team:person:personal')).toBeUndefined()
})
it('discards drafts on identity mismatch or explicit cleanup', () => {
  saveFeedDraft('team:person:personal', 2, {})
  expect(takeFeedDraft('team:other:personal')).toBeUndefined()
  expect(takeFeedDraft('team:person:personal')).toBeUndefined()
  saveFeedDraft('team:person:personal', 2, {})
  clearFeedDraft()
  expect(takeFeedDraft('team:person:personal')).toBeUndefined()
})
