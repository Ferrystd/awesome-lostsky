import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import LsPageHeader from './ui/components/LsPageHeader.vue'
import LsListToolbar from './ui/components/LsListToolbar.vue'

it('移动布局保持语义参数且所有页面不再挂载极光播放控制', () => {
  expect(Object.keys(LsPageHeader.props ?? {}).sort()).toEqual(['backLabel', 'backTo', 'description', 'title'])
  expect(Object.keys(LsListToolbar.props ?? {}).sort()).toEqual(['ariaLabel', 'countLabel', 'modelValue', 'placeholder', 'searchable'])
  const scan = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? scan(join(directory, entry.name)) : [join(directory, entry.name)])
  for (const file of scan('frontend').filter(file => file.endsWith('.vue'))) {
    expect(readFileSync(file, 'utf8'), file).not.toMatch(/LsSceneMotionControl|暂停极光|播放极光/)
  }
  const renderer = readFileSync('frontend/apps/team/src/ui/workspace-scene/aurora-renderer.ts', 'utf8')
  expect(renderer).toContain("matchMedia('(prefers-reduced-motion: reduce)')")
  expect(renderer).toContain('!motion.matches && inView && !document.hidden')
})
