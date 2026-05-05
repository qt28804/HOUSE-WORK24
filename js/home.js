// ============================================================
// home.js — Logic cho trang chủ (index.html)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    // ── Trang chủ public — không cần đăng nhập ──
    const user = initPublicPage();
    initNavbar();

    // ── CTA links — nếu chưa login thì dẫn về login với redirect ──
    document.querySelectorAll('a[href*="pages/"]').forEach(link => {
        link.addEventListener('click', (e) => {
            if (localStorage.getItem('hw_user') || sessionStorage.getItem('hw_user')) return;
            // Chưa login → dẫn về login với redirect param
            e.preventDefault();
            const dest = link.getAttribute('href');
            const absUrl = new URL(dest, window.location.href).href;
            navigateTo(`login.html?redirect=${encodeURIComponent(absUrl)}`);
        });
    });

    // ── Counter animation ──
    const counters = document.querySelectorAll('.stat-number');
    const counterObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el     = entry.target;
            const target = +el.dataset.target;
            const duration = 1500;
            const step   = target / (duration / 16);
            let current  = 0;
            const timer  = setInterval(() => {
                current = Math.min(current + step, target);
                el.textContent = Math.floor(current).toLocaleString('vi-VN');
                if (current >= target) clearInterval(timer);
            }, 16);
            counterObserver.unobserve(el);
        });
    }, { threshold: 0.5 });

    counters.forEach(c => counterObserver.observe(c));

    // ── Scroll reveal ──
    const revealEls = document.querySelectorAll('.feature-card, .doc-card, .stat-item');
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, i * 80);
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    revealEls.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(24px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        revealObserver.observe(el);
    });

});
