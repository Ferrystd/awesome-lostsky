import type { EntityType } from './entity'

export interface EntityTeamSummary {
  slug: string
  display_name: string
}

export interface EntitySummary {
  slug: string
  type: EntityType
  display_name: string
  avatar?: string | null
  team?: EntityTeamSummary | null
  available: boolean
  href?: string | null
}

export type EntitySearch = (keyword: string) => Promise<EntitySummary[]>
export type EntityResolve = (slugs: string[]) => Promise<EntitySummary[]>
export type MarkdownImageUpload = (file: File) => Promise<string>

const unresolvedImageBlock = /^\s*!\[(?:\\.|[^\]\\])*\]\((?:\s*|<>\s+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'))\)\s*$/

export function removeUnresolvedMarkdownImages(content: string): string {
  const lineBreak = content.includes('\r\n') ? '\r\n' : '\n'
  return content
    .split(/\r?\n/)
    .filter(line => !unresolvedImageBlock.test(line))
    .join(lineBreak)
}
