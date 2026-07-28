import { api } from '@lostsky/api/client'
import type { EntitySummary as ResolvedEntity } from '@lostsky/ui/markdown'
import type { DocumentSummary, EntitySummary, Page, PublicDocument, PublicSubject } from './types'
export { entityTypeLabel, formatPublicField } from './format'

export const displayApi = {
  profile: () => api.get<PublicSubject>('/profile/get'),
  entities: (page = 1, limit = 20, type?: 'teamMember' | 'teamVirtual') =>
    api.get<Page<EntitySummary>>('/entity/index', { page, limit, type }),
  entity: (slug: string) => api.get<PublicSubject>('/entity/get', { slug }),
  documents: (entitySlug?: string, page = 1, limit = 20) =>
    api.get<Page<DocumentSummary>>('/document/index', { entity_slug: entitySlug, page, limit }),
  document: (id: number) => api.get<PublicDocument>('/document/get', { id }),
  resolve: (slugs: string[]) => api.get<ResolvedEntity[]>('/entity/resolve', { 'slugs[]': slugs }),
}
