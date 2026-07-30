import type { components } from '@lostsky/api/generated/transaction'

export type TransactionRecord = components['schemas']['Transaction']
export type TransactionOptions = components['schemas']['TransactionOptions']
export type Entity = components['schemas']['Entity']
export type EntitySummary = components['schemas']['EntitySummary']
export type Customer = components['schemas']['Customer']
export type SenderBinding = components['schemas']['SenderBinding']
export type BalanceLog = components['schemas']['BalanceLog']
export type StatsSummary = components['schemas']['TransactionStatsSummary']
export type EntityStat = components['schemas']['TransactionEntityStat']
export type RoleStats = components['schemas']['TransactionRoleStats']
export type TimelineStat = components['schemas']['TransactionTimelineStat']
export type CustomerStat = components['schemas']['TransactionCustomerStat']

export interface AssigneeStat {
  entity_id: number
  slug?: string | null
  name: string
  avatar?: string | null
  customer_count: number
  transaction_count: number
  total_price: string
  total_cost: string
  team_cut: string
}

export interface InviteIdentity {
  entity_id: number
  type: 'team' | 'teamMember' | 'teamVirtual'
  slug: string
  name: string
  avatar?: string | null
  display_url: string
}

export interface Pagination<T> {
  total: number
  list: T[]
  page: number
  limit: number
}
