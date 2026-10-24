import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8')
}

describe('shared motion contract', () => {
  const styles = source('./styles.css')

  it('defines restrained durations, easing and reusable state transitions', () => {
    expect(styles).toContain('--motion-fast: 150ms')
    expect(styles).toContain('--motion-base: 200ms')
    expect(styles).toContain('--motion-slow: 320ms')
    expect(styles).toContain('--ease-out: cubic-bezier(0.22, 1, 0.36, 1)')
    expect(styles).toContain('.ls-state-enter-active')
    expect(styles).toContain('.ls-popover-enter-active')
    expect(styles).toContain('.ls-list-move')
    expect(styles).toContain('.ls-backdrop-leave-active')
  })

  it('keeps reduced-motion behavior global and effectively immediate', () => {
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)')
    expect(styles).toContain('animation-duration: 0.01ms !important')
    expect(styles).toContain('transition-duration: 0.01ms !important')
    expect(styles).toContain('--motion-distance-sm: 0')
  })

  it('resource lists render immediately without an initial animation choreography', () => {
    const views = [
      source('../../../apps/team/src/views/DocumentsView.vue'),
      source('../../../apps/team/src/views/MembersView.vue'),
      source('../../../apps/team/src/views/FilesView.vue'),
    ]

    for (const view of views) {
      expect(view).toMatch(/<(?:LsResourceList|TeamResourceWorkspace)\b/)
      expect(view).not.toMatch(/animation-delay|transition-delay/)
      expect(view).not.toMatch(/<TransitionGroup[^>]*\sappear(?:\s|=|>)/)
    }
  })
})
