import { ApiError, api, auth, friendlyError } from '@lostsky/api/client'
import { ERROR_MESSAGES } from '@lostsky/api/error-messages'
import { formatPermissionDenied } from '@lostsky/api/error-format'
import { storedReferral } from '@lostsky/shared/referral'
import type { Balance, BindResult, Customer, EntitlementManageOptions, FileUploadAvailability, ManageAccess, ManageCampaign, ManageCode, ManageEntityOption, ManageOptions, ManageOwnedResource, ManagePackage, ManageService, Order, Page, ProductDetail, ProductManageOptions, ProductSummary, RedemptionCard, ServiceEntitlement, ServiceEntitlementDetail, ServiceInstance, StoreProfile } from './types'

const readyKey = () => `lostsky_shop_customer:${location.host}`

async function pageRequest<T>(path: string, params: Record<string, unknown>, label: string) {
  const data = await api.get<unknown>(path, params)
  if (!data || typeof data !== 'object' || !Array.isArray(Reflect.get(data, 'list'))) {
    throw new TypeError(`${label}响应格式错误`)
  }
  return data as Page<T>
}

export function isCustomerReady() {
  const entity = auth.entity()
  return entity?.type === 'teamCustomer' && sessionStorage.getItem(readyKey()) === String(entity.id)
}

export function rememberCustomer(customerId: number) {
  sessionStorage.setItem(readyKey(), String(customerId))
}

export function forgetCustomer() {
  sessionStorage.removeItem(readyKey())
}

export async function verifyCustomer() {
  const customer = await shopApi.me()
  rememberCustomer(customer.id)
  return customer
}

export const shopApi = {
  storefront: () => api.get<StoreProfile>('/storefront'),
  products: (page = 1, limit = 24) => pageRequest<ProductSummary>('/storefront/products', { page, limit }, '商品列表'),
  product: (id: number) => api.get<ProductDetail>(`/storefront/products/${id}`),
  bind: (slug?: string) => {
    const inviterSlug = storedReferral()
    return api.post<BindResult>('/customer/bind', {
      ...(slug ? { slug } : {}),
      ...(inviterSlug ? { inviter_slug: inviterSlug } : {}),
    })
  },
  me: () => api.get<Customer>('/customer/me'),
  updateProfile: (body: { nickname: string; avatar?: string | null; description?: string | null; assignee_entity_id?: number | null }) =>
    api.post<void>('/customer/me', body),
  uploadCustomerFile: async (file: File) => {
    try {
      const result = await api.uploadTo<Record<string, unknown>>(file, '/customer/upload')
      const url = String(result.url ?? result.path ?? '')
      if (!url) throw new ApiError('上传结果缺少文件地址', { method: 'POST', path: '/customer/upload', data: result })
      return url
    } catch (error) {
      throw new Error(friendlyError(error), { cause: error })
    }
  },
  assignees: () => api.get<Array<{ entity_id: number; slug: string; type: string; name: string; avatar?: string | null }>>('/customer/assignees'),
  claimSlug: (slug: string) => api.post<{ slug: string }>('/customer/slug', { slug }),
  balance: () => api.get<Balance>('/customer/balance'),
  orders: (page = 1, limit = 20) => pageRequest<Order>('/customer/orders', { page, limit }, '订单列表'),
  order: (id: number) => api.get<Order>(`/customer/orders/${id}`),
  purchase: (body: { product_id: number; quantity: number; handler_entity_id?: number; product_handlers?: Record<number, number>; purchase_values?: Record<number, unknown>; memo?: string }) =>
    api.post<{ id: number }>('/customer/orders', body),
  cancel: (id: number) => api.post<void>(`/customer/orders/${id}/cancel`, {}),
  services: (page = 1, limit = 20) => pageRequest<ServiceEntitlement>('/customer/services', { page, limit }, '服务权益列表'),
  service: (id: number) => api.get<ServiceEntitlementDetail>(`/customer/services/${id}`),
  serviceHandlers: (id: number) => api.get<Array<{ entity_id: number; subject: ManageEntityOption & { entityable_type?: string } }>>(`/customer/services/${id}/handlers`),
  startService: (id: number, body: { quantity: string; handler_entity_id: 0; memo?: string; field_values?: Array<Record<number, unknown>> }) => api.post<{id:number}>(`/customer/services/${id}/start`, body),
  createServiceOffer: (id: number, body: { quantity: string; handler_entity_id: number; memo?: string; field_values?: Array<Record<number, unknown>> }) => api.post<{id:number}>(`/customer/services/${id}/offers`, body),
  withdrawServiceOffer: (id: number, reason = '') => api.post(`/customer/service-offers/${id}/withdraw`, { reason }),
  restartService: (id: number, body: { handler_entity_id: number; memo?: string; field_values?: Array<Record<number, unknown>> }) => api.post(`/customer/service-redemptions/${id}/start`, body),
  cancelService: (id: number, reason: string) => api.post(`/customer/service-redemptions/${id}/cancel`, { reason }),
  confirmServiceCompletion: (id: number) => api.post(`/customer/service-redemptions/${id}/complete`, {}),
  rejectServiceCompletion: (id: number, reason: string) => api.post(`/customer/service-redemptions/${id}/completion/reject`, { reason }),
  acceptServiceAdjustment: (instanceId: number, adjustmentId: number) => api.post(`/customer/service-redemptions/${instanceId}/adjustments/${adjustmentId}/accept`, {}),
  rejectServiceAdjustment: (instanceId: number, adjustmentId: number) => api.post(`/customer/service-redemptions/${instanceId}/adjustments/${adjustmentId}/reject`, {}),
  cards: () => api.get<RedemptionCard[]>('/customer/cards'),
  claimCard: (code: string) => api.post<{ id: number }>('/customer/cards/claim', { code }),
  revealCard: (id: number) => api.post<{ id: number; code: string }>(`/customer/cards/${id}/reveal`, {}),
}

