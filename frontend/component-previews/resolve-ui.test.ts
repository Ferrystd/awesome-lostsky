import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type ViteDevServer } from 'vite'
import { previewUiAlias } from './resolve-ui.mjs'

describe('mixed application preview UI resolution', () => {
  let server: ViteDevServer
  const frontend = path.resolve('frontend')
  beforeAll(async () => {
    server = await createServer({ configFile: false, server: { middlewareMode: true }, optimizeDeps: { noDiscovery: true, entries: [] }, resolve: { alias: [previewUiAlias(frontend)] } })
  })
  afterAll(async () => { await server?.close() })

  it('resolves Team-only and shared-name controls through the Team application boundary', async () => {
    for (const name of ['LsFormFields', 'LsFormContent', 'LsPageLink', 'LsListToolbar']) {
      const resolved = await server.pluginContainer.resolveId(`@lostsky/ui/components/${name}.vue`, path.join(frontend, 'apps/team/src/components/TeamShareLinks.vue'))
      expect(resolved?.id.replaceAll('\\', '/')).toBe(`${frontend.replaceAll('\\', '/')}/apps/team/src/ui/components/${name}.vue`)
    }
  })

  it('keeps public stories and other applications on the stable shared UI', async () => {
    for (const importer of ['component-previews/src/ui-stories.ts', 'apps/shop/src/views/manage/ProductsView.vue']) {
      const resolved = await server.pluginContainer.resolveId('@lostsky/ui/components/LsListToolbar.vue', path.join(frontend, importer))
      expect(resolved?.id.replaceAll('\\', '/')).toBe(`${frontend.replaceAll('\\', '/')}/packages/ui/src/components/LsListToolbar.vue`)
    }
  })
})
