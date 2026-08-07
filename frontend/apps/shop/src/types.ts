export interface StoreProfile {
  slug: string
  type: 'team'
  product_count: number
  profile: {
    name: string
    avatar?: string | null
    description?: string | null
    intro_image?: string | null
    introduction_markdown?: string | null
  }
}

export interface ProductSummary {
  id: number
  name: string
  description?: string | null
  cover_image?: string | null
  price: string
}

export interface Handler {
  entity_id: number
  slug: string
  name: string
  avatar?: string | null
}

export interface ProductDetail extends ProductSummary {
  introduction_markdown?: string | null
  handlers: Handler[]
}

export interface Page<T> { total: number; list: T[]; page: number; limit: number }
export interface Balance { balance: string; recharged: string; spent: string }
export interface Customer {
  id: number
  team_id: number
  is_blocked: 0 | 1
  balance?: Balance | null
  profile: {
    name: string
    avatar?: string | null
    description?: string | null
  }
  identity: {
    slug?: string | null
  }
  assignee?: {
    entity_id: number
    slug: string
    type: 'team' | 'teamMember' | 'teamVirtual'
    name: string
    avatar?: string | null
  } | null
}
export interface BindResult { token?: string | null; customer: Customer; created: boolean }

export interface Order {
  id: number
  product_id: number
  product_name: string
  product_cover_image?: string | null
  quantity: number
  unit_price: string
  total_price: string
  prepaid: string
  status: 1 | 2 | 3
  memo?: string | null
  create_time: number
  handler?: { name?: string; profile?: { name?: string } } | null
}

export interface RedemptionField {
  id: number
  name: string
  value_type: string
  input_type: string
  options?: string[] | null
  fill_stage: 'customer' | 'manager'
  is_required: 0 | 1
  value?: Record<string, unknown> | null
}

export interface ServiceInstance {
  id: number
  status: 1 | 2 | 3
  ordinal: number
  expire_time: number
  is_expired: boolean
  memo?: string | null
  service: { id: number; name: string; description?: string | null }
  handler?: { name?: string; profile?: { name?: string } } | null
  cancel_requests?: Array<{ id: number; status: 1 | 2 | 3; reason: string }>
  redemption_fields?: RedemptionField[]
}

export interface RedemptionCard {
  id: number
  code_hint: string
  use_count: number
  max_uses?: number | null
  campaign: { name: string }
}

export interface ManageAccess {
  permissions: string[]
  team?: { id: number; slug: string; name: string } | null
  identity?: { type: string }
  abilities?: { transaction?: { enabled: boolean; reason: string | null; label: string } }
}
export interface ManageEntityOption { id?: number; entity_id?: number; slug: string; type?: string; name: string; avatar?: string | null }
export interface ManageService {
  id: number; team_id: number; name: string; description?: string | null; is_active: 0 | 1
  default_total_price: string; default_cost: string; default_handler_cut: string; default_sender_cut: string; default_cs_cut: string; default_team_cut: string
  handlers?: Array<{ entity_id: number; subject?: ManageEntityOption | null }>
}
export interface ManagePackageService { id?: number; service_id: number; quantity: number; valid_days: number; service?: ManageService | null }
export interface ManageAbilityItem { ability_key: string; level: number; duration_days: number }
export interface ManagePackage { id: number; name: string; is_active: 0 | 1; services?: ManagePackageService[]; abilities?: ManageAbilityItem[] }
export interface ManageCampaign { id: number; package_id: number; name: string; claim_group: string; mode: 1 | 2 | 3; total_limit?: number | null; per_target_limit: number; redeem_starts_at: number; redeem_ends_at: number; is_active: 0 | 1; package?: ManagePackage | null }
export interface ManageCode { id: number; campaign_id: number; code_hint: string; use_count: number; max_uses?: number | null; expire_time: number; is_active: 0 | 1; create_time: number }
export interface ManageCustomerOption { id: number; nickname?: string; name?: string; is_blocked: 0 | 1; balance?: Balance | null }
export interface ManageOptions { entities: ManageEntityOption[]; customers: ManageCustomerOption[]; services: ManageService[]; packages: ManagePackage[]; campaigns: ManageCampaign[] }
