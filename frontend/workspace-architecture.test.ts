import { readFileSync, readdirSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { hasManagePermission } from './apps/shop/src/lib'
import { hasWorkspacePermission } from './apps/transaction/src/lib/workspace-access'

const root = resolve(import.meta.dirname, '..')
const source = (path: string) => readFileSync(resolve(root, path), 'utf8')

function filesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(directory, entry.name)
    return entry.isDirectory() ? filesUnder(path) : [path]
  })
}

describe('后台工作台入口架构', () => {
  it('Permission 与 Ability 禁用原因统一由错误格式化器生成', () => {
    const hardcodedAccessReason = /(?:缺少|当前团队未启用|暂时无法核对)[^\n]{0,120}(?:Permission|Ability)/
    const offenders = filesUnder(resolve(root, 'frontend/apps'))
      .filter(path => /\.(?:ts|vue)$/.test(path) && !path.endsWith('.test.ts'))
      .filter(path => hardcodedAccessReason.test(readFileSync(path, 'utf8')))
      .map(path => relative(root, path).replaceAll('\\', '/'))

    expect(offenders).toEqual([])
  })

  it('Team、商品与记账统一直显四应用入口，并从团队概览进入个人工作台', () => {
    for (const path of [
      'frontend/apps/team/src/components/TeamShell.vue',
      'frontend/apps/shop/src/components/ShopManageShell.vue',
      'frontend/apps/transaction/src/components/TransactionShell.vue',
    ]) {
      const shell = source(path)
      expect(shell).not.toContain(':workspace-options=')
      expect(shell).not.toContain(':app-options=')
      expect(shell).toContain("key: 'team', label: '团队'")
      expect(shell).toContain("key: 'shop', label: '商品'")
      expect(shell).toContain("key: 'transaction', label: '记账'")
      expect(shell).toContain("key: 'chat', label: '聊天'")
    }
    const team = source('frontend/apps/team/src/components/TeamShell.vue')
    expect(team).toContain('context-label="TEAM WORKSPACE"')
    expect(source('frontend/apps/team/src/views/DashboardView.vue')).toContain('进入个人工作台')
    expect(source('frontend/apps/shop/src/views/manage/ManageOverviewView.vue')).toContain('进入个人工作台')
    expect(source('frontend/apps/transaction/src/views/TeamOverviewView.vue')).toContain('进入个人工作台')
    expect(source('frontend/apps/transaction/src/views/TransactionsView.vue')).not.toContain('进入个人工作台')
    const chat = source('frontend/apps/chat/src/views/ChatView.vue')
    expect(chat).not.toContain('workspaceOptions')
    expect(chat).not.toContain('aria-label="切换应用"')
    expect(chat).toContain('class="app-links"')
    expect(chat).toContain('class="app-menu"')
    expect(chat).toContain("shopWorkspaceUrl('/customer/profile')")
  })

  it('保留 Team 团队概览并用共享组件重做其余五个宽版概览', () => {
    const dashboard = source('frontend/apps/team/src/views/DashboardView.vue')
    expect(dashboard).not.toContain('LsWorkspaceOverview')
    expect(dashboard).toContain('class="welcome"')
    expect(dashboard).toContain('class="stats"')
    expect(dashboard).toContain('class="work-grid"')

    const overviews = [
      ['frontend/apps/team/src/views/PersonalView.vue', '进入团队工作台'],
      ['frontend/apps/shop/src/views/manage/ManageOverviewView.vue', '进入个人工作台'],
      ['frontend/apps/shop/src/views/manage/PersonalOverviewView.vue', '进入团队工作台'],
      ['frontend/apps/transaction/src/views/TeamOverviewView.vue', '进入个人工作台'],
      ['frontend/apps/transaction/src/views/PersonalOverviewView.vue', '进入团队工作台'],
    ] as const
    for (const [path, switchLabel] of overviews) {
      const overview = source(path)
      expect(overview, `${path} 未使用共享概览`).toContain('LsWorkspaceOverview')
      expect(overview, `${path} 缺少对向工作台入口`).toContain(switchLabel)
    }

    expect(source('frontend/apps/team/src/views/PersonalView.vue')).toContain('切换身份')
    expect(source('frontend/apps/team/src/router.ts')).toMatch(/path: '\/personal'[^\n]*pageWidth: 'wide'/)
    expect(source('frontend/apps/shop/src/router.ts')).toMatch(/path: '\/manage'[^\n]*width: 'wide'/)
    expect(source('frontend/apps/shop/src/router.ts')).toMatch(/path: '\/manage\/personal'[^\n]*width: 'wide'/)
    expect(source('frontend/apps/transaction/src/router.ts')).toMatch(/path: '\/overview'[^\n]*pageWidth: 'wide'/)
    expect(source('frontend/apps/transaction/src/router.ts')).toMatch(/path: '\/personal'[^\n]*pageWidth: 'wide'/)
  })

  it('六个团队与个人工作台都将无业务 Permission 的概览固定为首个导航入口', () => {
    const team = source('frontend/apps/team/src/components/TeamShell.vue')
    expect(team).toContain("const primary: NavItem[] = [\n  { to: '/', label: '概览', icon: House }")
    expect(team).toContain("const personalNav: NavItem[] = [\n  { to: '/personal', label: '概览', icon: House }")

    const shop = source('frontend/apps/shop/src/components/ShopManageShell.vue')
    expect(shop).toMatch(/const nav = \[\s*\{\s*to: "\/manage",\s*label: "概览",\s*icon: House,\s*permission: null,/)
    expect(shop).toContain("{ to: '/manage/personal', label: '概览', icon: House, permission: null }")
    expect(shop.indexOf("label: '概览'")).toBeLessThan(shop.indexOf("label: '我的商品'"))
    expect(shop).toContain("permission: 'shop.product.self.manage'")

    const transaction = source('frontend/apps/transaction/src/components/TransactionShell.vue')
    expect(transaction).toContain("const teamNav = [\n  ['/overview', '概览', House, null]")
    expect(transaction).toContain("const personalNav = [\n  ['/personal', '概览', House, null]")

    expect(source('frontend/apps/team/src/router.ts')).toContain("path: '/personal', component: PersonalView, meta: { title: '概览'")
    expect(source('frontend/apps/shop/src/router.ts')).toContain("path: '/manage/personal', component: () => import('./views/manage/PersonalOverviewView.vue'), meta: { title: '概览'")
    expect(source('frontend/apps/transaction/src/router.ts')).toContain("path: '/personal', component: PersonalOverviewView, meta: { title: '概览'")
  })

  it('共享顶栏只承载标题和响应式动作，不重新引入应用或工作台切换控件', () => {
    const header = source('frontend/packages/ui/src/components/LsWorkspaceHeader.vue')
    expect(header).not.toContain('workspaceOptions')
    expect(header).not.toContain('appOptions')
    expect(header).not.toContain('ChevronDown')
    expect(header).toContain('<slot name="actions" />')
    expect(header).toContain('>操作</NButton>')
  })

  it('记账先读取访问快照，Ability 缺失时进入零业务请求页面', () => {
    const router = source('frontend/apps/transaction/src/router.ts')
    expect(router).toContain('await loadWorkspaceAccess()')
    expect(router).toContain("return '/unavailable'")
    expect(source('frontend/apps/transaction/src/views/UnavailableView.vue')).not.toContain("api.")
  })

  it('Account 只保留旧深链跳转，客户资料留在商城客户中心', () => {
    const accountRouter = source('frontend/apps/account/src/router.ts')
    const shopRouter = source('frontend/apps/shop/src/router.ts')
    expect(accountRouter).toContain("path: '/identity/current/:section?'")
    expect(accountRouter).not.toContain('CurrentEntityProfileView')
    expect(shopRouter).toContain("path: '/customer/profile'")
    expect(shopRouter).not.toContain('currentEntityUrl')
    const accountOpenApi = JSON.parse(source('docs/openapi/account.openapi.json'))
    expect(accountOpenApi.components.schemas.IdentityTarget.properties.kind.enum)
      .toEqual(['identity', 'team-personal', 'shop-customer'])
    expect(accountOpenApi.components.schemas.CurrentIdentityResult).toBeUndefined()
  })

  it('个人查询控制器只使用请求上下文的 entity_id', () => {
    for (const path of ['app/shop/controller/Personal.php', 'app/transaction/controller/Personal.php']) {
      const controller = source(path)
      expect(controller).toContain('$request->entity_id')
      expect(controller).not.toMatch(/(?:get|post)\(['"]entity_id(?:\/|['"])/)
    }
    const personalProducts = source('app/shop/controller/PersonalProduct.php')
    expect(personalProducts).toContain('$request->acting_entity')
    expect(personalProducts).not.toMatch(/(?:get|post)\(['"]entity_id(?:\/|['"])/)
  })

  it('Team Entity 与成员、虚拟实体使用同一套个人工作台准入', () => {
    for (const path of [
      'frontend/apps/team/src/router.ts',
      'frontend/apps/shop/src/router.ts',
      'frontend/apps/transaction/src/router.ts',
    ]) {
      expect(source(path)).toContain("['team', 'teamMember', 'teamVirtual']")
    }
  })

  it('无业务 Permission 时仍有团队概览，父级 Permission 可满足子操作', () => {
    expect(source('frontend/apps/shop/src/router.ts')).toContain('ManageOverviewView.vue')
    expect(source('frontend/apps/transaction/src/router.ts')).toContain("path: '/overview'")
    expect(source('app/service/TeamAccess.php')).toContain("'team' =>")
    expect(hasManagePermission(['shop'], 'shop.order.read')).toBe(true)
    expect(source('frontend/apps/shop/src/router.ts')).toContain('hasManagePermission(access.permissions, permission)')
    expect(hasWorkspacePermission(['transaction'], 'transaction.report.read')).toBe(true)
    expect(hasWorkspacePermission(['transaction.read'], 'transaction.write')).toBe(false)
  })

  it('Shop 商品表单通过统一上传接口处理封面与详情图片', () => {
    const form = source('frontend/apps/shop/src/views/manage/ProductFormView.vue')
    const access = source('app/shop/controller/Manage.php')
    expect(form).toContain('LsMediaUploadField')
    expect(form).toContain(':upload="uploadFileUrl"')
    expect(form).toContain(':upload-image="uploadMarkdownImage"')
    expect(form).not.toContain("formatPermissionDenied(['file.upload'])")
    expect(form).not.toContain('商城暂未配置直接上传入口')
    expect(access).toContain('TeamAccess::class)->snapshot(')
  })

  it('file.upload 只保护文件库上传，资源附件只受 File Ability 与资源保存鉴权', () => {
    const commonUpload = source('app/common/controller/Upload.php')
    const fileController = source('app/team/controller/File.php')
    const filesView = source('frontend/apps/team/src/views/FilesView.vue')
    expect(commonUpload).not.toContain('Permissions::FILE_UPLOAD')
    expect(fileController).toContain("'Permission:' . Permissions::FILE_UPLOAD => ['only' => ['upload']]")
    expect(filesView).toContain("api.uploadTo(file, '/file/upload')")
    expect(source('frontend/apps/team/src/lib/teamAccessReason.ts')).toContain('export function resourceUploadReason')
  })

  it('商城客户头像通过客户自助上传端点保存，不借用后台角色权限', () => {
    const controller = source('app/shop/controller/Customer.php')
    const route = source('app/shop/route/app.php')
    const form = source('frontend/apps/shop/src/views/CustomerProfileView.vue')
    expect(route).toContain("Route::post('customer/upload', 'Customer/upload')")
    expect(controller).toContain('public function upload(Request $request)')
    expect(controller).toContain('app(\\app\\service\\File::class)->upload(')
    expect(form).toContain(':upload="shopApi.uploadCustomerFile"')
    expect(form).not.toMatch(/<NInput\b[^>]*avatar[^>]*>/i)
    const contract = JSON.parse(source('docs/openapi/shop.openapi.json'))
    expect(contract.paths['/customer/upload'].post.security).toEqual([{ bearerAuth: [] }])
    expect(contract.paths['/customer/upload'].post.requestBody.content['multipart/form-data']).toBeDefined()
  })

  it('Customer 不进入后台双工作台，核销个人任务不误用流水读取权限', () => {
    expect(source('frontend/apps/team/src/router.ts')).toContain("auth.entity()?.type === 'teamCustomer'")
    expect(source('frontend/apps/shop/src/router.ts')).toContain("entityType === 'teamCustomer'")
    expect(source('frontend/apps/transaction/src/router.ts')).toContain("entityType === 'teamCustomer'")
    expect(source('app/transaction/controller/Personal.php'))
      .toContain("['transactions', 'transaction', 'bindings']")
    expect(source('frontend/apps/transaction/src/router.ts'))
      .toContain("personalSection: 'services' }")
  })

  it('新增工作台接口均声明认证，个人查询不接受 Entity 范围参数', () => {
    const contracts = [
      ['docs/openapi/team.openapi.json', ['/personal', '/personal/profile', '/personal/fields']],
      ['docs/openapi/shop.openapi.json', [
        '/manage/access', '/personal/orders', '/personal/orders/{id}', '/personal/products',
        '/personal/products/{id}', '/personal/products/{id}/handlers',
        '/personal/products/{id}/redemption-fields',
      ]],
      ['docs/openapi/transaction.openapi.json', [
        '/workspace/access', '/personal/transactions', '/personal/transactions/{id}', '/personal/stats',
        '/personal/services', '/personal/services/{id}', '/personal/bindings',
      ]],
    ] as const
    for (const [file, paths] of contracts) {
      const contract = JSON.parse(source(file))
      for (const path of paths) {
        const operation = contract.paths[path].get ?? contract.paths[path].post
        expect(operation.security).toEqual([{ bearerAuth: [] }])
        expect((operation.parameters ?? []).map((parameter: { name: string }) => parameter.name))
          .not.toContain('entity_id')
      }
    }
    const team = JSON.parse(source('docs/openapi/team.openapi.json'))
    expect(team.paths['/personal/profile'].post.requestBody.content['application/json'].schema.required)
      .toContain('expected_entity_id')
  })

  it('权益包与履约费用防止可空数字崩溃，并明确区分查询失败和空结果', () => {
    const packageForm = source('frontend/apps/shop/src/views/manage/PackageFormView.vue')
    expect(packageForm).toContain('quantity: number | null')
    expect(packageForm).toContain('const finite = (value: number | null)')
    expect(packageForm).not.toMatch(/item\.(?:quantity|valid_days|unit_price|unit_cost|unit_handler_cut|unit_sender_cut|unit_cs_cut)\.toFixed/)

    const serviceDetail = source('frontend/apps/transaction/src/views/ServiceDetailView.vue')
    expect(serviceDetail).toContain('quantity: number | null')
    expect(serviceDetail).toContain('const feeValid = computed')
    expect(serviceDetail).toContain('handlers.isError.value')
    expect(serviceDetail).not.toMatch(/fee\.(?:quantity|unit_price|cost)\.toFixed/)

    const storefrontService = source('frontend/apps/shop/src/views/ServiceView.vue')
    expect(storefrontService).toContain('query.isError.value')
    expect(storefrontService).toContain('handlers.isError.value')
  })
})
