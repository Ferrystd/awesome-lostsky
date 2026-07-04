/**
 * 失落青空 (LostSky Studio) - API 请求封装
 * 管理后台通用：自动读取 JWT token 并封装 fetch
 */

// 统一请求 api.lostsky.work，app/slug 由后端通过 Origin 请求头自动解析
// 页面域名 {app}.lostsky.work 或 {slug}.{app}.lostsky.work 对应 Origin 头
const API_BASE  = '//api.lostsky.work';
const AUTH_TOKEN_KEY = 'lostsky_token';
const AUTH_USER_KEY = 'lostsky_user';
const AUTH_MAX_AGE = 60 * 60 * 24 * 30;
const PUBLIC_ACCOUNT_PATHS = ['/login', '/register'];
const PUBLIC_SITE_PATHS = ['/'];
const PUBLIC_API_PATHS = ['/login/phone', '/login/password', '/register/phone'];
const PAGE_ID_KEY = 'lostsky_page_id';
const inflightMutations = new Map();
let isRedirectingToLogin = false;

class ApiError extends Error {
    constructor(message, detail = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = detail.status || 0;
        this.code = detail.code ?? null;
        this.method = detail.method || '';
        this.path = detail.path || '';
        this.data = detail.data ?? null;
        this.response = detail.response ?? null;
        this.cause = detail.cause;
        this.isNetworkError = !!detail.isNetworkError;
        this.notified = false;
    }
}

function makeId() {
    try {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return window.crypto.randomUUID();
        }
    } catch (e) {}

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getPageId() {
    try {
        let pageId = sessionStorage.getItem(PAGE_ID_KEY);
        if (!pageId) {
            pageId = makeId();
            sessionStorage.setItem(PAGE_ID_KEY, pageId);
        }
        return pageId;
    } catch (e) {
        return makeId();
    }
}

function requestKey(method, path, body) {
    return `${method}:${path}:${JSON.stringify(body ?? null)}`;
}

function apiErrorMessage(error) {
    if (error.status === 429) return '操作太频繁，请稍后再试';
    if (error.status >= 500) return '服务暂时不可用，请稍后再试';
    if (error.status === 403) return error.message || '没有权限执行此操作';
    if (error.status === 404) return error.message || '请求的资源不存在';
    if (error.status === 422) return error.message || '提交内容不完整或格式不正确';
    if (error.isNetworkError) return '网络请求失败，请检查网络连接或跨域配置';
    return error.message || '请求失败';
}

function ensureApiToast() {
    let el = document.getElementById('lostsky-api-toast');
    if (el) return el;

    el = document.createElement('div');
    el.id = 'lostsky-api-toast';
    el.setAttribute('role', 'alert');
    el.style.cssText = [
        'position:fixed',
        'right:24px',
        'top:24px',
        'z-index:99999',
        'max-width:min(360px,calc(100vw - 32px))',
        'padding:12px 14px',
        'border:1px solid rgba(248,113,113,.35)',
        'border-radius:12px',
        'background:rgba(15,23,42,.96)',
        'box-shadow:0 18px 40px rgba(0,0,0,.35)',
        'color:#fecaca',
        'font-size:14px',
        'line-height:1.5',
        'opacity:0',
        'transform:translateY(-8px)',
        'pointer-events:none',
        'transition:opacity .18s ease,transform .18s ease',
    ].join(';');
    document.body.appendChild(el);
    return el;
}

function notifyApiError(error) {
    if (!error || error.notified || error.status === 401) return;

    const detail = error instanceof ApiError
        ? error
        : new ApiError(error.message || '请求失败', { cause: error });

    detail.notified = true;
    window.dispatchEvent(new CustomEvent('lostsky:api-error', { detail }));

    if (!document.body) return;
    const toast = ensureApiToast();
    toast.textContent = apiErrorMessage(detail);
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-8px)';
    }, 3600);
}

async function parseResponseJson(res) {
    try {
        return await res.json();
    } catch (e) {
        return {};
    }
}

function buildHttpError(res, json, method, path, fallbackMessage) {
    const message = json.message || fallbackMessage || res.statusText || '请求失败';
    return new ApiError(message, {
        status: res.status,
        code: json.code ?? null,
        method,
        path,
        data: json.data ?? null,
        response: json,
    });
}

function buildNetworkError(error, method, path) {
    return new ApiError('网络请求失败', {
        method,
        path,
        cause: error,
        isNetworkError: true,
    });
}

function getAuthCookieDomain() {
    const hostname = window.location.hostname;
    if (hostname === 'lostsky.work' || hostname.endsWith('.lostsky.work')) {
        return '.lostsky.work';
    }
    return '';
}

function readStorage(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return null;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {}
}

function removeStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {}
}

function getCookie(name) {
    const prefix = encodeURIComponent(name) + '=';
    return document.cookie
        .split('; ')
        .find(item => item.startsWith(prefix))
        ?.slice(prefix.length) || '';
}

function setCookie(name, value, maxAge) {
    const domain = getAuthCookieDomain();
    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    if (domain) cookie += `; domain=${domain}`;
    if (window.location.protocol === 'https:') cookie += '; Secure';
    document.cookie = cookie;
}

