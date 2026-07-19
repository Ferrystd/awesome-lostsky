import { api } from '@lostsky/api/client'
import type { EntitySummary } from '@lostsky/ui/markdown'

export function searchEntities(keyword: string) {
  return api.get<EntitySummary[]>('/entity/search', { keyword, limit: 10 })
}

export function resolveEntities(slugs: string[]) {
  return api.get<EntitySummary[]>('/entity/resolve', { 'slugs[]': slugs })
}

export async function uploadMarkdownImage(file: File) {
  const result = await api.upload<Record<string, unknown>>(file)
  const url = String(result.url ?? result.path ?? '')
  if (!url) throw new Error('上传结果缺少图片地址')
  return url
}
