import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const frontend = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const root = resolve(frontend, '..')
const apps = ['site', 'account', 'team', 'chat', 'transaction', 'display', 'shop']
const domains = { site: 'www.lostsky.work', account: 'account.lostsky.work', team: 'team.lostsky.work', chat: 'chat.lostsky.work', transaction: 'transaction.lostsky.work', display: 'display.lostsky.work', shop: 'shop.lostsky.work' }
const heroVideo = existsSync(join(frontend, 'media/source/site/lostsky-loop.webm'))
const removeOptions = { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }

for (const app of apps) {
  execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', 'build', '--config', `frontend/vite.${app}.ts`], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, VITE_HAS_HERO_VIDEO: app === 'site' && heroVideo ? '1' : '0' },
  })
  const dist = join(frontend, `.dist/${app}`)
  const assetOut = join(root, `www/assets.lostsky.work/build/${app}`)
  rmSync(assetOut, removeOptions)
  mkdirSync(assetOut, { recursive: true })
  for (const entry of readdirSync(dist)) {
    if (entry !== 'index.html') cpSync(join(dist, entry), join(assetOut, entry), { recursive: true })
  }
  const html = readFileSync(join(dist, 'index.html'), 'utf8')
  const domainOut = join(root, 'www', domains[app])
  rmSync(domainOut, removeOptions)
  mkdirSync(domainOut, { recursive: true })
  writeFileSync(join(domainOut, 'index.html'), html, 'utf8')
}

const mediaSource = join(frontend, 'media/source')
const mediaOut = join(root, 'www/assets.lostsky.work/media')
if (existsSync(mediaSource)) {
  rmSync(mediaOut, removeOptions)
  cpSync(mediaSource, mediaOut, { recursive: true })
}

console.log('LostSky frontend published to www/.')
await import('./check-cors.mjs')
