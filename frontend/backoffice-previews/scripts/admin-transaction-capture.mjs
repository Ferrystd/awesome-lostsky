import { installPreviewRoutes } from './runtime.mjs'
import { chromium } from '@playwright/test'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { adminFixture, transactionFixture } from './admin-transaction-fixtures.mjs'

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const catalogRoot = path.join(repository, 'frontend/backoffice-previews')
const output = path.join(repository, 'test-results/backoffice-previews')
const apps = process.argv.includes('--admin') ? ['admin'] : process.argv.includes('--transaction') ? ['transaction'] : ['admin', 'transaction']
const filter = process.argv.find(arg => arg.startsWith('--route='))?.slice(8)
const capture = process.argv.includes('--capture')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const results = []
try {
  for (const app of apps) {
    const scenes = JSON.parse(await readFile(path.join(catalogRoot, `${app}.json`), 'utf8'))
    const dist = path.join(repository, 'frontend/.dist', app)
    if (!existsSync(path.join(dist, 'index.html'))) throw new Error(`先完成任务树完整构建：${dist}`)
    const buildHash = createHash('sha256').update(await readFile(path.join(dist, 'index.html'))).digest('hex')
    for (const scene of scenes.filter(item => !filter || item.routeKey.includes(filter))) {
      const reportPath = path.join(output, `${app}-report.json`)
      const previous = existsSync(reportPath) ? JSON.parse(await readFile(reportPath, 'utf8')) : []
      const completed = previous.find(item => item.routeKey === scene.routeKey && item.buildHash === buildHash && item.status === 'captured' && item.screenshots?.length === 2 && item.screenshots.every(image => existsSync(image.path)))
      if (completed) { results.push(completed); console.log(`reused ${scene.routeKey}`); continue }
      const errors = []
      const missing = []
      const origin = `http://${app === 'transaction' ? 'demo.' : ''}${app}.lostsky.work`
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce', serviceWorkers: 'block' })
      const token = `x.${Buffer.from(JSON.stringify({ sub: 99, act: { type: 'teamMember', id: 11 } })).toString('base64url')}.x`
      await context.addCookies([{ name: 'lostsky_token', value: token, domain: '.lostsky.work', path: '/' }])
      await installPreviewRoutes(context, { app, origin, missing, fixture: (url, request) => request.method() !== 'GET' ? undefined : app === 'admin' ? adminFixture(url) : transactionFixture(url, scene) })
      const page = await context.newPage()
      page.on('pageerror', error => errors.push(error.message))
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
      const result = { routeKey: scene.routeKey, app, path: scene.path, variant: scene.variant, template: scene.template, buildHash, screenshots: [], geometry: [], errors, missing, status: 'failed' }
      try {
        await page.goto(origin + scene.previewPath, { waitUntil: 'networkidle' })
        await page.locator('h1').first().waitFor({ state: 'visible', timeout: 15000 })
        result.heading = await page.locator('h1').first().innerText()
        if (new URL(page.url()).pathname !== new URL(origin + scene.previewPath).pathname) throw new Error(`Unexpected route: ${page.url()}`)
        if (scene.expectedHeading && result.heading !== scene.expectedHeading) throw new Error(`Unexpected heading: ${result.heading}`)
        for (const width of [320, 375, 768, 1024, 1440]) {
          await page.setViewportSize({ width, height: 1000 })
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
          const geometry = await page.evaluate(() => ({ width: innerWidth, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, offenders: [...document.querySelectorAll('main *')].filter(el => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1 && getComputedStyle(el).position !== 'fixed').slice(0, 8).map(el => ({ tag: el.tagName, class: el.className })) }))
          result.geometry.push(geometry)
          if (geometry.overflow > 1) errors.push(`overflow ${geometry.overflow}px at ${width}`)
        }
        if (errors.length || missing.length) throw new Error('DOM or API validation failed; preview not generated')
        for (const width of capture ? [1440, 375] : []) {
          await page.setViewportSize({ width, height: 1000 })
          const filename = `${scene.routeKey.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}-${width === 1440 ? 'desktop' : 'mobile'}.png`
          await mkdir(path.join(output, app), { recursive: true })
          const target = path.join(output, app, filename)
          await page.screenshot({ path: target, fullPage: true, animations: 'disabled' })
          result.screenshots.push({ width, path: target })
        }
        result.status = errors.length || missing.length ? 'failed' : capture ? 'captured' : 'validated'
      } catch (error) { errors.push(String(error)) }
      await context.close()
      results.push(result)
      console.log(`${result.status} ${scene.routeKey}${errors.length || missing.length ? ' ' + JSON.stringify({ errors, missing }) : ''}`)
      await writeFile(reportPath, JSON.stringify([...previous.filter(item => item.routeKey !== result.routeKey), result], null, 2))
    }
  }
} finally { await browser.close() }
process.exitCode = results.some(result => result.status === 'failed') ? 1 : 0
