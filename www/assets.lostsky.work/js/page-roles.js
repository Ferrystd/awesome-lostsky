const PERMISSION_GROUPS = [
    { name: '团队成员', items: [
        ['team.member.read', '查看成员'], ['team.member.invite', '邀请成员'],
        ['team.member.update', '编辑成员'], ['team.member.remove', '移除成员'],
        ['team.role.read', '查看角色'],
    ] },
    { name: '商店', items: [
        ['shop.read', '查看商店'], ['shop.update', '编辑商店'],
        ['shop.product.read', '查看商品'], ['shop.product.write', '编辑商品'],
        ['shop.product.delete', '删除商品'], ['shop.order.read', '查看订单'],
        ['shop.order.write', '处理订单'],
    ] },
    { name: '交易', items: [
        ['transaction.read', '查看交易'], ['transaction.write', '编辑交易'],
        ['transaction.delete', '删除交易'], ['transaction.category.read', '查看交易分类'],
        ['transaction.category.write', '编辑交易分类'], ['transaction.report.read', '查看交易报表'],
    ] },
    { name: '客户', items: [
        ['customer.read', '查看客户'], ['customer.write', '编辑客户'],
        ['customer.delete', '删除客户'], ['customer.export', '导出客户'],
    ] },
    { name: '文件', items: [
        ['file.read', '查看文件'], ['file.upload', '上传文件'],
        ['file.delete', '删除文件'], ['file.share', '分享文件'],
    ] },
    { name: '团队设置', items: [
        ['team.setting.read', '查看团队设置'], ['team.setting.update', '编辑团队设置'],
    ] },
];

const rolesState = {
    roles: [],
    members: [],
    permissionsByRole: new Map(),
    activeRoleId: null,
    activeMemberId: null,
    activeMemberRoleIds: [],
    memberFilter: '',
};

document.addEventListener('DOMContentLoaded', () => {
    bindRolePageEvents();
    renderPermissionGroups([]);
    loadRoleWorkspace();
});

function bindRolePageEvents() {
    document.querySelectorAll('.page-roles-tab').forEach(button => {
        button.addEventListener('click', () => switchWorkspaceTab(button.dataset.tab));
    });
    document.getElementById('create-role-button').addEventListener('click', () => {
        document.getElementById('create-role-form').reset();
        document.getElementById('create-role-sort').value = '0';
        openRoleModal('create-role-modal');
        setTimeout(() => document.getElementById('create-role-key').focus(), 100);
    });
    document.querySelectorAll('[data-close-modal]').forEach(button => {
        button.addEventListener('click', () => closeRoleModal(button.dataset.closeModal));
    });
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', event => {
            if (event.target === modal) closeRoleModal(modal.id);
        });
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') document.querySelectorAll('.modal-overlay.active').forEach(modal => closeRoleModal(modal.id));
    });
    document.getElementById('create-role-form').addEventListener('submit', createRole);
    document.getElementById('role-form').addEventListener('submit', saveRoleInfo);
    document.getElementById('save-permissions-button').addEventListener('click', saveRolePermissions);
    document.getElementById('delete-role-button').addEventListener('click', confirmRoleDelete);
    document.getElementById('confirm-delete-role').addEventListener('click', deleteRole);
    document.getElementById('member-search').addEventListener('input', event => {
        rolesState.memberFilter = event.target.value.trim().toLowerCase();
        renderMemberList();
    });
    document.getElementById('save-member-roles-button').addEventListener('click', saveMemberRoles);
    document.getElementById('permission-groups').addEventListener('change', updatePermissionSummary);
}

async function loadRoleWorkspace() {
    try {
        const [roles, members] = await Promise.all([
            window.apiGet('/role/index'),
            window.apiGet('/member/index'),
        ]);
        rolesState.roles = roles || [];
        rolesState.members = members || [];

        const permissionResults = await Promise.allSettled(
            rolesState.roles.map(role => window.apiGet('/rolePermission/index', { role_id: role.id }))
        );
        permissionResults.forEach((result, index) => {
            rolesState.permissionsByRole.set(
                Number(rolesState.roles[index].id),
                result.status === 'fulfilled' ? (result.value || []).map(item => item.permission_key) : []
            );
        });

        renderRoleList();
        renderMemberList();
        if (rolesState.roles.length) selectRole(Number(rolesState.roles[0].id));
    } catch (error) {
        renderLoadError(error);
    }
}

