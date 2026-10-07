import { createRouter, createWebHistory } from 'vue-router'
export const router = createRouter({
  history: createWebHistory(), scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', component: () => import('./views/CommunitiesView.vue'), meta: { title: '社区广场' } },
    { path: '/mine', component: () => import('./views/CommunitiesView.vue'), meta: { title: '我加入的社区' } },
    { path: '/c/:slug', component: () => import('./views/CommunityView.vue'), meta: { title: '社区' } },
    { path: '/c/:slug/posts/new', component: () => import('./views/PostFormView.vue'), meta: { title: '发布帖子' } },
    { path: '/c/:slug/posts/:postId(\\d+)', component: () => import('./views/PostView.vue'), meta: { title: '帖子详情' } },
    { path: '/c/:slug/posts/:postId(\\d+)/edit', component: () => import('./views/PostFormView.vue'), meta: { title: '编辑帖子' } },
    { path: '/c/:slug/manage/:section(boards|announcements|posts|comments|members)/:itemId?', component: () => import('./views/ManageView.vue'), meta: { title: '社区管理' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
router.beforeEach(to => { document.title = `${String(to.meta.title)} · LostSky` })
