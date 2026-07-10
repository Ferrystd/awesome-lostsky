/**
 * LostSky 团队后台通用交互。
 * 只处理当前页高亮、移动端侧边栏和入场动效；导航入口由各 HTML 静态维护。
 */
document.addEventListener('DOMContentLoaded', () => {
    const normalizeNavPath = path => {
        const cleanPath = (path || '/')
            .replace(/^https?:\/\/[^/]+/i, '')
            .replace(/\/index(?:\.html)?$/, '/')
            .replace(/\.html$/, '');
        return cleanPath || '/';
    };

    const currentPath = normalizeNavPath(window.location.pathname);
    document.querySelectorAll('.sidebar-link').forEach(link => {
        if (normalizeNavPath(link.getAttribute('href')) === currentPath) {
            link.classList.add('active');
        }
    });

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

    const animatedElements = document.querySelectorAll('.fade-in-element');
    setTimeout(() => {
        animatedElements.forEach(el => el.classList.add('visible'));
    }, 100);
});

window.openModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
};

window.closeModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
};
