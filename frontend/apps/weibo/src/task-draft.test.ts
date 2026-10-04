import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { compileScript, parse } from '@vue/compiler-sfc'
import { transformSync } from 'esbuild'
import * as Vue from 'vue'
import { afterEach, expect, it, vi } from 'vitest'
import { useQueryDraft } from '../../../packages/shared/src/useQueryDraft'

afterEach(() => vi.unstubAllGlobals())
it('an old task save cannot clear a new task request or navigate its form', async () => {
  vi.stubGlobal('location', { host: 'demo.weibo.lostsky.work' })
  const route = Vue.reactive({ params: { id: '1' }, meta: { workspace: 'team' } })
  const router = { push: vi.fn() }
  const requests: Array<{ finish: (data: unknown) => void; body: Record<string, unknown> }> = []
  const mocks: Record<string, unknown> = {
    vue: Vue,
    'vue-router': { useRoute: () => route, useRouter: () => router },
    '@lostsky/shared/useQueryDraft': { useQueryDraft },
    '@lostsky/shared/useUnsavedChangesGuard': { useUnsavedChangesGuard: () => {} },
    '@lostsky/api/client': { auth: { entity: () => ({ type: 'teamMember', id: 1 }) }, api: { post: (_path: string, body: Record<string, unknown>) => new Promise(resolve => requests.push({ finish: resolve, body })) } },
    '@lostsky/ui/useRouteAccess': { useRouteAccess: () => ({ reason: Vue.ref(''), restricted: Vue.ref(false) }) },
    '@lostsky/ui/feedback': { feedback: { success: vi.fn(), warning: vi.fn() } },
    '@tanstack/vue-query': { useQuery: () => ({ data: Vue.ref(undefined) }) },
    '../lib/workspace': { apiPrefix: () => '', expectedEntity: () => ({}) },
  }
  const source = readFileSync(resolve('frontend/apps/weibo/src/views/TaskFormView.vue'), 'utf8')
  const code = transformSync(compileScript(parse(source).descriptor, { id: 'task' }).content, { loader: 'ts', format: 'cjs' }).code
  const module = { exports: {} as any }
  new Function('require', 'module', 'exports', code)((id: string) => mocks[id] ?? {}, module, module.exports)
  const scope = Vue.effectScope()
  const state = scope.run(() => module.exports.default.setup({}, { expose: () => {} }))
  const fill = () => { state.topic.value = 'draft'; state.content.value = 'body'; state.accountIds.value = [1] }
  fill()
  const oldSave = state.save()
  expect(state.pending.value).toBe(true)
  route.params.id = '2'
  await Vue.nextTick()
  expect(state.pending.value).toBe(false)
  fill()
  const newSave = state.save()
  requests[0].finish({ version: 2 })
  await oldSave
  expect(state.pending.value).toBe(true)
  expect(router.push).not.toHaveBeenCalled()
  requests[1].finish({ version: 8 })
  await newSave
  expect(state.pending.value).toBe(false)
  expect(state.baselineVersion.value).toBe(8)
  expect(router.push).toHaveBeenCalledOnce()
  scope.stop()
})
