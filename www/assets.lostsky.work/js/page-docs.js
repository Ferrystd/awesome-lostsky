const docParams = new URLSearchParams(window.location.search);

const visibilityLabels = {
    1: '团队管理可见',
    2: '团队管理可见，不含成员本人',
    3: '成员本人和团队管理可见',
    4: '团队成员可见',
    5: '公开可见',
    6: '指定对象可见'
};

const state = {
    page: 1,
    docs: [],
    members: [],
    targetType: docParams.get('target_type') === 'teamMember' ? 'teamMember' : 'team',
    targetId: docParams.get('target_id') || ''
};

document.addEventListener('DOMContentLoaded', async () => {
    bindEvents();
    await loadMembers();
    syncTargetControls();
    await loadDocuments(1);

    if (docParams.get('create') === '1') {
        openDocumentModal();
        return;
    }

    const editId = Number(docParams.get('edit') || 0);
    if (editId) {
        const doc = state.docs.find(item => Number(item.id) === editId) || await window.apiGet('/doc/get', { id: editId });
        openDocumentModal(doc);
    }
});

function bindEvents() {
    document.getElementById('target-type').addEventListener('change', async (event) => {
        state.targetType = event.target.value;
        state.targetId = document.getElementById('target-member').value || '';
        syncTargetControls();
        await loadDocuments(1);
    });

    document.getElementById('target-member').addEventListener('change', async (event) => {
        state.targetId = event.target.value;
        await loadDocuments(1);
    });

    document.getElementById('filter-keyword').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') loadDocuments(1);
    });

    document.getElementById('form-content').addEventListener('input', updateFormPreview);
    document.getElementById('form-manager-scope').addEventListener('change', () => renderVisibilityOptions());
}

async function loadMembers() {
    try {
        state.members = await window.apiGet('/member/index') || [];
        const select = document.getElementById('target-member');
        select.innerHTML = state.members.map(member => {
            const profile = member.profile || {};
            const name = profile.nickname || `成员 ${member.id}`;
            return `<option value="${member.id}">${escapeHtml(name)} #${member.id}</option>`;
        }).join('');

        if (!state.targetId && state.members.length) {
            state.targetId = String(state.members[0].id);
        }
        if (state.targetId) {
            select.value = state.targetId;
        }
    } catch (err) {
        state.members = [];
    }
}

function syncTargetControls() {
    const typeSelect = document.getElementById('target-type');
    const memberWrap = document.getElementById('target-member-wrap');
    typeSelect.value = state.targetType;
    memberWrap.classList.toggle('hidden', state.targetType !== 'teamMember');
    syncManagerScopeControl();
    renderVisibilityOptions();
    updateSummary();
}

function renderVisibilityOptions(selected) {
    const select = document.getElementById('form-visibility');
    const managerScope = Number(document.getElementById('form-manager-scope').value || 1);
    let options = [[1, '团队管理可见'], [4, '团队成员可见'], [5, '公开可见']];

    if (state.targetType === 'teamMember') {
        options = managerScope === 1
            ? [[2, '团队管理可见，不含成员本人'], [3, '成员本人和团队管理可见'], [5, '公开可见']]
            : [[3, '成员本人和团队管理可见'], [4, '团队成员可见'], [5, '公开可见']];
    }

    select.innerHTML = options.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
    select.value = String(selected || options[0][0]);
    if (!select.value) {
        select.value = String(options[0][0]);
    }
}

function syncManagerScopeControl(value) {
    const wrap = document.getElementById('form-manager-wrap');
    const select = document.getElementById('form-manager-scope');
    wrap.classList.toggle('hidden', state.targetType !== 'teamMember');
    select.value = String(state.targetType === 'teamMember' ? (value || 2) : 1);
}

async function loadDocuments(page = 1) {
    state.page = page;
    const listEl = document.getElementById('doc-list');
    listEl.innerHTML = '<div class="col-span-full rounded-2xl border border-slate-200 bg-white py-12 text-center text-slate-500 shadow-sm">正在加载文档...</div>';

    if (state.targetType === 'teamMember' && !state.targetId) {
        listEl.innerHTML = '<div class="col-span-full rounded-2xl border border-slate-200 bg-white py-12 text-center text-slate-500 shadow-sm">请先选择一个成员。</div>';
        renderPagination(0, 12, 1);
        updateSummary();
        return;
    }

    const params = {
        page,
        limit: 12,
        keyword: document.getElementById('filter-keyword').value.trim(),
        visibility: document.getElementById('filter-visibility').value,
        target_type: state.targetType
    };
    if (state.targetType === 'teamMember') {
        params.target_id = state.targetId;
    }

    try {
        const res = await window.apiGet('/doc', params);
        state.docs = res?.list || [];
        renderDocumentList(state.docs);
        renderPagination(res?.total || state.docs.length, res?.limit || 12, page);
        updateSummary(res?.total || state.docs.length);
    } catch (err) {
        listEl.innerHTML = `<div class="col-span-full rounded-2xl border border-red-100 bg-red-50 py-12 text-center text-red-600 shadow-sm">${escapeHtml(err.message || '加载失败')}</div>`;
        document.getElementById('doc-summary').textContent = '文档索引加载失败';
    }
}