function switchWorkspaceTab(tab) {
    const isRole = tab === 'role';
    document.getElementById('role-panel').classList.toggle('hidden', !isRole);
    document.getElementById('member-panel').classList.toggle('hidden', isRole);
    document.querySelectorAll('.page-roles-tab').forEach(button => {
        const active = button.dataset.tab === tab;
        button.setAttribute('aria-selected', String(active));
        button.classList.toggle('bg-sky-50', active);
        button.classList.toggle('text-sky-700', active);
        button.classList.toggle('text-slate-600', !active);
    });
}

function renderRoleList() {
    const list = document.getElementById('role-list');
    document.getElementById('role-total').textContent = `${rolesState.roles.length} 个`;
    if (!rolesState.roles.length) {
        list.innerHTML = '<div class="p-6 text-center text-sm text-slate-500">暂无角色，请先新建角色。</div>';
        showRoleEditor(false);
        renderMemberRoleOptions();
        return;
    }
    list.innerHTML = rolesState.roles.map(role => {
        const count = (rolesState.permissionsByRole.get(Number(role.id)) || []).length;
        const active = Number(role.id) === rolesState.activeRoleId;
        return `<button type="button" data-role-id="${role.id}" aria-current="${active}" class="page-roles-list-button w-full rounded-lg px-3 py-3 text-left transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500">
            <span class="flex items-start justify-between gap-3"><span class="min-w-0"><span class="block truncate text-sm font-medium text-slate-950">${escapeRoleHtml(role.name)}</span><span class="mt-1 block truncate font-mono text-xs text-slate-500">${escapeRoleHtml(role.role_key)}</span></span><span class="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs text-slate-500 border border-slate-200">${count}</span></span>
        </button>`;
    }).join('');
    list.querySelectorAll('[data-role-id]').forEach(button => {
        button.addEventListener('click', () => selectRole(Number(button.dataset.roleId)));
    });
    renderMemberRoleOptions();
}

function selectRole(roleId) {
    const role = rolesState.roles.find(item => Number(item.id) === roleId);
    if (!role) return;
    rolesState.activeRoleId = roleId;
    renderRoleList();
    showRoleEditor(true);
    document.getElementById('role-editor-title').textContent = role.name;
    document.getElementById('role-key-display').textContent = role.role_key;
    document.getElementById('role-name').value = role.name || '';
    document.getElementById('role-sort').value = Number(role.sort || 0);
    document.getElementById('role-description').value = role.description || '';
    renderPermissionGroups(rolesState.permissionsByRole.get(roleId) || []);
}

function showRoleEditor(show) {
    document.getElementById('role-editor').classList.toggle('hidden', !show);
    document.getElementById('role-editor-empty').classList.toggle('hidden', show);
}

function renderPermissionGroups(selectedKeys) {
    const selected = new Set(selectedKeys);
    document.getElementById('permission-groups').innerHTML = PERMISSION_GROUPS.map(group => `
        <fieldset class="rounded-xl border border-slate-200 p-4">
            <legend class="px-1 text-sm font-semibold text-slate-950">${escapeRoleHtml(group.name)}</legend>
            <div class="mt-2 space-y-2">${group.items.map(([key, label]) => `
                <label class="page-roles-choice flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border border-slate-200 px-3 py-2.5 transition-colors hover:bg-slate-50">
                    <input type="checkbox" name="permission_keys" value="${key}" ${selected.has(key) ? 'checked' : ''} class="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500">
                    <span class="min-w-0"><span class="block text-sm font-medium text-slate-800">${escapeRoleHtml(label)}</span><span class="block break-all font-mono text-xs text-slate-500">${key}</span></span>
                </label>`).join('')}</div>
        </fieldset>`).join('');
    updatePermissionSummary();
}

function updatePermissionSummary() {
    const count = document.querySelectorAll('input[name="permission_keys"]:checked').length;
    document.getElementById('permission-summary').textContent = `已选择 ${count} 项权限`;
}

