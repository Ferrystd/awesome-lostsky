import type { Customer, Member, TransactionOptions } from './types'

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

export const memberName = (member?: Member | null, id?: number | null) =>
  String(member?.nickname || (id ? `成员 #${id}` : '团队主体'))

export const customerName = (customer?: Customer | null, id?: number | null) =>
  String(customer?.nickname || (id ? `客户 #${id}` : '未关联客户'))

export const memberOptions = (data?: TransactionOptions) => (data?.members ?? [])
  .filter((item) => Number(item.is_blocked ?? 0) !== 1)
  .map((item) => ({ label: memberName(item, item.id), value: Number(item.id) }))

export const customerOptions = (data?: TransactionOptions) => (data?.customers ?? [])
  .filter((item) => Number(item.is_blocked ?? 0) !== 1)
  .map((item) => ({ label: customerName(item, item.id), value: Number(item.id) }))

export const transactionType = (value: unknown) => Number(value) === 1 ? '商城订单' : '记账登记'
export const balanceLogType = (value: unknown) => ({ 1: '充值', 2: '消费', 3: '退款', 4: '调整' }[Number(value)] ?? '变动')