function renderDocumentList(list) {
    const listEl = document.getElementById('doc-list');
    if (!list.length) {
        listEl.innerHTML = '<div class="col-span-full rounded-2xl border border-slate-200 bg-white py-12 text-center text-slate-500 shadow-sm">暂无文档</div>';
        return;
    }

    listEl.innerHTML = list.map(doc => {
        const viewUrl = documentUrl(doc.id);
        return `
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_14px_32px_rgba(15,23,42,0.10)] flex flex-col min-h-[220px]">
            <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                    <a href="${viewUrl}" class="block text-lg font-semibold text-slate-950 hover:text-sky-700 transition-colors truncate">${escapeHtml(doc.title || '未命名文档')}</a>
                    <p class="mt-2 text-sm text-slate-500 line-clamp-3">${escapeHtml(stripMarkdown(doc.content || '') || '暂无内容')}</p>
                </div>
                <span class="shrink-0 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-500 font-mono border border-slate-200">#${doc.id}</span>
            </div>
            <div class="mt-auto pt-5 flex flex-wrap items-center justify-between gap-3">
                <div class="flex flex-wrap gap-2 text-xs">
                    <span class="px-2 py-1 rounded bg-sky-50 text-sky-700 border border-sky-100">${escapeHtml(visibilityLabels[Number(doc.visibility)] || '未知范围')}</span>
                    <span class="px-2 py-1 rounded bg-slate-50 text-slate-500 border border-slate-200">更新 ${formatDate(doc.update_time || doc.create_time)}</span>
                </div>
                <div class="flex gap-2">
                    <a href="${viewUrl}" class="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-sm text-slate-700 transition-colors">查看</a>
                    <button type="button" onclick="openDocumentModalById(${doc.id})" class="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-sm text-slate-700 transition-colors">编辑</button>
                    <button type="button" onclick="deleteDocument(${doc.id})" class="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-100 text-sm text-red-600 transition-colors">删除</button>
                </div>
            </div>
        </article>`;
    }).join('');
}

function renderPagination(total, limit, current) {
    const wrap = document.getElementById('pagination');
    const totalPages = Math.ceil(total / limit);
    if (totalPages <= 1) {
        wrap.innerHTML = '';
        return;
    }

    let html = '';
    if (current > 1) html += `<button onclick="loadDocuments(${current - 1})" class="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 text-sm text-slate-700">上一页</button>`;
    html += `<span class="px-3 py-1 text-sm text-slate-500">第 ${current} / ${totalPages} 页</span>`;
    if (current < totalPages) html += `<button onclick="loadDocuments(${current + 1})" class="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 text-sm text-slate-700">下一页</button>`;
    wrap.innerHTML = html;
}

function updateSummary(total = state.docs.length) {
    const targetName = state.targetType === 'teamMember' ? selectedMemberName() : '团队';
    document.getElementById('doc-summary').textContent = `${targetName}文档，共 ${total} 篇`;
}

function selectedMemberName() {
    const member = state.members.find(item => String(item.id) === String(state.targetId));
    const profile = member?.profile || {};
    return profile.nickname || (member ? `成员 ${member.id}` : '成员');
}

function openDocumentModalById(id) {
    const doc = state.docs.find(item => Number(item.id) === Number(id));
    if (doc) openDocumentModal(doc);
}

function openDocumentModal(doc = null) {
    const isEdit = !!doc;
    document.getElementById('modal-title').textContent = isEdit ? '编辑文档' : '新增文档';
    document.getElementById('form-id').value = isEdit ? doc.id : '';
    document.getElementById('form-title').value = isEdit ? (doc.title || '') : '';
    document.getElementById('form-sort').value = isEdit ? Number(doc.sort || 0) : 0;
    syncManagerScopeControl(isEdit ? doc.manager_scope : undefined);
    renderVisibilityOptions(isEdit ? doc.visibility : undefined);
    document.getElementById('form-content').value = isEdit ? (doc.content || '') : '';
    document.getElementById('form-error').classList.add('hidden');
    updateFormPreview();
    window.openModal('doc-modal');
}

