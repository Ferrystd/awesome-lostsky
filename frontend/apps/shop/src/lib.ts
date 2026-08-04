import { api, auth } from '@lostsky/api/client'
import { storedReferral } from '@lostsky/shared/referral'
import type { Balance, BindResult, Customer, ManageAccess, ManageCampaign, ManageCode, ManageOptions, ManagePackage, ManageService, Order, Page, ProductDetail, ProductSummary, RedemptionCard, ServiceInstance, StoreProfile } from './types'

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
  assignees: () => api.get<Array<{ entity_id: number; slug: string; type: string; name: string; avatar?: string | null }>>('/customer/assignees'),
  claimSlug: (slug: string) => api.post<{ slug: string }>('/customer/slug', { slug }),
  balance: () => api.get<Balance>('/customer/balance'),
  orders: (page = 1, limit = 20) => pageRequest<Order>('/customer/orders', { page, limit }, '订单列表'),
  order: (id: number) => api.get<Order>(`/customer/orders/${id}`),
  purchase: (body: { product_id: number; quantity: number; handler_entity_id?: number; memo?: string }) =>
    api.post<{ id: number }>('/customer/orders', body),
  cancel: (id: number) => api.post<void>(`/customer/orders/${id}/cancel`, {}),
  services: (page = 1, limit = 20) => pageRequest<ServiceInstance>('/customer/services', { page, limit }, '服务列表'),
  service: (id: number) => api.get<ServiceInstance>(`/customer/services/${id}`),
  serviceHandlers: (id: number) => api.get<Array<{ entity_id: number; subject: { id: number; name: string } }>>(`/customer/services/${id}/handlers`),
  startService: (id: number, body: { handler_entity_id: number; memo?: string; field_values?: Record<number, unknown> }) => api.post(`/customer/services/${id}/start`, body),
  cancelService: (id: number, reason: string) => api.post(`/customer/services/${id}/cancel`, { reason }),
  cards: () => api.get<RedemptionCard[]>('/customer/cards'),
  claimCard: (code: string) => api.post<{ id: number }>('/customer/cards/claim', { code }),
  revealCard: (id: number) => api.post<{ id: number; code: string }>(`/customer/cards/${id}/reveal`, {}),
}

let manageAccess: ManageAccess | null = null
export async function loadManageAccess(force = false) {
  if (!manageAccess || force) manageAccess = await api.get<ManageAccess>('/manage/access')
  return manageAccess
}
export function canManage(permission: string) { return Boolean(manageAccess?.permissions.includes(permission)) }

export const manageApi = {
  access: loadManageAccess,
  options: () => api.get<ManageOptions>('/manage/options'),
  products: (params: Record<string, unknown>) => pageRequest<any>('/product', params, '商品列表'),
  product: (id: number) => api.get<any>(`/product/${id}`),
  saveProduct: (id: number | null, body: Record<string, unknown>) => api.post<{id:number}>(id ? `/product/${id}` : '/product', body),
  disableProduct: (id: number) => api.post(`/product/${id}`, { is_active: 0 }),
  setProductHandlers: (id: number, entity_ids: number[]) => api.post(`/product/${id}/handlers`, { entity_ids }),
  productFields: (id: number) => api.get<any[]>(`/product/${id}/redemption-fields`),
  saveProductField: (productId: number, fieldId: number | null, body: Record<string, unknown>) => api.post(`/product/${productId}/redemption-fields${fieldId ? `/${fieldId}` : ''}`, body),
  deleteProductField: (productId: number, fieldId: number) => api.post(`/product/${productId}/redemption-fields/${fieldId}/delete`, {}),
  orders: (params: Record<string, unknown>) => pageRequest<any>('/order', params, '订单列表'),
  order: (id: number) => api.get<any>(`/order/${id}`),
  createOrder: (body: Record<string, unknown>) => api.post<{id:number}>('/order', body),
  orderAction: (id: number, action: 'cancel'|'complete') => api.post(`/order/${id}/${action}`, {}),
  services: (params: Record<string, unknown>) => pageRequest<ManageService>('/manage/services', params, '服务列表'),
  service: (id: number) => api.get<ManageService>(`/manage/services/${id}`),
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
