import { chromium } from '@playwright/test'
import vue from '@vitejs/plugin-vue'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const previewRoot = path.resolve(scriptDir, '..')
const frontendRoot = path.resolve(previewRoot, '..')
const repository = path.resolve(frontendRoot, '..')
const generatedDir = path.join(previewRoot, 'generated')
const catalog = JSON.parse(await readFile(path.join(previewRoot, 'catalog.json'), 'utf8'))
const args = process.argv.slice(2)
const jsonOutput = args.includes('--json')

function valueAfter(flag) {
  const index = args.indexOf(flag)
  return index >= 0 ? args[index + 1] : undefined
}

function resolveEntry(value) {
  const query = String(value || '').trim().toLocaleLowerCase()
  return catalog.find(entry => entry.id.toLocaleLowerCase() === query
    || entry.name.toLocaleLowerCase() === query
    || entry.aliases.some(alias => alias.toLocaleLowerCase() === query))
}

let selected = []
if (args.includes('--all')) selected = catalog
else {
  const names = [valueAfter('--component'), ...(valueAfter('--components') || '').split(',')].filter(Boolean)
  const unknown = names.filter(name => !resolveEntry(name))
  if (unknown.length) {
    process.stderr.write(`未知组件：${unknown.join('、')}\n`)
    process.exit(2)
  }
  selected = names.map(resolveEntry)
}

if (!selected.length) {
  process.stderr.write('请使用 --component <名称>、--components <名称,名称> 或 --all。\n')
  process.exit(2)
}

await mkdir(generatedDir, { recursive: true })
const server = await createServer({
  root: previewRoot,
  cacheDir: path.join(frontendRoot, '.vite', 'component-previews'),
  logLevel: 'silent',
  plugins: [vue()],
  resolve: {
    alias: {
      '@lostsky/ui': path.join(frontendRoot, 'packages', 'ui', 'src'),
      '@lostsky/api': path.join(frontendRoot, 'packages', 'api', 'src'),
      '@lostsky/shared': path.join(frontendRoot, 'packages', 'shared', 'src'),
    },
    dedupe: ['vue'],
  },
  css: { postcss: path.join(frontendRoot, 'postcss.config.cjs') },
  server: { host: '127.0.0.1', port: 5191, strictPort: true, fs: { allow: [repository] } },
})

const apiData = (pathname) => {
  if (pathname.endsWith('/access')) return {
    permissions: ['file.read', 'file.upload', 'team.entity.field.manage', 'team.role.read', 'team.join_field.read', 'team.join_review.read', 'team.notice.read', 'team.notice.send', 'team.setting.read', 'team.entity.virtual.*.manage'],
    abilities: { doc: { enabled: true, level: 1, expire_time: 0, reason: null, label: '文档' } },
  }
  if (pathname.endsWith('/session')) return { id: 1, user_id: 1, name: '预览管理员', is_super_admin: true, permissions: ['*'] }
  if (pathname.endsWith('/search')) return { users: [], teams: [] }
  if (pathname.endsWith('/verification/sms')) return { retry_after: 60, debug_bypass: true }
  return []
}

await server.listen()
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await page.addInitScript(() => {
  localStorage.setItem('lostsky_token', 'component-preview-token')
})
await page.route('http://127.0.0.1:5191/api/**', async route => {
  const data = apiData(new URL(route.request().url()).pathname)
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) })
})
await page.route('**/assets.lostsky.work/**', route => route.fulfill({
  status: 200,
  contentType: 'image/svg+xml',
  body: '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="#07151b"/></svg>',
}))

const generated = []
const failed = []

async function prepareInteraction(state) {
  const iframe = page.locator(`[data-state="${state}"] iframe`)
  if (!await iframe.count()) return null
  const frame = page.frameLocator(`[data-state="${state}"] iframe`)
  const root = frame.locator('.preview-sheet--single')
  await root.waitFor({ state: 'visible', timeout: 15_000 })
  const preferredTarget = frame.locator('[data-preview-target]:visible').first()
  const target = await preferredTarget.count()
    ? preferredTarget
    : frame.locator('button:not([disabled]):visible, input:not([disabled]):visible, textarea:not([disabled]):visible, a[href]:not(.skip):visible, [tabindex="0"]:visible, .n-base-selection:visible').first()
  if (!await target.count()) return null
  if (state === 'hover') await target.hover({ timeout: 5_000 })
  if (state === 'focus') await target.focus()
  if (state === 'active') {
    const box = await target.boundingBox()
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      return 'pressed'
    }
  }
  return null
}

try {
  for (const entry of selected) {
    const errors = []
    const onPageError = error => errors.push(error.message)
    const onConsole = message => {
      if (message.type() !== 'error') return
      if (entry.name === 'LsRouteErrorBoundary' && message.text().startsWith('Route render failed')) return
      errors.push(message.text())
    }
    const onRequestFailed = request => errors.push(`${request.url()}: ${request.failure()?.errorText || '请求失败'}`)
    page.on('pageerror', onPageError)
    page.on('console', onConsole)
    page.on('requestfailed', onRequestFailed)
    try {
      await page.goto(`http://127.0.0.1:5191/?id=${encodeURIComponent(entry.id)}`, { waitUntil: 'domcontentloaded', timeout: 30_000 })
      await page.locator(`[data-preview-id="${entry.id}"]`).waitFor({ state: 'visible', timeout: 15_000 })
      const frames = page.locator('.preview-cell iframe')
      for (let index = 0; index < await frames.count(); index++) {
        const frame = frames.nth(index).contentFrame()
        await frame.locator('.preview-sheet--single').waitFor({ state: 'visible', timeout: 15_000 })
        await frame.locator('body').evaluate(() => document.fonts.ready)
      }
      await page.locator('body').evaluate(() => document.fonts.ready)
      await prepareInteraction('hover')
      await prepareInteraction('focus')
      const pressed = await prepareInteraction('active')
      await page.waitForTimeout(350)
      if (errors.length) throw new Error([...new Set(errors)].join(' | '))
      const size = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }))
      const outputPath = path.join(generatedDir, `${entry.name}.png`)
      await page.screenshot({ path: outputPath, fullPage: true, animations: 'disabled' })
      if (pressed) {
        await page.mouse.move(0, 0)
        await page.mouse.up()
      }
      generated.push({ component: entry.name, id: entry.id, path: outputPath, ...size })
      if (!jsonOutput) process.stdout.write(`已生成 ${entry.name}: ${outputPath}\n`)
    } catch (error) {
      try { await page.mouse.up() } catch {}
      const message = error instanceof Error ? error.message : String(error)
      failed.push({ component: entry.name, id: entry.id, error: [...new Set([message, ...errors])].join(' | ') })
      if (!jsonOutput) process.stderr.write(`生成失败 ${entry.name}: ${failed.at(-1).error}\n`)
    } finally {
      page.off('pageerror', onPageError)
      page.off('console', onConsole)
      page.off('requestfailed', onRequestFailed)
      await page.goto('about:blank')
    }
  }
} finally {
  await browser.close()
  await server.close()
}

const report = { generated, failed }
await writeFile(path.join(generatedDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
if (jsonOutput) process.stdout.write(`${JSON.stringify(report)}\n`)
if (failed.length) process.exitCode = 1
