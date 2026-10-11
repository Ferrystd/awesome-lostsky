import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import ts from 'typescript'

it('declares a standard width for every Team workspace route and documents each concrete page', () => {
  const source = readFileSync(new URL('./router.ts', import.meta.url), 'utf8')
  const audit = readFileSync(new URL('../../../../docs/dev/design/admin/team-page-widths.md', import.meta.url), 'utf8')
  const tree = ts.createSourceFile('router.ts', source, ts.ScriptTarget.Latest, true)
  let count = 0
  const property = (node: ts.ObjectLiteralExpression, name: string) => node.properties.find(item => ts.isPropertyAssignment(item) && item.name.getText(tree) === name) as ts.PropertyAssignment | undefined
  function visit(node: ts.Node) {
    if (ts.isObjectLiteralExpression(node) && property(node, 'component') && property(node, 'path')) {
      const path = property(node, 'path')!.initializer
      const meta = property(node, 'meta')?.initializer
      expect(meta && ts.isObjectLiteralExpression(meta), path.getText(tree)).toBe(true)
      if (meta && ts.isObjectLiteralExpression(meta) && !property(meta, 'public')) {
        const width = property(meta, 'pageWidth')?.initializer
        expect(width && ts.isStringLiteral(width) && ['form', 'content', 'wide'].includes(width.text), path.getText(tree)).toBe(true)
        if (ts.isStringLiteral(path)) {
          count++
          const documentedPath = path.text.replace(/\(\\d\+\)/g, '')
          expect(audit, path.text).toContain(`| \`${documentedPath}\` |`)
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(tree)
  expect(count).toBe(56)
})
