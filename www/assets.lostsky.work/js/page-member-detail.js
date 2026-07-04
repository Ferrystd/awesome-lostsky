/**
 * 成员详情页专属交互逻辑
 */

const urlParams = new URLSearchParams(window.location.search);
const memberId = urlParams.get('id');

let currentMember = null;
let allFields = [];

document.addEventListener('DOMContentLoaded', async () => {
    const memberDocsLink = document.getElementById('member-docs-link');
    if (memberDocsLink && memberId) {
        memberDocsLink.href = `/docs?target_type=teamMember&target_id=${encodeURIComponent(memberId)}`;
    }

    if (!memberId) {
        alert('缺少成员 ID 参数');
        window.location.href = '/members';
        return;
    }

    try {
        currentMember = await window.apiGet('/member/get', { member_id: memberId });
        renderBasicInfo(currentMember);

        const [fieldsRes, valuesRes] = await Promise.all([
            window.apiGet('/memberField/index'),
            window.apiGet('/memberField/values', { member_id: memberId })
        ]);

        allFields = fieldsRes || [];
        renderCustomFields(allFields, buildValuesMap(valuesRes || []));
    } catch (err) {
        console.error(err);
        alert(err.message || '加载成员信息失败');
        if (String(err.message || '').includes('404')) {
            window.location.href = '/members';
        }
    }
});

