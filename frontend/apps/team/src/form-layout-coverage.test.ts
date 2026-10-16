import { readFileSync } from 'node:fs'
import { parse as parseTemplate, type ElementNode, type RootNode, type TemplateChildNode } from '@vue/compiler-dom'
import { parse } from '@vue/compiler-sfc'
import { describe, expect, it } from 'vitest'
import ts from 'typescript'

const ordinaryFields: Record<string, string[]> = {
  ChatVirtualFormView: ['virtual-slug', 'virtual-name', 'virtual-avatar', 'virtual-description'],
  RoleFormView: ['role-key', 'role-name', 'role-description', 'role-sort'],
  RoleDetailView: ['role-detail-name', 'role-detail-description', 'role-detail-sort'],
  CustomerDetailView: ['customer-name', 'customer-avatar', 'customer-description', 'customer-assignee', 'customer-senders'],
  EntityFieldFormView: ['entity-field-type', 'entity-field-key', 'entity-field-name', 'entity-field-value-type', 'entity-field-input-type', 'entity-field-options', 'entity-field-manager', 'entity-field-visibility', 'entity-field-targets', 'entity-field-sort'],
  JoinFieldFormView: ['join-field-key', 'join-field-name', 'join-field-value-type', 'join-field-input-type', 'join-field-default', 'join-field-transfer', 'join-field-sort'],
  DocumentFormView: ['document-title', 'document-entity', 'document-manager-scope', 'document-visibility', 'document-sort'],
  NoticeSendView: ['notice-recipient', 'notice-title', 'notice-pinned'],
  ChatIntegrationFormView: ['integration-name', 'integration-endpoint'],
  ChatGroupView: ['group-title'],
  MemberFormView: ['member-join-code', 'member-slug', 'member-search'],
  PersonalView: ['personal-slug'],
  AbilitiesView: ['ability-code'],
  EntityDetailView: [],
}

function source(name: string) {
  return readFileSync(new URL(`./views/${name}.vue`, import.meta.url), 'utf8')
}
function elements(name: string) {
  const { descriptor, errors } = parse(source(name))
  expect(errors, name).toEqual([])
  const tree = parseTemplate(descriptor.template!.content)
  const entries: { node: ElementNode; ancestors: ElementNode[] }[] = []
  function visit(node: RootNode | TemplateChildNode, ancestors: ElementNode[]) {
    if (node.type === 1) entries.push({ node, ancestors })
    if (node.type === 0 || node.type === 1) {
      for (const child of node.children) visit(child, node.type === 1 ? [...ancestors, node] : ancestors)
    }
  }
  visit(tree, [])
  return entries
}
function attribute(node: ElementNode, name: string) {
  const value = node.props.find(prop => prop.type === 6 && prop.name === name)
  return value?.type === 6 ? value.value?.content : undefined
}
function inFieldGroup(ancestors: ElementNode[]) {
  return [...ancestors].reverse().find(node => node.tag === 'LsFormFields' || node.tag === 'LsFormContent')?.tag === 'LsFormFields'
}

const submissions: Record<string, string[]> = {
  ChatVirtualFormView: ['submit'], RoleFormView: ['submit'],
  RoleDetailView: ['routeAccess.restricted.value || saveInfo.mutate()'],
  CustomerDetailView: ['save.mutate()'], EntityFieldFormView: ['submit'], JoinFieldFormView: ['submit'],
  DocumentFormView: ['submit'], NoticeSendView: ['submit'], ChatIntegrationFormView: ['submit'], ChatGroupView: ['submit'],
  MemberFormView: ['submit', 'capabilities.member_slug && claim.mutate()', 'capabilities.member_search && saveSearch.mutate()'],
  PersonalView: ['saveProfile.mutate()'], AbilitiesView: ['inspectCode'], EntityDetailView: ['submitProfile'],
}

