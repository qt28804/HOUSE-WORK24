// ============================================================
// auth.js — Auth + Navbar indicator + Page transition + Loader
// ============================================================

// ── Helpers ─────────────────────────────────────────────────
function getLoginPath() {
    return window.location.pathname.includes('/pages/') ? '../login.html' : 'login.html';
}

function getHomePath() {
    return window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
}

// ── Render nav auth area ─────────────────────────────────────
function _renderUserNav(user) {
    const area = document.getElementById('navAuthArea');
    if (!area) return;
    const isAdmin = user.role === 'admin';
    const icon = isAdmin ? 'fa-user-shield' : 'fa-user-circle';

    // Auth pill: icon + tên + nút đăng xuất — gọn, không bị tràn
    area.innerHTML = `
        <div class="nav-user">
            <i class="fas ${icon} nav-user-icon"></i>
            <span class="nav-user-name">${user.displayName || user.username}</span>
            <button class="nav-logout-btn" onclick="logout()">
                <i class="fas fa-arrow-right-from-bracket"></i>
            </button>
        </div>`;

    // Lưu role để initNavbar dùng sau
    window._hw_userRole = user.role;
}

// ── Thêm hoặc xóa mục Admin trong nav menu ──────────────────
function _syncAdminNavItem() {
    const isAdmin = window._hw_userRole === 'admin';
    const navMenu = document.getElementById('navMenu');
    if (!navMenu) return;

    // Xóa mục admin cũ nếu có (tránh duplicate)
    navMenu.querySelectorAll('.nav-item-admin').forEach(el => el.remove());

    if (!isAdmin) return;

    // Đường dẫn đúng tuỳ vị trí trang
    const inPages  = window.location.pathname.includes('/pages/');
    const adminPath = inPages ? 'admin.html' : 'pages/admin.html';
    const isAdminPage = window.location.pathname.endsWith('admin.html');

    const li = document.createElement('li');
    li.className = 'nav-item nav-item-admin' + (isAdminPage ? ' active' : '');
    li.innerHTML = `<a href="${adminPath}" class="nav-link">
        <i class="fas fa-shield-alt" style="color:#a5b4fc;margin-right:.3rem"></i>Admin
    </a>`;

    // Chèn trước indicator (indicator luôn là phần tử cuối cùng trong navMenu)
    const indicator = navMenu.querySelector('.nav-indicator');
    if (indicator) {
        navMenu.insertBefore(li, indicator);
    } else {
        navMenu.appendChild(li);
    }

    // Gắn event listener cho link Admin vừa tạo
    const link = li.querySelector('.nav-link');
    if (link) {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href) return;
            try {
                const cur = window.location.pathname;
                const tgt = new URL(href, window.location.href).pathname;
                if (cur === tgt) return;
            } catch (_) {}
            e.preventDefault();
            navigateTo(href);
        });
    }
}

function _renderLoginBtn() {
    const area = document.getElementById('navAuthArea');
    if (!area) return;
    const loginPath = getLoginPath();
    area.innerHTML = `
        <a class="nav-login-btn" href="${loginPath}">
            <i class="fas fa-sign-in-alt"></i> Đăng nhập
        </a>`;
}

// ── initAuth — dùng cho các trang cần đăng nhập ─────────────
function initAuth(options = {}) {
    const { adminOnly = false } = options;

    const stored = localStorage.getItem('hw_user') || sessionStorage.getItem('hw_user');
    if (!stored) {
        // Lưu trang hiện tại để sau login quay lại
        const current = window.location.href;
        const loginPath = getLoginPath();
        window.location.replace(`${loginPath}?redirect=${encodeURIComponent(current)}`);
        return null;
    }

    let user;
    try { user = JSON.parse(stored); }
    catch (e) {
        window.location.replace(getLoginPath());
        return null;
    }

    if (adminOnly && user.role !== 'admin') {
        window.location.replace(getHomePath());
        return null;
    }

    _renderUserNav(user);
    return user;
}

// ── initPublicPage — dùng cho trang chủ (không cần login) ───
function initPublicPage() {
    const stored = localStorage.getItem('hw_user') || sessionStorage.getItem('hw_user');
    if (stored) {
        try {
            const user = JSON.parse(stored);
            _renderUserNav(user);
            return user;
        } catch (e) { /* ignore */ }
    }
    // Chưa login → hiện nút Login
    _renderLoginBtn();
    return null;
}