async function createRole(event) {
    event.preventDefault();
    const button = document.getElementById('create-role-submit');
    await withBusyButton(button, '创建中...', async () => {
        const result = await window.apiPost('/role/add', {
            role_key: document.getElementById('create-role-key').value.trim(),
            name: document.getElementById('create-role-name').value.trim(),
            description: nullableText(document.getElementById('create-role-description').value),
            sort: Number(document.getElementById('create-role-sort').value || 0),
        });
        const roles = await window.apiGet('/role/index');
        rolesState.roles = roles || [];
        rolesState.permissionsByRole.set(Number(result.id), []);
        closeRoleModal('create-role-modal');
        renderRoleList();
        selectRole(Number(result.id));
        showRoleToast('角色已创建');
    });
}

async function saveRoleInfo(event) {
    event.preventDefault();
    const role = getActiveRole();
    if (!role) return;
    const button = document.getElementById('save-role-button');
    await withBusyButton(button, '保存中...', async () => {
        const payload = {
            id: role.id,
            name: document.getElementById('role-name').value.trim(),
            description: nullableText(document.getElementById('role-description').value),
            sort: Number(document.getElementById('role-sort').value || 0),
        };
        await window.apiPost('/role/edit', payload);
        Object.assign(role, payload);
        renderRoleList();
        selectRole(Number(role.id));
        showRoleToast('角色信息已保存');
    });
}

async function saveRolePermissions() {
    const role = getActiveRole();
    if (!role) return;
    const button = document.getElementById('save-permissions-button');
    const permissionKeys = Array.from(document.querySelectorAll('input[name="permission_keys"]:checked')).map(input => input.value);
    await withBusyButton(button, '保存中...', async () => {
        await window.apiPost('/rolePermission/save', { role_id: role.id, permission_keys: permissionKeys });
        rolesState.permissionsByRole.set(Number(role.id), permissionKeys);
        renderRoleList();
        showRoleToast('角色权限已保存');
    });
}

function confirmRoleDelete() {
    const role = getActiveRole();
    if (!role) return;
    document.getElementById('delete-role-description').textContent = `删除“${role.name}”后，其权限与成员绑定也会被移除。`;
    openRoleModal('delete-role-modal');
}

async function deleteRole() {
    const role = getActiveRole();
    if (!role) return;
    const button = document.getElementById('confirm-delete-role');
    await withBusyButton(button, '删除中...', async () => {
        await window.apiPost('/role/delete', { id: role.id });
        rolesState.roles = rolesState.roles.filter(item => Number(item.id) !== Number(role.id));
        rolesState.permissionsByRole.delete(Number(role.id));
        rolesState.activeRoleId = null;
        closeRoleModal('delete-role-modal');
        renderRoleList();
        if (rolesState.roles.length) selectRole(Number(rolesState.roles[0].id));
        showRoleToast('角色已删除');
    });
}

function renderMemberList() {
    const list = document.getElementById('member-list');
    const filtered = rolesState.members.filter(member => {
        const name = memberDisplayName(member).toLowerCase();
        return !rolesState.memberFilter || name.includes(rolesState.memberFilter) || String(member.user_id).includes(rolesState.memberFilter);
    });
    if (!filtered.length) {
        list.innerHTML = `<div class="p-6 text-center text-sm text-slate-500">${rolesState.members.length ? '没有匹配的成员。' : '暂无团队成员。'}</div>`;
        return;
    }
    list.innerHTML = filtered.map(member => {
        const name = memberDisplayName(member);
        const active = Number(member.id) === rolesState.activeMemberId;
        return `<button type="button" data-member-id="${member.id}" aria-current="${active}" class="page-roles-list-button flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-xs font-semibold text-sky-700">${escapeRoleHtml(memberInitial(name))}</span>
            <span class="min-w-0 flex-1"><span class="block truncate text-sm font-medium text-slate-950">${escapeRoleHtml(name)}</span><span class="block text-xs text-slate-500">User ID: ${member.user_id}</span></span>
            ${Number(member.is_blocked) ? '<span class="text-xs font-medium text-red-600">已封禁</span>' : ''}
        </button>`;
    }).join('');
    list.querySelectorAll('[data-member-id]').forEach(button => {
        button.addEventListener('click', () => selectMember(Number(button.dataset.memberId)));
    });
}

