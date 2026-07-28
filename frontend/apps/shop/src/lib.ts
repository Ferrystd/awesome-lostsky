import { api, auth } from '@lostsky/api/client'
import type { Balance, BindResult, Customer, Order, Page, ProductDetail, ProductSummary, StoreProfile } from './types'

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

export const shopApi = {
  storefront: () => api.get<StoreProfile>('/storefront'),
  products: (page = 1, limit = 24) => pageRequest<ProductSummary>('/storefront/products', { page, limit }, '商品列表'),
  product: (id: number) => api.get<ProductDetail>(`/storefront/products/${id}`),
  bind: (slug?: string) => api.post<BindResult>('/customer/bind', slug ? { slug } : {}),
  me: () => api.get<Customer>('/customer/me'),
  balance: () => api.get<Balance>('/customer/balance'),
  orders: (page = 1, limit = 20) => pageRequest<Order>('/customer/orders', { page, limit }, '订单列表'),
  order: (id: number) => api.get<Order>(`/customer/orders/${id}`),
  purchase: (body: { product_id: number; quantity: number; handler_entity_id?: number; memo?: string }) =>
    api.post<{ id: number }>('/customer/orders', body),
  cancel: (id: number) => api.post<void>(`/customer/orders/${id}/cancel`, {}),
}

export const formatMoney = (value: string | number) => `¥${Number(value).toFixed(2)}`
export const formatDate = (timestamp: number) => new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp * 1000)
export const orderStatus = (status: Order['status']) => ({ 1: '处理中', 2: '已完成', 3: '已取消' })[status]
