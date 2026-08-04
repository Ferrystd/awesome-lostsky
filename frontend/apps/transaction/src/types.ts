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

export interface Pagination<T> {
  total: number
  list: T[]
  page: number
  limit: number
}

export interface ServiceField {
  id: number; name: string; value_type: string; input_type: string; options?: string[] | null
  fill_stage: 'customer' | 'manager'; is_required: number; value?: Record<string, unknown> | null
}
export interface ServiceRedemption {
  id: number; status: 1 | 2 | 3; expire_time: number; started_at?: number | null; completed_at?: number | null
  service: { name: string; description?: string | null }; customer_id?: number | null; customer?: Customer | null
  handler_entity_id?: number | null; handler?: Entity | null; sender?: Entity | null; cs?: Entity | null
  cancel_requests?: Array<{ id:number; status:1|2|3; reason:string }>; redemption_fields?: ServiceField[]
  capabilities?: { manage: boolean; approve_cancel: boolean }
}
