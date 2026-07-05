(() => {
    const state = {
        list: [],
        activeId: null,
        filter: 'all',
        keyword: '',
        loading: false,
    };

    const $ = id => document.getElementById(id);

    function asList(data) {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.list)) return data.list;
        if (Array.isArray(data?.data)) return data.data;
        return [];
    }

    function isRead(notice) {
        return Number(notice.is_read ?? notice.confirmed ?? notice.is_confirmed ?? 0) === 1;
    }

    function hasAsset(notice) {
        const assets = notice.assets ?? notice.asset ?? notice.reward ?? notice.rewards;
        if (Array.isArray(assets)) return assets.length > 0;
        return !!assets || Number(notice.has_asset ?? notice.has_assets ?? 0) === 1;
    }

    function noticeTime(notice) {
        const raw = notice.create_time || notice.update_time || notice.confirm_time;
        if (!raw) return '';
        const date = Number(raw) > 10000000000 ? new Date(Number(raw)) : new Date(Number(raw) * 1000);
        if (Number.isNaN(date.getTime())) return String(raw);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
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

    function visibleList() {
        return state.list.filter(notice => {
            const read = isRead(notice);
            if (state.filter === 'unread' && read) return false;
            if (state.filter === 'read' && !read) return false;
            if (state.filter === 'asset' && !hasAsset(notice)) return false;

            if (!state.keyword) return true;
            const haystack = `${notice.title || ''} ${notice.content || ''}`.toLowerCase();
            return haystack.includes(state.keyword.toLowerCase());
        });
    }

    function badge(text, className) {
        return `<span class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${className}">${escapeHtml(text)}</span>`;
    }

    function renderSummary() {
        const total = state.list.length;
        const unread = state.list.filter(notice => !isRead(notice)).length;
        const assets = state.list.filter(hasAsset).length;
        $('notice-summary').textContent = `共 ${total} 封，${unread} 封未确认，${assets} 封含资产`;
        $('confirm-all-btn').disabled = unread === 0 || state.loading;
    }

    function renderList() {
        const wrap = $('notice-list');
        const list = visibleList();
        renderSummary();

        if (!list.length) {
            wrap.innerHTML = '<div class="p-8 text-center text-slate-500">没有匹配的站内信</div>';
            renderDetail(null);
            return;
        }

        if (!state.activeId || !list.some(item => Number(item.id) === Number(state.activeId))) {
            state.activeId = list[0].id;
        }

        wrap.innerHTML = list.map(notice => {
            const read = isRead(notice);
            const active = Number(notice.id) === Number(state.activeId);
            const pinned = Number(notice.is_pinned || 0) === 1;
            const title = escapeHtml(notice.title || '未命名站内信');
            const content = escapeHtml(notice.content || '').replace(/\s+/g, ' ').slice(0, 90);
            const activeClass = active ? 'bg-sky-50 border-l-sky-600' : 'border-l-transparent hover:bg-slate-50';
            const titleClass = read ? 'text-slate-700' : 'text-slate-950';

            return `
                <button type="button" class="w-full text-left p-4 border-l-2 ${activeClass} transition-colors" data-notice-id="${notice.id}">
                    <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                            <div class="flex items-center gap-2 mb-1">
                                ${pinned ? '<span class="h-2 w-2 rounded-full bg-amber-400"></span>' : ''}
                                <h3 class="font-medium truncate ${titleClass}">${title}</h3>
                            </div>
                            <p class="text-xs text-slate-500">${escapeHtml(noticeTime(notice))}</p>
                        </div>
                        ${read
                            ? '<span class="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">已确认</span>'
                            : '<span class="shrink-0 rounded-full bg-sky-50 px-2 py-1 text-xs text-sky-700">未确认</span>'}
                    </div>
                    <p class="mt-3 text-sm text-slate-500 line-clamp-2">${content || '暂无内容预览'}</p>
                </button>
            `;
        }).join('');

        wrap.querySelectorAll('[data-notice-id]').forEach(button => {
            button.addEventListener('click', () => selectNotice(button.dataset.noticeId));
        });

        renderDetail(state.list.find(item => Number(item.id) === Number(state.activeId)));
    }

    async function selectNotice(id) {
        state.activeId = id;
        renderList();

        try {
            const detail = await window.apiGet('/notice/get', { id });
            if (detail?.id) {
                const index = state.list.findIndex(item => Number(item.id) === Number(detail.id));
                if (index >= 0) state.list[index] = { ...state.list[index], ...detail };
                renderDetail(state.list[index]);
            }
        } catch (err) {
            console.warn('站内信详情加载失败', err);
        }
    }

    function renderDetail(notice) {
        const empty = $('notice-detail-empty');
        const detail = $('notice-detail');
        if (!notice) {
            empty.classList.remove('hidden');
            detail.classList.add('hidden');
            return;
        }

        empty.classList.add('hidden');
        detail.classList.remove('hidden');
        detail.classList.add('flex');

        $('notice-detail-title').textContent = notice.title || '未命名站内信';
        $('notice-detail-time').textContent = noticeTime(notice) ? `发送时间：${noticeTime(notice)}` : '发送时间：未知';
        $('notice-detail-content').textContent = notice.content || '暂无内容';

        const badges = [];
        badges.push(isRead(notice)
            ? badge('已确认', 'border-slate-200 bg-slate-100 text-slate-600')
            : badge('未确认', 'border-sky-200 bg-sky-50 text-sky-700'));
        if (Number(notice.is_pinned || 0) === 1) {
            badges.push(badge('置顶', 'border-amber-200 bg-amber-50 text-amber-700'));
        }
        if (hasAsset(notice)) {
            badges.push(badge('含资产', 'border-emerald-200 bg-emerald-50 text-emerald-700'));
        }
        $('notice-detail-badges').innerHTML = badges.join('');

        $('confirm-btn').disabled = isRead(notice) || state.loading;
        $('receive-btn').disabled = true;
        $('notice-asset-box').classList.toggle('hidden', !hasAsset(notice));
    }

    async function loadNotices() {
        state.loading = true;
        $('notice-list').innerHTML = '<div class="p-8 text-center text-slate-500">正在加载站内信...</div>';
        try {
            const data = await window.apiGet('/notice/index');
            state.list = asList(data);
            renderList();
        } catch (err) {
            $('notice-list').innerHTML = '<div class="p-8 text-center text-red-600">站内信加载失败</div>';
            console.warn('站内信加载失败', err);
        } finally {
            state.loading = false;
            renderSummary();
        }
    }

    async function confirmNotice() {
        if (!state.activeId) return;
        state.loading = true;
        renderDetail(state.list.find(item => Number(item.id) === Number(state.activeId)));
        try {
            await window.apiPost('/notice/confirm', { id: state.activeId });
            const notice = state.list.find(item => Number(item.id) === Number(state.activeId));
            if (notice) notice.is_read = 1;
            renderList();
        } catch (err) {
            console.warn('站内信确认失败', err);
        } finally {
            state.loading = false;
            renderSummary();
        }
    }

    async function confirmAll() {
        state.loading = true;
        $('confirm-all-btn').disabled = true;
        try {
            await window.apiPost('/notice/confirmAll', {});
            state.list.forEach(notice => { notice.is_read = 1; });
            renderList();
        } catch (err) {
            console.warn('全部确认失败', err);
        } finally {
            state.loading = false;
            renderSummary();
        }
    }

    function bindFilters() {
        document.querySelectorAll('.notice-filter').forEach(button => {
            button.addEventListener('click', () => {
                state.filter = button.dataset.filter || 'all';
                document.querySelectorAll('.notice-filter').forEach(item => {
                    item.className = 'notice-filter px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50';
                });
                button.className = 'notice-filter px-3 py-2 rounded-lg text-sm bg-sky-50 text-sky-700';
                renderList();
            });
        });
    }

    function bindSearch() {
        const input = $('notice-keyword');
        const apply = () => {
            state.keyword = input.value.trim();
            renderList();
        };
        $('notice-search-btn').addEventListener('click', apply);
        input.addEventListener('keydown', event => {
            if (event.key === 'Enter') apply();
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        bindFilters();
        bindSearch();
        $('confirm-btn').addEventListener('click', confirmNotice);
        $('confirm-all-btn').addEventListener('click', confirmAll);
        loadNotices();
    });
})();
