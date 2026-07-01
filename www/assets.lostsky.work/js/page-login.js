/**
 * 登录页面交互逻辑
 */

let currentMode = 'phone'; // 'phone' | 'account'

// 切换登录方式
function switchTab(mode) {
    if (mode === currentMode) return;
    currentMode = mode;
    
    const tabPhone = document.getElementById('tab-phone');
    const tabAccount = document.getElementById('tab-account');
    const labelAccount = document.getElementById('label-account');
    const inputAccount = document.getElementById('input-account');

    if (mode === 'phone') {
        // UI
        tabPhone.classList.add('page-login-tab-active');
        tabPhone.classList.remove('text-gray-400', 'hover:text-white');
        tabAccount.classList.remove('page-login-tab-active');
        tabAccount.classList.add('text-gray-400', 'hover:text-white');
        
        // Form
        labelAccount.textContent = '手机号码';
        inputAccount.placeholder = '请输入手机号';
        inputAccount.type = 'text'; // keep as text, HTML5 'tel' is fine but 'text' is safer for formatting
        inputAccount.value = '';
    } else {
        // UI
        tabAccount.classList.add('page-login-tab-active');
        tabAccount.classList.remove('text-gray-400', 'hover:text-white');
        tabPhone.classList.remove('page-login-tab-active');
        tabPhone.classList.add('text-gray-400', 'hover:text-white');
        
        // Form
        labelAccount.textContent = '登录账号';
        inputAccount.placeholder = '请输入用户名或邮箱';
        inputAccount.type = 'text';
        inputAccount.value = '';
    }
    
    hideError();
    inputAccount.focus();
}

// 密码可见性切换
function togglePassword() {
    const input = document.getElementById('input-password');
    const iconClosed = document.getElementById('icon-eye-closed');
    const iconOpen = document.getElementById('icon-eye-open');
    
    if (input.type === 'password') {
        input.type = 'text';
        iconClosed.classList.add('hidden');
        iconOpen.classList.remove('hidden');
    } else {
        input.type = 'password';
        iconClosed.classList.remove('hidden');
        iconOpen.classList.add('hidden');
    }
}

// 错误提示
function showError(msg) {
    const alertBox = document.getElementById('error-alert');
    const msgSpan = document.getElementById('error-message');
    msgSpan.textContent = msg;
    alertBox.classList.remove('hidden');
}

function hideError() {
    const alertBox = document.getElementById('error-alert');
    alertBox.classList.add('hidden');
}

// 按钮状态
function setLoading(isLoading) {
    const btn = document.getElementById('btn-submit');
    const text = document.getElementById('btn-text');
    const spinner = document.getElementById('btn-spinner');
    
    btn.disabled = isLoading;
    if (isLoading) {
        text.textContent = '登录中...';
        spinner.classList.remove('hidden');
    } else {
        text.textContent = '立即登录';
        spinner.classList.add('hidden');
    }
}

// 提交登录
async function handleLogin(e) {
    e.preventDefault();
    hideError();
    
    const accountVal = document.getElementById('input-account').value.trim();
    const passwordVal = document.getElementById('input-password').value;
    
    if (!accountVal || !passwordVal) {
        showError('请完整填写账号和密码');
        return;
    }
    
    setLoading(true);
    
    const payload = {
        password: passwordVal,
        device_name: navigator.platform || 'Web Browser' // 简易识别
    };
    
    const apiPath = currentMode === 'phone' ? '/login/phone' : '/login/password';
    if (currentMode === 'phone') {
        payload.phone = accountVal;
    } else {
        payload.account = accountVal;
    }
    
    try {
        const data = await apiPost(apiPath, payload);
        // data 结构: { token, user: {...} }
        
        // 存储 token
        localStorage.setItem('lostsky_token', data.token);
        // 可选：存储一些用户信息
        localStorage.setItem('lostsky_user', JSON.stringify(data.user));
        
        // 登录成功，跳转回控制台或源站
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || '//console.lostsky.work';
        window.location.href = redirect;
        
    } catch (err) {
        showError(err.message || '登录失败，请稍后重试');
    } finally {
        setLoading(false);
    }
}
