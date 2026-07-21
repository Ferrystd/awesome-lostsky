import type { components } from '@lostsky/api/generated/transaction'

export type TransactionRecord = components['schemas']['Transaction']
export type TransactionOptions = components['schemas']['TransactionOptions']
export type Member = components['schemas']['Member']
export type Customer = components['schemas']['Customer']
export type SenderBinding = components['schemas']['SenderBinding']
export type BalanceLog = components['schemas']['BalanceLog']
export type StatsSummary = components['schemas']['TransactionStatsSummary']
export type MemberStat = components['schemas']['TransactionMemberStat']
export type RoleStats = components['schemas']['TransactionRoleStats']
export type TimelineStat = components['schemas']['TransactionTimelineStat']
export type CustomerStat = components['schemas']['TransactionCustomerStat']

export interface Pagination<T> {
  total: number
  list: T[]
  page: number
  limit: number
}
