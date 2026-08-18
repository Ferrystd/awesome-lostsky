import type { components } from '@lostsky/api/generated/transaction'

export type TransactionRecord = components['schemas']['Transaction']
export type TransactionOptions = components['schemas']['TransactionOptions']
export type ManualEntitlementGrantOptions = components['schemas']['ManualEntitlementGrantOptions']
export type ManualEntitlementGrantResult = components['schemas']['ManualEntitlementGrantResult']
export type PersonalEntitlementGrantRecord = components['schemas']['PersonalEntitlementGrantRecord']
export type Entity = components['schemas']['Entity']
export type EntitySummary = components['schemas']['EntitySummary']
export type Customer = components['schemas']['Customer']
export type PersonalCustomer = components['schemas']['PersonalCustomer']
export type BalanceLog = components['schemas']['BalanceLog']
export type StatsSummary = components['schemas']['TransactionStatsSummary']
export type EntityStat = components['schemas']['TransactionEntityStat']
export type RoleStats = components['schemas']['TransactionRoleStats']
export type TimelineStat = components['schemas']['TransactionTimelineStat']
export type CustomerStat = components['schemas']['TransactionCustomerStat']
export type PersonStat = components['schemas']['TransactionPersonStat']
export type PersonStatsPage = components['schemas']['TransactionPersonStatsPage']

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
  fill_stage: 'customer' | 'manager'; is_required: number; value?: unknown
}
export interface ServiceRedemptionResource {
  index: number
  quantity: string
  redemption_fields: ServiceField[]
}
export type ServiceCustomer = Customer & { profile?: { name?: string | null } | null; name?: string | null }
export interface ServiceRedemption {
  id: number; status: 1 | 2 | 3 | string; status_code?: 1 | 2 | 3; expire_time: number; started_at?: number | null; completed_at?: number | null
  quantity: string; create_time?: number; status_label?: string; handler_cut?: string; memo?: string | null
  entitlement?: { id?: number; unit_name?: string; quantity_step?: string } | null
  service: { name: string; description?: string | null }; customer_id?: number | null; customer?: ServiceCustomer | null
  handler_entity_id?: number | null; handler?: Entity | null; sender?: Entity | null; cs?: Entity | null
  cancel_requests?: Array<{ id:number; status:1|2|3; reason:string }>; redemption_fields?: ServiceField[]; redemption_resources?: ServiceRedemptionResource[]
  adjustments?: Array<{ id:number; name:string; quantity:string; unit_price:string; total_price:string; status:1|2|3; memo?:string|null }>
  capabilities?: { manage: boolean; approve_cancel: boolean }
}

export interface ServiceAssignmentOffer {
  id: number; status: 1 | 2 | 3 | 4 | 5 | string; quantity: string; create_time: number
  total_price: string; handler_cut: string; memo?: string | null
  service?: { name?: string | null } | null; customer?: ServiceCustomer | null
  entitlement?: { unit_name?: string | null; quantity_step?: string } | null
  redemption_fields?: ServiceField[]; redemption_resources?: ServiceRedemptionResource[]
}
