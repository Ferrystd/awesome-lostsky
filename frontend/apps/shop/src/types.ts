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
