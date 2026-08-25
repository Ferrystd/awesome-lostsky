import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const nginx = readFileSync(join(root, 'deploy/nginx/lostsky-static-wildcard.conf'), 'utf8')
const middleware = readFileSync(join(root, 'app/middleware.php'), 'utf8')
const corsConfig = readFileSync(join(root, 'config/cors.php'), 'utf8')
const viteConfig = readFileSync(join(root, 'frontend/vite.shared.ts'), 'utf8')
const required = [
  'server_name assets.lostsky.work;',
  'Access-Control-Allow-Origin "*" always;',
  'Cross-Origin-Resource-Policy "cross-origin" always;',
  'Access-Control-Expose-Headers "Content-Length, Content-Range, ETag" always;',
  'Accept-Ranges "bytes" always;',
]
for (const directive of required) {
  if (!nginx.includes(directive)) throw new Error(`Missing assets CORS directive: ${directive}`)
}
const corsMiddlewarePosition = middleware.indexOf('\\app\\middleware\\Cors::class')
const appResolverPosition = middleware.indexOf('\\app\\middleware\\AppResolver::class')
if (corsMiddlewarePosition < 0 || appResolverPosition < 0 || corsMiddlewarePosition > appResolverPosition) {
  throw new Error('API CORS middleware must run before app resolution')
}
if (!corsConfig.includes("'allowed_headers' => '*'")) {
  throw new Error('API CORS must accept requested authorization and tracing headers')
}
if (!viteConfig.includes("process.env.VITE_DEV_API_TARGET || 'http://api.lostsky.work'")) {
  throw new Error('Local Vite proxy must target the HTTP API virtual host unless explicitly overridden')
}

const htmlRoots = [
  'www.lostsky.work',
  'account.lostsky.work',
  'admin.lostsky.work',
  'team.lostsky.work',
  'chat.lostsky.work',
  'transaction.lostsky.work',
  'display.lostsky.work',
  'shop.lostsky.work',
  'weibo.lostsky.work',
]
let checked = 0
for (const domain of htmlRoots) {
  const directory = join(root, 'www', domain)
  const names = readdirSync(directory)
  const htmlNames = names.filter((name) => extname(name) === '.html' && statSync(join(directory, name)).isFile())
  if (htmlNames.length !== 1 || htmlNames[0] !== 'index.html') {
    throw new Error(`${domain} must publish index.html as its only HTML entry`)
  }
  for (const name of htmlNames) {
    const html = readFileSync(join(directory, name), 'utf8')
    const module = html.match(/<script type="module"([^>]+)>/)
    if (!module || !module[1].includes('crossorigin') || !module[1].includes('//assets.lostsky.work/')) {
      throw new Error(`${domain}/${name} must load its module from assets.lostsky.work with crossorigin`)
    }
    checked += 1
  }
}
console.log(`Assets CORS template contract OK: ${checked} HTML entries (production still requires manual BaoTa/Nginx apply)`)
