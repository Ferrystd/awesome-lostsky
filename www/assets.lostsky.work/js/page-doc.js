const docViewParams = new URLSearchParams(window.location.search);
const docId = Number(docViewParams.get('id') || 0);

const docVisibilityLabels = {
    1: '团队管理可见',
    2: '团队管理可见，不含成员本人',
    3: '成员本人和团队管理可见',
    4: '团队成员可见',
    5: '公开可见',
    6: '指定对象可见'
};

document.addEventListener('DOMContentLoaded', async () => {
    if (!docId) {
        renderError('缺少文档 ID');
        return;
    }

    try {
        const doc = await window.apiGet('/doc/get', { id: docId });
        renderDocument(doc);
    } catch (err) {
        renderError(err.message || '文档加载失败');
    }
});

function renderDocument(doc) {
    const title = doc.title || '未命名文档';
    document.title = `${title} - 文档查看`;
    document.getElementById('doc-title').textContent = title;
    document.getElementById('doc-content').innerHTML = renderMarkdown(doc.content || '');
    document.getElementById('doc-meta').innerHTML = `
        <span class="px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">${escapeHtml(docVisibilityLabels[Number(doc.visibility)] || '未知范围')}</span>
        <span class="px-2 py-1 rounded bg-white/5 text-gray-400 border border-white/10">${escapeHtml(targetName(doc))}</span>
        <span class="px-2 py-1 rounded bg-white/5 text-gray-400 border border-white/10">更新 ${formatDate(doc.update_time || doc.create_time)}</span>
    `;

    const listUrl = listPageUrl(doc);
    document.getElementById('back-link').href = listUrl;
    document.getElementById('edit-link').href = `${listUrl}&edit=${encodeURIComponent(doc.id)}`;
}

function renderError(message) {
    document.getElementById('doc-title').textContent = '文档不可用';
    document.getElementById('doc-content').innerHTML = `<div class="text-center py-20 text-red-400">${escapeHtml(message)}</div>`;
    document.getElementById('doc-meta').innerHTML = '';
}

function targetName(doc) {
    return doc.documentable_type === 'teamMember' ? `成员文档 #${doc.documentable_id}` : '团队文档';
}

function listPageUrl(doc) {
    const params = new URLSearchParams({
        target_type: doc.documentable_type || 'team'
    });
    if (doc.documentable_type === 'teamMember') {
        params.set('target_id', doc.documentable_id || '');
    }
    return `/docs?${params.toString()}`;
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
            html += inCode ? '</code></pre>' : '<pre class="my-5 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 text-sm text-gray-300"><code>';
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
            html += `<h${level} class="${size} font-bold text-white mt-8 mb-3">${inlineMarkdown(heading[2])}</h${level}>`;
            return;
        }

        const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
        const unordered = trimmed.match(/^[-*]\s+(.+)$/);
        if (ordered || unordered) {
            const nextType = ordered ? 'ol' : 'ul';
            if (listType !== nextType) {
                closeList();
                html += `<${nextType} class="my-4 ${nextType === 'ol' ? 'list-decimal' : 'list-disc'} pl-6 space-y-2">`;
                listType = nextType;
            }
            html += `<li>${inlineMarkdown((ordered || unordered)[1])}</li>`;
            return;
        }

        const quote = trimmed.match(/^>\s?(.+)$/);
        if (quote) {
            closeList();
            html += `<blockquote class="my-5 border-l-2 border-primary/60 bg-white/[0.03] pl-4 py-3 text-gray-400">${inlineMarkdown(quote[1])}</blockquote>`;
            return;
        }

        closeList();
        html += `<p class="my-4">${inlineMarkdown(trimmed)}</p>`;
    });

    closeList();
    if (inCode) html += '</code></pre>';
    return html || '<div class="text-gray-500 text-center py-20">暂无内容</div>';
}

function inlineMarkdown(text) {
    return escapeHtml(text)
        .replace(/`([^`]+)`/g, '<code class="rounded bg-black/40 px-1.5 py-0.5 text-primary">$1</code>')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:text-sky-300 underline underline-offset-4">$1</a>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function formatDate(value) {
    const timestamp = Number(value || 0);
    if (!timestamp) return '未记录';
    return new Date(timestamp * 1000).toLocaleDateString('zh-CN', {
        year: 'numeric',
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