function logout() {
    _showLoader();
    _fadeOut(() => {
        localStorage.removeItem('hw_user');
        sessionStorage.removeItem('hw_user');
        window.location.href = getHomePath(); // về trang chủ, không phải login
    });
}

// ── Page loader ──────────────────────────────────────────────
function _showLoader() {
    let el = document.getElementById('_pageLoader');
    if (!el) {
        el = document.createElement('div');
        el.id = '_pageLoader';
        el.innerHTML = `
            <div class="_loader-inner">
                <svg class="_loader-ring" viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r="18" fill="none" stroke-width="3"/>
                </svg>
            </div>`;
        document.body.appendChild(el);
    }
    // Force reflow rồi show
    el.getBoundingClientRect();
    el.classList.add('_loader-show');
}

function _fadeOut(callback) {
    document.body.classList.add('page-leaving');
    setTimeout(callback, 280);
}

function navigateTo(url) {
    _showLoader();
    _fadeOut(() => { window.location.href = url; });
}

// ── Navbar ───────────────────────────────────────────────────
function initNavbar() {
    const navMenu   = document.getElementById('navMenu');
    const hamburger = document.getElementById('hamburger');
    const navbar    = document.getElementById('navbar');
    const wrapper   = navbar ? navbar.closest('.nav-wrapper') : null;

    // ── 1. Sliding indicator ──
    if (navMenu) {
        const indicator = document.createElement('div');
        indicator.className = 'nav-indicator';
        navMenu.appendChild(indicator);

        function snap(link) {
            if (!link) return;
            const mr = navMenu.getBoundingClientRect();
            const lr = link.getBoundingClientRect();
            indicator.style.width     = lr.width + 'px';
            indicator.style.transform = `translateX(${lr.left - mr.left}px) translateY(-50%)`;
        }

        function slide(link, fast) {
            if (!link) return;
            indicator.classList.toggle('returning', !fast);
            snap(link);
        }

        // Init — snap đến active TRƯỚC khi hiện, không có transition
        const active = navMenu.querySelector('.nav-item.active .nav-link');
        if (active) {
            snap(active);
            // 2 rAF = đảm bảo browser đã paint vị trí đúng → mới fade in
            requestAnimationFrame(() => requestAnimationFrame(() => {
                indicator.classList.add('ready');
            }));
        }

        // Hover → trượt nhanh
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('mouseenter', () => slide(link, true));
        });

        // Leave → quay về active, chậm hơn
        navMenu.addEventListener('mouseleave', () => {
            const a = navMenu.querySelector('.nav-item.active .nav-link');
            if (a) slide(a, false);
        });

        // Resize → snap lại
        window.addEventListener('resize', () => {
            const a = navMenu.querySelector('.nav-item.active .nav-link');
            if (!a) return;
            indicator.classList.remove('ready');
            snap(a);
            requestAnimationFrame(() => requestAnimationFrame(() => {
                indicator.classList.add('ready');
            }));
        });
    }

    // ── 2. Nav-link click → page transition ──
    if (navMenu) {
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#')) return;

            link.addEventListener('click', (e) => {
                // Đóng mobile menu
                navMenu.classList.remove('active');
                if (hamburger) hamburger.classList.remove('active');

                // Không navigate nếu đang ở trang này rồi
                try {
                    const cur = window.location.pathname;
                    const tgt = new URL(href, window.location.href).pathname;
                    if (cur === tgt) return;
                } catch (_) {}

                e.preventDefault();
                navigateTo(href);
            });
        });
    }

    // ── 3. Hamburger toggle ──
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            const open = navMenu.classList.toggle('active');
            hamburger.classList.toggle('active', open);
        });

        // Click ngoài → đóng
        document.addEventListener('click', (e) => {
            const w = wrapper || navbar;
            if (w && !w.contains(e.target)) {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
    }

    // ── 4. Scroll effect ──
    if (navbar) {
        const w = wrapper || navbar;
        const onScroll = () => {
            const s = window.scrollY > 30;
            navbar.classList.toggle('scrolled', s);
            w.classList.toggle('scrolled', s);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    // ── 5. Logout button transition ──
    document.addEventListener('click', (e) => {
        if (e.target.closest('.nav-logout-btn')) {
            e.preventDefault();
            logout();
        }
    });

    // ── 6. Inject Admin nav item sau khi indicator đã sẵn sàng ──
    _syncAdminNavItem();
}
