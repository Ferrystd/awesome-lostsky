# JS 架构

## 文件分层

```
js/
├── global.js           # 1. 全局运行时：导航交互、主题切换、滚动监听、IntersectionObserver
├── api.js              # 2. API 客户端：fetch 封装、JWT 注入、错误拦截、重试
├── auth.js             # 3. 认证模块：token 存取 (localStorage)、刷新、登出清理
├── router.js           # 4. 前端路由：轻量 hash/path 路由，支持嵌套
├── lib/                # 5. 第三方库 (自托管)
│   ├── alpine.js       #    Alpine.js ~15KB (响应式、x-bind、x-show、x-for)
│   └── utils.js        #    工具函数 (debounce, throttle, formatDate, cn)
└── components/         # 6. 共享 JS 组件
    ├── modal.js        #    弹窗控制 (open/close/toggle)
    ├── toast.js        #    Toast 通知 (success/error/info)
    ├── dropdown.js     #    下拉菜单
    └── form-validate.js#    表单校验
```

## 模块加载与依赖

```
router.js ──→ 无依赖，纯工具
utils.js  ──→ 无依赖，纯工具
alpine.js ──→ 无依赖，第三方
auth.js  ──→ 无依赖，只操作 localStorage
api.js   ──→ 依赖 auth.js，需要 token
toast.js ──→ 无依赖，纯 DOM 操作

global.js  ←── 组合调用 router + toast + utils
各页面 <script> ←── 组合调用 api + auth + modal + toast
```

## API 客户端 (api.js) 设计

```js
// 核心能力
const api = {
    get(url, params)    → GET 请求
    post(url, data)     → POST 请求
    put(url, data)      → PUT 请求
    del(url)            → DELETE 请求
}

// 自动行为
- 注入 Authorization: Bearer <token>
- 注入 X-Team-Slug (从 hostname 解析)
- 注入 X-Request-Id (UUID 防重放)
- 4xx 统一 toast 提示
- 401 自动跳转登录页
```

## 前端路由 (router.js) 设计

采用轻量 hash 路由，无需 History API（与 CDN 静态托管兼容）：

```
#/shop/products          → 加载产品列表
#/shop/products/123      → 加载产品详情
#/transaction/customers  → 加载客户列表
```

## 规则

- 不引入 React/Vue 等重框架——Alpine.js (~15KB) 提供足够的响应式能力
- 不引入 npm/构建工具——纯 ES Module，浏览器原生支持
- 页面特有逻辑内联 `<script type="module">`，不独立建文件
- 共享组件以函数/类导出，页面按需 import
