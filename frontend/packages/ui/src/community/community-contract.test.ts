import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import ts from 'typescript'

const source = (path: string) => readFileSync(path, 'utf8')
const directory = 'frontend/packages/ui/src/community'
function props(name: string) {
  const code = source(`${directory}/${name}.vue`).match(/<script setup lang="ts">([\s\S]*?)<\/script>/)![1]
  const ast = ts.createSourceFile(`${name}.ts`, code, ts.ScriptTarget.Latest, true)
  let names: string[] = []
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && node.expression.getText(ast) === 'defineProps' && node.typeArguments?.[0] && ts.isTypeLiteralNode(node.typeArguments[0])) {
      names = node.typeArguments[0].members.map(member => member.name?.getText(ast) ?? '').sort()
    }
    ts.forEachChild(node, visit)
  }
  visit(ast)
  return names
}
describe('社区跨应用组件契约', () => {
  it('封闭参数只承载业务、权限和路由，不暴露视觉实现', () => {
    expect(props('CommunityManagement')).toEqual(['canModerate', 'canRead', 'canWrite', 'expectedEntityId', 'moderateReason', 'readReason', 'scope', 'writeReason'].sort())
    expect(props('CommunityGovernance')).toEqual(['apiBase', 'routeBase', 'backTo', 'communityName', 'canRead', 'canModerate', 'deniedReason', 'expectedEntityId', 'uploadImage', 'uploadDisabledReason'].sort())
    expect(props('CommunityPostList')).toEqual(['basePath', 'boards', 'filtered', 'posts'])
    expect(props('CommunityTabs')).toEqual(['items', 'label', 'value'])
    expect(props('CommunityPostMeta')).toEqual(['author', 'time'])
    expect(props('CommunityContentState')).toEqual(['reason', 'status'])
    for (const name of ['CommunityManagement', 'CommunityGovernance', 'CommunityPostList', 'CommunityPostMeta', 'CommunityTabs', 'CommunityContentState']) {
      expect(source(`${directory}/${name}.vue`)).not.toContain(':deep(')
      expect(source(`${directory}/${name}.vue`)).not.toMatch(/<LsButton\b[^>]*@click="[^"]*\.refetch\(/)
      expect(source('frontend/component-previews/catalog.json')).toContain(`"name": "${name}"`)
      expect(source('frontend/component-previews/src/community-stories.ts')).toContain(`${name}:`)
    }
  })
  it('三处入口复用管理组件，Community不提供人员选择或管理员任命', () => {
    for (const app of ['admin', 'team']) expect(source(`frontend/apps/${app}/src/views/CommunitiesView.vue`)).toContain('<CommunityManagement')
    expect(source('frontend/apps/community/src/views/ManageView.vue')).toContain('<CommunityGovernance')
    const app = source('frontend/apps/community/src/App.vue')
    expect(app).toContain('identityUrl(new URL(route.fullPath, location.origin).href)')
    expect(app).not.toContain('NSelect')
    expect(source('frontend/apps/account/src/views/IdentityView.vue')).not.toContain('communityWorkspaceUrl')
    expect(source('frontend/apps/account/src/views/TeamsView.vue')).not.toContain('communityWorkspaceUrl')
    expect(source(`${directory}/CommunityGovernance.vue`)).not.toContain('/administrators')
    expect(source('frontend/packages/api/src/community.ts')).toContain("from './generated/community'")
    for (const path of ['frontend/apps/community/src/views/PostFormView.vue', `${directory}/CommunityManagement.vue`, `${directory}/CommunityGovernance.vue`]) {
      expect(source(path)).toContain('!draft.dirty.value')
      expect(source(path)).toContain('draft.accept(submission) || draft.dirty.value')
    }
  })
  it('首页独立于目录并复用社区目录，无页面视觉穿透', () => {
    const router = source('frontend/apps/community/src/router.ts')
    expect(router).toContain("path: '/communities'")
    expect(router).toContain("import('./views/HomeView.vue')")
    for (const name of ['HomeView', 'CommunitiesView']) {
      const page = source(`frontend/apps/community/src/views/${name}.vue`)
      expect(page).toContain('<CommunityDirectory')
      expect(page).not.toContain(':deep(')
    }
    const home = source('frontend/apps/community/src/views/HomeView.vue')
    expect(home).toContain('official: 1')
    expect(home).not.toContain('CommunityPostList')
    expect(home).not.toContain('/posts')
    expect(home).not.toContain('featured')
    expect(source('frontend/apps/community/src/views/CommunitiesView.vue')).toContain("route.query.official === '1'")
    const directorySource = source('frontend/apps/community/src/components/CommunityDirectory.vue')
    expect(directorySource).toContain('defineProps<{ communities: Community[] }>()')
    expect(directorySource).not.toContain(':deep(')
    expect(source('frontend/component-previews/catalog.json')).toContain('"name": "CommunityDirectory"')
  })
  it('十应用构建、API生成、开发端口和E2E发现覆盖Community', () => {
    const pkg = JSON.parse(source('package.json'))
    expect(pkg.scripts['dev:community']).toBe('vite --config frontend/vite.community.ts')
    expect(pkg.scripts['build:community']).toBe('vite build --config frontend/vite.community.ts')
    expect(pkg.scripts['generate:api']).toContain('community.openapi.json -o frontend/packages/api/src/generated/community.ts')
    const apps = source('frontend/scripts/build.mjs').match(/const apps = (\[[^\n]+\])/)![1].match(/'[^']+'/g)!.map(value => value.slice(1, -1))
    expect(apps).toEqual(['site', 'account', 'admin', 'team', 'chat', 'community', 'transaction', 'display', 'shop', 'weibo'])
    expect(source('frontend/scripts/check-cors.mjs')).toContain("'community.lostsky.work'")
    expect(source('frontend/vite.community.ts')).toContain("appConfig('community', 5182)")
    expect(source('playwright.config.ts')).toContain("url: 'http://127.0.0.1:5182'")
  })
})
