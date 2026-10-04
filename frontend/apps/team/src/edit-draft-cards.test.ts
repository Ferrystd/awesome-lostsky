import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { compileScript, parse } from '@vue/compiler-sfc'
import { transformSync } from 'esbuild'
import * as Vue from 'vue'
import { describe, expect, it } from 'vitest'
import { useQueryDraft } from '../../../packages/shared/src/useQueryDraft'

// Execute the real component setup with reactive props; visual children are irrelevant to draft behavior.
function setup(name: string, input: Record<string, unknown>) {
  const source = readFileSync(resolve('frontend/apps/team/src/components', `${name}.vue`), 'utf8')
  const script = compileScript(parse(source).descriptor, { id: name })
  const code = transformSync(script.content, { loader: 'ts', format: 'cjs' }).code
  const module = { exports: {} as any }
  new Function('require', 'module', 'exports', code)((id: string) => id === 'vue' ? Vue : id.endsWith('/useQueryDraft') ? { useQueryDraft } : {}, module, module.exports)
  const props = Vue.reactive({ fields: [], storedValues: [] as Array<Record<string, unknown>>, assignments: [] as Array<Record<string, unknown>>, roles: [], catalog: [], advancedCatalog: [], effectivePermissions: [], success: false, mode: 'manager', ...input })
  const emitted: Array<[string, unknown]> = []
  const scope = Vue.effectScope()
  const state = scope.run(() => module.exports.default.setup(props, { expose: () => {}, emit: (event: string, value: unknown) => emitted.push([event, value]) }))
  return { props, state, emitted, stop: () => scope.stop() }
}

describe('Team entity card drafts', () => {
  it('preserves field input across props refresh and only confirms submitted values', async () => {
    const card = setup('EntityFieldsCard', { fields: [{ id: 1, name: 'Field' }], storedValues: [{ field_id: 1, value_string: 'initial' }] })
    expect(card.state.values[1]).toBe('initial')
    card.state.values[1] = 'submitted'
    card.state.submit()
    card.state.values[1] = 'new input'
    card.props.storedValues = [{ field_id: 1, value_string: 'remote' }]
    await Vue.nextTick()
    expect(card.state.values[1]).toBe('new input')
    card.props.success = true
    await Vue.nextTick()
    expect(card.state.isDirty.value).toBe(true)
    expect(card.emitted.filter(([event]) => event === 'dirty').at(-1)).toEqual(['dirty', true])
    expect(card.emitted.find(([event]) => event === 'save')?.[1]).toEqual({ 1: 'submitted' })
    card.state.values[1] = 'submitted'
    expect(card.state.isDirty.value).toBe(false)
    card.stop()
  })
  it('retains role selections on background refresh and input during save', async () => {
    const card = setup('EntityPermissionsCard', { assignments: [{ role_id: 1 }] })
    card.state.selected.value = [1, 2]
    card.state.submit()
    card.state.selected.value.push(3)
    card.props.assignments = [{ role_id: 4 }]
    await Vue.nextTick()
    expect(card.state.selected.value).toEqual([1, 2, 3])
    card.props.success = true
    await Vue.nextTick()
    expect(card.state.isDirty.value).toBe(true)
    expect(card.emitted.find(([event]) => event === 'save')?.[1]).toEqual([1, 2])
    card.state.selected.value = [2, 1]
    expect(card.state.isDirty.value).toBe(false)
    card.stop()
  })
})
