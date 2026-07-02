/**
 * 成员详情页专属交互逻辑
 */

// 从 URL 获取 member_id (如: /member-detail?id=123)
const urlParams = new URLSearchParams(window.location.search);
const memberId = urlParams.get('id');

let currentMember = null;
let allFields = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!memberId) {
        alert('缺少成员 ID 参数');
        window.location.href = '/members';
        return;
    }

    try {
        // 1. 获取成员基础信息
        currentMember = await window.apiGet('/member/get', { member_id: memberId });
        renderBasicInfo(currentMember);

        // 2. 获取所有字段定义与当前成员的值
        const [fieldsRes, valuesRes] = await Promise.all([
            window.apiGet('/memberField/index'),
            window.apiGet('/memberField/values', { member_id: memberId })
        ]);

        allFields = fieldsRes || [];
        const valuesMap = {};
        (valuesRes || []).forEach(val => {
            // 根据 value_type 取真实值
            let realValue = val.value_string;
            if (val.field?.value_type === 'int') realValue = val.value_int;
            if (val.field?.value_type === 'decimal') realValue = val.value_decimal;
            if (val.field?.value_type === 'datetime') realValue = val.value_datetime;
            if (val.field?.value_type === 'text') realValue = val.value_text;
            if (val.field?.value_type === 'json') realValue = val.value_json;
            valuesMap[val.field_id] = realValue;
        });

        renderCustomFields(allFields, valuesMap);

    } catch (err) {
        console.error(err);
        alert(err.message || '加载成员信息失败');
        if (err.message?.includes('不存在') || err.message?.includes('404')) {
            window.location.href = '/members';
        }
    }
});

function renderBasicInfo(member) {
    const p = member.profile || {};
    document.getElementById('display-name').textContent = p.nickname || `成员 ${member.user_id}`;
    document.getElementById('display-desc').textContent = p.description || '这家伙很懒，什么都没写...';
    if (p.avatar) document.getElementById('display-avatar').src = p.avatar;
    document.getElementById('display-user-id').textContent = member.user_id;

    const statusEl = document.getElementById('display-status');
    if (member.is_blocked) {
        statusEl.className = 'px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30';
        statusEl.textContent = '已封禁';
    } else if (!member.is_displayed) {
        statusEl.className = 'px-2 py-0.5 rounded text-xs bg-gray-500/20 text-gray-400 border border-gray-500/30';
        statusEl.textContent = '已隐藏';
    } else {
        statusEl.className = 'px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400 border border-green-500/30';
        statusEl.textContent = '展示中';
    }

    const posts = member.posts || [];
    const postsHtml = posts.map(post => `<span class="px-3 py-1 bg-white/10 border border-white/10 rounded-full text-xs text-gray-300">${escapeHtml(post.type?.name || '未知岗位')}</span>`).join('');
    document.getElementById('display-posts').innerHTML = postsHtml || '<span class="text-gray-500 text-sm">暂无分配岗位</span>';
}

function renderCustomFields(fields, valuesMap) {
    const container = document.getElementById('fields-container');
    
    if (!fields.length) {
        container.innerHTML = `<div class="col-span-full text-center py-8 text-gray-500">当前团队尚未定义任何自定义字段</div>`;
        return;
    }

    container.innerHTML = fields.map(field => {
        const val = valuesMap[field.id] !== undefined && valuesMap[field.id] !== null ? valuesMap[field.id] : '';
        const requiredMark = field.is_required ? `<span class="text-red-400">*</span>` : '';
        let inputHtml = '';

        // 根据 input_type 渲染不同的输入控件
        if (field.input_type === 'textarea') {
            inputHtml = `<textarea id="field_${field.id}" rows="3" class="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors admin-scroll" ${field.is_required?'required':''}>${escapeHtml(String(val))}</textarea>`;
        } else if (field.input_type === 'select' && field.options) {
            let opts = '';
            try {
                opts = field.options.map(o => `<option value="${escapeHtml(String(o.value))}" ${String(val) === String(o.value) ? 'selected' : ''}>${escapeHtml(o.label)}</option>`).join('');
            } catch(e){}
            inputHtml = `<select id="field_${field.id}" class="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary" ${field.is_required?'required':''}>
                <option value="">请选择</option>
                ${opts}
            </select>`;
        } else if (field.input_type === 'switch') {
            // 开关处理
            const checked = (String(val) === '1' || String(val) === 'true') ? 'checked' : '';
            inputHtml = `<label class="flex items-center cursor-pointer mt-2">
                <input type="checkbox" id="field_${field.id}" class="sr-only peer" ${checked}>
                <div class="page-member-detail-switch"></div>
            </label>`;
        } else {
            // 默认 text, number, image, file
            const type = field.input_type === 'number' ? 'number' : 'text';
            inputHtml = `<input type="${type}" id="field_${field.id}" value="${escapeHtml(String(val))}" class="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors" ${field.is_required?'required':''}>`;
        }

        // 占全宽的字段类型
        const colSpanClass = (field.input_type === 'textarea' || field.value_type === 'json' || field.value_type === 'text') ? 'col-span-full' : '';

        return `
            <div class="${colSpanClass}">
                <label for="field_${field.id}" class="block text-sm font-medium text-gray-300 mb-2">${escapeHtml(field.name)} ${requiredMark}</label>
                ${inputHtml}
                <p class="text-xs text-gray-500 mt-1">${escapeHtml(field.field_key)}</p>
            </div>
        `;
    }).join('');
}

document.getElementById('custom-fields-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgEl = document.getElementById('form-message');
    msgEl.className = 'hidden p-3 rounded-lg text-sm mt-6';

    const values = {};
    allFields.forEach(field => {
        const el = document.getElementById(`field_${field.id}`);
        if (!el) return;
        
        if (field.input_type === 'switch') {
            values[field.id] = el.checked ? 1 : 0;
        } else {
            let v = el.value;
            // 如果是数值类型并且为空，处理成 null 避免传空字符串给后端报错
            if ((field.value_type === 'int' || field.value_type === 'decimal') && v === '') {
                v = null;
            }
            // 如果是 json 类型，尝试转换以验证
            if (field.value_type === 'json' && v) {
                try {
                    v = JSON.parse(v);
                } catch(e) {
                    // ignore, 后端也会拦截
                }
            }
            values[field.id] = v;
        }
    });

    try {
        await window.apiPost('/memberField/saveValues', {
            member_id: parseInt(memberId),
            values: values
        });
        
        msgEl.textContent = '自定义字段保存成功';
        msgEl.classList.add('bg-green-500/10', 'border', 'border-green-500/20', 'text-green-400');
        msgEl.classList.remove('hidden');
        setTimeout(() => msgEl.classList.add('hidden'), 3000);
    } catch (err) {
        msgEl.textContent = err.message || '保存失败';
        msgEl.classList.add('bg-red-500/10', 'border', 'border-red-500/20', 'text-red-400');
        msgEl.classList.remove('hidden');
    }
});

function editBasicInfo() {
    // 暂跳转回 members.html 去操作基础弹窗，也可以在这里再写个弹窗。
    // 为了保持交互不跳出，这里建议后续优化为在这页直接提供弹窗
    alert('请返回成员列表点击"编辑"进行基础资料的修改。');
}

function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
