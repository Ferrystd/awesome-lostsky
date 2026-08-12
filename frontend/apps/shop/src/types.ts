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
export interface FileUploadAvailability {
  count: number
  total_size: number
  size_limit: number | null
  remaining_size: number | null
  available: boolean
  reason: 'quota' | null
}
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
  file_upload?: FileUploadAvailability
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
  create_time?: number
  memo?: string | null
  quantity: string
  service: { id: number; name: string; description?: string | null }
  handler?: { name?: string; profile?: { name?: string } } | null
  cancel_requests?: Array<{ id: number; status: 1 | 2 | 3; reason: string }>
  adjustments?: ServiceAdjustment[]
  redemption_fields?: RedemptionField[]
}

export interface ServiceAdjustment {
  id: number
  name: string
  quantity: string
  unit_price: string
  total_price: string
  status: 1 | 2 | 3
  memo?: string | null
}

export interface ServiceEntitlement {
  id: number
  unit_name: string
  quantity_scale: number
  quantity_step: string
  granted_quantity: string
  reserved_quantity: string
  consumed_quantity: string
  available_quantity: string
  expire_time: number
  is_expired: boolean
  is_exhausted: boolean
  allow_open_dispatch?: boolean
  dispatch_available?: boolean
  service: { id: number; name: string; description?: string | null }
  instances?: ServiceInstance[]
  assignment_offers?: ServiceAssignmentOffer[]
  redemption_fields?: RedemptionField[]
}

export interface ServiceAssignmentOffer {
  id: number
  quantity: string
  status: number | string
  memo?: string | null
  expire_time: number
  decision_reason?: string | null
  target_handler?: { id: number; name?: string; profile?: { name?: string } } | null
  service_instance_id?: number | null
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
  identity?: { type: string; entity_id: number; name: string; slug?: string | null; avatar?: string | null }
  abilities?: {
    file?: { enabled: boolean; reason: string | null; label: string }
    transaction?: { enabled: boolean; reason: string | null; label: string }
    shop?: { enabled: boolean; reason: string | null; label: string }
  }
  file_upload?: FileUploadAvailability
}
export interface ManageEntityOption { id?: number; entity_id?: number; slug: string; type?: string; name: string; avatar?: string | null }
export interface ManageService {
  id: number; team_id: number; name: string; description?: string | null; is_active: 0 | 1
  unit_name: string; quantity_scale: number; quantity_step: string
  default_total_price: string; default_cost: string; default_handler_cut: string; default_sender_cut: string; default_cs_cut: string; default_team_cut: string
  handlers?: Array<{ entity_id: number; subject?: ManageEntityOption | null }>
}
export interface ManagePackageService {
  id?: number; service_id: number; quantity: string | number; valid_days: number; service?: ManageService | null
  unit_price: string; unit_cost: string; distribution_mode: 1 | 2 | '固定金额' | '按比例'
  unit_handler_cut: string; unit_sender_cut: string; unit_cs_cut: string
  handler_rate_bp: number; sender_rate_bp: number; cs_rate_bp: number; sort: number
}
export interface ManageAbilityItem { ability_key: string; level: number; duration_days: number }
export interface ManagePricingSummary { price: string; cost: string; handler_cut: string; sender_cut: string; cs_cut: string; team_cut: string }
export interface ManagePackage {
  id: number; name: string; pricing_mode: 1 | 2 | '历史均摊' | '分项计价'; is_active: 0 | 1
  is_pricing_locked?: boolean; pricing_summary?: ManagePricingSummary | null; services?: ManagePackageService[]; abilities?: ManageAbilityItem[]
}
export interface ManageCampaign { id: number; package_id: number; name: string; claim_group: string; mode: 1 | 2 | 3; total_limit?: number | null; per_target_limit: number; redeem_starts_at: number; redeem_ends_at: number; is_active: 0 | 1; package?: ManagePackage | null }
export interface ManageCode { id: number; campaign_id: number; code_hint: string; use_count: number; max_uses?: number | null; expire_time: number; is_active: 0 | 1; create_time: number }
export interface ManageCustomerOption { id: number; nickname?: string; name?: string; is_blocked: 0 | 1; balance?: Balance | null }
export interface ProductManageOptions { entities: ManageEntityOption[]; packages: ManagePackage[]; campaigns: ManageCampaign[] }
export interface ManageServiceDefaults {
  default_unit_name: string; default_quantity_scale: number; default_quantity_step: string; default_valid_days: number
  allow_customer_open_dispatch: boolean; assignment_offer_timeout_minutes: number; default_handler_rate_percent: number; default_sender_rate_percent: number; default_cs_rate_percent: number
}
export interface ManageOptions extends ProductManageOptions { customers: ManageCustomerOption[]; services: ManageService[]; service_defaults: ManageServiceDefaults }
