import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { compileScript, parse } from '@vue/compiler-sfc'
import { transformSync } from 'esbuild'
import * as Vue from 'vue'
import { describe, expect, it } from 'vitest'
import { useQueryDraft } from '../../../packages/shared/src/useQueryDraft'

import * as serviceDistribution from './service-distribution'
import * as purchaseFields from './purchase-fields'
import * as compositionPricing from './composition-pricing'
import * as personalPricing from './personal-pricing'
import * as productVariants from './product-variants'
import * as serviceRedemptionFields from './service-redemption-fields'
// Execute the actual setup; mock only queries, transport, navigation and visual dependencies.
function setup(kind: 2 | 3) {
  const route = Vue.reactive({ params: { id: '1' }, query: {}, meta: { workspace: 'team' } })
  const access = Vue.ref<any>(undefined)
  const records = Vue.reactive<Record<number, any>>({})
  const pushed: string[] = []
  const sent: any[] = []
  let finishSave: ((value: any) => void) | undefined
  const management = {
    personal: false, routeBase: '/manage/products', permission: 'shop.product.manage',
    saveProduct: (_id: number, body: unknown) => { sent.push(body); return new Promise(resolve => { finishSave = resolve }) },
  }
  const source = readFileSync(resolve('frontend/apps/shop/src/views/manage/ProductFormView.vue'), 'utf8')
  const code = transformSync(compileScript(parse(source).descriptor, { id: 'Product' }).content, { loader: 'ts', format: 'cjs' }).code
  const module = { exports: {} as any }
  const require = (id: string): any => {
    if (id === 'vue') return Vue
    if (id === 'vue-router') return { useRoute: () => route, useRouter: () => ({ push: (path: string) => pushed.push(path) }) }
    if (id.endsWith('/useQueryDraft')) return { useQueryDraft }
    if (id.endsWith('/useUnsavedChangesGuard')) return { useUnsavedChangesGuard: () => {} }
    if (id.endsWith('/useRouteAccess')) return { useRouteAccess: () => ({ restricted: Vue.ref(false), reason: Vue.ref(''), read: (fn: () => unknown) => fn() }) }
    if (id.endsWith('/feedback')) return { feedback: { success: () => {}, info: () => {} } }
    if (id === 'naive-ui') return { useDialog: () => ({ warning: () => {} }) }
    if (id === '../../service-distribution') return serviceDistribution
    if (id === '../../purchase-fields') return purchaseFields
    if (id === '../../composition-pricing') return compositionPricing
    if (id === '../../personal-pricing') return personalPricing
    if (id === '../../product-variants') return productVariants
    if (id === '../../service-redemption-fields') return serviceRedemptionFields
    if (id === '../../lib') return { productManagement: () => management, canManage: () => true }
    if (id === '@tanstack/vue-query') return {
      useQueryClient: () => ({ invalidateQueries: async () => {} }),
      useQuery: (options: any) => ({ data: Vue.computed(() => {
        const key = Vue.unref(options.queryKey) as any[]
        if (key.includes('shop-manage-access')) return access.value
        if (key.includes('manage-product-options')) return { products: [{ id: 9, name: '子商品', entity_id: null, kind: 1, price: '10.00', cost: '1.00', handler_cut: '2.00', sender_cut: '1.00', cs_cut: '0.00' }] }
        return records[Number(key.at(-1))]
      }), isPending: Vue.ref(false), isError: Vue.ref(false) }),
      useMutation: (options: any) => ({ isPending: Vue.ref(false), mutateAsync: async () => {
        const data = await options.mutationFn()
        await options.onSuccess?.(data)
        return data
      } }),
    }
    return {}
  }
  new Function('require', 'module', 'exports', code)(require, module, module.exports)
  const scope = Vue.effectScope()
  const state = scope.run(() => module.exports.default.setup({}, { expose: () => {} }))
  const row = (id: number, name: string) => ({ id, name, kind, cover_image: '/cover.webp', price: '10.00', cost: '1.00', handler_cut: '2.00', sender_cut: '1.00', cs_cut: '0.00', is_active: 1, items: [{ product_id: 9, quantity: 1 }] })
  return { state, route, records, access, row, pushed, sent, finish: (id = 1) => finishSave?.({ id }), stop: () => scope.stop() }
}

