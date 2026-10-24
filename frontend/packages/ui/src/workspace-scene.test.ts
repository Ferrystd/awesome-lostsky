import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it } from 'vitest'
import { darkTheme } from 'naive-ui'
import { workspaceSceneProviderProps } from './workspace-scene-theme'
import LsWorkspaceHeader from './components/LsWorkspaceHeader.vue'

describe('workspace scene opt-in', () => {
  it('leaves the host dark theme and overrides intact when disabled or leaving the sample route', () => {
    const host = { theme: darkTheme, themeOverrides: { common: { primaryColor: '#f0c080' } }, class: 'shop-theme' }
    expect(workspaceSceneProviderProps(false)).toEqual({})
    const enabled = { ...host, ...workspaceSceneProviderProps(true) }
    expect(enabled.theme).toBe(darkTheme)
    expect(enabled.class).toBe('ls-theme-aurora')
    expect(enabled.themeOverrides).not.toBe(host.themeOverrides)
    const disabled = { ...host, ...workspaceSceneProviderProps(false) }
    expect(disabled).toEqual(host)
    expect(disabled.themeOverrides).toBe(host.themeOverrides)
  })

  it('enables foreground header stacking only for an opted-in scene', async () => {
    for (const scene of [false, true]) {
      const html = await renderToString(createSSRApp({ render: () => h(LsWorkspaceHeader, { title: '工作台', contextLabel: '团队', scene }) }))
      expect(html.includes('ls-workspace-header--scene')).toBe(scene)
      expect(html).toContain('<h1')
    }
  })
})