describe('Team 现役表单共享字段布局覆盖', () => {
  it('覆盖的是已挂路由的页面，保留原来的表单提交边界', () => {
    const router = readFileSync(new URL('./router.ts', import.meta.url), 'utf8')
    const tree = ts.createSourceFile('router.ts', router, ts.ScriptTarget.Latest, true)
    const routeComponents = new Set<string>()
    function visit(node: ts.Node) {
      if (ts.isPropertyAssignment(node) && node.name.getText(tree) === 'component') {
        routeComponents.add(node.initializer.getText(tree))
      }
      ts.forEachChild(node, visit)
    }
    visit(tree)
    for (const name of Object.keys(ordinaryFields)) {
      // ChatGroupView is loaded inline; other current pages are lazy constants.
      expect(routeComponents.has(name) || [...routeComponents].some(component => component.includes(`/views/${name}.vue`)), name).toBe(true)
      const actual = elements(name).flatMap(({ node }) => node.props.flatMap(prop =>
        prop.type === 7 && prop.name === 'on' && prop.arg?.loc.source === 'submit' ? [prop.exp?.loc.source] : [],
      ))
      for (const submit of submissions[name]) expect(actual, `${name}: ${submit}`).toContain(submit)
    }
  })

  it('普通输入和布尔设置都属于公共字段组，页面不传视觉配置', () => {
    for (const [name, ids] of Object.entries(ordinaryFields)) {
      const entries = elements(name)
      for (const id of ids) {
        const field = entries.find(({ node }) => node.tag === 'LsField' && attribute(node, 'for-id') === id)
        expect(field, `${name}: ${id}`).toBeDefined()
        expect(inFieldGroup(field!.ancestors), `${name}: ${id}`).toBe(true)
      }
      for (const { node, ancestors } of entries) {
        if (node.tag === 'LsSwitchField') expect(inFieldGroup(ancestors), `${name}: ${attribute(node, 'label')}`).toBe(true)
        if (node.tag === 'LsFormFields') expect(node.props, `${name}: 字段组只提供语义上下文`).toEqual([])
        if (node.tag === 'LsFormFields' || node.tag === 'LsFormContent') {
          expect(node.props.some(prop => /^(?:class|style|layout|columns|label-width|breakpoint)$/.test(prop.type === 6 ? prop.name : prop.arg?.loc.source || '')), name).toBe(false)
        }
      }
    }
    expect(source('DocumentFormView')).not.toContain('field-row')
    expect(source('EntityDetailView')).not.toContain('visibility-list')
    const pinned = elements('NoticeSendView').find(({ node }) => node.tag === 'LsField' && attribute(node, 'label') === '列表位置')
    expect(pinned && inFieldGroup(pinned.ancestors)).toBe(true)
    expect(elements('NoticeSendView').some(({ node }) => node.tag === 'NCheckbox' && attribute(node, 'id') === 'notice-pinned')).toBe(true)
  })

  it('普通输入、数字和可搜索选择器的标签指向实际input而非组件外壳', () => {
    for (const [name, ids] of Object.entries(ordinaryFields)) {
      const entries = elements(name)
      for (const { node, ancestors } of entries) {
        const supportsNativeInput = ['NInput', 'NInputNumber', 'LsEntitySelect'].includes(node.tag)
          || (node.tag === 'NSelect' && node.props.some(prop => prop.type === 6 && prop.name === 'filterable'))
        if (!supportsNativeInput) continue
        const field = [...ancestors].reverse().find(parent => parent.tag === 'LsField')
        const id = field && attribute(field, 'for-id')
        if (!id || !ids.includes(id)) continue
        expect(attribute(node, 'id'), `${name}: ${id} 不重复标记组件外壳`).toBeUndefined()
        const binding = node.props.find(prop => prop.type === 7 && prop.name === 'bind' && prop.arg?.loc.source === 'input-props')
        expect(binding?.type === 7 && binding.exp, `${name}: ${id} input-props`).toBeTruthy()
        if (binding?.type !== 7 || !binding.exp) continue
        const tree = ts.createSourceFile('input-props.ts', `const props = ${binding.exp.loc.source}`, ts.ScriptTarget.Latest, true)
        const declaration = tree.statements[0]
        expect(ts.isVariableStatement(declaration), `${name}: ${id} 属性对象`).toBe(true)
        if (!ts.isVariableStatement(declaration)) continue
        const object = declaration.declarationList.declarations[0].initializer
        expect(object && ts.isObjectLiteralExpression(object), `${name}: ${id} 属性对象`).toBe(true)
        if (!object || !ts.isObjectLiteralExpression(object)) continue
        const idProp = object.properties.find(prop => ts.isPropertyAssignment(prop) && prop.name.getText(tree) === 'id')
        expect(idProp && ts.isPropertyAssignment(idProp) && ts.isStringLiteral(idProp.initializer) && idProp.initializer.text, `${name}: ${id} 原生input标识`).toBe(id)
      }
    }
    // Naive 非 filterable NSelect 不渲染原生 input，公开 API 不透传焦点 div 属性；保持既有交互。
  })

  it('迁移字段通过slot将提示和错误描述关联到实际输入控件', () => {
    const covered: string[] = []
    for (const [name, ids] of Object.entries(ordinaryFields)) {
      const entries = elements(name)
      for (const { node: field } of entries) {
        if (field.tag !== 'LsField' || !ids.includes(attribute(field, 'for-id') || '')) continue
        const hasFeedback = field.props.some(prop => prop.type === 6 ? prop.name === 'hint' : prop.name === 'bind' && ['hint', 'error'].includes(prop.arg?.loc.source || ''))
        if (!hasFeedback) continue
        const descendants = entries.filter(({ ancestors }) => ancestors.includes(field))
        const slots = [field, ...descendants.map(({ node }) => node)].flatMap(node => node.props.filter(prop => prop.type === 7 && prop.name === 'slot'))
        expect(slots.some(prop => prop.type === 7 && prop.exp?.loc.source.includes('describedBy')), `${name}: feedback slot`).toBe(true)
        const input = descendants.find(({ node }) => ['NInput', 'NInputNumber', 'NSelect', 'LsEntitySelect', 'LsInput'].includes(node.tag))?.node
        expect(input, `${name}: feedback control`).toBeDefined()
        const binding = input!.props.find(prop => prop.type === 7 && prop.name === 'bind' && prop.arg?.loc.source === (input!.tag === 'LsInput' ? 'aria-describedby' : 'input-props'))
        expect(binding?.type === 7 && binding.exp?.loc.source.includes('describedBy'), `${name}: ${attribute(field, 'for-id')}`).toBe(true)
        covered.push(`${name}:${attribute(field, 'for-id')}`)
      }
    }
    expect(covered).toContain('MemberFormView:member-join-code')
    expect(covered).toContain('JoinFieldFormView:join-field-name')
    expect(covered).toContain('CustomerDetailView:customer-senders')
  })

  it('正文、权限、动态列表和命令区保留完整宽度，不进入普通字段上下文', () => {
    for (const name of Object.keys(ordinaryFields)) {
      for (const { node, ancestors } of elements(name)) {
        if (['LsMarkdownEditor', 'LsCheckboxGroupField', 'LsFormList', 'LsFormActions'].includes(node.tag)) {
          expect(inFieldGroup(ancestors), `${name}: ${node.tag}`).toBe(false)
        }
        if (node.tag === 'LsMarkdownEditor') expect(ancestors.some(parent => parent.tag === 'LsFormContent'), name).toBe(true)
      }
    }
    const options = elements('JoinFieldFormView').find(({ node }) => node.tag === 'LsField' && attribute(node, 'for-id') === 'join-field-options')
    expect(options?.ancestors.some(node => node.tag === 'LsFormContent')).toBe(true)
    const lookup = elements('ChatGroupView').find(({ node }) => node.tag === 'LsField' && attribute(node, 'for-id') === 'invite-search')
    expect(lookup && inFieldGroup(lookup.ancestors)).toBe(false)
  })

  it('入队、复职、代填、资料、动态字段与设置继续委托给唯一业务组件', () => {
    const delegation: Record<string, string[]> = {
      JoinView: ['JoinApplicationFields'], MemberFormView: ['JoinApplicationFields', 'EntityFieldsCard'],
      PersonalView: ['EntityProfileFields', 'EntityFieldsCard'], EntityDetailView: ['EntityProfileFields'],
      SettingsView: ['TeamSettingsGroup'],
    }
    for (const [name, tags] of Object.entries(delegation)) {
      const entries = elements(name)
      for (const tag of tags) {
        const delegated = entries.filter(({ node }) => node.tag === tag)
        expect(delegated.length, `${name}: ${tag}`).toBeGreaterThan(0)
        for (const { ancestors } of delegated) expect(inFieldGroup(ancestors), `${name}: 不重复持有组件内部布局`).toBe(false)
      }
    }
    for (const name of ['AuditView', 'JoinReviewDetailView']) {
      expect(elements(name).some(({ node }) => node.tag === 'LsFormFields'), `${name}: 筛选或窄确认流程不扩散`).toBe(false)
    }
  })
})
