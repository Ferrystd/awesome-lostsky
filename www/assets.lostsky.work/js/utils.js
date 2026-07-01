/**
 * 失落青空 (LostSky Studio) - 通用工具函数
 * 🔒 此文件锁定，页面修改时不得改动
 */

/** 防抖 */
function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

/** 节流 */
function throttle(fn, interval = 300) {
    let last = 0;
    return function (...args) {
        const now = Date.now();
        if (now - last >= interval) {
            last = now;
            fn.apply(this, args);
        }
    };
}

/** 格式化数字（千分位） */
function formatNumber(n) {
    return Number(n).toLocaleString('zh-CN');
}

/** 获取 URL 查询参数 */
function getQueryParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
}
