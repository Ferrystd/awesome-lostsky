import { describe, expect, it } from 'vitest'
import { entityTypeLabel, formatMoney, formatPublicField } from './format'
import { groupPublicDocuments } from './lib'
import type { DocumentSummary } from './types'

const document = (id: number, tags: string[]): DocumentSummary => ({
  id,
  title: `Document ${id}`,
  tags,
  sort: id,
  update_time: 1_700_000_000 + id,
  entity: { slug: 'demo', type: 'team', name: 'Demo' },
})

describe('display public fields', () => {
  it('renders booleans, dates and select labels for visitors', () => {
    expect(formatPublicField({ key: 'active', name: '启用', value_type: 'bool', value: 1 })).toBe('是')
    expect(formatPublicField({
      key: 'role',
      name: '岗位',
      value_type: 'select',
      value: 'host',
      options: [{ value: 'host', label: '主持人' }],
    })).toBe('主持人')
    expect(formatPublicField({
      key: 'skills',
      name: '能力（Ability）',
      value_type: 'multi_select',
      value: ['guide', 'support'],
      options: [
        { value: 'guide', label: '引导' },
        { value: 'support', label: '支持' },
      ],
    })).toBe('引导、支持')
    expect(formatPublicField({
      key: 'since',
      name: '加入日期',
      value_type: 'date',
      value: 1_735_689_600,
    })).toMatch(/2025/)
  })

  it('renders the remaining public field value types', () => {
    expect(formatPublicField({ key: 'bio', name: '介绍', value_type: 'text', value: '两行介绍' })).toBe('两行介绍')
    expect(formatPublicField({ key: 'projects', name: '项目数', value_type: 'int', value: 28 })).toBe('28')
    expect(formatPublicField({ key: 'rating', name: '评分', value_type: 'decimal', value: '4.95' })).toBe('4.95')
    expect(formatPublicField({
      key: 'event',
      name: '活动时间',
      value_type: 'datetime',
      value: 1_785_583_800,
    })).toMatch(/2026/)
    expect(formatPublicField({
      key: 'preferences',
      name: '偏好',
      value_type: 'json',
      value: { language: '中文', format: '语音' },
    })).toBe('{\n  "language": "中文",\n  "format": "语音"\n}')
  })

  it('covers every public entity label', () => {
    expect(entityTypeLabel('team')).toBe('团队')
    expect(entityTypeLabel('teamMember')).toBe('成员')
    expect(entityTypeLabel('teamVirtual')).toBe('虚拟实体')
  })

  it('formats public product prices consistently with the shop', () => {
    expect(formatMoney('32')).toBe('¥32.00')
    expect(formatMoney('19.90')).toBe('¥19.90')
  })
})

describe('display public document groups', () => {
  it('keeps the original public document section without display tags', () => {
    const groups = groupPublicDocuments([document(1, []), document(2, ['guide'])], [], '默认说明')

    expect(groups).toHaveLength(1)
    expect(groups[0]).toMatchObject({
      key: 'public-documents',
      title: '公开文档',
      description: '默认说明',
      documents: [{ id: 1 }, { id: 2 }],
    })
  })

  it('uses exact case-sensitive matches and configured group order', () => {
    const groups = groupPublicDocuments(
      [document(1, ['A']), document(2, ['a']), document(3, ['empty'])],
      [
        { tag: 'a', description: '小写' },
        { tag: 'missing', description: '空分组' },
        { tag: 'A', description: '大写' },
      ],
      '默认说明',
    )

    expect(groups.map(group => group.title)).toEqual(['a', 'A', '公开文档'])
    expect(groups.map(group => group.documents.map(item => item.id))).toEqual([[2], [1], [3]])
  })

  it('shows multi-tag documents in every matching group without adding them to the fallback', () => {
    const groups = groupPublicDocuments(
      [document(1, ['guide', 'news']), document(2, ['other']), document(3, [])],
      [
        { tag: 'guide', description: null },
        { tag: 'news', description: '新闻' },
      ],
      '默认说明',
    )

    expect(groups.map(group => group.documents.map(item => item.id))).toEqual([[1], [1], [2, 3]])
  })
})
