import { createHash } from 'node:crypto'
import { expect, test, type Page } from './fixtures'

const origin = process.env.TEAM_TEST_ORIGIN ?? 'http://demo.team.lostsky.work:5175'
async function fixture(page: Page) {
  await page.context().addCookies([{ name: 'lostsky_token', value: 'e2e-token', domain: '.lostsky.work', path: '/' }])
  await page.addInitScript(() => {
    const stats = { draws: 0, brightest: [0, 0, 0] }
    ;(window as any).auroraStats = stats
    const draw = WebGLRenderingContext.prototype.drawArrays
    WebGLRenderingContext.prototype.drawArrays = function (...args) { stats.draws++; const result = draw.apply(this, args)
      const pixel = new Uint8Array(4)
      for (const x of [.15,.5,.85]) for (const y of [.15,.5,.85]) {
        this.readPixels(Math.floor(this.drawingBufferWidth*x), Math.floor(this.drawingBufferHeight*y), 1, 1, this.RGBA, this.UNSIGNED_BYTE, pixel)
        for (let i=0;i<3;i++) stats.brightest[i] = Math.max(stats.brightest[i],pixel[i])
      }
      return result }
  })
  await page.route(`${origin}/api/**`, route => {
    const path = new URL(route.request().url()).pathname
    const data = path.endsWith('/access') ? { permissions: ['team'], abilities: {}, identity: { type: 'team', entity_id: 1 } }
      : path.endsWith('/setting/schema') ? { apps: [{ app_name: 'entity', label: '人员', settings: [{ key: 'welcome', label: '欢迎语', type: 'string', control: 'input', value: '欢迎加入', default: '' }] }] }
      : { total: 30, list: Array.from({ length: 30 }, (_, id) => ({ id, title: `通知 ${id}`, content: '请确认团队工作安排。', is_read: 0 })) }
    return route.fulfill({ json: { code: 0, data } })
  })
}
const count = (page: Page) => page.evaluate(() => (window as any).auroraStats.draws as number)
async function staysStill(page: Page) {
  await page.waitForTimeout(100)
  const before = await count(page)
  await page.waitForTimeout(300)
  expect(await count(page)).toBe(before)
}

test('aurora flows within a bounded canvas and stops for pause, visibility, reduced motion and unmount', async ({ page }) => {
  test.setTimeout(60_000)
  await fixture(page)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto(`${origin}/notices/team`)
  const canvas = page.locator('.team-aurora-backdrop canvas.ready')
  await expect(canvas).toBeVisible()
  const hash = async () => createHash('sha256').update(await canvas.screenshot()).digest('hex')
  const first = await hash()
  const before = await count(page)
  const started = Date.now()
  await page.waitForTimeout(1100)
  const frames = (await count(page)) - before
  expect(frames).toBeGreaterThan(5)
  expect(frames / ((Date.now() - started) / 1000)).toBeLessThanOrEqual(25)
  expect(await hash()).not.toBe(first)
  const pixels = await canvas.evaluate(element => (element as HTMLCanvasElement).width * (element as HTMLCanvasElement).height)
  expect(pixels).toBeLessThan(262000)
  await page.getByRole('button', { name: '暂停极光' }).click()
  await staysStill(page)
  const paused = await hash()
  await page.waitForTimeout(300)
  expect(await hash()).toBe(paused)
  await page.getByRole('button', { name: '播放极光' }).click()
  await expect.poll(() => count(page)).toBeGreaterThan(await count(page))
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')) })
  await staysStill(page)
  await page.evaluate(() => { delete (document as any).hidden; document.dispatchEvent(new Event('visibilitychange')) })
  await expect.poll(() => count(page)).toBeGreaterThan(await count(page))
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  // The scene remains in the viewport while the content scrolls.
  expect((await canvas.boundingBox())!.y).toBe(0)
  await expect.poll(() => count(page)).toBeGreaterThan(await count(page))
  await canvas.evaluate(element => { (element.parentElement as HTMLElement).style.display = 'none' })
  await staysStill(page)
  await canvas.evaluate(element => { (element.parentElement as HTMLElement).style.display = '' })
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect.poll(() => count(page)).toBeGreaterThan(await count(page))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await staysStill(page)
  await expect(page.getByRole('button', { name: '暂停极光' })).toBeHidden()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  // The app root must restore its ordinary theme on a route without this scene.
  await page.evaluate(async () => { const { router } = await import(/* @vite-ignore */ '/src/router.ts'); await router.push('/personal/notices') })
  await expect(page.locator('.team-aurora-backdrop')).toHaveCount(0)
  await expect(page.locator('.ls-theme-aurora')).toHaveCount(0)
  await staysStill(page)
  await test.info().attach('aurora-runtime.json', { body: JSON.stringify({ frames, pixels }), contentType: 'application/json' })
})

