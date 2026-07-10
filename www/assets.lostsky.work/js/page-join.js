(function () {
    const state = {
        fields: [],
        mine: [],
    };

    const statusText = {
        1: '已申请',
        2: '审核中',
        3: '已取消',
        4: '已加入',
        5: '已拒绝',
    };
    const statusValue = Object.fromEntries(Object.entries(statusText).map(([key, value]) => [value, Number(key)]));

    const fieldContainer = document.getElementById('join-fields');
    const mineList = document.getElementById('mine-list');
    const errorEl = document.getElementById('join-error');

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
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

    function inputType(field) {
        if (field.input_type === 'date') return 'date';
        if (field.input_type === 'datetime') return 'datetime-local';
        if (field.value_type === 'int' || field.value_type === 'decimal') return 'number';
        return 'text';
    }

    function renderControl(field) {
        const id = `join_field_${field.id}`;
        const required = Number(field.is_apply_required) === 1 ? 'required' : '';
        const common = `id="${id}" data-field-id="${field.id}" data-field-key="${escapeHtml(field.field_key)}" data-value-type="${escapeHtml(field.value_type)}" data-input-type="${escapeHtml(field.input_type)}" ${required}`;
        const value = field.default_value ?? '';
        const options = normalizeOptions(field.options);

        if (field.input_type === 'textarea' || field.value_type === 'text' || field.value_type === 'json') {
            return `<textarea ${common} rows="4" placeholder="${escapeHtml(field.name)}">${escapeHtml(value)}</textarea>`;
        }

        if (field.input_type === 'select') {
            return `<select ${common}>
                <option value="">请选择</option>
                ${options.map(opt => `<option value="${escapeHtml(opt.value)}" ${String(value) === opt.value ? 'selected' : ''}>${escapeHtml(opt.label)}</option>`).join('')}
            </select>`;
        }

        if (field.input_type === 'radio') {
            return `<div class="join-check-group" role="radiogroup" ${common}>
                ${options.map(opt => `<label class="join-check"><input type="radio" name="${id}" value="${escapeHtml(opt.value)}" ${String(value) === opt.value ? 'checked' : ''} ${required}>${escapeHtml(opt.label)}</label>`).join('')}
            </div>`;
        }

        if (field.input_type === 'checkbox') {
            if (field.value_type === 'bool') {
                const checked = value === 1 || String(value) === '1' || String(value).toLowerCase() === 'true';
                return `<label class="join-check"><input type="checkbox" ${common} ${checked ? 'checked' : ''}>是</label>`;
            }
            const values = Array.isArray(value) ? value.map(String) : String(value || '').split(',').filter(Boolean);
            return `<div class="join-check-group" ${common}>
                ${options.map(opt => `<label class="join-check"><input type="checkbox" name="${id}" value="${escapeHtml(opt.value)}" ${values.includes(opt.value) ? 'checked' : ''}>${escapeHtml(opt.label)}</label>`).join('')}
            </div>`;
        }

        if (field.input_type === 'upload') {
            return `<div class="join-upload">
                <input type="hidden" ${common} value="${escapeHtml(String(value || ''))}">
                <span id="${id}_status">${value ? '已上传' : '尚未上传'}</span>
                <input type="file" id="${id}_file" class="hidden" onchange="window.uploadJoinField(${field.id})">
                <button type="button" onclick="document.getElementById('${id}_file').click()">上传文件</button>
            </div>`;
        }

        return `<input type="${inputType(field)}" ${common} value="${escapeHtml(String(value || ''))}">`;
    }

    function renderFields() {
        document.getElementById('field-count').textContent = `${state.fields.length} 个字段`;
        if (!state.fields.length) {
            fieldContainer.innerHTML = '<div class="join-empty">当前团队暂未配置申请表单。</div>';
            return;
        }

        fieldContainer.innerHTML = state.fields.map(field => {
            const required = Number(field.is_apply_required) === 1 ? '<span class="join-required">*</span>' : '';
            const wide = ['textarea', 'upload'].includes(field.input_type) || ['text', 'json', 'multi_select'].includes(field.value_type);
            return `<div class="join-field" data-wide="${wide ? 'true' : 'false'}">
                <label for="join_field_${field.id}">${escapeHtml(field.name)} ${required}</label>
                ${renderControl(field)}
            </div>`;
        }).join('');
    }

    function collectValue(field) {
        const el = document.getElementById(`join_field_${field.id}`);
        if (!el) return null;

        if (field.input_type === 'radio') {
            return document.querySelector(`input[name="join_field_${field.id}"]:checked`)?.value || '';
        }
        if (field.input_type === 'checkbox') {
            if (field.value_type === 'bool') return el.checked ? 1 : 0;
            return Array.from(document.querySelectorAll(`input[name="join_field_${field.id}"]:checked`)).map(input => input.value);
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

    function collectValues() {
        const values = {};
        state.fields.forEach(field => {
            values[field.id] = collectValue(field);
        });
        return values;
    }

    function showError(message) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    }

    function clearError() {
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
    }

    function statusCode(value) {
        const code = Number(value);
        return Number.isFinite(code) && code > 0 ? code : (statusValue[value] || 0);
    }

    function statusLabel(value) {
        const code = statusCode(value);
        return statusText[code] || value || '未知状态';
    }

    async function uploadJoinFile(file) {
        const headers = {
            'X-Page-Id': getPageId(),
            'X-Request-Id': makeId(),
        };
        const token = getToken();
        if (token) headers.Authorization = 'Bearer ' + token;

        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(API_BASE + '/join/upload', {
            method: 'POST',
            headers,
            body: formData,
        });
        const json = await parseResponseJson(res);
        if (!res.ok || json.code !== 0) {
            throw new ApiError(json.message || '上传失败', { status: res.status, response: json });
        }
        return json.data;
    }

    window.uploadJoinField = async function (fieldId) {
        const fileInput = document.getElementById(`join_field_${fieldId}_file`);
        const valueInput = document.getElementById(`join_field_${fieldId}`);
        const status = document.getElementById(`join_field_${fieldId}_status`);
        const file = fileInput?.files?.[0];
        if (!file) return;

        try {
            status.textContent = '上传中...';
            const result = await uploadJoinFile(file);
            valueInput.value = result.url || '';
            status.textContent = result.name || '已上传';
        } catch (err) {
            status.textContent = '上传失败';
            notifyApiError(err);
        } finally {
            if (fileInput) fileInput.value = '';
        }
    };

    function valueText(item) {
        const field = item.field || {};
        const type = field.value_type || 'string';
        const value = {
            text: item.value_text,
            int: item.value_int,
            bool: item.value_int ? '是' : '否',
            decimal: item.value_decimal,
            date: item.value_datetime,
            datetime: item.value_datetime,
            multi_select: Array.isArray(item.value_json) ? item.value_json.join('，') : item.value_json,
            json: typeof item.value_json === 'object' ? JSON.stringify(item.value_json) : item.value_json,
        }[type] ?? item.value_string;
        return value === null || value === undefined || value === '' ? '未填写' : String(value);
    }

    function renderTasks(tasks) {
        if (!Array.isArray(tasks) || !tasks.length) {
            return '<div class="join-empty">管理员尚未设置审核任务。</div>';
        }
        return `<div class="join-task-list">${tasks.map(task => `
            <div class="join-task ${Number(task.is_passed) === 1 ? 'is-passed' : ''}">
                <div class="join-task-row">
                    <strong>${escapeHtml(task.title)}</strong>
                    <span class="join-status ${Number(task.is_passed) === 1 ? 's4' : 's2'}">${Number(task.is_passed) === 1 ? '已通过' : '暂未通过'}</span>
                </div>
                ${task.description ? `<small>${escapeHtml(task.description)}</small>` : ''}
            </div>
        `).join('')}</div>`;
    }

    function renderMine() {
        if (!state.mine.length) {
            mineList.innerHTML = '<div class="join-empty">还没有申请记录。</div>';
            return;
        }

        mineList.innerHTML = state.mine.map(item => {
            const code = statusCode(item.status);
            return `
            <article class="join-card">
                <div class="join-card-head">
                    <p class="join-card-title">申请 #${item.id}</p>
                    <span class="join-status s${code}">${escapeHtml(statusLabel(item.status))}</span>
                </div>
                <p class="join-meta">提交时间：${item.create_time || '-'}</p>
                ${renderTasks(item.tasks)}
                ${[1, 2].includes(code) ? `<button type="button" class="join-danger mt-3" onclick="window.cancelJoin(${item.id})">取消申请</button>` : ''}
            </article>
        `;
        }).join('');
    }

    window.cancelJoin = async function (id) {
        if (!confirm('确定取消这条加入申请吗？')) return;
        await apiPost('/join/cancel', { id });
        await loadMine();
    };

    async function loadForm() {
        state.fields = await apiGet('/join/form');
        renderFields();
    }

    async function loadMine() {
        state.mine = await apiGet('/join/mine');
        renderMine();
    }

    async function submitForm(event) {
        event.preventDefault();
        clearError();
        const submit = document.getElementById('join-submit');
        submit.disabled = true;
        submit.style.opacity = '0.7';

        try {
            await apiPost('/join/apply', {
                values: collectValues(),
                memo: document.getElementById('join-memo').value,
            });
            document.getElementById('join-form').reset();
            await loadMine();
        } catch (err) {
            showError(err.message || '提交失败');
        } finally {
            submit.disabled = false;
            submit.style.opacity = '1';
        }
    }

    async function boot() {
        try {
            await Promise.all([loadForm(), loadMine()]);
        } catch (err) {
            showError(err.message || '页面加载失败');
        }
    }

    document.getElementById('join-form').addEventListener('submit', submitForm);
    document.getElementById('reload-mine').addEventListener('click', loadMine);
    document.addEventListener('DOMContentLoaded', boot);
})();
