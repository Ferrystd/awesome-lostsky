export interface DocumentTagDraft {
  key: number
  tag: string
  touched: boolean
}

export interface DocumentTagGroupDraft extends DocumentTagDraft {
  description: string
  descriptionTouched: boolean
}

let nextDraftKey = 0

export function createDocumentTagDraft(tag = ''): DocumentTagDraft {
  return { key: ++nextDraftKey, tag, touched: false }
}

export function createDocumentTagGroupDraft(tag = '', description: string | null = ''): DocumentTagGroupDraft {
  return {
    ...createDocumentTagDraft(tag),
    description: description ?? '',
    descriptionTouched: false,
  }
}

export function documentTagDrafts(value: unknown): DocumentTagDraft[] {
  return Array.isArray(value)
    ? value.filter((tag): tag is string => typeof tag === 'string').map(createDocumentTagDraft)
    : []
}

export function documentTagGroupDrafts(value: unknown): DocumentTagGroupDraft[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    if (typeof record.tag !== 'string') return []
    return [createDocumentTagGroupDraft(
      record.tag,
      typeof record.description === 'string' ? record.description : null,
    )]
  })
}

export function documentTagError(
  item: DocumentTagDraft,
  items: DocumentTagDraft[],
  index: number,
  submitted = false,
): string {
  if (!submitted && !item.touched) return ''
  const tag = item.tag.trim()
  if (!tag) return '标签不能为空'
  if (tag.startsWith('#')) return '标签不能以 # 开头'
  if (/\p{Cc}/u.test(tag)) return '标签不能包含控制字符'
  if ([...tag].length > 50) return '标签长度不能超过 50 个字符'
  if (items.findIndex(candidate => candidate.tag.trim() === tag) !== index) return '标签不能重复'
  return ''
}

export function documentTagDescriptionError(item: DocumentTagGroupDraft, submitted = false): string {
  if (!submitted && !item.descriptionTouched) return ''
  return [...item.description.trim()].length > 255 ? '说明长度不能超过 255 个字符' : ''
}

export function hasDocumentTagErrors(items: DocumentTagDraft[]): boolean {
  return items.some((item, index) => documentTagError(item, items, index, true) !== '')
}

export function hasDocumentTagGroupErrors(items: DocumentTagGroupDraft[]): boolean {
  return hasDocumentTagErrors(items)
    || items.some(item => documentTagDescriptionError(item, true) !== '')
}

export function documentTagsPayload(items: DocumentTagDraft[]): string[] {
  return items.map(item => item.tag.trim())
}

export function documentTagGroupsPayload(items: DocumentTagGroupDraft[]): Array<{ tag: string; description: string | null }> {
  return items.map(item => ({
    tag: item.tag.trim(),
    description: item.description.trim() || null,
  }))
}
