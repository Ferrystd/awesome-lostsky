export interface AuditOption {
  value: string
  label: string
}

export interface AuditFilterCatalog {
  applications: AuditOption[]
  actions: AuditOption[]
  resource_types: AuditOption[]
}

export interface AuditActor {
  authenticated_user_id: number
  username?: string | null
  entity_id: number | null
  entity_type?: string | null
  entity_name?: string | null
  entity_slug?: string | null
}

export interface AuditEventSummary {
  id: number
  application: string
  application_label: string
  action: string
  action_label: string
  resource_type: string
  resource_label: string
  resource_id?: number | null
  actor: AuditActor
  request_id?: string | null
  create_time: number
}

export interface AuditChange {
  field?: string
  before?: unknown
  after?: unknown
  changed?: boolean
  redacted?: boolean
}

export interface AuditEventDetail extends AuditEventSummary {
  context: Record<string, unknown>
}

export interface AuditPage {
  total: number
  list: AuditEventSummary[]
  page: number
  limit: number
}

export function formatAuditTime(value: number) {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(value * 1000)
}

export function actorLabel(actor: AuditActor) {
  const entity = actor.entity_name || actor.entity_slug
  const account = actor.username || `用户 #${actor.authenticated_user_id}`
  return entity ? `${entity} · ${account}` : account
}

export function displayAuditValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(displayAuditValue).join('、') || '—'
  if (typeof value === 'object' && value && 'redacted' in value) return '已变更（内容不记录）'
  return JSON.stringify(value) || '—'
}
