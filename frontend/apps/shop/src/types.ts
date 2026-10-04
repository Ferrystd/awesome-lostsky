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
  kind?: 1 | 2 | 3 | 4 | 5
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
  purchase_fields?: import('./purchase-fields').PurchaseField[]
  variants?: ProductDetail[]
  handler_groups?: Array<{ product_id: number; name: string; handlers: Handler[] }>
  inclusions?: Array<{ kind: 1 | 3 | 4; name: string; quantity: string; unit_name: string; quantity_step?: string; valid_days?: number }>
  introduction_markdown?: string | null
  handlers: Handler[]
  benefit_package?: {
    name: string
    services: Array<{
      id: number
      name: string
      description?: string | null
      quantity: string
      unit_name: string
      quantity_step: string
      valid_days: number
    }>
  } | null
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
  purchase_fields?: import('./purchase-fields').OrderPurchaseField[]
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
  is_customer_visible: 0 | 1
  is_required: 0 | 1
  is_active: 0 | 1
  sort: number
  value?: Record<string, unknown> | null
}

export interface ServiceRedemptionFieldInput {
  id?: number
  name: string
  value_type: string
  input_type: string
  options: string[]
  fill_stage: 'customer' | 'manager'
  is_customer_visible: 0 | 1
  is_required: 0 | 1
  is_active: 0 | 1
  sort: number
}

export interface ServiceRedemptionFieldDraft extends Omit<ServiceRedemptionFieldInput, 'options'> {
  key: string
  options_text: string
}

export interface ServiceInstance {
  settlement_kind?: 'service' | 'unused'
  settled_handler_cut?: string
  settled_team_cut?: string
  completion_requested_at?: number | null
  completion_due_at?: number | null
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
  unused_auto_complete_after_minutes?: number | null
  unused_auto_complete_due_at?: number | null
  id: number
  unit_name: string
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
  identity?: { type: string; entity_id: number; name: string; slug?: string | null; avatar?: string | null; belongs_to_team: boolean; is_external: boolean }
  entry_warning?: { required: boolean; kind: string | null; ttl_seconds: number }
  abilities?: {
    file?: { enabled: boolean; reason: string | null; label: string }
    transaction?: { enabled: boolean; reason: string | null; label: string }
    shop?: { enabled: boolean; reason: string | null; label: string }
  }
  file_upload?: FileUploadAvailability
}
export interface ManageEntityOption { id?: number; entity_id?: number; slug: string; type?: string; entityable_type?: string; name: string; avatar?: string | null }
export interface ManageOwnedResource { owner_entity_id?: number | null; owner?: ManageEntityOption | null }
export interface ManageService extends ManageOwnedResource {
  unused_auto_complete_after_minutes?: number | null
  auto_complete_after_minutes?: number | null
  id: number; team_id: number; name: string; description?: string | null; is_active: 0 | 1
  unit_name: string; quantity_step: string
  default_total_price: string; default_cost: string; default_handler_cut: string; default_sender_cut: string; default_cs_cut: string; default_team_cut: string
  handlers?: Array<{ entity_id: number; subject?: ManageEntityOption | null }>
  redemption_fields?: RedemptionField[]
}
export interface ManagePackageService {
  id?: number; service_id: number; quantity: string | number; valid_days: number; service?: ManageService | null
  unit_price: string; unit_cost: string
  unit_handler_cut: string; unit_sender_cut: string; unit_cs_cut: string
  sort: number
}
export interface ManageAbilityItem { ability_key: string; level: number; duration_days: number }
export interface ManagePricingSummary { price: string; cost: string; handler_cut: string; sender_cut: string; cs_cut: string; team_cut: string }
export interface ManagePackage extends ManageOwnedResource {
  id: number; name: string; pricing_mode: 1 | 2 | '历史均摊' | '分项计价'; is_active: 0 | 1
  is_pricing_locked?: boolean; pricing_summary?: ManagePricingSummary | null; services?: ManagePackageService[]; abilities?: ManageAbilityItem[]
}
export interface ManageCampaign extends ManageOwnedResource { id: number; package_id: number; name: string; claim_group: string; mode: 1 | 2 | 3; total_limit?: number | null; redeem_starts_at: number; redeem_ends_at: number; is_active: 0 | 1; package?: ManagePackage | null }
export interface ManageCode { id: number; campaign_id: number; code_hint: string; use_count: number; max_uses?: number | null; expire_time: number; is_active: 0 | 1; create_time: number }
export interface ManageCustomerOption { id: number; nickname?: string; name?: string; is_blocked: 0 | 1; balance?: Balance | null }
export interface ManageServiceDefaults {
  default_auto_complete_after_minutes?: number | null
  default_unit_name: string; default_quantity_step: string; default_valid_days: number
  allow_customer_open_dispatch: boolean; default_handler_rate_percent: number; default_sender_rate_percent: number; default_cs_rate_percent: number
}
export interface ManageProductCandidate {
  purchase_fields?: import('./purchase-fields').PurchaseField[]
  id: number
  team_id: number
  entity_id: number | null
  name: string
  kind: number | string
  price: string
  cost: string
  handler_cut: string | null
  sender_cut: string | null
  cs_cut: string | null
  team_cut: string | null
  is_active: 0 | 1
}
export interface ProductManageOptions { entities: ManageEntityOption[]; products?: ManageProductCandidate[]; packages: ManagePackage[]; campaigns: ManageCampaign[]; service_defaults: ManageServiceDefaults }
export interface EntitlementManageOptions extends ProductManageOptions { services: ManageService[] }
export interface ManageOptions extends EntitlementManageOptions { customers: ManageCustomerOption[] }
