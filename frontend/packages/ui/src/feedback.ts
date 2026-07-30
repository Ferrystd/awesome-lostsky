import { createDiscreteApi } from 'naive-ui'
import { lostskyNaiveTheme } from './naive-theme'

type FeedbackType = 'error' | 'info' | 'success' | 'warning'

const { message } = createDiscreteApi(['message'], {
  configProviderProps: {
    themeOverrides: lostskyNaiveTheme,
  },
  messageProviderProps: {
    placement: 'top',
  },
})

const recent = new Map<string, number>()

function show(type: FeedbackType, content: string) {
  const text = content.trim()
  if (!text) return

  const key = `${type}:${text}`
  const now = Date.now()
  if (now - (recent.get(key) ?? 0) < 800) return
  recent.set(key, now)

  message[type](text, {
    closable: true,
    duration: type === 'error' ? 5000 : 3800,
    keepAliveOnHover: true,
  })
}

export const feedback = {
  error: (content: string) => show('error', content),
  info: (content: string) => show('info', content),
  success: (content: string) => show('success', content),
  warning: (content: string) => show('warning', content),
}
