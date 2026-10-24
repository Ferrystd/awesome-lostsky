import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const mime = { '.js':'text/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.woff':'font/woff','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg' }

/** Actual built Vue with explicit mock API; never forwards requests to a live service. */
export async function installPreviewRoutes(context, { app, origin, fixture, missing, mockedWrites = [] }) {
 const dist=path.join(repository,'frontend/.dist',app)
      await context.route('**/*', async route => {
        const request = route.request()
        const url = new URL(request.url())
        const headers = { 'access-control-allow-origin': origin, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS' }
        if (url.hostname === 'api.lostsky.work' || url.pathname.startsWith('/api/')) {
          if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
          const normalizedPath = url.pathname.replace(/^\/api(?=\/)/, '')
          if (request.method() !== 'GET' && !mockedWrites.includes(`${request.method()} ${normalizedPath}`)) { missing.push(`blocked write ${request.method()} ${normalizedPath}`); return route.abort() }
          const data = fixture(url, request)
          if (data === undefined) { missing.push(`unmocked ${request.method()} ${url.pathname}`); return route.fulfill({ status: 501, headers, json: { code: 501, message: '预览夹具缺失', data: null } }) }
          if (data?.__previewError) return route.fulfill({ status: data.status ?? (data.__previewError === true ? 503 : 200), headers, json: data.__previewError === true ? { code: data.code, message: data.message, data: null } : data.__previewError })
          return route.fulfill({ headers, json: { code: 0, message: 'ok', data } })
        }
        let local
        if (url.hostname === new URL(origin).hostname && request.isNavigationRequest()) local = path.join(dist, 'index.html')
        else if (url.hostname === new URL(origin).hostname) local = path.resolve(dist, '.' + url.pathname)
        else if (url.hostname === 'assets.lostsky.work' && url.pathname.startsWith(`/build/${app}/`)) local = path.resolve(dist, '.' + url.pathname.slice(`/build/${app}`.length))
        else if (url.hostname === 'assets.lostsky.work' && url.pathname.startsWith('/media/')) local = path.resolve(repository, 'frontend/media/source', '.' + url.pathname.slice('/media'.length))
        if (local && (local.startsWith(dist + path.sep) || local.startsWith(path.join(repository, 'frontend/media/source') + path.sep))) {
          try { return await route.fulfill({ headers, body: await readFile(local), contentType: mime[path.extname(local)] || 'application/octet-stream' }) }
          catch { missing.push(`missing local asset ${url.pathname}`) }
        } else missing.push(`blocked network ${url.hostname}${url.pathname}`)
        return route.abort()
      })
}
