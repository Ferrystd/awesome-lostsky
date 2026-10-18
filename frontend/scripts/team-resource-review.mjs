import { chromium } from '@playwright/test'
import { strict as assert } from 'node:assert'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

// Real local static Team application; only business responses are synthetic.
const base = process.env.TEAM_REVIEW_URL || 'http://demo.team.lostsky.work'
const out = 'test-results/team-resource-redesign'
mkdirSync(out, { recursive: true })
const person = { entity_id: 1, id: 1, name: '青空运营（模拟数据）', slug: 'operator', entityable_type: 'teamMember', type: 'teamMember', belongs_to_team: true }
const files = [
  { id: 1, name: '团队服务手册.pdf', mime_type: 'application/pdf', size: 1835008, url: 'https://example.invalid/manual.pdf', source: 'manual', subject: person, create_time: 1792195200 },
  { id: 2, name: '活动排期与新成员协作指南（模拟数据长文件名称）.xlsx', mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 38400, subject: null, entity_id: 99, create_time: null },
  { id: 3, name: '历史记录.txt', mime_type: 'text/plain', size: 1024, subject: null },
]
const groups = [
  { uuid: 'service', title: '日常接待与团队协作', is_closed: false, participants: [person, person, person] },
  { uuid: 'project', title: '十月活动筹备与跨部门协作群（模拟长名称）', is_closed: false, participants: [person, person] },
  { uuid: 'archive', title: '九月活动归档', is_closed: true, participants: [person] },
]
const browser = await chromium.launch({ headless: true })
const detailsOnly = process.env.TEAM_REVIEW_DETAILS_ONLY === '1'
const results = detailsOnly ? JSON.parse(readFileSync(`${out}/review.json`, 'utf8')) : []
try {
  for (const width of detailsOnly ? [] : [1440, 375]) {
    for (const variant of ['single', 'multiple', 'empty']) {
      for (const path of ['/files', '/chat-groups']) {
        const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce', serviceWorkers: 'block' })
        const token = `x.${Buffer.from(JSON.stringify({ sub: 1, act: { type: 'teamMember', id: 1, entity_id: 1 } })).toString('base64url')}.x`
        await context.addCookies([{ name: 'lostsky_token', value: token, domain: '.lostsky.work', path: '/' }])
        const count = variant === 'empty' ? 0 : variant === 'single' ? 1 : 3
        const missing = [], errors = []
        await context.route(url => url.hostname === 'api.lostsky.work' || url.pathname.startsWith('/api/'), async route => {
          const url = new URL(route.request().url())
          const endpoint = url.pathname.replace(/^\/api/, '').replace(/^\/team(?=\/)/, '')
          let data
          if (endpoint === '/access') data = { team: { id: 1, slug: 'demo', name: '青空团队（模拟数据）' }, identity: person, permissions: ['file.read', 'file.upload', 'file.delete', 'chat.group.manage'], abilities: { file: { enabled: true } } }
          else if (endpoint === '/file/usage') data = { count, total_size: count ? 1874432 : 0, size_limit: 134217728, remaining_size: 132343296, available: true, reason: null }
          else if (endpoint === '/file/index') { const list = files.slice(0, count).filter(file => file.name.includes(url.searchParams.get('keyword') || '')); data = { list, total: list.length } }
          else if (endpoint === '/chatGroup/index') data = groups.slice(0, count)
          else { missing.push(endpoint); return route.abort('blockedbyclient') }
          await route.fulfill({ json: { code: 0, message: 'synthetic fixture', data } })
        })
        const page = await context.newPage()
        page.on('pageerror', error => errors.push(error.message))
        await page.goto(base + path)
        await page.waitForLoadState('networkidle')
        assert.equal(await page.locator('.team-resource-entry').count(), count)
        const geometry = await page.evaluate(() => {
          const box = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height } }
          return { main: box('.team-resource-workspace__main'), aside: box('.team-resource-workspace__context, .team-resource-workspace__filters'), width: box('.team-resource-workspace').width, overflow: document.documentElement.scrollWidth > innerWidth, oldRow: document.querySelectorAll('.ls-resource-row').length, community: document.body.innerText.includes('团队社区') }
        })
        assert.equal(geometry.overflow, false)
        assert.equal(geometry.oldRow, 0)
        assert.equal(geometry.community, false)
        if (width === 1440) { assert.equal(geometry.width, 1024); assert.ok(geometry.aside.x > geometry.main.x + geometry.main.width) }
        else if (path === '/chat-groups') assert.ok(geometry.aside.y < geometry.main.y)
        else assert.ok(geometry.aside.y >= geometry.main.y + geometry.main.height)
        if (variant === 'single') await page.screenshot({ path: `${out}/${path.slice(1)}-${width}.png`, fullPage: true })
        if (variant === 'multiple' && path === '/files') {
          await page.getByRole('link', { name: files[1].name, exact: true }).click()
          assert.match(await page.locator('#file-details').innerText(), /人员 #99（资料不可用）/)
          assert.match(await page.locator('#file-details').innerText(), /未记录/)
          await page.getByRole('searchbox', { name: '搜索文件' }).fill('团队服务')
          await page.waitForResponse(response => response.url().includes('/file/index'))
          await page.waitForFunction(() => document.querySelectorAll('.team-resource-entry').length === 1)
          assert.match(await page.locator('#file-details').innerText(), /团队服务手册/)
          assert.match(await page.locator('#file-details').innerText(), /青空运营/)
        }
        if (variant === 'multiple' && path === '/chat-groups') {
          await page.locator('.chat-scope').getByText('已关闭', { exact: true }).click()
          await page.waitForFunction(() => document.querySelectorAll('.team-resource-entry').length === 1)
          assert.equal(await page.locator('.team-resource-entry').count(), 1)
          assert.match(await page.locator('.team-resource-entry').innerText(), /九月活动归档/)
          await page.getByRole('searchbox', { name: '搜索群聊' }).fill('不匹配')
          assert.equal(await page.locator('.team-resource-entry').count(), 0)
        }
        assert.deepEqual(missing, [])
        assert.deepEqual(errors, [])
        results.push({ path, width, variant, geometry, passed: true })
        writeFileSync(`${out}/review.json`, JSON.stringify(results, null, 2))
        await context.close()
      }
    }
  }
  // The existing dangerous command must stay confirmable and explainably disabled.
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', serviceWorkers: 'block' })
  const token = `x.${Buffer.from(JSON.stringify({ sub: 1, act: { type: 'teamMember', id: 1, entity_id: 1 } })).toString('base64url')}.x`
  await context.addCookies([{ name: 'lostsky_token', value: token, domain: '.lostsky.work', path: '/' }])
  const group = { ...groups[0], participants: [] }, writes = [], missing = []
  await context.route(url => url.hostname === 'api.lostsky.work' || url.pathname.startsWith('/api/'), async route => {
    const endpoint = new URL(route.request().url()).pathname.replace(/^\/api/, '').replace(/^\/team(?=\/)/, '')
    let data
    if (endpoint === '/access') data = { identity: person, team: { id: 1, slug: 'demo', name: '青空团队（模拟数据）' }, permissions: ['chat.group.manage'], abilities: {} }
    else if (endpoint === '/chatGroup/get') data = group
    else if (endpoint === '/chatGroup/messages') data = []
    else if (endpoint === '/chatGroup/close') { writes.push(route.request().postDataJSON()); group.is_closed = true; data = {} }
    else { missing.push(endpoint); return route.abort('blockedbyclient') }
    await route.fulfill({ json: { code: 0, data } })
  })
  const page = await context.newPage()
  await page.goto(`${base}/chat-groups/service`)
  await page.waitForLoadState('networkidle')
  const button = page.getByRole('button', { name: '关闭群聊', exact: true })
  const stroke = await button.evaluate(el => ({ border: getComputedStyle(el, '::after').borderStyle, background: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color }))
  assert.equal(stroke.border, 'dashed')
  await page.screenshot({ path: `${out}/close-group-1440.png`, fullPage: true })
  assert.notEqual(await button.getAttribute('aria-disabled'), 'true')
  page.once('dialog', dialog => dialog.dismiss())
  await button.click()
  assert.equal(writes.length, 0)
  page.once('dialog', dialog => dialog.accept())
  await button.click()
  await page.waitForFunction(() => document.querySelector('.ls-button--danger')?.getAttribute('aria-disabled') === 'true')
  assert.deepEqual(writes, [{ expected_entity_id: 1, uuid: 'service' }])
  await button.click({ force: true })
  assert.equal(writes.length, 1)
  assert.deepEqual(missing, [])
  results.push({ path: '/chat-groups/service', enabledDisabled: true, confirmation: true, stroke, passed: true })
  await context.close()
  writeFileSync(`${out}/review.json`, JSON.stringify(results, null, 2))
  console.log(JSON.stringify({ passed: results.length, screenshots: ['files-1440.png', 'chat-groups-1440.png', 'files-375.png', 'chat-groups-375.png'], stroke }))
} finally { await browser.close() }
