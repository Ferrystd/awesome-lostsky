import type { VNodeChild } from 'vue'

export const previewStates = ['default', 'hover', 'focus', 'active', 'disabled', 'loading', 'error', 'mobile'] as const
export type PreviewState = typeof previewStates[number]

export interface StoryDefinition {
  name: string
  desktopWidth?: number
  supported: PreviewState[]
  render: (state: PreviewState) => VNodeChild
  reason?: Partial<Record<PreviewState, string>>
}

export interface CatalogEntry {
  id: string
  name: string
  source: string
  story: string
  category: string
  aliases: string[]
}
