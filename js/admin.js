// ============================================================
// admin.js — Admin Dashboard (fully functional)
// ============================================================

// ── Storage keys ──────────────────────────────────────────────
const KEYS = {
    users:      'hw_users',
    protection: 'hw_prot_settings',
    system:     'hw_sys_settings',
    violations: 'hw_violations',
};

// ── DOCS data (imported from tai-lieu context) ────────────────
// We read the count from the DOCS array if available, else fallback
function getDocCount() {
    if (typeof DOCS !== 'undefined') return DOCS.length;
    return 0;
}

// ── Helpers ───────────────────────────────────────────────────
function loadJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch { return fallback; }
}

function saveJSON(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
}

function fmtDate(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function fmtTime(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' }) + ' ' +
           d.toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit' });
}

function initials(name) {
    if (!name) return '?';
    return name.trim().split(/\s+/).map(w => w[0]).slice(-2).join('').toUpperCase();
}

// ── Toast ─────────────────────────────────────────────────────
let _toastTimer;
function showToast(msg, type = 'default') {
    const el = document.getElementById('admToast');
    if (!el) return;
    clearTimeout(_toastTimer);
    el.className = 'adm-toast';
    el.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : type === 'warning' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${msg}`;
    if (type !== 'default') el.classList.add(type);
    // Force reflow
    el.getBoundingClientRect();
    el.classList.add('show');
    _toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

// ── Tab switching ─────────────────────────────────────────────
function switchTab(name) {
    document.querySelectorAll('.adm-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.adm-nav-btn').forEach(b => b.classList.remove('active'));
    const tab = document.getElementById('tab-' + name);
    if (tab) tab.classList.add('active');
    const btn = document.querySelector(`.adm-nav-btn[data-tab="${name}"]`);
    if (btn) btn.classList.add('active');
    // Close mobile sidebar
    document.getElementById('admSidebar')?.classList.remove('open');
}

// ══════════════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════════════
function getUsers() {
    return loadJSON(KEYS.users, []);
}

function saveUsers(users) {
    saveJSON(KEYS.users, users);
    updateNavBadges();
}

// Seed current logged-in user if not in list
function seedCurrentUser() {
    const stored = localStorage.getItem('hw_user') || sessionStorage.getItem('hw_user');
    if (!stored) return;
    let current;
    try { current = JSON.parse(stored); } catch { return; }

    const users = getUsers();
    const exists = users.find(u => u.username === current.username);
    if (!exists) {
        users.unshift({
            id: current.username,
            username: current.username,
            displayName: current.displayName || current.username,
            role: current.role || 'admin',
            createdAt: Date.now(),
        });
        saveUsers(users);
    }
}

function renderUsers(list) {
    const tbody = document.getElementById('userTableBody');
    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">
            <div class="adm-empty">
                <div class="adm-empty-icon"><i class="fas fa-user-slash"></i></div>
                <div class="adm-empty-title">Chưa có người dùng</div>
                <div class="adm-empty-desc">Nhấn "Thêm người dùng" để tạo tài khoản mới</div>
            </div></td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(u => `
        <tr>
            <td>
                <div class="adm-user-cell">
                    <div class="adm-avatar">${initials(u.displayName || u.username)}</div>
                    <div>
                        <div class="adm-user-name">${u.displayName || u.username}</div>
                    </div>
                </div>
            </td>
            <td style="color:#64748b;font-size:.82rem">${u.username}</td>
            <td>
                <span class="adm-role ${u.role === 'admin' ? 'adm-role-admin' : 'adm-role-user'}">
                    <i class="fas ${u.role === 'admin' ? 'fa-shield-alt' : 'fa-user'}"></i>
                    ${u.role === 'admin' ? 'Admin' : 'Người dùng'}
                </span>
            </td>
            <td style="color:#64748b;font-size:.82rem">${fmtDate(u.createdAt)}</td>
            <td>
                <div class="adm-tbl-actions">
                    <button class="adm-icon-btn" title="Chỉnh sửa" onclick="openEditUserModal('${u.id}')"><i class="fas fa-pen"></i></button>
                    <button class="adm-icon-btn danger" title="Xóa" onclick="confirmDeleteUser('${u.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>`).join('');
}

function filterUsers() {
    const q = (document.getElementById('userSearch')?.value || '').toLowerCase();
    const users = getUsers();
    const filtered = q ? users.filter(u =>
        (u.displayName || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q)
    ) : users;
    document.getElementById('userCountBadge').textContent = filtered.length;
    renderUsers(filtered);
}

function loadUsersTab() {
    const users = getUsers();
    document.getElementById('userCountBadge').textContent = users.length;
    renderUsers(users);
}

// ── Add / Edit user modal ──
let _editingUserId = null;

function openAddUserModal() {
    _editingUserId = null;
    document.getElementById('userModalTitle').textContent = 'Thêm người dùng';
    document.getElementById('editUserId').value = '';
    document.getElementById('formDisplayName').value = '';
    document.getElementById('formUsername').value = '';
    document.getElementById('formPassword').value = '';
    document.getElementById('formRole').value = 'user';
    document.getElementById('formPasswordGroup').style.display = 'block';
    document.getElementById('userModal').classList.add('open');
}

function openEditUserModal(id) {
    const users = getUsers();
    const u = users.find(x => x.id === id);
    if (!u) return;
    _editingUserId = id;
    document.getElementById('userModalTitle').textContent = 'Chỉnh sửa người dùng';
    document.getElementById('editUserId').value = id;
    document.getElementById('formDisplayName').value = u.displayName || '';
    document.getElementById('formUsername').value = u.username || '';
    document.getElementById('formPassword').value = '';
    document.getElementById('formRole').value = u.role || 'user';
    document.getElementById('formPasswordGroup').style.display = 'block';
    document.getElementById('userModal').classList.add('open');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('open');
}

async function saveUser() {
    const displayName = document.getElementById('formDisplayName').value.trim();
    const username    = document.getElementById('formUsername').value.trim();
    const password    = document.getElementById('formPassword').value;
    const role        = document.getElementById('formRole').value;

    if (!displayName || !username) {
        showToast('Vui lòng điền đầy đủ thông tin', 'warning');
        return;
    }

    const users = getUsers();

    if (_editingUserId) {
        // Edit
        const idx = users.findIndex(u => u.id === _editingUserId);
        if (idx === -1) return;
        users[idx].displayName = displayName;
        users[idx].username    = username;
        users[idx].role        = role;
        // Hash mật khẩu mới nếu có nhập
        if (password) {
            users[idx].password = await _hashPassword(password);
        }
        saveUsers(users);
        showToast('Đã cập nhật người dùng', 'success');
    } else {
        // Add
        const exists = users.find(u => u.username === username);
        if (exists) { showToast('Tên đăng nhập đã tồn tại', 'error'); return; }
        if (!password) { showToast('Vui lòng nhập mật khẩu', 'warning'); return; }

        const hashedPw = await _hashPassword(password);
        const newUser = {
            id: username + '_' + Date.now(),
            username, displayName,
            password: hashedPw,
            role,
            createdAt: Date.now(),
        };
        users.push(newUser);
        saveUsers(users);

        // Đồng bộ lên Supabase nếu đã cấu hình
        if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured()) {
            sbUpsertStudentUser(newUser).then(ok => {
                if (ok) showToast('Đã thêm & đồng bộ lên Supabase ✓', 'success');
                else    showToast('Đã thêm (chưa đồng bộ Supabase)', 'warning');
            });
        } else {
            showToast('Đã thêm người dùng', 'success');
        }
    }

    closeUserModal();
    loadUsersTab();
    refreshDashboard();
}

