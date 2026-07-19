export interface EntityTeamSummary {
  slug: string
  display_name: string
}

export interface EntitySummary {
  slug: string
  type: 'team' | 'teamMember' | 'unknown'
  display_name: string
  avatar?: string | null
  team?: EntityTeamSummary | null
  available: boolean
  href?: string | null
}

export type EntitySearch = (keyword: string) => Promise<EntitySummary[]>
export type EntityResolve = (slugs: string[]) => Promise<EntitySummary[]>
export type MarkdownImageUpload = (file: File) => Promise<string>
