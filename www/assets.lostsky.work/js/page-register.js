/**
 * 注册页面交互逻辑
 */

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
        text.textContent = '注册中...';
        spinner.classList.remove('hidden');
    } else {
        text.textContent = '注册并登录';
        spinner.classList.add('hidden');
    }
}

// 手机号简单正则验证 (中国大陆)
function isValidPhone(phone) {
    return /^1[3-9]\d{9}$/.test(phone);
}

// 提交注册
async function handleRegister(e) {
    e.preventDefault();
    hideError();
    
    const phoneVal = document.getElementById('input-phone').value.trim();
    const passwordVal = document.getElementById('input-password').value;
    const agreementChecked = document.getElementById('agreement').checked;
    
    if (!phoneVal || !passwordVal) {
        showError('请完整填写手机号和密码');
        return;
    }
    
    if (!isValidPhone(phoneVal)) {
        showError('请输入正确的手机号码');
        return;
    }
    
    if (passwordVal.length < 6) {
        showError('密码长度不能少于 6 位');
        return;
    }
    
    if (!agreementChecked) {
        showError('请阅读并同意《用户服务协议》与《隐私政策》');
        return;
    }
    
    setLoading(true);
    
    const payload = {
        phone: phoneVal,
        password: passwordVal,
        device_name: navigator.platform || 'Web Browser' // 简易识别
    };
    
    try {
        // 调用注册接口，成功后后端已自动登录发 Token
        const data = await apiPost('/register/phone', payload);
        saveAuth(data);
        
        // 注册并自动登录成功，跳转到控制台
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || '/teams';
        window.location.href = redirect;
        
    } catch (err) {
        showError(err.message || '注册失败，请稍后重试');
    } finally {
        setLoading(false);
    }
}