// Hash mật khẩu SHA-256
async function _hashPassword(pw) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// Upsert học sinh lên Supabase
async function sbUpsertStudentUser(user) {
    try {
        const sb = getSupabase();
        if (!sb) return false;
        const { error } = await sb.from('users').upsert({
            username:     user.username,
            display_name: user.displayName,
            role:         user.role === 'admin' ? 'admin' : 'student',
            login_method: 'password',
            last_login_at: new Date().toISOString()
        }, { onConflict: 'username' });
        return !error;
    } catch { return false; }
}

function confirmDeleteUser(id) {
    const users = getUsers();
    const u = users.find(x => x.id === id);
    if (!u) return;

    // Prevent deleting self
    const stored = localStorage.getItem('hw_user') || sessionStorage.getItem('hw_user');
    let current;
    try { current = JSON.parse(stored); } catch {}
    if (current && current.username === u.username) {
        showToast('Không thể xóa tài khoản đang đăng nhập', 'error');
        return;
    }

    openConfirmModal(
        'Xóa người dùng',
        `Bạn có chắc muốn xóa người dùng <strong>${u.displayName || u.username}</strong>? Hành động này không thể hoàn tác.`,
        () => {
            const updated = getUsers().filter(x => x.id !== id);
            saveUsers(updated);
            loadUsersTab();
            refreshDashboard();
            showToast('Đã xóa người dùng', 'success');
        }
    );
}

