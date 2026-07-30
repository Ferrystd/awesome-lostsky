export interface PublicProfile {
  name: string
  avatar?: string | null
  description?: string | null
  intro_image?: string | null
  intro_video?: string | null
  introduction_markdown?: string | null
}

export interface PublicField {
  key: string
  name: string
  value_type: string
  value: unknown
  options?: unknown[] | null
}

export interface PublicRole {
  name: string
  description?: string | null
}

export interface PublicProduct {
  id: number
  name: string
  description?: string | null
  cover_image?: string | null
  price: string
  href: string
}

export interface PublicSubject {
  slug: string
  type: 'team' | 'teamMember' | 'teamVirtual'
  profile: PublicProfile
  fields: PublicField[]
  roles?: PublicRole[]
  products?: PublicProduct[]
}

export interface EntitySummary {
  slug: string
  type: 'team' | 'teamMember' | 'teamVirtual'
  name: string
  avatar?: string | null
  description?: string | null
  roles?: PublicRole[]
}

export interface Page<T> {
  total: number
  list: T[]
  page: number
  limit: number
}

export interface DocumentSummary {
  id: number
  title: string
  sort: number
  update_time: number
  entity: EntitySummary
}

export interface PublicDocument extends DocumentSummary {
  content?: string | null
}
