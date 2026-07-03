/**
 * 失落青空 - 团队管理页逻辑
 */

// 检查登录状态
document.addEventListener('DOMContentLoaded', () => {
    if (!getToken()) {
        redirectToLogin();
        return;
    }

    const user = getAuthUser();
    document.getElementById('user-info-text').textContent = user ? `你好，${user.username || user.phone}` : '已登录';

    // 初始化加载团队列表
    fetchTeams();
});

// 退出登录
async function handleLogout() {
    // 调一次 quit 接口（后端仅踢掉当前设备，且目前后端要求 JWT，所以直接带着 token 请求）
    try {
        await apiPost('/devices/quit', {});
    } catch (e) {
        console.error('退出设备失败', e);
    } finally {
        // 无论服务端是否成功，客户端都清除信息并跳转
        clearAuth();
        window.location.href = '/login';
    }
}

// --------------------------------------------------------------------------
// 核心数据操作：获取团队列表
// --------------------------------------------------------------------------
let currentTeams = [];

async function fetchTeams() {
    const skeleton = document.getElementById('skeleton-grid');
    const grid = document.getElementById('teams-grid');
    const emptyState = document.getElementById('empty-state');

    skeleton.classList.remove('hidden');
    grid.classList.add('hidden');
    emptyState.classList.add('hidden');
    grid.innerHTML = '';

    try {
        const res = await apiGet('/team/index');
        
        if (res) {
            currentTeams = res || [];
            
            skeleton.classList.add('hidden');

            if (currentTeams.length === 0) {
                emptyState.classList.remove('hidden');
            } else {
                renderTeams(currentTeams);
                grid.classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error(error);
        skeleton.classList.add('hidden');
        emptyState.classList.remove('hidden');
        // 可选：toast 提示 error.message
    }
}

// --------------------------------------------------------------------------
// 渲染团队卡片
// --------------------------------------------------------------------------
function renderTeams(teams) {
    const grid = document.getElementById('teams-grid');
    
    teams.forEach((team, index) => {
        const isOwner = team.is_owner === 1;
        const roleBadge = isOwner 
            ? '<span class="glow-badge text-primary px-2.5 py-0.5 rounded-full text-xs font-medium">创建者</span>'
            : '<span class="bg-white/10 text-gray-300 px-2.5 py-0.5 rounded-full text-xs font-medium border border-white/5">成员</span>';

        // 仅创建者有删除权限
        const actionBtn = isOwner
            ? `<button onclick="openDeleteModal(${team.id}, '${team.display_name}')" class="page-teams-btn-danger text-gray-500 border border-white/5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors" title="删除团队">
                 删除
               </button>`
            : ``;

        // 进入工作台按钮（假设跳转到具体的业务系统，比如 team.lostsky.work/slug）
        const enterLink = `https://${team.slug}.team.lostsky.work`;

        const cardHTML = `
            <div class="glass-card rounded-2xl p-6 flex flex-col h-full" style="animation-delay: ${index * 0.1}s">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-white/10 flex-shrink-0">
                            <span class="text-white font-bold text-lg">${team.display_name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                            <h3 class="text-white font-bold text-lg leading-tight truncate max-w-[150px] sm:max-w-[180px]">${team.display_name}</h3>
                            <div class="text-gray-500 text-xs mt-1">@${team.slug}</div>
                        </div>
                    </div>
                    ${roleBadge}
                </div>
                
                <div class="mt-auto pt-5 flex items-center justify-between border-t border-white/5">
                    ${actionBtn}
                    <a href="${enterLink}" class="ml-auto flex items-center text-sm font-medium text-primary hover:text-white transition-colors group">
                        进入工作台
                        <svg class="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </a>
                </div>
            </div>
        `;

        grid.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// --------------------------------------------------------------------------
// 创建团队逻辑
// --------------------------------------------------------------------------
function openCreateModal() {
    document.getElementById('form-create').reset();
    document.getElementById('create-error').classList.add('hidden');
    document.getElementById('modal-create').classList.add('active');
    setTimeout(() => {
        document.getElementById('input-display-name').focus();
    }, 100);
}

function closeCreateModal() {
    document.getElementById('modal-create').classList.remove('active');
}

async function submitCreateTeam(e) {
    e.preventDefault();
    
    const displayName = document.getElementById('input-display-name').value.trim();
    const slug = document.getElementById('input-slug').value.trim();
    const errorAlert = document.getElementById('create-error');
    const btn = document.getElementById('btn-submit-create');
    const text = document.getElementById('text-submit-create');
    const spinner = document.getElementById('spinner-submit-create');

    if (!displayName || !slug) return;

    // 禁用按钮 & 显示加载
    btn.disabled = true;
    text.textContent = '创建中...';
    spinner.classList.remove('hidden');
    errorAlert.classList.add('hidden');

    try {
        const res = await apiPost('/team/add', { display_name: displayName, slug: slug });
        
        closeCreateModal();
        // 刷新列表
        fetchTeams();
    } catch (error) {
        errorAlert.textContent = error.message || '网络或服务器错误';
        errorAlert.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        text.textContent = '创建';
        spinner.classList.add('hidden');
    }
}

// --------------------------------------------------------------------------
// 删除团队逻辑
// --------------------------------------------------------------------------
let targetDeleteId = null;

function openDeleteModal(id, name) {
    targetDeleteId = id;
    document.getElementById('delete-team-name').textContent = name;
    document.getElementById('modal-delete').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('modal-delete').classList.remove('active');
    targetDeleteId = null;
}

async function submitDeleteTeam() {
    if (!targetDeleteId) return;

    const btn = document.getElementById('btn-submit-delete');
    const text = document.getElementById('text-submit-delete');
    const spinner = document.getElementById('spinner-submit-delete');

    // 禁用按钮 & 显示加载
    btn.disabled = true;
    text.textContent = '删除中...';
    spinner.classList.remove('hidden');

    try {
        await apiPost('/team/delete', { team_id: targetDeleteId });
        
        closeDeleteModal();
        // 刷新列表
        fetchTeams();
    } catch (error) {
        alert(error.message || '网络或服务器错误');
    } finally {
        btn.disabled = false;
        text.textContent = '确认删除';
        spinner.classList.add('hidden');
    }
}
