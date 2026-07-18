import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const nginx = readFileSync(join(root, 'deploy/nginx/lostsky-static-wildcard.conf'), 'utf8')
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

const htmlRoots = ['www.lostsky.work', 'account.lostsky.work', 'team.lostsky.work']
let checked = 0
for (const domain of htmlRoots) {
  const directory = join(root, 'www', domain)
  for (const name of readdirSync(directory)) {
    if (extname(name) !== '.html' || !statSync(join(directory, name)).isFile()) continue
    const html = readFileSync(join(directory, name), 'utf8')
    const module = html.match(/<script type="module"([^>]+)>/)
    if (!module || !module[1].includes('crossorigin') || !module[1].includes('//assets.lostsky.work/')) {
      throw new Error(`${domain}/${name} must load its module from assets.lostsky.work with crossorigin`)
    }
    checked += 1
  }
}
console.log(`Assets CORS template contract OK: ${checked} HTML entries (production still requires manual BaoTa/Nginx apply)`)
