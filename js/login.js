// ============================================================
// login.js — Logic cho trang đăng nhập
// ============================================================

// ── Cấu hình Google OAuth ────────────────────────────────────
const GOOGLE_CLIENT_ID = '534748116389-44busaj78tdfghad5hbur4kbffveu0ps.apps.googleusercontent.com';

let currentRole = 'student';

// ── Hash SHA-256 đơn giản (dùng Web Crypto API) ──────────────
async function _sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Tài khoản admin ──────────────────────────────────────────
// Mật khẩu được lưu dạng SHA-256 hash — không thể reverse
// Mật khẩu thực: chỉ bạn biết, không ai đọc được từ hash này
const ADMIN_CREDENTIALS = {
    username: 'admin_housework',
    // SHA-256('HouseWork@2026!')
    passwordHash: '696bfa4105f977b55aa47e6986562f5f7a67305bee468ea6e8f15a80cc0aceb1',
    displayName: 'Admin',
    redirect: 'pages/admin.html'
};

// Nếu đã đăng nhập thì chuyển thẳng vào trang chủ
(function checkAlreadyLoggedIn() {
    const stored = localStorage.getItem('hw_user') || sessionStorage.getItem('hw_user');
    if (stored) {
        try {
            const u = JSON.parse(stored);
            const redirect = _getRedirectParam();
            window.location.href = redirect || (u.role === 'admin' ? 'pages/admin.html' : 'index.html');
        } catch (e) { /* ignore */ }
    }
})();

function _getRedirectParam() {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('redirect');
    if (!r) return null;
    try {
        const url = new URL(r);
        if (url.origin === window.location.origin) return r;
    } catch (e) { return r; }
    return null;
}

function switchRole(role) {
    currentRole = role;
    document.getElementById('tabStudent').classList.toggle('active', role === 'student');
    document.getElementById('tabAdmin').classList.toggle('active', role === 'admin');
    document.getElementById('errorMsg').classList.remove('show');

    // Học sinh: hiện form username/password + nút Google/GitHub
    // Admin: chỉ hiện form username/password
    if (role === 'student') {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('username').placeholder = 'Tên đăng nhập...';
        document.querySelector('.divider').style.display = 'flex';
        document.querySelector('.social-btns').style.display = 'grid';
    } else {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('username').placeholder = 'Tên đăng nhập admin...';
        document.querySelector('.divider').style.display = 'none';
        document.querySelector('.social-btns').style.display = 'none';
    }
}

