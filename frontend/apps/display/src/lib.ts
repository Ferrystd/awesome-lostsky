import { api } from '@lostsky/api/client'
import type { EntitySummary as ResolvedEntity } from '@lostsky/ui/markdown'
import type { DocumentDisplayTag, DocumentSummary, EntitySummary, Page, PublicDocument, PublicSubject, PublicTeamSubject } from './types'
export { entityTypeLabel, formatMoney, formatPublicField } from './format'

export interface PublicDocumentGroup {
  key: string
  title: string
  description: string | null
  documents: DocumentSummary[]
}

export function groupPublicDocuments(
  documents: DocumentSummary[],
  displayTags: DocumentDisplayTag[],
  fallbackDescription: string,
): PublicDocumentGroup[] {
  const configuredTags = new Set(displayTags.map(item => item.tag))
  const groups = displayTags.flatMap((item) => {
    const matches = documents.filter(document => document.tags.includes(item.tag))
    return matches.length ? [{
      key: `tag:${item.tag}`,
      title: item.tag,
      description: item.description,
      documents: matches,
    }] : []
  })
  const fallbackDocuments = documents.filter(document =>
    !document.tags.some(tag => configuredTags.has(tag)),
  )

  if (fallbackDocuments.length) {
    groups.push({
      key: 'public-documents',
      title: '公开文档',
      description: fallbackDescription,
      documents: fallbackDocuments,
    })
  }

  return groups
}

export const displayApi = {
  profile: () => api.get<PublicTeamSubject>('/profile/get'),
  entities: (page = 1, limit = 20, type?: 'teamMember' | 'teamVirtual', keyword?: string) =>
    api.get<Page<EntitySummary>>('/entity/index', { page, limit, type, keyword }),
  entity: (slug: string) => api.get<PublicSubject>('/entity/get', { slug }),
  documents: (entitySlug?: string, page = 1, limit = 20) =>
    api.get<Page<DocumentSummary>>('/document/index', { entity_slug: entitySlug, page, limit }),
  document: (id: number) => api.get<PublicDocument>('/document/get', { id }),
  resolve: (slugs: string[]) => api.get<ResolvedEntity[]>('/entity/resolve', { 'slugs[]': slugs }),
}
