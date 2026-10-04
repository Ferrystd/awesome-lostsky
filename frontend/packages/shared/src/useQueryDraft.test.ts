import { describe, expect, it } from 'vitest'
import { effectScope, reactive, ref } from 'vue'
import { useQueryDraft } from './useQueryDraft'

function setup() {
  const scope = effectScope()
  const key = ref('a')
  const form = reactive({ title: '', items: [] as string[] })
  const draft = scope.run(() => useQueryDraft({ key: () => key.value, read: () => ({ ...form }), apply: value => Object.assign(form, value) }))!
  return { scope, key, form, draft }
}
describe('query drafts', () => {
  it('hydrates clean forms, detaches nested data and protects edits including before initial response', () => {
    const { scope, form, draft } = setup()
    form.title = 'early edit'
    expect(draft.hydrate({ title: 'server', items: [] })).toBe(false)
    draft.reset()
    const response = { title: 'server', items: ['one'] }
    expect(draft.hydrate(response)).toBe(true)
    expect(draft.hydrate({ title: 'updated', items: ['one'] })).toBe(true)
    expect(form.title).toBe('updated')
    form.items.push('two')
    expect(response.items).toEqual(['one'])
    expect(draft.hydrate({ title: 'remote update', items: [] })).toBe(false)
    expect(form.items).toEqual(['one', 'two'])
    const failedRequest = draft.capture()
    expect(draft.isCurrent(failedRequest)).toBe(true)
    // A failed request never calls accept; repeated identical query results cannot clear dirty.
    expect(draft.hydrate({ title: 'updated', items: ['one'] })).toBe(false)
    expect(draft.dirty.value).toBe(true)
    scope.stop()
  })
  it('confirms only submitted values and preserves input typed during the request', () => {
    const { scope, form, draft } = setup()
    form.title = 'submitted'
    const submitted = draft.capture()
    form.title = 'newer'
    draft.accept(submitted)
    expect(form.title).toBe('newer')
    expect(draft.dirty.value).toBe(true)
    draft.accept(draft.capture(), { title: 'normalized', items: [] })
    expect(form.title).toBe('normalized')
    expect(draft.dirty.value).toBe(false)
    scope.stop()
  })
  it('resets confirmed target changes and rejects old responses even after returning to the old key', () => {
    const { scope, key, form, draft } = setup()
    form.title = 'a draft'
    const submitted = draft.capture()
    key.value = 'b'
    expect(form.title).toBe('')
    expect(draft.hydrate({ title: 'old response', items: [] }, 'a')).toBe(false)
    key.value = 'a'
    expect(draft.accept(submitted)).toBe(false)
    expect(form.title).toBe('')
    scope.stop()
  })
})
