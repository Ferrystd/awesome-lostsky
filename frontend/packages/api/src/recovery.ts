import { api, ApiError } from './client'

export interface SmsDelivery { expires_in?: number; retry_after: number; debug_bypass?: boolean }
export interface RecoveryCredential { recovery_token: string; expires_in: number }

export const recovery = {
  verify: (phone: string, code: string) => api.post<RecoveryCredential>('/recovery/verify', { phone, code }),
  sendPhoneCode: (recovery_token: string, phone: string) => api.post<SmsDelivery>('/recovery/phone/sms', { recovery_token, phone }),
  resetPassword: (recovery_token: string, password: string) => api.post<null>('/recovery/password', { recovery_token, password }),
  changePhone: (recovery_token: string, phone: string, code: string) => api.post<null>('/recovery/phone', { recovery_token, phone, code }),
}

export function isRecoveryExpired(reason: unknown) {
  return reason instanceof ApiError && reason.status === 410
}
