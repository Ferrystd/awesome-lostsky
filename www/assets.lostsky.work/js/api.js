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
let isRedirectingToLogin = false;

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
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }
    const options = { method, headers };
    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }
    const res = await fetch(API_BASE + path, options);
    let json = {};
    try {
        json = await res.json();
    } catch (e) {}
    if (isAuthFailure(res, json, path)) {
        redirectToLogin();
        throw new Error(json.message || '登录已过期，请重新登录');
    }
    if (!res.ok || json.code !== 0) {
        throw new Error(json.message || '请求失败');
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureAuthenticatedPage);
} else {
    ensureAuthenticatedPage();
}
