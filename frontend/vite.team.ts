import { fileURLToPath } from 'node:url'
import { appConfig } from './vite.shared'

// Scope the approved Team design to this application; other applications use the stable UI.
const config = appConfig('team', 5175)
export default (env: Parameters<typeof config>[0]) => {
  const resolved = config(env)
  resolved.resolve!.alias = { ...resolved.resolve!.alias, '@lostsky/ui': fileURLToPath(new URL('./apps/team/src/ui', import.meta.url)) }
  return resolved
}