function removeCookie(name) {
    setCookie(name, '', 0);
    document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; SameSite=Lax`;
}

function getToken() {
    const token = decodeURIComponent(getCookie(AUTH_TOKEN_KEY));
    if (token) return token;

    const storedToken = readStorage(AUTH_TOKEN_KEY);
    if (storedToken) setCookie(AUTH_TOKEN_KEY, storedToken, AUTH_MAX_AGE);
    return storedToken;
}

function saveAuth(data) {
    if (!data || !data.token) return;

    setCookie(AUTH_TOKEN_KEY, data.token, AUTH_MAX_AGE);
    writeStorage(AUTH_TOKEN_KEY, data.token);

    if (data.user) {
        const userJson = JSON.stringify(data.user);
        setCookie(AUTH_USER_KEY, userJson, AUTH_MAX_AGE);
        writeStorage(AUTH_USER_KEY, userJson);
    }
}

function getAuthUser() {
    const userJson = decodeURIComponent(getCookie(AUTH_USER_KEY)) || readStorage(AUTH_USER_KEY);
    if (!userJson) return null;

    try {
        return JSON.parse(userJson);
    } catch (e) {
        console.error('解析用户信息失败', e);
        return null;
    }
}

function clearAuth() {
    removeCookie(AUTH_TOKEN_KEY);
    removeCookie(AUTH_USER_KEY);
    removeStorage(AUTH_TOKEN_KEY);
    removeStorage(AUTH_USER_KEY);
}

function normalizePath(path) {
    return path.split('?')[0];
}

function normalizePagePath(path) {
    const cleanPath = normalizePath(path).replace(/\/index(?:\.html)?$/, '/').replace(/\.html$/, '');
    return cleanPath || '/';
}

function isPublicPage() {
    const hostname = window.location.hostname;
    const path = normalizePagePath(window.location.pathname);

    if (hostname === 'account.lostsky.work') {
        return PUBLIC_ACCOUNT_PATHS.includes(path);
    }
    if (hostname === 'www.lostsky.work' || hostname === 'lostsky.work') {
        return PUBLIC_SITE_PATHS.includes(path);
    }
    return false;
}

function isPublicApi(path) {
    return PUBLIC_API_PATHS.includes(normalizePath(path));
}

function getLoginUrl() {
    const loginUrl = window.location.hostname === 'account.lostsky.work'
        ? '/login'
        : '//account.lostsky.work/login';
    return `${loginUrl}?redirect=${encodeURIComponent(window.location.href)}`;
}

function redirectToLogin() {
    if (isRedirectingToLogin || isPublicPage()) return;
    isRedirectingToLogin = true;
    clearAuth();
    window.location.replace(getLoginUrl());
}

function isAuthFailure(res, json, path) {
    if (isPublicApi(path)) return false;
    if (res.status === 401) return true;
    if (Number(json.code) === 401) return true;

    const message = String(json.message || '').toLowerCase();
    return /token|jwt|未登录|请先登录|登录.*过期|认证.*失败|身份.*失效|授权.*失效/.test(message);
}

function ensureAuthenticatedPage() {
    if (!isPublicPage() && !getToken()) redirectToLogin();
}

async function request(method, path, body = null) {
    const key = method === 'GET' ? '' : requestKey(method, path, body);
    if (key && inflightMutations.has(key)) {
        return inflightMutations.get(key);
    }

    const promise = doRequest(method, path, body);
    if (key) {
        inflightMutations.set(key, promise);
        promise.then(
            () => inflightMutations.delete(key),
            () => inflightMutations.delete(key)
        );
    }
    return promise;
}

async function doRequest(method, path, body = null) {
    const headers = {
        'Content-Type': 'application/json',
        'X-Page-Id': getPageId(),
    };
    if (method !== 'GET') {
        headers['X-Request-Id'] = makeId();
    }

    const token = getToken();
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }
    const options = { method, headers };
    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }

    let res;
    try {
        res = await fetch(API_BASE + path, options);
    } catch (e) {
        const error = buildNetworkError(e, method, path);
        notifyApiError(error);
        throw error;
    }

    const json = await parseResponseJson(res);
    if (isAuthFailure(res, json, path)) {
        redirectToLogin();
        throw new ApiError(json.message || '登录已过期，请重新登录', {
            status: res.status,
            code: json.code ?? null,
            method,
            path,
            response: json,
        });
    }
    if (!res.ok || json.code !== 0) {
        const error = buildHttpError(res, json, method, path, '请求失败');
        notifyApiError(error);
        throw error;
    }
    return json.data;
}

async function apiUpload(file) {
    if (!file) {
        throw new Error('请选择文件');
    }

    const headers = {
        'X-Page-Id': getPageId(),
        'X-Request-Id': makeId(),
    };
    const token = getToken();
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }

    const formData = new FormData();
    formData.append('file', file);

    let res;
    try {
        res = await fetch(API_BASE + '/upload', {
            method: 'POST',
            headers,
            body: formData,
        });
    } catch (e) {
        const error = buildNetworkError(e, 'POST', '/upload');
        notifyApiError(error);
        throw error;
    }

    const json = await parseResponseJson(res);
    if (isAuthFailure(res, json, '/upload')) {
        redirectToLogin();
        throw new ApiError(json.message || '登录已过期，请重新登录', {
            status: res.status,
            code: json.code ?? null,
            method: 'POST',
            path: '/upload',
            response: json,
        });
    }
    if (!res.ok || json.code !== 0) {
        const error = buildHttpError(res, json, 'POST', '/upload', '上传失败');
        notifyApiError(error);
        throw error;
    }
    return json.data;
}

function apiGet(path, params) {
    if (params) {
        const qs = Object.entries(params)
            .filter(([, v]) => v !== '' && v !== null && v !== undefined)
            .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
            .join('&');
        if (qs) path += '?' + qs;
    }
    return request('GET', path);
}
function apiPost(path, body)   { return request('POST', path, body); }
function apiPut(path, body)    { return request('PUT', path, body); }
function apiDelete(path)       { return request('DELETE', path); }

window.ApiError = ApiError;
window.notifyApiError = notifyApiError;

window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (reason instanceof ApiError || reason?.name === 'ApiError') {
        notifyApiError(reason);
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureAuthenticatedPage);
} else {
    ensureAuthenticatedPage();
}
