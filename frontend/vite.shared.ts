import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export function appConfig(app: 'site' | 'account' | 'admin' | 'team' | 'chat' | 'transaction' | 'display' | 'shop', port: number) {
  const root = fileURLToPath(new URL(`./apps/${app}`, import.meta.url))
  return defineConfig(({ command }) => ({
    root,
    cacheDir: fileURLToPath(new URL(`./.vite/${app}`, import.meta.url)),
    base: command === 'build' ? `//assets.lostsky.work/build/${app}/` : '/',
    plugins: [vue()],
    resolve: {
      alias: {
        '@lostsky/ui': fileURLToPath(new URL('./packages/ui/src', import.meta.url)),
        '@lostsky/api': fileURLToPath(new URL('./packages/api/src', import.meta.url)),
        '@lostsky/shared': fileURLToPath(new URL('./packages/shared/src', import.meta.url)),
      },
    },
    css: { postcss: fileURLToPath(new URL('./postcss.config.cjs', import.meta.url)) },
    server: {
      port,
      strictPort: true,
      allowedHosts: ['.lostsky.work'],
      proxy: {
        '/api': {
          target: process.env.VITE_DEV_API_TARGET || 'http://api.lostsky.work',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          configure: (proxy) => proxy.on('proxyReq', (request) => {
            const origin = app === 'team' || app === 'chat' || app === 'transaction' || app === 'display' || app === 'shop'
              ? `https://demo.${app}.lostsky.work`
              : `https://${app === 'site' ? 'www' : app}.lostsky.work`
            request.setHeader('Origin', origin)
          }),
        },
      },
    },
    build: { outDir: fileURLToPath(new URL(`./.dist/${app}`, import.meta.url)), emptyOutDir: true, sourcemap: false },
  }))
}
