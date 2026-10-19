import { darkTheme } from 'naive-ui'
import { lostskyAuroraTheme } from './naive-theme'

/** Merge after the host provider props; disabled leaves its theme and class untouched. */
export function workspaceSceneProviderProps(enabled: boolean) {
  return enabled
    ? { class: 'ls-theme-aurora', theme: darkTheme, themeOverrides: lostskyAuroraTheme }
    : {}
}
