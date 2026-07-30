import { describe, expect, it } from 'vitest'
import { entityTypeLabel, formatMoney, formatPublicField } from './format'

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
      name: '能力',
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
