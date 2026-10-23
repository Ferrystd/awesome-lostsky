import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve('frontend/apps/team/src')
const read = (file: string) => readFileSync(path.join(root, file), 'utf8')

describe('Team adopted workspace cleanup', () => {
  it('uses one category layout for both routed reviews and draft-preserving role categories', () => {
    for (const name of ['JoinReviewView', 'MemberDepartureView', 'RoleDetailView']) {
      const source = read(`views/${name}.vue`)
      expect(source).toContain('<TeamCategoryLayout')
      expect(source).toContain('<LsPageHeader')
      expect(source).not.toContain('LsCategoryPage')
    }
    expect(existsSync(path.join(root, 'ui/components/LsCategoryPage.vue'))).toBe(false)
    expect(read('components/TeamCategoryNavigation.vue')).toContain('<LsCategoryNavigationItem')
  })

  it('removes the empty generic resource route and the abandoned toolbar presentation', () => {
    expect(read('router.ts')).not.toMatch(/ResourceView|ResourceMeta|Object\.entries\(resources\)/)
    expect(existsSync(path.join(root, 'views/ResourceView.vue'))).toBe(false)
    expect(read('ui/components/LsListToolbar.vue')).not.toMatch(/embedded|background:\s*var\(--surface\)|border:\s*1px/)
    for (const file of readdirSync(path.join(root, 'views')).filter(file => file.endsWith('.vue'))) {
      expect(read(`views/${file}`)).not.toMatch(/<LsListToolbar\b[^>]*\bembedded\b/)
    }
  })

  it('removes manual motion controls while retaining automatic rendering safeguards', () => {
    expect(existsSync(path.join(root, 'ui/components/LsSceneMotionControl.vue'))).toBe(false)
    expect(existsSync(path.join(root, 'ui/workspace-scene.ts'))).toBe(false)
    const renderer = read('ui/workspace-scene/aurora-renderer.ts')
    expect(renderer).toContain("matchMedia('(prefers-reduced-motion: reduce)')")
    expect(renderer).toContain('!motion.matches && inView && !document.hidden')
    expect(renderer).toContain("document.removeEventListener('visibilitychange', sync)")
    expect(renderer).toContain('resizeObserver.disconnect(); visibilityObserver.disconnect()')
    expect(renderer).not.toContain('setPaused')
  })
})