async function submitDocumentForm() {
    const id = document.getElementById('form-id').value;
    const errorEl = document.getElementById('form-error');
    const payload = {
        title: document.getElementById('form-title').value.trim(),
        content: document.getElementById('form-content').value,
        manager_scope: Number(document.getElementById('form-manager-scope').value || 1),
        visibility: Number(document.getElementById('form-visibility').value),
        sort: Number(document.getElementById('form-sort').value) || 0,
        target_type: state.targetType
    };

    if (state.targetType === 'teamMember') {
        payload.target_id = Number(state.targetId);
    }

    if (!payload.title) {
        errorEl.textContent = '文档标题不能为空';
        errorEl.classList.remove('hidden');
        return;
    }

    try {
        if (id) {
            await window.apiPost('/doc/edit', { ...payload, id: Number(id) });
        } else {
            await window.apiPost('/doc/create', payload);
        }
        window.closeModal('doc-modal');
        await loadDocuments(state.page);
    } catch (err) {
        errorEl.textContent = err.message || '保存失败';
        errorEl.classList.remove('hidden');
    }
}

async function deleteDocument(id) {
    const doc = state.docs.find(item => Number(item.id) === Number(id));
    if (!confirm(`确定删除“${doc?.title || '未命名文档'}”吗？`)) return;
    try {
        await window.apiPost('/doc/delete', { id });
        await loadDocuments(state.page);
    } catch (err) {
        alert(err.message || '删除失败');
    }
}

function documentUrl(id) {
    const params = new URLSearchParams({ id });
    params.set('target_type', state.targetType);
    if (state.targetType === 'teamMember' && state.targetId) {
        params.set('target_id', state.targetId);
    }
    return `/doc?${params.toString()}`;
}

function updateFormPreview() {
    document.getElementById('form-preview').innerHTML = renderMarkdown(document.getElementById('form-content').value);
}

function renderMarkdown(markdown) {
    const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
    let html = '';
    let inCode = false;
    let listType = '';
    const closeList = () => {
        if (listType) {
            html += `</${listType}>`;
            listType = '';
        }
    };

    lines.forEach(line => {
        if (line.trim().startsWith('```')) {
            closeList();
            html += inCode ? '</code></pre>' : '<pre class="my-4 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 text-sm text-gray-300"><code>';
            inCode = !inCode;
            return;
        }
        if (inCode) {
            html += escapeHtml(line) + '\n';
            return;
        }

        const trimmed = line.trim();
        if (!trimmed) {
            closeList();
            return;
        }

        const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
        if (heading) {
            closeList();
            const level = heading[1].length;
            const size = level === 1 ? 'text-3xl' : level === 2 ? 'text-2xl' : 'text-xl';
            html += `<h${level} class="${size} font-bold text-white mt-6 mb-3">${inlineMarkdown(heading[2])}</h${level}>`;
            return;
        }

        const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
        const unordered = trimmed.match(/^[-*]\s+(.+)$/);
        if (ordered || unordered) {
            const nextType = ordered ? 'ol' : 'ul';
            if (listType !== nextType) {
                closeList();
                html += `<${nextType} class="my-3 ${nextType === 'ol' ? 'list-decimal' : 'list-disc'} pl-6 space-y-1">`;
                listType = nextType;
            }
            html += `<li>${inlineMarkdown((ordered || unordered)[1])}</li>`;
            return;
        }

        const quote = trimmed.match(/^>\s?(.+)$/);
        if (quote) {
            closeList();
            html += `<blockquote class="my-4 border-l-2 border-primary/60 bg-white/[0.03] pl-4 py-2 text-gray-400">${inlineMarkdown(quote[1])}</blockquote>`;
            return;
        }

        closeList();
        html += `<p class="my-3">${inlineMarkdown(trimmed)}</p>`;
    });

    closeList();
    if (inCode) html += '</code></pre>';
    return html || '<div class="text-gray-500 text-center py-10">暂无内容</div>';
}

function inlineMarkdown(text) {
    return escapeHtml(text)
        .replace(/`([^`]+)`/g, '<code class="rounded bg-black/40 px-1.5 py-0.5 text-primary">$1</code>')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:text-sky-300 underline underline-offset-4">$1</a>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function stripMarkdown(value) {
    return String(value || '')
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/[#>*_`[\]()\-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function formatDate(value) {
    const timestamp = Number(value || 0);
    if (!timestamp) return '未记录';
    return new Date(timestamp * 1000).toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
