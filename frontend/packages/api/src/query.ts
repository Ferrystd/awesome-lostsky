import type { VueQueryPluginOptions } from '@tanstack/vue-query'
import { ApiError } from './client'

export function shouldRetryQuery(failureCount: number, error: unknown) {
  if (error instanceof ApiError) {
    if (error.status >= 400 && error.status < 500) return false
    return (error.network || error.status >= 500) && failureCount < 2
  }
  return failureCount < 1
}

export function shouldRefetchOnWindowFocus(query: { state: { error: unknown } }) {
  const error = query.state.error
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
  return 'always' as const
}

export const lostskyQueryPluginOptions: VueQueryPluginOptions = {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        retry: shouldRetryQuery,
        refetchOnReconnect: true,
        refetchOnWindowFocus: shouldRefetchOnWindowFocus,
      },
      mutations: { retry: false },
    },
  },
}
