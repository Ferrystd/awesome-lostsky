(function () {
    const state = {
        page: 1,
        limit: 20,
        list: [],
        selectedId: 0,
        detail: null,
    };

    const statusText = {
        1: '已申请',
        2: '审核中',
        3: '已取消',
        4: '已加入',
        5: '已拒绝',
    };
    const statusValue = Object.fromEntries(Object.entries(statusText).map(([key, value]) => [value, Number(key)]));

    const statusClass = {
        1: 'bg-sky-50 text-sky-700 border-sky-100',
        2: 'bg-amber-50 text-amber-700 border-amber-100',
        3: 'bg-slate-100 text-slate-500 border-slate-200',
        4: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        5: 'bg-red-50 text-red-700 border-red-100',
    };

    const listEl = document.getElementById('application-list');
    const detailEl = document.getElementById('application-detail');

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatTime(raw) {
        if (!raw) return '-';
        const value = Number(raw);
        const date = Number.isFinite(value)
            ? new Date(value > 10000000000 ? value : value * 1000)
            : new Date(raw);
        return Number.isNaN(date.getTime()) ? String(raw) : date.toLocaleString('zh-CN');
    }

    function userName(item) {
        const user = item.user || {};
        const profile = user.profile || {};
        return profile.nickname || user.nickname || user.username || user.phone || user.email || `User #${item.user_id}`;
    }

    function statusCode(value) {
        const code = Number(value);
        return Number.isFinite(code) && code > 0 ? code : (statusValue[value] || 0);
    }

    function status(item) {
        const code = statusCode(item.status);
        return statusText[code] || item.status || '未知状态';
    }

    function statusBadge(item) {
        const cls = statusClass[statusCode(item.status)] || 'bg-slate-100 text-slate-500 border-slate-200';
        return `<span class="inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-medium ${cls}">${escapeHtml(status(item))}</span>`;
    }

    function valueText(item) {
        const field = item.field || {};
        const type = field.value_type || 'string';
        const value = {
            text: item.value_text,
            int: item.value_int,
            bool: item.value_int ? '是' : '否',
            decimal: item.value_decimal,
            date: item.value_datetime ? formatTime(item.value_datetime) : '',
            datetime: item.value_datetime ? formatTime(item.value_datetime) : '',
            multi_select: Array.isArray(item.value_json) ? item.value_json.join('、') : item.value_json,
            json: typeof item.value_json === 'object' ? JSON.stringify(item.value_json) : item.value_json,
        }[type] ?? item.value_string;
        return value === null || value === undefined || value === '' ? '未填写' : String(value);
    }

    function canEdit(item) {
        return item && [1, 2].includes(statusCode(item.status));
    }

    function renderList() {
        if (!state.list.length) {
            listEl.innerHTML = '<div class="p-5 text-sm text-slate-500">当前没有匹配的申请。</div>';
            return;
        }

        listEl.innerHTML = state.list.map(item => `
            <button type="button" class="block w-full p-5 text-left transition-colors hover:bg-slate-50 ${state.selectedId === Number(item.id) ? 'bg-sky-50/70' : 'bg-white'}" onclick="window.selectJoinApplication(${Number(item.id)})">
                <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                        <p class="font-medium text-slate-950 truncate">${escapeHtml(userName(item))}</p>
                        <p class="mt-1 text-xs text-slate-500">申请 #${item.id} · User #${item.user_id} · ${escapeHtml(formatTime(item.create_time))}</p>
                    </div>
                    ${statusBadge(item)}
                </div>
            </button>
        `).join('');
    }

    function renderValues(values) {
        if (!Array.isArray(values) || !values.length) {
            return '<div class="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">没有申请字段值。</div>';
        }

        return `<div class="grid grid-cols-1 md:grid-cols-2 gap-3">${values.map(value => `
            <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-medium text-slate-500">${escapeHtml(value.field?.name || `字段 #${value.field_id}`)}</p>
                <p class="mt-1 text-sm font-medium text-slate-950 break-words">${escapeHtml(valueText(value))}</p>
            </div>
        `).join('')}</div>`;
    }

    function taskInputClass() {
        return 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-50 disabled:text-slate-400';
    }

    function renderTask(task, index) {
        const disabled = canEdit(state.detail) ? '' : 'disabled';
        const change = task.id ? `onchange="window.toggleJoinTaskPassed(${Number(task.id)}, this.checked)"` : '';
        return `<div class="rounded-lg border border-slate-200 bg-white p-4" data-task-index="${index}" data-task-id="${task.id || ''}">
            <div class="flex flex-col gap-3">
                <label class="text-sm font-medium text-slate-700">审核任务 ${index + 1}</label>
                <input class="${taskInputClass()}" type="text" value="${escapeHtml(task.title || '')}" placeholder="任务标题" ${disabled} data-task-title>
                <textarea class="${taskInputClass()}" rows="2" placeholder="任务说明" ${disabled} data-task-description>${escapeHtml(task.description || '')}</textarea>
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <label class="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" ${Number(task.is_passed) === 1 ? 'checked' : ''} ${disabled} ${change} data-task-passed>
                        已通过
                    </label>
                    ${canEdit(state.detail) ? `<button type="button" class="text-sm font-medium text-red-600 hover:text-red-700" onclick="window.removeJoinTask(${index})">删除任务</button>` : ''}
                </div>
            </div>
        </div>`;
    }

    function readTasksFromDom() {
        return Array.from(detailEl.querySelectorAll('[data-task-index]')).map((row, index) => ({
            title: row.querySelector('[data-task-title]').value,
            description: row.querySelector('[data-task-description]').value,
            is_passed: row.querySelector('[data-task-passed]').checked ? 1 : 0,
            sort: (index + 1) * 10,
        })).filter(task => task.title.trim() !== '');
    }

    function renderTasks(tasks) {
        const list = Array.isArray(tasks) ? tasks : [];
        return `<div class="grid gap-3">
            ${list.length ? list.map(renderTask).join('') : '<div class="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">尚未设置审核任务。</div>'}
        </div>
        ${canEdit(state.detail) ? `<div class="mt-3 flex flex-wrap gap-2">
            <button type="button" class="inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors" onclick="window.addJoinTask()">添加任务</button>
            <button type="button" class="inline-flex min-h-10 items-center rounded-lg bg-sky-600 px-4 text-sm font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors" onclick="window.saveJoinTasks()">保存任务</button>
        </div>` : ''}`;
    }

    function renderDetail() {
        const item = state.detail;
        if (!item) {
            detailEl.innerHTML = '<div class="text-sm text-slate-500">暂无选中的申请。</div>';
            return;
        }

        detailEl.innerHTML = `
            <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div class="min-w-0">
                        <p class="text-lg font-semibold text-slate-950">${escapeHtml(userName(item))}</p>
                        <p class="mt-1 text-sm text-slate-500">申请 #${item.id} · User #${item.user_id} · ${escapeHtml(formatTime(item.create_time))}</p>
                    </div>
                    ${statusBadge(item)}
                </div>
                ${item.memo ? `<p class="mt-3 text-sm text-slate-600">备注：${escapeHtml(item.memo)}</p>` : ''}
            </div>

            <section class="mt-6">
                <div class="mb-3">
                    <h3 class="text-base font-semibold text-slate-950">申请资料</h3>
                    <p class="mt-1 text-sm text-slate-500">申请人提交的表单内容。</p>
                </div>
                ${renderValues(item.values)}
            </section>

            <section class="mt-6">
                <div class="mb-3">
                    <h3 class="text-base font-semibold text-slate-950">审核任务</h3>
                    <p class="mt-1 text-sm text-slate-500">任务通过状态仅管理员可维护。</p>
                </div>
                ${renderTasks(item.tasks)}
            </section>

            <div class="mt-6 flex flex-wrap gap-2">
                ${canEdit(item) ? `
                    <button type="button" class="inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors" onclick="window.reviewJoinApplication()">进入审核中</button>
                    <button type="button" class="inline-flex min-h-10 items-center rounded-lg bg-sky-600 px-4 text-sm font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors" onclick="window.approveJoinApplication()">同意加入</button>
                    <button type="button" class="inline-flex min-h-10 items-center rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors" onclick="window.rejectJoinApplication()">拒绝</button>
                ` : '<div class="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">当前状态已结束，不能继续操作。</div>'}
            </div>
        `;
    }

    async function loadList() {
        const status = document.getElementById('status-filter').value;
        const result = await apiGet('/joinReview/index', {
            status,
            page: state.page,
            limit: state.limit,
        });
        state.list = result.list || [];
        if (!state.selectedId && state.list.length) state.selectedId = Number(state.list[0].id);
        renderList();
        if (state.selectedId) await loadDetail(state.selectedId);
        if (!state.list.length) {
            state.detail = null;
            renderDetail();
        }
    }

    async function loadDetail(id) {
        state.selectedId = Number(id);
        state.detail = await apiGet('/joinReview/get', { id });
        renderList();
        renderDetail();
    }

    window.selectJoinApplication = loadDetail;

    window.addJoinTask = function () {
        if (!state.detail) return;
        const tasks = readTasksFromDom();
        tasks.push({ title: '', description: '', is_passed: 0, sort: (tasks.length + 1) * 10 });
        state.detail.tasks = tasks;
        renderDetail();
    };

    window.removeJoinTask = function (index) {
        const tasks = readTasksFromDom();
        tasks.splice(index, 1);
        state.detail.tasks = tasks;
        renderDetail();
    };

    window.saveJoinTasks = async function () {
        if (!state.detail) return;
        await apiPost('/joinReview/saveTasks', {
            id: state.detail.id,
            tasks: readTasksFromDom(),
        });
        await loadDetail(state.detail.id);
        await loadList();
    };

    window.toggleJoinTaskPassed = async function (taskId, checked) {
        if (!state.detail || !taskId) return;
        await apiPost('/joinReview/setTaskPassed', {
            id: state.detail.id,
            task_id: taskId,
            is_passed: checked ? 1 : 0,
        });
        await loadDetail(state.detail.id);
    };

    window.reviewJoinApplication = async function () {
        if (!state.detail) return;
        await apiPost('/joinReview/review', { id: state.detail.id });
        await loadList();
    };

    window.approveJoinApplication = async function () {
        if (!state.detail || !confirm('确定同意该用户加入团队吗？')) return;
        await apiPost('/joinReview/approve', { id: state.detail.id });
        await loadList();
    };

    window.rejectJoinApplication = async function () {
        if (!state.detail) return;
        const memo = prompt('请输入拒绝原因');
        if (!memo) return;
        await apiPost('/joinReview/reject', { id: state.detail.id, memo });
        await loadList();
    };

    async function boot() {
        try {
            await loadList();
        } catch (err) {
            detailEl.innerHTML = `<div class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">${escapeHtml(err.message || '页面加载失败')}</div>`;
        }
    }

    document.getElementById('status-filter').addEventListener('change', () => {
        state.selectedId = 0;
        state.detail = null;
        loadList();
    });
    document.getElementById('reload-detail').addEventListener('click', () => {
        if (state.selectedId) {
            loadDetail(state.selectedId);
        } else {
            loadList();
        }
    });
    document.addEventListener('DOMContentLoaded', boot);
})();
