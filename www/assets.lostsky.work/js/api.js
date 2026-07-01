/**
 * 失落青空 (LostSky Studio) - API 请求封装
 * 🔒 此文件锁定，页面修改时不得改动
 * 管理后台通用：自动从 localStorage 读取 JWT token
 */

// 统一请求 api.lostsky.work，app/slug 由后端通过 Origin 请求头自动解析
// 页面域名 {app}.lostsky.work 或 {slug}.{app}.lostsky.work 对应 Origin 头
const API_BASE  = '//api.lostsky.work';

function getToken() {
    return localStorage.getItem('lostsky_token');
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
    const json = await res.json();
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
