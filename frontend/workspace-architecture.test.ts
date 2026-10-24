import { readFileSync, readdirSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { hasManagePermission } from './apps/shop/src/lib'
import { hasWorkspacePermission, serviceRedemptionReadPermissions } from './apps/transaction/src/lib/workspace-access'

const root = resolve(import.meta.dirname, '..')
const source = (path: string) => readFileSync(resolve(root, path), 'utf8').replaceAll('\r\n', '\n')

function filesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(directory, entry.name)
    return entry.isDirectory() ? filesUnder(path) : [path]
  })
}

describe('后台工作台入口架构', () => {
  it('受限路由继续渲染真实页面，只在页面内部降级数据', () => {
    for (const path of [
      'frontend/apps/admin/src/App.vue',
      'frontend/apps/team/src/App.vue',
      'frontend/apps/shop/src/App.vue',
      'frontend/apps/transaction/src/App.vue',
      'frontend/apps/weibo/src/App.vue',
    ]) {
      const app = source(path)
      expect(app).not.toContain('LsAccessState')
      expect(app).toContain('<RouterView')
    }
    const operation = source('frontend/apps/weibo/src/views/OperationView.vue')
    expect(operation).toContain('useRouteAccess')
    expect(operation).toContain('enabled: computed(() => !routeAccess.restricted.value)')
    expect(operation).toContain("routeAccess.restricted.value ? '-'")
    expect(source('docs/dev/design/admin/states-and-access.md')).toContain('路由壳层不得用统一状态页替换真实业务页')
  })

  it('Permission 与 Ability 禁用原因统一由错误格式化器生成', () => {
    const hardcodedAccessReason = /(?:缺少|当前团队未启用|暂时无法核对)[^\n]{0,120}(?:Permission|Ability)/
    const offenders = filesUnder(resolve(root, 'frontend/apps'))
      .filter(path => /\.(?:ts|vue)$/.test(path) && !path.endsWith('.test.ts'))
      .filter(path => hardcodedAccessReason.test(readFileSync(path, 'utf8')))
      .map(path => relative(root, path).replaceAll('\\', '/'))

    expect(offenders).toEqual([])
  })

  it('Team、商品、记账与微博统一使用五应用入口', () => {
    const navigation = source('frontend/packages/shared/src/navigation.ts')
    for (const entry of ["key: 'team', label: '团队'", "key: 'shop', label: '商品'", "key: 'transaction', label: '记账'", "key: 'chat', label: '聊天'", "key: 'weibo', label: '微博'"]) expect(navigation).toContain(entry)
    for (const path of [
      'frontend/apps/team/src/components/TeamShell.vue',
      'frontend/apps/shop/src/components/ShopManageShell.vue',
      'frontend/apps/transaction/src/components/TransactionShell.vue',
      'frontend/apps/weibo/src/components/WeiboShell.vue',
    ]) {
      const shell = source(path)
      expect(shell).not.toContain(':workspace-options=')
      expect(shell).not.toContain(':app-options=')
      expect(shell).toContain('workspaceAppEntries(')
    }
    const team = source('frontend/apps/team/src/components/TeamShell.vue')
    expect(team).toContain('context-label="团队工作台"')
    expect(source('frontend/apps/team/src/views/DashboardView.vue')).toContain('进入个人工作台')
    expect(source('frontend/apps/shop/src/views/manage/ManageOverviewView.vue')).toContain('进入个人工作台')
    expect(source('frontend/apps/transaction/src/views/TeamOverviewView.vue')).toContain('进入个人工作台')
    expect(source('frontend/apps/transaction/src/views/TransactionsView.vue')).not.toContain('进入个人工作台')
    const chat = source('frontend/apps/chat/src/views/ChatView.vue')
    expect(chat).not.toContain('workspaceOptions')
    expect(chat).not.toContain('aria-label="切换应用"')
    expect(chat).toContain('class="app-links"')
    expect(chat).toContain('class="app-menu"')
    expect(chat).toContain("paths: { shop: '/customer/profile' }")
  })

  it('各应用复用前端库并保持差异化概览与双向入口', () => {
    const dashboard = source('frontend/apps/team/src/views/DashboardView.vue')
    expect(dashboard).toContain('LsOverviewPage')
    expect(dashboard).toContain('LsMetricGrid')
    expect(dashboard).not.toContain('class="stats"')
    expect(dashboard).toContain('class="team-resource-map"')
    expect(source('frontend/apps/shop/src/components/ShopOverviewWorkspace.vue')).toContain('LsResourceList')
    expect(source('frontend/apps/transaction/src/views/TeamOverviewView.vue')).toContain('class="ledger-section"')

    const overviews = [
      ['frontend/apps/team/src/views/PersonalView.vue', '进入团队工作台'],
      ['frontend/apps/shop/src/views/manage/ManageOverviewView.vue', '进入个人工作台'],
      ['frontend/apps/shop/src/views/manage/PersonalOverviewView.vue', '进入团队工作台'],
      ['frontend/apps/transaction/src/views/TeamOverviewView.vue', '进入个人工作台'],
      ['frontend/apps/transaction/src/views/PersonalOverviewView.vue', '进入团队工作台'],
    ] as const
    for (const [path, switchLabel] of overviews) {
      const overview = source(path)
      const pageComponent = path.includes('/shop/') || path.endsWith('/TeamOverviewView.vue') ? 'LsSinglePanelPage' : 'LsOverviewPage'
      expect(overview, `${path} 未使用共享页面`).toContain(`<${pageComponent}`)
      expect(overview, `${path} 缺少对向工作台入口`).toContain(switchLabel)
    }

    const teamPersonal = source('frontend/apps/team/src/views/PersonalView.vue')
    expect(teamPersonal).toContain('label="使用文档"')
    expect(teamPersonal).toContain('href="//doc.lostsky.work"')
    expect(teamPersonal).not.toContain("label: '切换身份'")
    const weiboOverview = source('frontend/apps/weibo/src/views/OverviewView.vue')
    const weiboDashboard = source('frontend/apps/weibo/src/components/TeamOverviewDashboard.vue')
    expect(weiboOverview).toContain('进入团队工作台')
    expect(weiboOverview).toContain('TeamOverviewDashboard')
    expect(weiboOverview).toContain('LsOverviewPage')
    expect(weiboOverview).toContain('LsPanel')
    expect(weiboOverview).toContain('LsAsyncState')
    expect(weiboDashboard).toContain('AccountHealthSummary')
    expect(weiboDashboard).toContain('TaskStatusSummary')
    expect(weiboDashboard).toContain('OperationRecordList')
    expect(weiboDashboard).not.toContain(':deep(')
    expect(weiboOverview).not.toContain('LsPageHeader')
    expect(weiboOverview).not.toContain('NSkeleton')
    expect(source('frontend/apps/team/src/router.ts')).toMatch(/path: '\/personal'[^\n]*pageWidth: 'wide'/)
    expect(source('frontend/apps/shop/src/router.ts')).toMatch(/path: '\/manage'[^\n]*width: 'wide'/)
    expect(source('frontend/apps/shop/src/router.ts')).toMatch(/path: '\/manage\/personal'[^\n]*width: 'wide'/)
    expect(source('frontend/apps/transaction/src/router.ts')).toMatch(/path: '\/overview'[^\n]*pageWidth: 'wide'/)
    expect(source('frontend/apps/transaction/src/router.ts')).toMatch(/path: '\/personal'[^\n]*pageWidth: 'wide'/)
  })

  it('六个团队与个人工作台都将无业务 Permission 的概览固定为首个导航入口', () => {
    const team = source('frontend/apps/team/src/components/TeamShell.vue')
    expect(team).toMatch(/const primary: NavItem\[\] = \[\s*\{\s*to: ["']\/["'],\s*label: ["']概览["'],\s*icon: House/)
    expect(team).toMatch(/const personalNav: NavItem\[\] = \[\s*\{\s*to: ["']\/personal["'],\s*label: ["']概览["'],\s*icon: House/)

    const shop = source('frontend/apps/shop/src/components/ShopManageShell.vue')
    expect(shop).toMatch(/const nav = \[\s*\{\s*to: "\/manage",\s*label: "概览",\s*icon: House,\s*permission: null,/)
    expect(shop).toContain("{ to: '/manage/personal', label: '概览', icon: House, permission: null }")
    expect(shop.indexOf("label: '概览'")).toBeLessThan(shop.indexOf("label: '我的商品'"))
    expect(shop).not.toContain("label: '我的服务'")
    expect(shop).not.toContain("label: '我的权益包'")
    expect(shop).not.toContain("label: '我的卡活动'")
    expect(source('frontend/apps/shop/src/router.ts')).not.toMatch(/path: '\/manage\/(?:personal\/)?(?:services|packages|campaigns)(?:\/|')/)
    expect(shop).toContain("permission: 'shop.product.self.manage'")

    const transaction = source('frontend/apps/transaction/src/components/TransactionShell.vue')
    expect(transaction).toContain("const teamNav = [\n  ['/overview', '概览', House, null]")
    expect(transaction).toContain("const personalNav = [\n  ['/personal', '概览', House, null]")
    expect(transaction).toContain("['/personal/transactions', '我的流水', ListChecks, null]")
    expect(transaction).not.toContain("['/personal/stats', '我的业绩'")
    expect(transaction).toContain("['/personal/services', '我的接单', BadgeCheck, null]")
    expect(transaction).toContain("['/personal/customers', '我的顾客', Handshake, null]")
    expect(transaction).toContain("['/personal/entitlements', '权益下发', Gift, null]")

    const personalEntitlements = source('frontend/apps/transaction/src/views/PersonalEntitlementsView.vue')
    expect(personalEntitlements).toContain("api.get<Pagination<PersonalEntitlementGrantRecord>>('/personal/entitlements'")
    expect(personalEntitlements).toContain('label="下发权益" to="/personal/entitlements/new"')
    expect(personalEntitlements).not.toContain('resolveTransactionAbilityReason')
    expect(personalEntitlements).not.toContain('hasWorkspacePermission')
    const transactionRouter = source('frontend/apps/transaction/src/router.ts')
    expect(transactionRouter).toContain("path: '/', redirect: '/overview'")
    expect(transactionRouter).toContain("path: '/transactions', component: TransactionsView, meta: { title: '团队流水'")
    expect(transactionRouter).toContain("path: '/personal/transactions', component: PersonalWorkspaceView, meta: { title: '我的流水', pageWidth: 'wide', workspace: 'personal', personalSection: 'transactions' }")
    expect(transactionRouter).not.toContain("path: '/personal/stats'")
    expect(transactionRouter).toContain("path: '/personal/customers', component: PersonalCustomersView, meta: { title: '我的顾客', pageWidth: 'wide', workspace: 'personal' }")
    expect(transactionRouter).toContain("path: '/personal/bindings', redirect: '/personal/customers'")
    expect(transactionRouter).toContain("path: '/personal/entitlements', component: PersonalEntitlementsView, meta: { title: '权益下发', pageWidth: 'wide', workspace: 'personal' }")
    expect(transactionRouter).toContain("path: '/personal/entitlements/new', component: EntitlementGrantView, meta: { title: '下发顾客权益', pageWidth: 'form', workspace: 'personal', permission: 'service.entitlement.grant'")

    expect(source('frontend/apps/team/src/router.ts')).toContain("path: '/personal', component: PersonalView, meta: { workspaceScene: true, title: '概览'")
    expect(source('frontend/apps/shop/src/router.ts')).toContain("path: '/manage/personal', component: () => import('./views/manage/PersonalOverviewView.vue'), meta: { title: '概览'")
    expect(transactionRouter).toContain("path: '/personal', component: PersonalOverviewView, meta: { title: '概览'")
  })

  it('共享顶栏只承载标题和响应式动作，不重新引入应用或工作台切换控件', () => {
    const header = source('frontend/packages/ui/src/components/LsWorkspaceHeader.vue')
    expect(header).not.toContain('workspaceOptions')
    expect(header).not.toContain('appOptions')
    expect(header).not.toContain('ChevronDown')
    expect(header).toContain('<slot name="actions" />')
    expect(header).toContain('>操作</NButton>')
  })

  it('工作台侧栏统一前往身份切换页，退出登录收口到 Account 身份页', () => {
    for (const path of [
      'frontend/apps/team/src/components/TeamShell.vue',
      'frontend/apps/shop/src/components/ShopManageShell.vue',
      'frontend/apps/transaction/src/components/TransactionShell.vue',
      'frontend/apps/weibo/src/components/WeiboShell.vue',
    ]) {
      const shell = source(path)
      expect(shell).toContain('identityUrl()')
      expect(shell).toContain('切换身份')
      expect(shell).not.toContain('退出登录')
      expect(shell).not.toContain('function logout()')
    }

    const identity = source('frontend/apps/account/src/views/IdentityView.vue')
    expect(identity).toContain("api.post('/devices/quit', {})")
    expect(identity).toContain('auth.clear()')
    expect(identity).toContain("router.replace('/login')")
    expect(identity).toContain('退出登录')
    expect(identity).toContain("safeRedirect(route.query.redirect, '')")
    expect(identity).toContain('href="/teams"')
    expect(identity).toContain('返回团队列表')
    expect(identity).toContain('<footer v-if="returnUrl" class="return-action">')
    expect(identity).toContain('<a class="return-link" :href="returnUrl">')
    expect(identity).toContain('前往页面')
    expect(identity).not.toContain('<NButton type="primary" tag="a" :href="returnUrl">')
    expect(identity).toContain('await candidates.refetch()')
    expect(identity).not.toContain('goToSafeRedirect')
  })

  it('微博侧栏沿用 Team 的品牌、分组、箭头和激活态结构', () => {
    const shell = source('frontend/apps/weibo/src/components/WeiboShell.vue')
    const styles = source('frontend/apps/weibo/src/app.css')
    expect(shell).toContain('<strong>LostSky</strong><span>失落青空</span>')
    expect(shell).toContain('<p>工作空间</p>')
    expect(shell).toContain('<ChevronRight :size="15" />')
    expect(shell).toContain('<ShieldCheck :size="18" />')
    expect(styles).toMatch(/grid-template-columns:\s*24px\s+minmax\(0,\s*1fr\)\s+auto/)
    expect(styles).toMatch(/\.weibo-sidebar nav a\.router-link-active svg:last-child\s*\{\s*color:\s*var\(--afterglow\)/)
    expect(styles).toMatch(/\.weibo-content\s*\{[^}]*width:\s*min\(100%,\s*90rem\)/)
  })

  it('商城前台导航标明首页，并从页脚进入身份切换', () => {
    const storefront = source('frontend/apps/shop/src/App.vue')
    expect(storefront).toContain('<RouterLink to="/"><House :size="17" aria-hidden="true" />商城首页</RouterLink>')
    expect(storefront).toContain('<a :href="identityUrl()">切换身份</a>')
    expect(storefront).not.toContain('认识 LostSky')
  })

  it('记账入口和读取不受 Ability 限制，指定动作才在点击后提示', () => {
    const router = source('frontend/apps/transaction/src/router.ts')
    expect(router).toContain('await loadWorkspaceAccess()')
    expect(router).not.toContain('/unavailable')
    expect(source('frontend/apps/transaction/src/components/TransactionShell.vue')).not.toContain('states: { transaction')
    for (const path of [
      'frontend/apps/transaction/src/views/TransactionFormView.vue',
      'frontend/apps/transaction/src/views/RechargeView.vue',
      'frontend/apps/transaction/src/views/EntitlementGrantView.vue',
      'frontend/apps/transaction/src/views/PersonalServiceTaskView.vue',
    ]) expect(source(path)).toContain('resolveTransactionAbilityReason')

    const personalEntitlements = source('frontend/apps/transaction/src/views/PersonalEntitlementsView.vue')
    expect(personalEntitlements).toContain('to="/personal/entitlements/new"')
    expect(personalEntitlements).not.toContain('resolveTransactionAbilityReason')
  })

  it('权益下发表单不在字段下堆叠静态提示框', () => {
    const grant = source('frontend/apps/transaction/src/views/EntitlementGrantView.vue')
    expect(grant).not.toContain('grant-note')
    expect(grant).toContain(':description="grantDescription"')
    expect(grant).toContain('请先建立并启用顾客资料')
    expect(grant).toContain(':disabled-reason="submitDisabledReason"')
  })

  it('个人核销始终使用三个具名边界面板承载分组和实时数量', () => {
    const component = source('frontend/apps/transaction/src/components/PersonalServiceLists.vue')
    expect(component).toContain("import LsPanel from '@lostsky/ui/components/LsPanel.vue'")
    expect(component).toContain("import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'")
    expect(component).toContain("import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'")
    expect(component.match(/<LsPanel aria-labelledby=/g)).toHaveLength(3)
    expect(component.match(/class="group-count" aria-live="polite"/g)).toHaveLength(3)
    expect(component).toContain('class="task-field-section"')
    expect(component).toContain('class="return-composer"')
    expect(component).toContain(":input-props=\"{ 'aria-label': '退回原因' }\"")
    expect(component).not.toMatch(/\.task-list\{[^}]*border:/)
    expect(component).not.toContain('class="task-main"')
    expect(component).not.toContain('class="return-action"')
    expect(component).not.toContain(':deep(.ls-')
    expect(source('docs/dev/design/admin/applications.md')).toContain('Transaction 个人接单队列')
  })

  it('Account 只保留旧深链跳转，顾客资料留在商城顾客中心', () => {
    const accountRouter = source('frontend/apps/account/src/router.ts')
    const shopRouter = source('frontend/apps/shop/src/router.ts')
    expect(accountRouter).toContain("path: '/identity/current/:section?'")
    expect(accountRouter).not.toContain('CurrentEntityProfileView')
    expect(shopRouter).toContain("path: '/customer/profile'")
    expect(shopRouter).not.toContain('currentEntityUrl')
    const accountOpenApi = JSON.parse(source('docs/dev/openapi/account.openapi.json'))
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

  it('团队身份 与成员、虚拟人员使用同一套个人工作台准入', () => {
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
    expect(hasWorkspacePermission(['service.redemption.read'], serviceRedemptionReadPermissions)).toBe(true)
    expect(hasWorkspacePermission(['service.redemption.manage'], serviceRedemptionReadPermissions)).toBe(true)
    expect(hasWorkspacePermission([], serviceRedemptionReadPermissions)).toBe(false)
  })

  it('团队核销入口与路由要求读取或管理权限，个人核销保持本人范围开放', () => {
    const shell = source('frontend/apps/transaction/src/components/TransactionShell.vue')
    const overview = source('frontend/apps/transaction/src/views/TeamOverviewView.vue')
    const router = source('frontend/apps/transaction/src/router.ts')

    expect(shell).toContain("['/transactions', '团队流水', ListChecks, 'transaction.read']")
    expect(shell).toContain("['/stats', '经营统计', BarChart3, 'transaction.report.read']")
    expect(shell).toContain("['/services', '权益核销', BadgeCheck, serviceRedemptionReadPermissions]")
    expect(shell).toContain("['/balances', '顾客余额', CircleDollarSign, 'transaction.read']")
    expect(overview).toContain("to: '/services', icon: BadgeCheck")
    expect(overview).not.toContain('permission: serviceRedemptionReadPermissions')
    expect(router).toMatch(/path: '\/services'[^\n]*permission: serviceRedemptionReadPermissions/)
    expect(router).toMatch(/path: '\/services\/:id\(\\\\d\+\)'[^\n]*permission: serviceRedemptionReadPermissions/)
    expect(shell).toContain("['/personal/services', '我的接单', BadgeCheck, null]")
    expect(router).toMatch(/path: '\/personal\/services'[^\n]*workspace: 'personal'[^\n]*(?!permission:)/)
    expect(source('app/transaction/route/app.php')).toContain("Route::post('personal/services/<id>/complete', 'Personal/completeService')")
    expect(source('frontend/apps/transaction/src/views/PersonalServiceTaskView.vue')).toMatch(/action\.mutate\(\{\s*suffix:\s*['"]complete['"]/)
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
    expect(filesView).toMatch(/api\.uploadTo\(file, ["']\/file\/upload["']\)/)
    expect(source('frontend/apps/team/src/lib/teamAccessReason.ts')).toContain('export function resourceUploadReason')
  })

  it('商城顾客头像通过顾客自助上传端点保存，不借用后台角色权限', () => {
    const controller = source('app/shop/controller/Customer.php')
    const route = source('app/shop/route/app.php')
    const form = source('frontend/apps/shop/src/views/CustomerProfileView.vue')
    expect(route).toContain("Route::post('customer/upload', 'Customer/upload')")
    expect(controller).toContain('public function upload(Request $request)')
    expect(controller).toContain('app(\\app\\service\\File::class)->upload(')
    expect(form).toContain(':upload="shopApi.uploadCustomerFile"')
    expect(form).not.toMatch(/<NInput\b[^>]*avatar[^>]*>/i)
    const contract = JSON.parse(source('docs/dev/openapi/shop.openapi.json'))
    expect(contract.paths['/customer/upload'].post.security).toEqual([{ bearerAuth: [] }])
    expect(contract.paths['/customer/upload'].post.requestBody.content['multipart/form-data']).toBeDefined()
  })

  it('Customer 不进入后台双工作台，个人业务不借用 Team 全量读取权限', () => {
    for (const router of [
      source('frontend/apps/team/src/router.ts'),
      source('frontend/apps/shop/src/router.ts'),
      source('frontend/apps/transaction/src/router.ts'),
    ]) {
      expect(router).toContain('location.replace(identityUrl(location.href))')
    }
    const personalController = source('app/transaction/controller/Personal.php')
    expect(personalController).not.toContain('Permissions::TRANSACTION_READ')
    expect(personalController).not.toContain('Permissions::TRANSACTION_REPORT_READ')
    expect(personalController).toContain("Permissions::TRANSACTION_WRITE => ['only' => ['transactionOptions']]")
    expect(source('frontend/apps/transaction/src/router.ts'))
      .toContain("personalSection: 'services' }")
  })

  it('新增工作台接口均声明认证，个人查询不接受人员范围参数', () => {
    const contracts = [
      ['docs/dev/openapi/team.openapi.json', ['/personal', '/personal/profile', '/personal/fields']],
      ['docs/dev/openapi/shop.openapi.json', [
        '/manage/access', '/personal/orders', '/personal/orders/{id}', '/personal/products',
        '/personal/products/{id}', '/personal/products/{id}/handlers',
        '/personal/services/{id}',
      ]],
      ['docs/dev/openapi/transaction.openapi.json', [
        '/workspace/access', '/personal/transaction-options', '/personal/transactions', '/personal/transactions/{id}', '/personal/stats',
        '/personal/services', '/personal/services/{id}', '/personal/customers', '/personal/entitlements',
        '/personal/entitlement-grant/options', '/personal/entitlement-grant',
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
    const team = JSON.parse(source('docs/dev/openapi/team.openapi.json'))
    expect(team.paths['/personal/profile'].post.requestBody.content['application/json'].schema.required)
      .toContain('expected_entity_id')
  })

  it('商品组合与履约费用防止可空数字崩溃，并明确区分查询失败和空结果', () => {
    const productForm = source('frontend/apps/shop/src/views/manage/ProductFormView.vue')
    const compositionPricing = source('frontend/apps/shop/src/composition-pricing.ts')
    expect(compositionPricing).toContain('quantity: number | null')
    expect(productForm).toContain('const finite = (value: number | null)')
    expect(productForm).not.toMatch(/item\.(?:quantity|valid_days|unit_price|unit_cost|unit_handler_cut|unit_sender_cut|unit_cs_cut)\.toFixed/)

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
