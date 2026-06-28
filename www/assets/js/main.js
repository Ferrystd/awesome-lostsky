/* ==========================================================================
   失落青空 (LostSky Studio) - 核心交互脚本
   CDN 托管路径：assets.lostsky.work/js/main.js
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    /* --------------------------------------------------------------------------
       1. 导航栏滚动效果 (从 index.html 迁移)
       -------------------------------------------------------------------------- */
    const nav = document.querySelector('nav');
    if (nav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                nav.classList.add('bg-[#020617]/80', 'shadow-lg');
                nav.classList.remove('border-b-0');
            } else {
                nav.classList.remove('bg-[#020617]/80', 'shadow-lg');
                nav.classList.add('border-b-0');
            }
        });
    }

    /* --------------------------------------------------------------------------
       2. 平滑滚动 (锚点链接)
       -------------------------------------------------------------------------- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    /* --------------------------------------------------------------------------
       3. 滚动渐入动画 (配合 style.css 中的 .fade-in-element)
       -------------------------------------------------------------------------- */
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // 如果只需要触发一次，可以取消观察
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // 自动为主要区块添加渐入类并观察
    const sections = document.querySelectorAll('section > div');
    sections.forEach(section => {
        section.classList.add('fade-in-element');
        observer.observe(section);
    });
});