function renderBasicInfo(member) {
    const p = member.profile || {};
    document.getElementById('display-name').textContent = p.nickname || `成员 ${member.user_id}`;
    document.getElementById('display-desc').textContent = p.description || '暂无描述';
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

function buildValuesMap(values) {
    const map = {};
    values.forEach(item => {
        if (!item.field_id) return;
        map[item.field_id] = fieldValue(item.field || {}, item);
    });
    return map;
}

function fieldValue(field, item) {
    switch (field.value_type) {
        case 'text':
            return item.value_text || '';
        case 'int':
        case 'bool':
            return item.value_int ?? '';
        case 'decimal':
            return item.value_decimal ?? '';
        case 'date':
        case 'datetime':
            return item.value_datetime || '';
        case 'multi_select':
        case 'json':
            return item.value_json || [];
        default:
            return item.value_string || '';
    }
}

function renderCustomFields(fields, valuesMap) {
    const container = document.getElementById('fields-container');
    if (!fields.length) {
        container.innerHTML = '<div class="col-span-full text-center py-8 text-gray-500">当前团队尚未定义任何自定义字段</div>';
        return;
    }

    container.innerHTML = fields.map(field => {
        const val = valuesMap[field.id] ?? '';
        const requiredMark = field.is_required ? '<span class="text-red-400">*</span>' : '';
        const disabledText = Number(field.is_editable) === 0 ? '<span class="ml-2 text-xs text-gray-500">只读</span>' : '';
        const colSpanClass = ['textarea', 'upload'].includes(field.input_type) || ['json', 'text', 'multi_select'].includes(field.value_type) ? 'col-span-full' : '';

        return `
            <div class="${colSpanClass}">
                <label for="field_${field.id}" class="block text-sm font-medium text-gray-300 mb-2">${escapeHtml(field.name)} ${requiredMark}${disabledText}</label>
                ${renderFieldControl(field, val)}
                <p class="text-xs text-gray-500 mt-1">${escapeHtml(field.field_key)}</p>
            </div>
        `;
    }).join('');
}

function renderFieldControl(field, value) {
    const disabled = Number(field.is_editable) === 0 ? 'disabled' : '';
    const required = field.is_required ? 'required' : '';
    const common = `data-field-id="${field.id}" data-value-type="${escapeHtml(field.value_type)}" data-input-type="${escapeHtml(field.input_type)}" ${disabled} ${required}`;
    const options = normalizeOptions(field.options);

    if (field.input_type === 'textarea' || field.value_type === 'text' || field.value_type === 'json') {
        const textValue = field.value_type === 'json' && value ? JSON.stringify(value) : String(value || '');
        return `<textarea id="field_${field.id}" rows="3" class="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors admin-scroll disabled:opacity-60" ${common}>${escapeHtml(textValue)}</textarea>`;
    }

    if (field.input_type === 'select') {
        return `<select id="field_${field.id}" class="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary disabled:opacity-60" ${common}>
            <option value="">请选择</option>
            ${options.map(opt => `<option value="${escapeHtml(opt.value)}" ${String(value) === opt.value ? 'selected' : ''}>${escapeHtml(opt.label)}</option>`).join('')}
        </select>`;
    }

    if (field.input_type === 'radio') {
        return `<div id="field_${field.id}" class="flex flex-wrap gap-3" ${common}>
            ${options.map(opt => `<label class="flex items-center gap-2 text-sm text-gray-300"><input type="radio" name="field_${field.id}" value="${escapeHtml(opt.value)}" ${String(value) === opt.value ? 'checked' : ''} ${disabled} ${required} class="text-primary bg-black/30 border-white/10">${escapeHtml(opt.label)}</label>`).join('')}
        </div>`;
    }

    if (field.input_type === 'checkbox') {
        if (field.value_type === 'bool') {
            const checked = value === 1 || value === true || String(value) === '1' || String(value).toLowerCase() === 'true';
            return `<label class="flex items-center cursor-pointer mt-2">
                <input type="checkbox" id="field_${field.id}" class="sr-only peer" ${checked ? 'checked' : ''} ${common}>
                <div class="page-member-detail-switch"></div>
            </label>`;
        }
        const values = Array.isArray(value) ? value.map(String) : String(value || '').split(',').filter(Boolean);
        return `<div id="field_${field.id}" class="flex flex-wrap gap-3" ${common}>
            ${options.map(opt => `<label class="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" name="field_${field.id}" value="${escapeHtml(opt.value)}" ${values.includes(opt.value) ? 'checked' : ''} ${disabled} class="text-primary bg-black/30 border-white/10">${escapeHtml(opt.label)}</label>`).join('')}
        </div>`;
    }

    if (field.input_type === 'upload') {
        return `<div class="flex flex-col sm:flex-row gap-2">
            <input type="text" id="field_${field.id}" value="${escapeHtml(String(value || ''))}" class="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors disabled:opacity-60" ${common}>
            <input type="file" id="field_file_${field.id}" class="hidden" onchange="uploadCustomFieldFile(${field.id})" ${disabled}>
            <button type="button" onclick="document.getElementById('field_file_${field.id}').click()" class="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white disabled:opacity-60" ${disabled}>上传</button>
        </div>`;
    }

    const type = field.input_type === 'date' ? 'date' : (field.input_type === 'datetime' ? 'datetime-local' : (['int', 'decimal'].includes(field.value_type) ? 'number' : 'text'));
    const inputValue = ['date', 'datetime'].includes(field.value_type) ? formatDateInput(value, field.input_type) : String(value || '');
    return `<input type="${type}" id="field_${field.id}" value="${escapeHtml(inputValue)}" class="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors disabled:opacity-60" ${common}>`;
}

function normalizeOptions(options) {
    if (!Array.isArray(options)) return [];
    return options.map(item => {
        if (typeof item === 'string') return { label: item, value: item };
        return {
            label: String(item.label ?? item.name ?? item.value ?? ''),
            value: String(item.value ?? item.label ?? item.name ?? ''),
        };
    });
}

function formatDateInput(value, inputType) {
    if (!value) return '';
    const date = /^\d+$/.test(String(value)) ? new Date(Number(value) * 1000) : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    const pad = number => String(number).padStart(2, '0');
    const ymd = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    if (inputType !== 'datetime') return ymd;
    return `${ymd}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function uploadCustomFieldFile(id) {
    const fileInput = document.getElementById(`field_file_${id}`);
    const textInput = document.getElementById(`field_${id}`);
    const file = fileInput?.files?.[0];
    if (!file) return;
    try {
        const result = await window.apiUpload(file);
        textInput.value = result.url || '';
    } catch (err) {
        alert(err.message || '上传失败');
    } finally {
        if (fileInput) fileInput.value = '';
    }
}

document.getElementById('custom-fields-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgEl = document.getElementById('form-message');
    msgEl.className = 'hidden p-3 rounded-lg text-sm mt-6';

    const values = {};
    allFields.forEach(field => {
        if (Number(field.is_editable) === 0) return;
        const el = document.getElementById(`field_${field.id}`);
        if (!el) return;
        values[field.id] = collectFieldValue(field, el);
    });

    try {
        await window.apiPost('/memberField/saveValues', {
            member_id: parseInt(memberId, 10),
            values
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

function collectFieldValue(field, el) {
    if (field.input_type === 'radio') {
        return document.querySelector(`input[name="field_${field.id}"]:checked`)?.value || '';
    }
    if (field.input_type === 'checkbox') {
        if (field.value_type === 'bool') return el.checked ? 1 : 0;
        return Array.from(document.querySelectorAll(`input[name="field_${field.id}"]:checked`)).map(input => input.value);
    }

    let value = el.value;
    if ((field.value_type === 'int' || field.value_type === 'decimal') && value === '') return null;
    if (field.value_type === 'json' && value) {
        try {
            value = JSON.parse(value);
        } catch (e) {}
    }
    return value;
}

function editBasicInfo() {
    window.location.href = `/members?edit=${encodeURIComponent(memberId)}`;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
