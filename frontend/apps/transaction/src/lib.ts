import type { Customer, Entity, EntitySummary, TransactionOptions } from './types'

export const money = (value: unknown) => new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 2,
}).format(Number(value ?? 0))

export const integer = (value: unknown) => new Intl.NumberFormat('zh-CN').format(Number(value ?? 0))

export const dateTime = (value: unknown) => {
  const seconds = Number(value ?? 0)
  return seconds ? new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(seconds * 1000)) : '—'
}

type EntityDisplay = Entity | EntitySummary | null | undefined

export const entityName = (entity?: EntityDisplay, id?: number | null) => {
  const profile = 'profile' in (entity ?? {}) ? (entity as Entity & { profile?: { nickname?: string } }).profile : undefined
  return String(('name' in (entity ?? {}) ? (entity as EntitySummary).name : null)
    || profile?.nickname
    || (id ? `主体 #${id}` : '未知人员'))
}

export const customerName = (customer?: Customer | null, id?: number | null) =>
  String(customer?.nickname || (id ? `顾客 #${id}` : '未关联顾客'))

export const customerOptions = (data?: TransactionOptions) => (data?.customers ?? [])
  .filter((item) => Number(item.is_blocked ?? 0) !== 1)
  .map((item) => ({ label: customerName(item, item.id), value: Number(item.id) }))

export const transactionParticipantDefaults = (customer: Customer | null | undefined, currentEntityId: number | null) => {
  const selfId = Number(currentEntityId) || null
  const assigneeId = Number(customer?.assignee_entity_id) || null
  return {
    senderEntityId: assigneeId || selfId,
    csEntityId: assigneeId && selfId ? selfId : null,
  }
}

export const transactionType = (value: unknown) => ({ 1: '商城订单', 2: '记账登记', 3: '权益包收款', 4: '权益核销', 5: '履约加价收款', 6: '履约加价业绩' }[Number(value)] ?? '其他流水')
export const balanceLogType = (value: unknown) => ({ 1: '充值', 2: '消费', 3: '退款', 4: '调整' }[Number(value)] ?? '变动')

export const serviceStatusCode = (value: unknown) => {
  if (typeof value === 'number') return value
  if (/^[123]$/.test(String(value))) return Number(value)
  return ({ 未核销: 1, 核销中: 2, 已核销: 3 } as Record<string, number>)[String(value)] ?? 0
}

export const serviceStatusName = (value: unknown) =>
  ({ 1: '未核销', 2: '核销中', 3: '已核销' } as Record<number, string>)[serviceStatusCode(value)] ?? '未知'