let manageAccess: ManageAccess | null = null
export async function loadManageAccess(force = false) {
  if (!manageAccess || force) manageAccess = await api.get<ManageAccess>('/manage/access')
  return manageAccess
}
export function hasManagePermission(permissions: string[], required: string) {
  return permissions.some(granted => required === granted || required.startsWith(`${granted}.`))
}
export function canManage(permission: string) { return Boolean(manageAccess && hasManagePermission(manageAccess.permissions, permission)) }
export function managePermissionReason(permission: string) { return formatPermissionDenied([permission]) }
export function resourceOwnerLabel(resource: ManageOwnedResource, currentEntityId = 0) {
  if (resource.owner_entity_id == null) return '团队公用'
  if (currentEntityId > 0 && resource.owner_entity_id === currentEntityId) return '本人'
  return resource.owner?.name || `人员 #${resource.owner_entity_id}`
}
export function fileUploadReason(
  state: FileUploadAvailability | undefined,
) {
  if (state?.available === false && state.reason === 'quota') return ERROR_MESSAGES.file.quota
  return ''
}

export type ProductManagementScope = 'team' | 'personal'
export function productManagement(scope: ProductManagementScope) {
  const personal = scope === 'personal'
  const apiBase = personal ? '/personal/products' : '/product'
  const routeBase = personal ? '/manage/personal/products' : '/manage/products'
  const permission = personal ? 'shop.product.self.manage' : 'shop.product.write'
  const payload = (body: Record<string, unknown>, expectedEntityId?: number) => personal
    ? { ...body, expected_entity_id: expectedEntityId ?? 0 }
    : body

  return {
    personal,
    permission,
    routeBase,
    options: () => api.get<ProductManageOptions>(personal ? `${apiBase}/options` : '/manage/options'),
    products: (params: Record<string, unknown>) => pageRequest<any>(apiBase, params, personal ? '我的商品列表' : '商品列表'),
    product: (id: number) => api.get<any>(`${apiBase}/${id}`),
    saveProduct: (id: number | null, body: Record<string, unknown>, expectedEntityId?: number) =>
      api.post<{id:number}>(id ? `${apiBase}/${id}` : apiBase, payload(body, expectedEntityId)),
    disableProduct: (id: number, expectedEntityId?: number) => api.post(`${apiBase}/${id}`, payload({ is_active: 0 }, expectedEntityId)),
    setProductHandlers: (id: number, entityIds: number[], expectedEntityId?: number) =>
      api.post(`${apiBase}/${id}/handlers`, payload({ entity_ids: entityIds }, expectedEntityId)),
  }
}

