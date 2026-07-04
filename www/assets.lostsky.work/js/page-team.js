/**
 * 失落青空 - 后台交互与组件加载
 */
document.addEventListener('DOMContentLoaded', () => {
    const ensureDocsNav = () => {
        const configGroups = Array.from(document.querySelectorAll('nav .px-3'))
            .filter(group => group.textContent.includes('团队配置'));
        const configGroup = configGroups[0];
        if (!configGroup || configGroup.querySelector('a[href="/docs"]')) return;

        const settingsLink = configGroup.querySelector('a[href="/settings"]');
        const docLink = document.createElement('a');
        docLink.href = '/docs';
        docLink.className = 'sidebar-link flex items-center px-3 py-2.5 rounded-lg text-sm text-gray-300 mb-1';
        docLink.innerHTML = '<svg class="w-5 h-5 mr-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h8l6 6v10a2 2 0 01-2 2z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 3v6h6M7 13h10M7 17h7"></path></svg>文档库';

        if (settingsLink) {
            configGroup.insertBefore(docLink, settingsLink);
        } else {
            configGroup.appendChild(docLink);
        }
    };

    ensureDocsNav();

    // 处理导航激活状态
    const normalizeNavPath = path => {
        const cleanPath = path.replace(/\/index(?:\.html)?$/, '/').replace(/\.html$/, '');
        return cleanPath || '/';
    };
    const currentPath = normalizeNavPath(window.location.pathname);
    const links = document.querySelectorAll('.sidebar-link');
    links.forEach(link => {
        if (normalizeNavPath(link.getAttribute('href')) === currentPath) {
            link.classList.add('active');
        }
    });

    // 处理移动端侧边栏切换
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (mobileMenuBtn && sidebar && sidebarOverlay) {
        const toggleSidebar = () => {
            const isClosed = sidebar.classList.contains('-translate-x-full');
            if (isClosed) {
                sidebar.classList.remove('-translate-x-full');
                sidebarOverlay.classList.remove('hidden');
                setTimeout(() => sidebarOverlay.classList.remove('opacity-0'), 10);
            } else {
                sidebar.classList.add('-translate-x-full');
                sidebarOverlay.classList.add('opacity-0');
                setTimeout(() => sidebarOverlay.classList.add('hidden'), 300);
            }
        };

        mobileMenuBtn.addEventListener('click', toggleSidebar);
        sidebarOverlay.addEventListener('click', toggleSidebar);
    }

    // 渐入动画初始化
    const animatedElements = document.querySelectorAll('.fade-in-element');
    setTimeout(() => {
        animatedElements.forEach(el => el.classList.add('visible'));
    }, 100);
});

// 弹窗控制函数
window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
};
window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
};