async function selectMember(memberId) {
    const member = rolesState.members.find(item => Number(item.id) === memberId);
    if (!member) return;
    rolesState.activeMemberId = memberId;
    renderMemberList();
    showMemberEditor(true);
    const name = memberDisplayName(member);
    document.getElementById('member-avatar').textContent = memberInitial(name);
    document.getElementById('member-name').textContent = name;
    document.getElementById('member-meta').textContent = `User ID: ${member.user_id}${Number(member.is_blocked) ? ' · 已封禁' : ''}`;
    document.getElementById('member-role-options').innerHTML = '<div class="col-span-full h-20 rounded-lg bg-slate-100 animate-pulse"></div>';
    try {
        const bindings = await window.apiGet('/memberRole/index', { member_id: memberId });
        if (rolesState.activeMemberId !== memberId) return;
        rolesState.activeMemberRoleIds = (bindings || []).map(item => Number(item.role_id));
        renderMemberRoleOptions();
    } catch (error) {
        document.getElementById('member-role-options').innerHTML = '<p class="col-span-full text-sm text-red-600">成员角色加载失败，请重新选择该成员。</p>';
    }
}

function renderMemberRoleOptions() {
    const container = document.getElementById('member-role-options');
    if (!container) return;
    if (!rolesState.roles.length) {
        container.innerHTML = '<div class="col-span-full rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">暂无可分配角色，请先新建角色。</div>';
        return;
    }
    const selected = new Set(rolesState.activeMemberRoleIds);
    container.innerHTML = rolesState.roles.map(role => `
        <label class="page-roles-choice flex min-h-16 cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50">
            <input type="checkbox" name="member_role_ids" value="${role.id}" ${selected.has(Number(role.id)) ? 'checked' : ''} class="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500">
            <span class="min-w-0"><span class="block text-sm font-medium text-slate-950">${escapeRoleHtml(role.name)}</span><span class="block truncate font-mono text-xs text-slate-500">${escapeRoleHtml(role.role_key)}</span></span>
        </label>`).join('');
}

function showMemberEditor(show) {
    document.getElementById('member-editor').classList.toggle('hidden', !show);
    document.getElementById('member-editor-empty').classList.toggle('hidden', show);
}

async function saveMemberRoles() {
    if (!rolesState.activeMemberId) return;
    const button = document.getElementById('save-member-roles-button');
    const roleIds = Array.from(document.querySelectorAll('input[name="member_role_ids"]:checked')).map(input => Number(input.value));
    await withBusyButton(button, '保存中...', async () => {
        await window.apiPost('/memberRole/save', { member_id: rolesState.activeMemberId, role_ids: roleIds });
        rolesState.activeMemberRoleIds = roleIds;
        showRoleToast('成员角色已保存');
    });
}

function renderLoadError(error) {
    const message = error && error.status === 403 ? '仅团队创建者可以管理角色与权限。' : '数据加载失败，请刷新页面重试。';
    document.getElementById('role-list').innerHTML = `<div class="p-6 text-center text-sm text-red-600">${message}</div>`;
    document.getElementById('member-list').innerHTML = `<div class="p-6 text-center text-sm text-red-600">${message}</div>`;
}

function getActiveRole() {
    return rolesState.roles.find(item => Number(item.id) === rolesState.activeRoleId) || null;
}

function memberDisplayName(member) {
    return member.profile?.nickname || `用户 ${member.user_id}`;
}

function memberInitial(name) {
    return String(name || '?').trim().slice(0, 1).toUpperCase();
}

function nullableText(value) {
    const text = String(value || '').trim();
    return text || null;
}

function openRoleModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.inert = false;
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('active');
}

function closeRoleModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    modal.inert = true;
}

async function withBusyButton(button, loadingText, action) {
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = loadingText;
    button.classList.add('opacity-60', 'cursor-not-allowed');
    try {
        await action();
    } catch (error) {
        console.error(error);
    } finally {
        button.disabled = false;
        button.textContent = originalText;
        button.classList.remove('opacity-60', 'cursor-not-allowed');
    }
}

function showRoleToast(message) {
    const toast = document.getElementById('roles-toast');
    toast.textContent = message;
    toast.className = 'pointer-events-none fixed right-4 top-4 z-[120] rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-700 opacity-100 shadow-lg transition duration-200';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.classList.add('opacity-0', '-translate-y-2');
    }, 3000);
}

function escapeRoleHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
