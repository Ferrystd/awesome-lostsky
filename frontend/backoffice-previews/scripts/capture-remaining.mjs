import { chromium } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { installPreviewRoutes } from './runtime.mjs'
import { weiboFixture, shopFixture } from './remaining-fixtures.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const manifestRoot = path.join(root, 'frontend/backoffice-previews')
const fixtureFor = { weibo: weiboFixture, shop: shopFixture }
const portFor = { weibo: 4315, shop: 4316 }
const apps = process.argv.slice(2).filter(app => app in fixtureFor)
const failedOnly = process.argv.includes('--failed-only')
const geometryOnly = process.argv.includes('--geometry-only')
const browser = await chromium.launch({ headless: true })
const results = []
try {
  for (const app of apps.length ? apps : Object.keys(fixtureFor)) {
    const manifestPath = path.join(manifestRoot, `${app}.json`)
    const scenes = JSON.parse(await readFile(manifestPath, 'utf8'))
    const reportPath = path.join(root, 'test-results/backoffice-previews', `${app}-report.json`)
    const report = await readFile(reportPath, 'utf8').then(JSON.parse).catch(() => [])
    const origin = `http://${app === 'weibo' || app === 'shop' ? 'demo.' : ''}${app}.lostsky.work:${portFor[app]}`
    for (const scene of scenes) {
      const previous = report.find(item => item.routeKey === scene.routeKey)
      if (failedOnly && previous?.status === 'captured') continue
      const captures = geometryOnly ? [...(previous?.captures ?? [])] : []; const failures = []; const geometry = []
      for (const [viewportName, viewport] of Object.entries({ desktop: { width: 1440, height: 1000 }, mobile: { width: 375, height: 900 } })) {
        const context = await browser.newContext({ viewport, reducedMotion: 'reduce', serviceWorkers: 'block' })
        const missing = []; const pageErrors = []
        {
          const value = `x.${Buffer.from(JSON.stringify({ uid: 21, sub: 21, act: { type: 'teamMember', id: 11, slug: 'qingkong', name: '青空接单人' } })).toString('base64url')}.x`
          await context.addCookies([{ name: 'lostsky_token', value, domain: '.lostsky.work', path: '/', sameSite: 'Lax' }])
        }
        await installPreviewRoutes(context, {
          app, origin, fixture: url => fixtureFor[app](url, scene), missing,
          mockedWrites: [],
        })
        const page = await context.newPage()
        page.on('pageerror', error => pageErrors.push(error.message))
        try {
          await page.goto(origin + scene.previewPath, { waitUntil: 'networkidle', timeout: 30000 })
          await page.locator('h1:visible').first().waitFor({ state: 'visible' })
          await page.waitForTimeout(250)
          const check = await page.evaluate(() => ({
            title: [...document.querySelectorAll('h1,h2')].find(node => node.getClientRects().length)?.textContent?.trim(),
            width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
            bodyLength: document.body.innerText.trim().length,
            headings: [...document.querySelectorAll('h1,h2')].map(node => node.textContent?.trim()),
            loading: [...document.querySelectorAll('.n-skeleton')].length,
          }))
          geometry.push({ viewport: viewportName, ...check })
          if (!check.title || check.bodyLength < 35 || check.loading) throw new Error('Route did not settle to a content page')
          if (check.scrollWidth > check.width + 1) throw new Error(`Horizontal overflow ${check.scrollWidth}/${check.width}`)
          if (missing.length) throw new Error([...new Set(missing)].join('; '))
          if (pageErrors.length) throw new Error(pageErrors.join('; '))
          const filename = scene.routeKey.replace(/[^a-zA-Z0-9_-]+/g, '_') + `-${viewportName}.png`
          const target = path.join(root, 'test-results/backoffice-previews', app, filename)
          await mkdir(path.dirname(target), { recursive: true })
          if (!geometryOnly) {
            await page.screenshot({ path: target, fullPage: true, animations: 'disabled' })
            captures.push(target)
          }
          if (viewportName === 'desktop') {
            for (const width of [320, 768, 1024]) {
              await page.setViewportSize({ width, height: 1000 })
              await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
              await page.waitForTimeout(250)
              const metric = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }))
              geometry.push({ viewport: `geometry-${width}`, ...metric })
              if (metric.scrollWidth > width + 1) throw new Error(`Horizontal overflow ${metric.scrollWidth}/${width}`)
            }
            await page.setViewportSize({ width: 1440, height: 1000 })
            await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
            await page.waitForTimeout(250)
            const metric = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }))
            geometry.push({ viewport: 'desktop-text-200-percent', ...metric })
            if (metric.scrollWidth > metric.width + 1) throw new Error(`Text zoom overflow ${metric.scrollWidth}/${metric.width}`)
          }
        } catch (error) {
          failures.push({ viewport: viewportName, error: String(error.message ?? error), missing, pageErrors })
        } finally { await context.close() }
      }
      const result = { routeKey: scene.routeKey, status: failures.length ? 'failed' : 'captured', captures, evidence: { geometry, failures } }
      results.push(result)
      const previousIndex = report.findIndex(item => item.routeKey === scene.routeKey)
      if (previousIndex < 0) report.push(result)
      else report[previousIndex] = result
      console.log(`${result.status}: ${scene.routeKey}${failures.length ? ' ' + failures.map(f => f.error).join(' | ') : ''}`)
      await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n')
    }
  }
} finally { await browser.close() }
await mkdir(path.join(root, 'test-results/backoffice-previews'), { recursive: true })
const allResults = []
for (const app of Object.keys(fixtureFor)) {
  const report = await readFile(path.join(root, 'test-results/backoffice-previews', `${app}-report.json`), 'utf8').then(JSON.parse).catch(() => [])
  allResults.push(...report)
}
await writeFile(path.join(root, 'test-results/backoffice-previews/remaining-report.json'), JSON.stringify(allResults, null, 2))
if (results.some(result => result.status !== 'captured')) process.exitCode = 1
