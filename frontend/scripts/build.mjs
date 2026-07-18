import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const frontend = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const root = resolve(frontend, '..')
const aliases = {
  site: ['index'],
  account: ['index', 'login', 'register', 'teams'],
  team: ['index', 'settings', 'roles', 'posts', 'notice', 'members', 'member-detail', 'me', 'join', 'join-review', 'files', 'fields', 'docs', 'doc'],
}
const domains = { site: 'www.lostsky.work', account: 'account.lostsky.work', team: 'team.lostsky.work' }
const heroVideo = existsSync(join(frontend, 'media/source/site/lostsky-loop.webm'))

for (const app of Object.keys(aliases)) {
  execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', 'build', '--config', `frontend/vite.${app}.ts`], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, VITE_HAS_HERO_VIDEO: app === 'site' && heroVideo ? '1' : '0' },
  })
  const dist = join(frontend, `.dist/${app}`)
  const assetOut = join(root, `www/assets.lostsky.work/build/${app}`)
  rmSync(assetOut, { recursive: true, force: true })
  mkdirSync(assetOut, { recursive: true })
  for (const entry of readdirSync(dist)) {
    if (entry !== 'index.html') cpSync(join(dist, entry), join(assetOut, entry), { recursive: true })
  }
  const html = readFileSync(join(dist, 'index.html'), 'utf8')
  const domainOut = join(root, 'www', domains[app])
  mkdirSync(domainOut, { recursive: true })
  for (const alias of aliases[app]) writeFileSync(join(domainOut, `${alias}.html`), html, 'utf8')
}

const mediaSource = join(frontend, 'media/source')
const mediaOut = join(root, 'www/assets.lostsky.work/media')
if (existsSync(mediaSource)) {
  rmSync(mediaOut, { recursive: true, force: true })
  cpSync(mediaSource, mediaOut, { recursive: true })
}

console.log('LostSky frontend published to www/.')
await import('./check-cors.mjs')
