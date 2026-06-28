// Simple navbar background change on scroll
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (window.scrollY > 50) {
        nav.classList.add('bg-[#020617]/80', 'shadow-lg');
        nav.classList.remove('border-b-0');
    } else {
        nav.classList.remove('bg-[#020617]/80', 'shadow-lg');
        nav.classList.add('border-b-0');
    }
});