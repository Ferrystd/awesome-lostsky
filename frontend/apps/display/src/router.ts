import { createRouter, createWebHistory } from 'vue-router'

const HomeView = () => import('./views/HomeView.vue')
const EntityView = () => import('./views/EntityView.vue')
const DocumentView = () => import('./views/DocumentView.vue')
const NotFoundView = () => import('./views/NotFoundView.vue')

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', component: HomeView, meta: { title: '团队公开主页' } },
    { path: '/entity/:slug', component: EntityView, meta: { title: '实体资料' } },
    { path: '/document/:id(\\d+)', component: DocumentView, meta: { title: '公开文档' } },
    { path: '/:pathMatch(.*)*', component: NotFoundView, meta: { title: '页面不存在' } },
  ],
})

router.afterEach((to) => {
  document.title = `${String(to.meta.title ?? '团队公开主页')} · LostSky`
  requestAnimationFrame(() => document.querySelector<HTMLElement>('main h1')?.focus())
})