test('aurora unavailable and lost-context fallbacks keep settings usable', async ({ page }) => {
  await fixture(page)
  await page.goto(`${origin}/settings/`)
  await expect(page.locator('.ls-theme-aurora')).toBeVisible()
  await expect(page.locator('.team-aurora-backdrop canvas.ready')).toBeVisible()
  await page.locator('.team-aurora-backdrop canvas').evaluate(element => element.dispatchEvent(new Event('webglcontextlost', { cancelable: true })))
  await expect(page.locator('.team-aurora-backdrop canvas.ready')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '暂停极光' })).toHaveCount(0)
  await staysStill(page)
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (kind: string, ...args: any[]) { return kind === 'webgl' ? null : getContext.call(this, kind as any, ...args) } as typeof getContext
  })
  await page.reload()
  const field = page.getByRole('textbox', { name: '欢迎语' })
  await expect(field).toHaveValue('欢迎加入')
  await field.fill('新的欢迎语')
  await expect(page.locator('.settings-panel button[type=submit]')).toBeEnabled()
  await expect(page.locator('.team-aurora-backdrop canvas.ready')).toHaveCount(0)
  expect(await page.locator('.team-aurora-backdrop').evaluate(element => getComputedStyle(element).backgroundImage)).toContain('gradient')
  const fallbackContrast = await page.locator('.team-aurora-backdrop').evaluate(element => {
    const style=getComputedStyle(element),colors=(style.backgroundImage+' '+style.backgroundColor).match(/rgb\([^)]+\)/g)!
    const lum=(c:number[])=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0)
    const maxima=[0,0,0]
    for(const color of colors){const rgb=color.match(/[\d.]+/g)!.map(Number);rgb.slice(0,3).forEach((v,i)=>maxima[i]=Math.max(maxima[i],v))}
    return (lum([192,205,206])+.05)/(lum(maxima)+.05)
  })
  expect(fallbackContrast).toBeGreaterThanOrEqual(4.5)
})


test('aurora pointer input eases independently, returns on leave and ignores touch', async ({ page }) => {
  await fixture(page)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto(`${origin}/settings`)
  const canvas = page.locator('.team-aurora-backdrop canvas.ready')
  await expect(canvas).toBeVisible()
  const pointer = () => canvas.evaluate(element => {
    const gl = (element as HTMLCanvasElement).getContext('webgl')!
    const program = gl.getParameter(gl.CURRENT_PROGRAM)
    return Array.from(gl.getUniform(program, gl.getUniformLocation(program, 'pointer'))) as number[]
  })
  await page.evaluate(() => document.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: innerWidth*.95, clientY: innerHeight*.1 })))
  await expect.poll(async () => (await pointer())[0]).toBeGreaterThan(.5)
  await page.evaluate(() => document.documentElement.dispatchEvent(new PointerEvent('pointerleave')))
  await expect.poll(async () => Math.abs((await pointer())[0])).toBeLessThan(.1)
  await page.evaluate(() => document.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'touch', clientX: innerWidth, clientY: 0 })))
  await page.waitForTimeout(250)
  expect(Math.abs((await pointer())[0])).toBeLessThan(.1)
  await page.getByRole('button', { name: '暂停极光' }).click()
  const frozen = await pointer()
  await page.evaluate(() => document.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: innerWidth, clientY: 0 })))
  await page.waitForTimeout(200)
  expect(await pointer()).toEqual(frozen)
  const contrast = await page.evaluate(() => {
    const lum = (rgb: number[]) => rgb.map(v => v/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0)
    const bg = (window as any).auroraStats.brightest as number[]
    const color = getComputedStyle(document.querySelector('.team-page-link')!).color.match(/[\d.]+/g)!.slice(0,3).map(Number)
    // Compare foreground against the per-channel maximum actually rendered throughout the pointer sweep.
    const bare = (lum(color)+.05)/(lum(bg)+.05)
    // Conservative surface endpoint: the lightest material color at its lowest opacity over that same field.
    const panel = [25,38,45].map((v,i)=>v*.42+bg[i]*.58)
    return { bare, panel: (lum(color)+.05)/(lum(panel)+.05), bg }
  })
  expect(contrast.bare).toBeGreaterThanOrEqual(4.5)
  expect(contrast.panel).toBeGreaterThanOrEqual(4.5)
  await test.info().attach('scene-composite-contrast.json', { body: JSON.stringify(contrast), contentType: 'application/json' })
  const header = page.locator('.ls-workspace-header--scene')
  expect(await header.evaluate(element => getComputedStyle(element).zIndex)).toBe('1')
})


test('liquid ribbons visibly move through settings and notice surfaces', async ({ page }) => {
  test.setTimeout(60_000)
  await fixture(page)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const results = []
  for (const [route, selector] of [['settings', '.settings-panel'], ['notices/team', '.ls-resource-list']]) {
    await page.goto(`${origin}/${route}`)
    await expect(page.locator('.team-aurora-backdrop canvas.ready')).toBeVisible()
    const panel = page.locator(selector)
    const box = (await panel.boundingBox())!
    const clip = { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 400) }
    const first = (await page.screenshot({ clip })).toString('base64')
    await page.waitForTimeout(1800)
    const second = (await page.screenshot({ clip })).toString('base64')
    const delta = await page.evaluate(async ([a,b]) => {
      const decode = async (value: string) => {
        const image = new Image(); image.src = `data:image/png;base64,${value}`; await image.decode()
        const c = document.createElement('canvas'); c.width=image.width;c.height=image.height
        const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0);return ctx.getImageData(0,0,c.width,c.height).data
      }
      const one=await decode(a),two=await decode(b);let changed=0,max=0
      for(let i=0;i<one.length;i+=4){const d=Math.max(...[0,1,2].map(k=>Math.abs(one[i+k]-two[i+k])));if(d>=6)changed++;max=Math.max(max,d)}
      return { fraction:changed/(one.length/4),max }
    }, [first,second])
    expect(delta.fraction, route).toBeGreaterThan(.05)
    expect(delta.max, route).toBeGreaterThan(12)
    results.push({route,...delta})
  }
  await test.info().attach('liquid-panel-motion.json',{body:JSON.stringify(results),contentType:'application/json'})
})
