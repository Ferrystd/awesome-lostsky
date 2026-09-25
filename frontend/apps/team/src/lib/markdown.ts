import { api, uploadFileUrl } from '@lostsky/api/client'
import type { EntitySummary } from '@lostsky/ui/markdown'

export function searchEntities(keyword: string) {
  return api.get<EntitySummary[]>('/entity/search', { keyword, limit: 10 })
}

export function resolveEntities(slugs: string[]) {
  return api.get<EntitySummary[]>('/entity/resolve', { 'slugs[]': slugs })
}

export async function uploadMarkdownImage(file: File) {
  return uploadFileUrl(file, 'markdown')
}