// ══════════════════════════════════════════════════════════════
// DOCUMENTS (read from DOCS array in tai-lieu.js)
// ══════════════════════════════════════════════════════════════
function getDocsData() {
    if (typeof DOCS !== 'undefined') return DOCS;
    return [];
}

function renderDocs(list) {
    const tbody = document.getElementById('docTableBody');
    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6">
            <div class="adm-empty">
                <div class="adm-empty-icon"><i class="fas fa-folder-open"></i></div>
                <div class="adm-empty-title">Không tìm thấy tài liệu</div>
                <div class="adm-empty-desc">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</div>
            </div></td></tr>`;
        return;
    }

    const SUBJECT_LABELS = {
        'toan':'Toán','ly':'Vật lý','hoa':'Hóa học','tin':'Tin học',
        'su':'Lịch sử','cong-nghe':'Công nghệ','tieng-anh':'Tiếng Anh','tong-de':'Tổng đề'
    };

    tbody.innerHTML = list.map(doc => {
        const subLabel = SUBJECT_LABELS[doc.subject] || doc.subject;
        const hasFile  = doc.fileUrl && doc.fileUrl !== 'null';
        const views    = doc.views >= 1000 ? (doc.views/1000).toFixed(1).replace(/\.0$/,'') + 'k' : doc.views;
        return `
        <tr>
            <td>
                <div style="font-weight:600;color:#1e293b;font-size:.855rem">${doc.title}</div>
                <div style="font-size:.75rem;color:#94a3b8;margin-top:2px">${doc.author}</div>
            </td>
            <td><span style="font-size:.78rem;color:#667eea;font-weight:600">${subLabel}</span></td>
            <td style="font-size:.78rem;color:#64748b">${doc.chapter}</td>
            <td style="font-size:.82rem;color:#475569"><i class="fas fa-eye" style="color:#94a3b8;margin-right:.3rem"></i>${views}</td>
            <td>
                ${hasFile
                    ? `<span class="adm-file-yes"><i class="fas fa-check-circle"></i> Có file</span>`
                    : `<span class="adm-file-no"><i class="fas fa-times-circle"></i> Chưa có</span>`}
            </td>
            <td>
                <div class="adm-tbl-actions">
                    ${hasFile ? `<button class="adm-icon-btn" title="Xem file" onclick="window.open('${doc.fileUrl}','_blank')"><i class="fas fa-eye"></i></button>` : ''}
                </div>
            </td>
        </tr>`;
    }).join('');
}

function filterDocs() {
    const q       = (document.getElementById('docSearch')?.value || '').toLowerCase();
    const subject = document.getElementById('docSubjectFilter')?.value || '';
    const docs    = getDocsData();
    const filtered = docs.filter(d => {
        const matchSubj = !subject || d.subject === subject;
        const matchQ    = !q || d.title.toLowerCase().includes(q) || d.chapter.toLowerCase().includes(q) || d.author.toLowerCase().includes(q);
        return matchSubj && matchQ;
    });
    document.getElementById('docCountBadge').textContent = filtered.length;
    renderDocs(filtered);
}

function loadDocsTab() {
    const docs = getDocsData();
    document.getElementById('docCountBadge').textContent = docs.length;
    renderDocs(docs);
}

// ══════════════════════════════════════════════════════════════
// VIOLATIONS LOG
// ══════════════════════════════════════════════════════════════
function getViolations() {
    return loadJSON(KEYS.violations, []);
}

function renderViolationLog(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const violations = getViolations();

    if (violations.length === 0) {
        el.innerHTML = `
            <div class="adm-empty">
                <div class="adm-empty-icon" style="color:#22c55e"><i class="fas fa-shield-alt"></i></div>
                <div class="adm-empty-title">Không có vi phạm</div>
                <div class="adm-empty-desc">Hệ thống chưa ghi nhận vi phạm nào</div>
            </div>`;
        return;
    }

    el.innerHTML = violations.slice().reverse().slice(0, 20).map(v => `
        <div class="adm-vlog-item">
            <div class="adm-vlog-icon"><i class="fas fa-ban"></i></div>
            <div>
                <div class="adm-vlog-user">${v.user || 'Ẩn danh'}</div>
                <div class="adm-vlog-detail">${v.action || 'Vi phạm không xác định'} — ${v.doc || ''}</div>
            </div>
            <div class="adm-vlog-time">${fmtTime(v.ts)}</div>
        </div>`).join('');
}

function clearViolationLog() {
    openConfirmModal(
        'Xóa log vi phạm',
        'Bạn có chắc muốn xóa toàn bộ log vi phạm? Hành động này không thể hoàn tác.',
        () => {
            saveJSON(KEYS.violations, []);
            renderViolationLog('violationLog');
            renderViolationLog('dashViolations');
            document.getElementById('statViolations').textContent = '0';
            showToast('Đã xóa log vi phạm', 'success');
        }
    );
}

// ══════════════════════════════════════════════════════════════
// PROTECTION SETTINGS
// ══════════════════════════════════════════════════════════════
function loadProtectionSettings() {
    const s = loadJSON(KEYS.protection, {
        blockCopy: false, blockRightClick: false,
        blockDevtools: false, watermark: false, logViolations: false
    });
    document.getElementById('prot_blockCopy').checked       = !!s.blockCopy;
    document.getElementById('prot_blockRightClick').checked = !!s.blockRightClick;
    document.getElementById('prot_blockDevtools').checked   = !!s.blockDevtools;
    document.getElementById('prot_watermark').checked       = !!s.watermark;
    document.getElementById('prot_logViolations').checked   = !!s.logViolations;
}

function saveProtectionSettings() {
    const s = {
        blockCopy:       document.getElementById('prot_blockCopy').checked,
        blockRightClick: document.getElementById('prot_blockRightClick').checked,
        blockDevtools:   document.getElementById('prot_blockDevtools').checked,
        watermark:       document.getElementById('prot_watermark').checked,
        logViolations:   document.getElementById('prot_logViolations').checked,
    };
    saveJSON(KEYS.protection, s);
    showToast('Đã lưu cài đặt bảo vệ', 'success');
}

// ══════════════════════════════════════════════════════════════
// SYSTEM SETTINGS
// ══════════════════════════════════════════════════════════════
function loadSystemSettings() {
    const s = loadJSON(KEYS.system, {
        allowRegister: true, maintenance: false, notifyViolation: true
    });
    document.getElementById('sys_allowRegister').checked    = !!s.allowRegister;
    document.getElementById('sys_maintenance').checked      = !!s.maintenance;
    document.getElementById('sys_notifyViolation').checked  = !!s.notifyViolation;
}

function saveSystemSettings() {
    const s = {
        allowRegister:   document.getElementById('sys_allowRegister').checked,
        maintenance:     document.getElementById('sys_maintenance').checked,
        notifyViolation: document.getElementById('sys_notifyViolation').checked,
    };
    saveJSON(KEYS.system, s);
    showToast('Đã lưu cài đặt hệ thống', 'success');
}

// ══════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════
function exportUsers() {
    const users = getUsers().map(u => ({
        username: u.username,
        displayName: u.displayName,
        role: u.role,
        createdAt: fmtDate(u.createdAt),
    }));
    const blob = new Blob([JSON.stringify(users, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'housework_users_' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
    showToast('Đã xuất dữ liệu người dùng', 'success');
}

// ══════════════════════════════════════════════════════════════
// RESET DATA
// ══════════════════════════════════════════════════════════════
function confirmResetData() {
    openConfirmModal(
        'Reset dữ liệu',
        'Bạn có chắc muốn xóa toàn bộ dữ liệu người dùng và cài đặt? Tài khoản admin hiện tại sẽ được giữ lại.',
        () => {
            const stored = localStorage.getItem('hw_user') || sessionStorage.getItem('hw_user');
            let current;
            try { current = JSON.parse(stored); } catch {}

            // Keep only current admin
            const adminOnly = current ? [{
                id: current.username,
                username: current.username,
                displayName: current.displayName || current.username,
                role: 'admin',
                createdAt: Date.now(),
            }] : [];

            saveUsers(adminOnly);
            saveJSON(KEYS.violations, []);
            localStorage.removeItem(KEYS.protection);
            localStorage.removeItem(KEYS.system);

            loadUsersTab();
            loadProtectionSettings();
            loadSystemSettings();
            refreshDashboard();
            showToast('Đã reset dữ liệu hệ thống', 'success');
        }
    );
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════
function refreshDashboard() {
    const users      = getUsers();
    const docs       = getDocsData();
    const violations = getViolations();
    const admins     = users.filter(u => u.role === 'admin');

    document.getElementById('statUsers').textContent      = users.length;
    document.getElementById('statDocs').textContent       = docs.length;
    document.getElementById('statViolations').textContent = violations.filter(v => {
        const today = new Date(); const vd = new Date(v.ts);
        return vd.toDateString() === today.toDateString();
    }).length;
    document.getElementById('statAdmins').textContent = admins.length;

    // Recent users
    const recentEl = document.getElementById('dashRecentUsers');
    if (recentEl) {
        const recent = users.slice().sort((a,b) => (b.createdAt||0) - (a.createdAt||0)).slice(0, 5);
        if (recent.length === 0) {
            recentEl.innerHTML = `<div class="adm-empty"><div class="adm-empty-icon"><i class="fas fa-users"></i></div><div class="adm-empty-title">Chưa có người dùng</div></div>`;
        } else {
            recentEl.innerHTML = recent.map(u => `
                <div style="display:flex;align-items:center;gap:.65rem;padding:.65rem 0;border-bottom:1px solid #f8fafc">
                    <div class="adm-avatar">${initials(u.displayName || u.username)}</div>
                    <div style="flex:1">
                        <div style="font-weight:600;font-size:.855rem;color:#1e293b">${u.displayName || u.username}</div>
                        <div style="font-size:.75rem;color:#94a3b8">${u.username}</div>
                    </div>
                    <span class="adm-role ${u.role === 'admin' ? 'adm-role-admin' : 'adm-role-user'}" style="font-size:.7rem">
                        ${u.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                </div>`).join('');
        }
    }

    // Violations
    renderViolationLog('dashViolations');
}

// ══════════════════════════════════════════════════════════════
// CONFIRM MODAL
// ══════════════════════════════════════════════════════════════
let _confirmCallback = null;

function openConfirmModal(title, message, onConfirm) {
    document.getElementById('confirmTitle').textContent   = title;
    document.getElementById('confirmMessage').innerHTML   = message;
    _confirmCallback = onConfirm;
    document.getElementById('confirmModal').classList.add('open');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('open');
    _confirmCallback = null;
}

document.addEventListener('click', e => {
    if (e.target.id === 'confirmOkBtn') {
        closeConfirmModal();
        if (_confirmCallback) _confirmCallback();
    }
});

// Close modals on overlay click
document.addEventListener('click', e => {
    if (e.target.id === 'userModal')    closeUserModal();
    if (e.target.id === 'confirmModal') closeConfirmModal();
});

// ══════════════════════════════════════════════════════════════
// NAV BADGES
// ══════════════════════════════════════════════════════════════
function updateNavBadges() {
    const users = getUsers();
    const docs  = getDocsData();
    const ub = document.getElementById('navBadgeUsers');
    const db = document.getElementById('navBadgeDocs');
    if (ub) ub.textContent = users.length;
    if (db) db.textContent = docs.length;
}

// ══════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    // Auth guard — admin only
    const user = initAuth({ adminOnly: true });
    if (!user) return;

    initNavbar();

    // Show admin name in sidebar
    const nameEl = document.getElementById('sidebarAdminName');
    if (nameEl) nameEl.textContent = user.displayName || user.username;

    // Dashboard date
    const dateEl = document.getElementById('dashDate');
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString('vi-VN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    // Seed current user into users list
    seedCurrentUser();

    // Load all data
    refreshDashboard();
    loadProtectionSettings();
    loadSystemSettings();
    updateNavBadges();

    // Sidebar nav
    document.querySelectorAll('.adm-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
            // Load tab data on demand
            if (tab === 'users')     loadUsersTab();
            if (tab === 'documents') loadDocsTab();
            if (tab === 'protection') renderViolationLog('violationLog');
        });
    });

    // Mobile sidebar toggle
    const toggle  = document.getElementById('admMobToggle');
    const sidebar = document.getElementById('admSidebar');
    if (toggle && sidebar) {
        toggle.addEventListener('click', e => {
            e.stopPropagation();
            sidebar.classList.toggle('open');
        });
        document.addEventListener('click', e => {
            if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }
});
