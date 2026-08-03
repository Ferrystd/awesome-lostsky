import { describe, expect, it } from 'vitest'
import {
  createDocumentTagDraft,
  createDocumentTagGroupDraft,
  documentTagDescriptionError,
  documentTagDrafts,
  documentTagError,
  documentTagGroupDrafts,
  documentTagGroupsPayload,
  documentTagsPayload,
  hasDocumentTagErrors,
  hasDocumentTagGroupErrors,
} from './documentTags'

describe('document tags', () => {
  it('normalizes missing and malformed collections', () => {
    expect(documentTagDrafts(null)).toEqual([])
    expect(documentTagDrafts([' 指南 ', 3, '精选']).map(item => item.tag)).toEqual([' 指南 ', '精选'])
    expect(documentTagGroupDrafts([
      { tag: '指南', description: '使用说明' },
      { tag: 3, description: null },
      null,
    ]).map(item => ({ tag: item.tag, description: item.description }))).toEqual([
      { tag: '指南', description: '使用说明' },
    ])
  })

  it('validates empty, hash-prefixed, control, long and duplicate tags', () => {
    const items = [
      createDocumentTagDraft(''),
      createDocumentTagDraft('#指南'),
      createDocumentTagDraft('含\u0007控制'),
      createDocumentTagDraft('长'.repeat(51)),
      createDocumentTagDraft('指南'),
      createDocumentTagDraft(' 指南 '),
    ]
    expect(items.map((item, index) => documentTagError(item, items, index, true))).toEqual([
      '标签不能为空',
      '标签不能以 # 开头',
      '标签不能包含控制字符',
      '标签长度不能超过 50 个字符',
      '',
      '标签不能重复',
    ])
    expect(hasDocumentTagErrors(items)).toBe(true)
  })

  it('keeps case-sensitive tags distinct and defers errors until blur or submit', () => {
    const items = [createDocumentTagDraft('Guide'), createDocumentTagDraft('guide')]
    expect(documentTagError(items[0], items, 0)).toBe('')
    expect(hasDocumentTagErrors(items)).toBe(false)
  })

  it('normalizes payload order and nullable descriptions', () => {
    const tags = [createDocumentTagDraft(' 指南 '), createDocumentTagDraft('精选')]
    const groups = [
      createDocumentTagGroupDraft(' 指南 ', ' 使用说明 '),
      createDocumentTagGroupDraft('精选', '   '),
    ]
    expect(documentTagsPayload(tags)).toEqual(['指南', '精选'])
    expect(documentTagGroupsPayload(groups)).toEqual([
      { tag: '指南', description: '使用说明' },
      { tag: '精选', description: null },
    ])
  })

  it('validates group descriptions independently', () => {
    const group = createDocumentTagGroupDraft('指南', '说'.repeat(256))
    expect(documentTagDescriptionError(group)).toBe('')
    group.descriptionTouched = true
    expect(documentTagDescriptionError(group)).toBe('说明长度不能超过 255 个字符')
    expect(hasDocumentTagGroupErrors([group])).toBe(true)
  })
})