export function entitlementManagement(scope: ProductManagementScope) {
  const personal = scope === 'personal'
  const apiPrefix = personal ? '/personal' : '/manage'
  const routePrefix = personal ? '/manage/personal' : '/manage'
  const permission = personal ? 'shop.product.self.manage' : 'shop.product.write'
  const disablePermission = personal ? permission : 'shop.product.delete'
  const payload = (body: Record<string, unknown>, expectedEntityId?: number) => personal
    ? { ...body, expected_entity_id: expectedEntityId ?? 0 }
    : body

  return {
    personal,
    permission,
    disablePermission,
    routePrefix,
    options: () => api.get<EntitlementManageOptions>(personal ? '/personal/products/options' : '/manage/options'),
    services: (params: Record<string, unknown>) => pageRequest<ManageService>(`${apiPrefix}/services`, params, personal ? '我的服务列表' : '服务列表'),
    service: (id: number) => api.get<ManageService>(`${apiPrefix}/services/${id}`),
    saveService: (id: number | null, body: Record<string, unknown>, expectedEntityId?: number) =>
      api.post<{id:number}>(id ? `${apiPrefix}/services/${id}` : `${apiPrefix}/services`, payload(body, expectedEntityId)),
    disableService: (id: number, expectedEntityId?: number) =>
      api.post(`${apiPrefix}/services/${id}/disable`, payload({}, expectedEntityId)),
    packages: (params: Record<string, unknown>) => pageRequest<ManagePackage>(`${apiPrefix}/packages`, params, personal ? '我的权益包列表' : '权益包列表'),
    package: (id: number) => api.get<ManagePackage>(`${apiPrefix}/packages/${id}`),
    savePackage: (id: number | null, body: Record<string, unknown>, expectedEntityId?: number) =>
      api.post<{id:number}>(id ? `${apiPrefix}/packages/${id}` : `${apiPrefix}/packages`, payload(body, expectedEntityId)),
    disablePackage: (id: number, expectedEntityId?: number) =>
      api.post(`${apiPrefix}/packages/${id}/disable`, payload({}, expectedEntityId)),
    campaigns: (params: Record<string, unknown>) => pageRequest<ManageCampaign>(`${apiPrefix}/campaigns`, params, personal ? '我的卡活动列表' : '活动列表'),
    campaign: (id: number) => api.get<ManageCampaign>(`${apiPrefix}/campaigns/${id}`),
    saveCampaign: (id: number | null, body: Record<string, unknown>, expectedEntityId?: number) =>
      api.post<{id:number}>(id ? `${apiPrefix}/campaigns/${id}` : `${apiPrefix}/campaigns`, payload(body, expectedEntityId)),
    disableCampaign: (id: number, expectedEntityId?: number) =>
      api.post(`${apiPrefix}/campaigns/${id}/disable`, payload({}, expectedEntityId)),
    codes: (campaignId: number, params: Record<string, unknown>) => pageRequest<ManageCode>(`${apiPrefix}/campaigns/${campaignId}/codes`, params, '卡密列表'),
    issueCodes: (campaignId: number, body: Record<string, unknown>, expectedEntityId?: number) =>
      api.post<Array<ManageCode & {code:string}>>(`${apiPrefix}/campaigns/${campaignId}/codes`, payload(body, expectedEntityId)),
    revealCode: (campaignId: number, codeId: number, expectedEntityId?: number) =>
      api.post<{id:number;code:string}>(`${apiPrefix}/campaigns/${campaignId}/codes/${codeId}/reveal`, payload({}, expectedEntityId)),
    disableCode: (campaignId: number, codeId: number, expectedEntityId?: number) =>
      api.post(`${apiPrefix}/campaigns/${campaignId}/codes/${codeId}/disable`, payload({}, expectedEntityId)),
  }
}