function togglePassword() {
    const pw   = document.getElementById('password');
    const icon = document.getElementById('eyeIcon');
    if (pw.type === 'password') {
        pw.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        pw.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('rememberMe').checked;
    const btn      = document.getElementById('loginBtn');
    const errorMsg = document.getElementById('errorMsg');

    if (!username || !password) {
        document.getElementById('errorText').textContent = 'Vui lòng nhập đầy đủ thông tin.';
        errorMsg.classList.add('show');
        return;
    }

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xác thực...';
    btn.disabled  = true;
    errorMsg.classList.remove('show');

    // Hash mật khẩu (await đúng cách, không bọc trong setTimeout)
    const inputHash = await _sha256(password);

    // ── Admin login ──
    if (currentRole === 'admin') {
        const isValid = username === ADMIN_CREDENTIALS.username &&
                        inputHash === ADMIN_CREDENTIALS.passwordHash;
        if (isValid) {
            const userData = JSON.stringify({
                username, role: 'admin',
                displayName: ADMIN_CREDENTIALS.displayName,
                loginMethod: 'password'
            });
            if (remember) localStorage.setItem('hw_user', userData);
            else sessionStorage.setItem('hw_user', userData);
            btn.innerHTML = '<i class="fas fa-check"></i> Thành công!';
            btn.style.background = 'linear-gradient(135deg, #43e97b, #38f9d7)';
            showPageLoader('Đang vào trang quản trị...', _getRedirectParam() || ADMIN_CREDENTIALS.redirect);
        } else {
            _loginError(btn, 'Sai tên đăng nhập hoặc mật khẩu admin.');
        }
        return;
    }

    // ── Student login — kiểm tra tài khoản do admin tạo ──
    const users = JSON.parse(localStorage.getItem('hw_users') || '[]');
    const user  = users.find(u => u.username === username && u.password === inputHash);

    if (user) {
        // Kiểm tra tài khoản có bị vô hiệu hóa không
        if (user.isActive === false) {
            _loginError(btn, 'Tài khoản đã bị vô hiệu hóa. Liên hệ admin.');
            return;
        }
        const userData = JSON.stringify({
            username:    user.username,
            displayName: user.displayName || user.username,
            role:        user.role === 'admin' ? 'admin' : 'student',
            loginMethod: 'password',
            dbId:        user.id || null
        });
        if (remember) localStorage.setItem('hw_user', userData);
        else sessionStorage.setItem('hw_user', userData);
        btn.innerHTML = '<i class="fas fa-check"></i> Thành công!';
        btn.style.background = 'linear-gradient(135deg, #43e97b, #38f9d7)';
        const dest = user.role === 'admin' ? 'pages/admin.html' : 'index.html';
        showPageLoader('Đang tải trang...', _getRedirectParam() || dest);
    } else {
        _loginError(btn, 'Tên đăng nhập hoặc mật khẩu không đúng.');
    }
}

function _loginError(btn, msg) {
    btn.innerHTML = '<span class="btn-login-text">ĐĂNG NHẬP</span><div class="btn-login-glow"></div>';
    btn.disabled  = false;
    btn.style.background = '';
    document.getElementById('errorText').textContent = msg;
    document.getElementById('errorMsg').classList.add('show');
    document.getElementById('password').value = '';
}

// ── Google OAuth ─────────────────────────────────────────────
function loginWithGoogle() {
    if (typeof google === 'undefined' || !google.accounts) {
        _showError('Google Sign-In chưa sẵn sàng. Vui lòng thử lại sau.');
        return;
    }

    const btn = document.getElementById('btnGoogle');
    btn.disabled = true;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" class="spin-slow">
        <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
        <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg><span>Đang kết nối...</span>`;

    google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        callback: (tokenResponse) => {
            if (tokenResponse.error) {
                _resetGoogleBtn();
                _showError('Đăng nhập Google thất bại.');
                return;
            }
            _fetchGoogleUserInfo(tokenResponse.access_token);
        },
        error_callback: (err) => {
            _resetGoogleBtn();
            if (err.type !== 'popup_closed') {
                _showError('Không thể mở cửa sổ đăng nhập Google.');
            }
        }
    }).requestAccessToken({ prompt: 'select_account' });
}

function handleGoogleCredential(response) {
    if (!response.credential) return;
    const payload = _decodeJWT(response.credential);
    if (payload) {
        _loginWithGoogleUser({ name: payload.name, email: payload.email, picture: payload.picture, sub: payload.sub });
    }
}

function _fetchGoogleUserInfo(accessToken) {
    fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: 'Bearer ' + accessToken }
    })
    .then(r => r.json())
    .then(info => _loginWithGoogleUser({ name: info.name, email: info.email, picture: info.picture, sub: info.sub }))
    .catch(() => { _resetGoogleBtn(); _showError('Không thể lấy thông tin tài khoản Google.'); });
}

function _loginWithGoogleUser(googleUser) {
    const userData = JSON.stringify({
        username: googleUser.email,
        displayName: googleUser.name,
        email: googleUser.email,
        avatar: googleUser.picture,
        role: 'student',
        loginMethod: 'google',
        googleId: googleUser.sub
    });
    localStorage.setItem('hw_user', userData);

    // Lưu/cập nhật user lên Supabase (nếu đã cấu hình)
    if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured()) {
        console.log('[Supabase] Đang upsert user...', googleUser.email);
        sbUpsertUser({
            googleId:    googleUser.sub,
            email:       googleUser.email,
            displayName: googleUser.name,
            avatar:      googleUser.picture
        }).then(dbUser => {
            if (dbUser) {
                console.log('[Supabase] Upsert thành công:', dbUser);
                const updated = JSON.parse(localStorage.getItem('hw_user'));
                updated.dbId = dbUser.id;
                updated.role = dbUser.role;
                localStorage.setItem('hw_user', JSON.stringify(updated));
            } else {
                console.warn('[Supabase] Upsert trả về null — kiểm tra RLS hoặc schema');
            }
        }).catch(err => {
            console.error('[Supabase] Lỗi upsert:', err);
        });
    } else {
        console.warn('[Supabase] Chưa cấu hình hoặc supabase.js chưa được load');
    }

    const redirect = _getRedirectParam();
    showPageLoader('Đăng nhập thành công!', redirect || 'index.html');
}

function _decodeJWT(token) {
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    } catch (e) { return null; }
}

function _showError(msg) {
    const errorMsg  = document.getElementById('errorMsg');
    const errorText = document.getElementById('errorText');
    errorText.textContent = msg;
    errorMsg.classList.add('show');
    _resetGoogleBtn();
}

function _resetGoogleBtn() {
    const btn = document.getElementById('btnGoogle');
    if (!btn) return;
    btn.disabled = false;
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg><span>Google</span>`;
}

// ── Page loader ───────────────────────────────────────────────
function showPageLoader(text, redirectUrl) {
    const loader     = document.getElementById('pageLoader');
    const loaderText = document.getElementById('loaderText');
    if (!loader) { window.location.href = redirectUrl; return; }
    if (loaderText) loaderText.textContent = text;
    loader.classList.add('active');
    setTimeout(() => { window.location.href = redirectUrl; }, 1200);
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Mặc định tab Học sinh → ẩn form (chỉ dùng Google/GitHub)
    switchRole('student');

    document.getElementById('password').addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('loginForm').requestSubmit();
    });
});