describe.each([2, 3] as const)('Product kind %s real setup query draft', kind => {
  it('hydrates clean refreshes, protects dirty input and rehydrates after a late access identity', async () => {
    const page = setup(kind)
    page.records[1] = page.row(1, '初始')
    await Vue.nextTick()
    expect(page.state.form.name).toBe('初始')
    page.access.value = { team: { id: 2 }, identity: { entity_id: 4 } }
    await Vue.nextTick()
    expect(page.state.form.name).toBe('初始')
    page.records[1] = page.row(1, '远端更新')
    await Vue.nextTick()
    expect(page.state.form.name).toBe('远端更新')
    page.state.form.name = '本地草稿'
    page.records[1] = page.row(1, '后台刷新')
    await Vue.nextTick()
    expect(page.state.form.name).toBe('本地草稿')
    expect(page.state.draft.dirty.value).toBe(true)
    page.stop()
  })

  it('rejects an empty composition amount and preserves exact cents after recovery', async () => {
    const page = setup(kind)
    page.records[1] = page.row(1, '初始')
    await Vue.nextTick()
    page.state.compositionItems.value[0].unit_price = null
    expect(page.state.valid.value).toBe(false)
    await expect(page.state.save.mutateAsync()).rejects.toThrow('请检查商品必填项、金额和核销额度')
    expect(page.sent).toEqual([])
    page.state.compositionItems.value[0].unit_price = 12.34
    await Vue.nextTick()
    expect(page.state.valid.value).toBe(true)
    const save = page.state.save.mutateAsync()
    expect(page.sent[0].items).toEqual([{ product_id: 9, quantity: 1, unit_price: '12.34' }])
    page.finish()
    await save
    expect(page.state.draft.dirty.value).toBe(false)
    expect(page.pushed).toEqual(['/manage/products/1'])
    page.stop()
  })

  it('confirms only the submitted snapshot and ignores a save response after switching objects', async () => {
    const page = setup(kind)
    page.records[1] = page.row(1, '初始')
    await Vue.nextTick()
    page.state.form.name = '提交值'
    const save = page.state.save.mutateAsync()
    page.state.form.name = '请求期间输入'
    page.finish()
    await save
    expect(page.sent[0].name).toBe('提交值')
    expect(page.sent[0].kind).toBe(kind)
    expect(page.sent[0].items).toEqual([{ product_id: 9, quantity: 1 }])
    expect(page.sent[0]).not.toHaveProperty('price')
    expect(page.state.form.name).toBe('请求期间输入')
    expect(page.state.draft.dirty.value).toBe(true)
    expect(page.pushed).toEqual([])
    const lateSave = page.state.save.mutateAsync()
    page.records[2] = page.row(2, '第二对象')
    page.route.params.id = '2'
    await Vue.nextTick()
    expect(page.state.form.name).toBe('第二对象')
    page.finish()
    await lateSave
    expect(page.state.form.name).toBe('第二对象')
    expect(page.state.draft.dirty.value).toBe(false)
    expect(page.pushed).toEqual([])
    page.stop()
  })
})

it('isolates product drafts when the acting identity changes', async () => {
  const page = setup(2)
  page.access.value = { team: { id: 2 }, identity: { entity_id: 4 } }
  page.records[1] = page.row(1, '已保存')
  await Vue.nextTick()
  page.state.form.name = '身份四草稿'
  page.access.value = { team: { id: 2 }, identity: { entity_id: 5 } }
  await Vue.nextTick()
  expect(page.state.form.name).toBe('已保存')
  expect(page.state.draft.dirty.value).toBe(false)
  page.stop()
})