export const manageApi = {
  access: loadManageAccess,
  options: () => api.get<ManageOptions>('/manage/options'),
  products: (params: Record<string, unknown>) => pageRequest<any>('/product', params, '商品列表'),
  product: (id: number) => api.get<any>(`/product/${id}`),
  saveProduct: (id: number | null, body: Record<string, unknown>) => api.post<{id:number}>(id ? `/product/${id}` : '/product', body),
  disableProduct: (id: number) => api.post(`/product/${id}`, { is_active: 0 }),
  setProductHandlers: (id: number, entity_ids: number[]) => api.post(`/product/${id}/handlers`, { entity_ids }),
  orders: (params: Record<string, unknown>) => pageRequest<any>('/order', params, '订单列表'),
  order: (id: number) => api.get<any>(`/order/${id}`),
  personalOrders: (params: Record<string, unknown>) => pageRequest<any>('/personal/orders', params, '我的业务订单'),
  personalOrder: (id: number) => api.get<any>(`/personal/orders/${id}`),
  createOrder: (body: Record<string, unknown>) => api.post<{id:number}>('/order', body),
  orderAction: (id: number, action: 'cancel'|'complete') => api.post(`/order/${id}/${action}`, {}),
  services: (params: Record<string, unknown>) => pageRequest<ManageService>('/manage/services', params, '服务列表'),
  service: (id: number) => api.get<ManageService>(`/manage/services/${id}`),
  serviceHandlers: (id: number) => api.get<Array<{entity_id:number;subject?:ManageEntityOption|null}>>(`/manage/services/${id}/handlers`),
  saveServiceHandlers: (id: number, entity_ids: number[]) => api.post(`/manage/services/${id}/handlers`, { entity_ids }),
  saveService: (id: number | null, body: Record<string, unknown>) => api.post<{id:number}>(id ? `/manage/services/${id}` : '/manage/services', body),
  disableService: (id: number) => api.post(`/manage/services/${id}/disable`, {}),
  packages: (params: Record<string, unknown>) => pageRequest<ManagePackage>('/manage/packages', params, '权益包列表'),
  package: (id: number) => api.get<ManagePackage>(`/manage/packages/${id}`),
  savePackage: (id: number | null, body: Record<string, unknown>) => api.post<{id:number}>(id ? `/manage/packages/${id}` : '/manage/packages', body),
  disablePackage: (id: number) => api.post(`/manage/packages/${id}/disable`, {}),
  campaigns: (params: Record<string, unknown>) => pageRequest<ManageCampaign>('/manage/campaigns', params, '活动列表'),
  campaign: (id: number) => api.get<ManageCampaign>(`/manage/campaigns/${id}`),
  saveCampaign: (id: number | null, body: Record<string, unknown>) => api.post<{id:number}>(id ? `/manage/campaigns/${id}` : '/manage/campaigns', body),
  disableCampaign: (id: number) => api.post(`/manage/campaigns/${id}/disable`, {}),
  codes: (campaignId: number, params: Record<string, unknown>) => pageRequest<ManageCode>(`/manage/campaigns/${campaignId}/codes`, params, '卡密列表'),
  issueCodes: (campaignId: number, body: Record<string, unknown>) => api.post<Array<ManageCode & {code:string}>>(`/manage/campaigns/${campaignId}/codes`, body),
  revealCode: (campaignId: number, codeId: number) => api.post<{id:number;code:string}>(`/manage/campaigns/${campaignId}/codes/${codeId}/reveal`, {}),
  disableCode: (campaignId: number, codeId: number) => api.post(`/manage/campaigns/${campaignId}/codes/${codeId}/disable`, {}),
}

export const formatMoney = (value: string | number) => `¥${Number(value).toFixed(2)}`
export const formatDate = (timestamp: number) => new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp * 1000)
export const orderStatus = (status: Order['status']) => ({ 1: '处理中', 2: '已完成', 3: '已取消' })[status]
export const serviceStatus = (status: ServiceInstance['status']) => ({ 1: '未核销', 2: '核销中', 3: '已核销' })[status]
