export interface FieldValuesPage {
  data: Array<{ entity_id: number; slug: string; name: string; type: 'team' | 'teamMember' | 'teamCustomer' | 'teamVirtual'; value: unknown }>
  total: number
  current_page: number
  per_page: number
}

export function formatFieldValue(value: unknown, type: string): string {
  if (value === null || value === undefined) return '—'
  if (type === 'bool') return Number(value) ? '是' : '否'
  if (type === 'json') return JSON.stringify(value, null, 2)
  if (Array.isArray(value)) return value.map(String).join('、')
  if (type === 'date' || type === 'datetime') {
    const date = new Date(typeof value === 'number' ? value * 1000 : String(value))
    if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat('zh-CN', {
      dateStyle: 'medium', ...(type === 'datetime' ? { timeStyle: 'medium' as const } : {}),
    }).format(date)
  }
  return String(value)
}
