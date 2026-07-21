interface PublicationContext { data: unknown }
interface Subscription {
  on(event: 'publication', listener: (context: PublicationContext) => void): Subscription
  on(event: 'subscribed' | 'unsubscribed' | 'error', listener: () => void): Subscription
  subscribe(): void
  unsubscribe(): void
}
interface CentrifugeClient {
  newSubscription(channel: string, options: {
    token: string
    getToken: () => Promise<string>
  }): Subscription
  connect(): void
  disconnect(): void
}
interface CentrifugeConstructor {
  new(url: string, options: { token: string; getToken: () => Promise<string> }): CentrifugeClient
}

declare global {
  interface Window { Centrifuge?: CentrifugeConstructor }
}

let loading: Promise<CentrifugeConstructor> | null = null

export function loadCentrifuge(): Promise<CentrifugeConstructor> {
  if (window.Centrifuge) return Promise.resolve(window.Centrifuge)
  if (loading) return loading
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/centrifuge@5.6.0/dist/centrifuge.min.js'
    script.crossOrigin = 'anonymous'
    script.onload = () => window.Centrifuge
      ? resolve(window.Centrifuge)
      : reject(new Error('实时 SDK 未正确加载'))
    script.onerror = () => reject(new Error('实时 SDK 加载失败'))
    document.head.append(script)
  })
  return loading
}

export type { CentrifugeClient, Subscription }
