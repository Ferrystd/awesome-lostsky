/**
 * LostSky 团队后台通用交互。
 */
document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('nav');

    const createNavLink = ({ href, label, icon }) => {
        const link = document.createElement('a');
        link.href = href;
        link.className = 'sidebar-link flex items-center px-3 py-2.5 rounded-lg text-sm text-gray-300 mb-1';
        link.innerHTML = `${icon}${label}`;
        return link;
    };

    const findGroup = labels => {
        const groups = Array.from(document.querySelectorAll('nav .px-3'));
        return groups.find(group => labels.some(label => group.textContent.includes(label)));
    };

    const ensureDocsNav = () => {
        const configGroup = findGroup(['团队配置', '鍥㈤槦閰嶇疆']);
        if (!configGroup || configGroup.querySelector('a[href="/docs"]')) return;

        const settingsLink = configGroup.querySelector('a[href="/settings"]');
        const docLink = createNavLink({
            href: '/docs',
            label: '文档库',
            icon: '<svg class="w-5 h-5 mr-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h8l6 6v10a2 2 0 01-2 2z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 3v6h6M7 13h10M7 17h7"></path></svg>',
        });

        if (settingsLink) {
            configGroup.insertBefore(docLink, settingsLink);
        } else {
            configGroup.appendChild(docLink);
        }
    };

    const ensureNoticeNav = () => {
        const coreGroup = findGroup(['核心管理', '鏍稿績绠＄悊']);
        if (!coreGroup || coreGroup.querySelector('a[href="/notice"]')) return;

        const membersLink = coreGroup.querySelector('a[href="/members"]');
        const noticeLink = createNavLink({
            href: '/notice',
            label: '站内信',
            icon: '<svg class="w-5 h-5 mr-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 8.5v7A2.5 2.5 0 0118.5 18h-13A2.5 2.5 0 013 15.5v-7A2.5 2.5 0 015.5 6h13A2.5 2.5 0 0121 8.5z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8l8 5 8-5"></path></svg>',
        });

        if (membersLink?.nextSibling) {
            coreGroup.insertBefore(noticeLink, membersLink.nextSibling);
        } else {
            coreGroup.appendChild(noticeLink);
        }
    };

    ensureDocsNav();
    ensureNoticeNav();

    const normalizeNavPath = path => {
        const cleanPath = (path || '/').replace(/\/index(?:\.html)?$/, '/').replace(/\.html$/, '');
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
