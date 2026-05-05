// ============================================================
// admin.js — Admin Dashboard (fully functional)
// ============================================================

// ── Storage keys ──────────────────────────────────────────────
const KEYS = {
    users:      'hw_users',
    protection: 'hw_prot_settings',
    system:     'hw_sys_settings',
    violations: 'hw_violations',
    content:    'hw_content',   // tài liệu & video do admin upload
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

function toggleAdminPw() {
    const pw  = document.getElementById('formPassword');
    const eye = document.getElementById('adminPwEye');
    if (pw.type === 'password') {
        pw.type = 'text';
        eye.className = 'fas fa-eye-slash';
    } else {
        pw.type = 'password';
        eye.className = 'fas fa-eye';
    }
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

        // Đồng bộ lên Supabase
        if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured()) {
            sbUpsertStudentUser(users[idx]).then(ok => {
                showToast(ok ? 'Đã cập nhật & đồng bộ Supabase ✓' : 'Đã cập nhật (chưa đồng bộ Supabase)', ok ? 'success' : 'warning');
            });
        } else {
            showToast('Đã cập nhật người dùng', 'success');
        }
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
        const { data, error } = await sb.from('users').upsert({
            username:      user.username,
            display_name:  user.displayName,
            password_hash: user.password,   // SHA-256 hash
            role:          user.role === 'admin' ? 'admin' : 'student',
            login_method:  'password',
            is_active:     true,
            last_login_at: new Date().toISOString()
        }, { onConflict: 'username' })
        .select('id')
        .single();

        if (error) {
            console.error('[Supabase] sbUpsertStudentUser error:', error.message);
            return false;
        }

        // Cập nhật lại id từ Supabase vào localStorage
        if (data?.id) {
            const users = getUsers();
            const idx = users.findIndex(u => u.username === user.username);
            if (idx !== -1) {
                users[idx].dbId = data.id;
                saveUsers(users);
            }
        }
        return true;
    } catch(e) {
        console.error('[Supabase] sbUpsertStudentUser exception:', e);
        return false;
    }
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

    if (confirm(`Xóa người dùng "${u.displayName || u.username}"?\nHành động này không thể hoàn tác.`)) {
        const updated = getUsers().filter(x => x.id !== id);
        saveUsers(updated);
        loadUsersTab();
        refreshDashboard();
        showToast('Đã xóa người dùng', 'success');
    }
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
    // Gắn onclick trực tiếp vào nút — tránh conflict event listeners
    const okBtn = document.getElementById('confirmOkBtn');
    okBtn.onclick = () => {
        closeConfirmModal();
        if (_confirmCallback) _confirmCallback();
    };
    document.getElementById('confirmModal').classList.add('open');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('open');
    _confirmCallback = null;
}

// Close modals on overlay click
document.addEventListener('click', e => {
    if (e.target.id === 'userModal')    closeUserModal();
    if (e.target.id === 'contentModal') closeContentModal();
    if (e.target.id === 'confirmModal') closeConfirmModal();
});

// Content grid — event delegation cho view/edit/delete
document.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id     = btn.dataset.id;
    if (!id) return;

    if (action === 'edit') {
        openEditContentModal(id);
    } else if (action === 'delete') {
        confirmDeleteContent(id);
    } else if (action === 'view') {
        const list = getContent();
        const c = list.find(x => x.id === id);
        if (c && c.url) {
            // Mở trong iframe modal thay vì tab mới
            _openPreviewModal(c.url, c.title, c.type);
        }
    }
});

// ══════════════════════════════════════════════════════════════
// NAV BADGES
// ══════════════════════════════════════════════════════════════
function updateNavBadges() {
    const users   = getUsers();
    const docs    = getDocsData();
    const content = getContent();
    const ub = document.getElementById('navBadgeUsers');
    const db = document.getElementById('navBadgeDocs');
    const cb = document.getElementById('navBadgeContent');
    if (ub) ub.textContent = users.length;
    if (db) db.textContent = docs.length;
    if (cb) cb.textContent = content.length;
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
            if (tab === 'content')   loadContentTab();
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

// ══════════════════════════════════════════════════════════════
// CONTENT MANAGEMENT — Upload tài liệu & video
// ══════════════════════════════════════════════════════════════

const SUBJECT_LABELS = {
    'toan':'Toán','ly':'Vật lý','hoa':'Hóa học','tin':'Tin học',
    'su':'Lịch sử','cong-nghe':'Công nghệ','tieng-anh':'Tiếng Anh','tong-de':'Tổng đề'
};

function getContent() {
    return loadJSON(KEYS.content, []);
}

function saveContent(list) {
    saveJSON(KEYS.content, list);
    updateNavBadges();
}

// ── Render danh sách nội dung ──
function loadContentTab() {
    const list = getContent();
    const badge = document.getElementById('navBadgeContent');
    const countBadge = document.getElementById('contentCountBadge');
    if (badge) badge.textContent = list.length;
    if (countBadge) countBadge.textContent = list.length;
    renderContentList(list);
    _initDropZone();
}

function filterContent() {
    const q    = (document.getElementById('contentSearch')?.value || '').toLowerCase();
    const type = document.getElementById('contentTypeFilter')?.value || '';
    const list = getContent();
    const filtered = list.filter(c => {
        const matchType = !type || c.type === type;
        const matchQ    = !q || c.title.toLowerCase().includes(q) || (c.subject||'').toLowerCase().includes(q);
        return matchType && matchQ;
    });
    document.getElementById('contentCountBadge').textContent = filtered.length;
    renderContentList(filtered);
}

function renderContentList(list) {
    const grid = document.getElementById('contentGrid');
    if (!grid) return;

    if (!list || list.length === 0) {
        grid.innerHTML = `
            <div class="adm-empty" style="grid-column:1/-1;padding:3rem">
                <div class="adm-empty-icon"><i class="fas fa-photo-video"></i></div>
                <div class="adm-empty-title">Chưa có nội dung</div>
                <div class="adm-empty-desc">Nhấn "Thêm nội dung" để upload tài liệu hoặc video</div>
            </div>`;
        return;
    }

    grid.innerHTML = list.map(c => {
        const isVideo = c.type === 'video';
        const isPdf   = c.type === 'pdf';
        const icon    = isVideo ? 'fa-play-circle' : isPdf ? 'fa-file-pdf' : 'fa-file-alt';
        const color   = isVideo ? '#f43f5e' : isPdf ? '#ef4444' : '#667eea';
        const subLabel = SUBJECT_LABELS[c.subject] || c.subject || '—';
        const destMap  = { docs: 'Tài liệu', library: 'Thư viện', both: 'Cả hai' };
        const dest     = destMap[c.target] || c.target;
        const destIcon = c.target === 'library' ? 'fa-layer-group' : c.target === 'both' ? 'fa-clone' : 'fa-book';
        const hasUrl   = c.url && c.url.length > 0;
        const urlLabel = c.url && c.url.startsWith('data:') ? 'File đã upload' : c.url ? c.url.slice(0,40) + '...' : '—';

        return `
        <div class="content-card" data-id="${c.id}">
            <div class="content-card-thumb" style="background:${isVideo ? 'linear-gradient(135deg,#1a1a2e,#16213e)' : 'linear-gradient(135deg,#f8fafc,#eef2ff)'}">
                <i class="fas ${icon}" style="font-size:2.5rem;color:${color}"></i>
                <span class="content-type-badge" style="background:${color}">
                    <i class="fas ${icon}"></i> ${c.type.toUpperCase()}
                </span>
            </div>
            <div class="content-card-body">
                <div class="content-card-title">${c.title}</div>
                <div class="content-card-meta">
                    <span><i class="fas fa-book-open" style="color:#667eea"></i> ${subLabel}</span>
                    <span><i class="fas ${destIcon}" style="color:#94a3b8"></i> ${dest}</span>
                </div>
                ${c.description ? `<div class="content-card-desc">${c.description}</div>` : ''}
                <div class="content-card-footer">
                    <span style="font-size:.72rem;color:#94a3b8">${fmtDate(c.createdAt)}</span>
                    <div class="adm-tbl-actions">
                        ${hasUrl ? `<button class="adm-icon-btn" title="Xem" data-action="view" data-id="${c.id}"><i class="fas fa-eye"></i></button>` : ''}
                        <button class="adm-icon-btn" title="Sửa" data-action="edit" data-id="${c.id}"><i class="fas fa-pen"></i></button>
                        <button class="adm-icon-btn danger" title="Xóa" data-action="delete" data-id="${c.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

// ── Modal thêm/sửa nội dung ──
let _editingContentId = null;

function openAddContentModal() {
    _editingContentId = null;
    document.getElementById('contentModalTitle').textContent = 'Thêm nội dung mới';
    document.getElementById('cFormTitle').value       = '';
    document.getElementById('cFormSubject').value     = 'toan';
    document.getElementById('cFormType').value        = 'pdf';
    document.getElementById('cFormTarget').value      = 'docs';
    document.getElementById('cFormDesc').value        = '';
    document.getElementById('cFormUrl').value         = '';
    document.getElementById('cFormVideoUrl').value    = '';
    document.getElementById('cFormFile') && (document.getElementById('cFormFile').value = '');
    document.getElementById('cFormChapter').value     = '';
    document.getElementById('cFormAuthor').value      = '';
    document.getElementById('cFilePreview') && (document.getElementById('cFilePreview').innerHTML = '');
    const lg = document.getElementById('cLinkGuide');
    const vg = document.getElementById('cVideoGuide');
    if (lg) lg.style.display = 'none';
    if (vg) vg.style.display = 'none';
    _toggleContentTypeFields('pdf');
    document.getElementById('contentModal').classList.add('open');
    setTimeout(_initDropZone, 50);
}

function openEditContentModal(id) {
    const list = getContent();
    const c = list.find(x => x.id === id);
    if (!c) return;
    _editingContentId = id;
    document.getElementById('contentModalTitle').textContent = 'Chỉnh sửa nội dung';
    document.getElementById('cFormTitle').value    = c.title || '';
    document.getElementById('cFormSubject').value  = c.subject || 'toan';
    document.getElementById('cFormType').value     = c.type || 'pdf';
    document.getElementById('cFormTarget').value   = c.target || 'docs';
    document.getElementById('cFormDesc').value     = c.description || '';
    document.getElementById('cFormChapter').value  = c.chapter || '';
    document.getElementById('cFormAuthor').value   = c.author || '';
    // Set URL đúng field tùy loại
    if (c.type === 'video') {
        document.getElementById('cFormVideoUrl').value = c.url || '';
        document.getElementById('cFormUrl').value      = '';
    } else {
        document.getElementById('cFormUrl').value      = c.url || '';
        document.getElementById('cFormVideoUrl').value = '';
    }
    document.getElementById('cFilePreview').innerHTML = c.url && c.type !== 'video' && !c.url.startsWith('data:')
        ? `<div class="file-preview-item"><i class="fas fa-link"></i> <span style="font-size:.8rem;word-break:break-all">${c.url.slice(0,80)}${c.url.length > 80 ? '...' : ''}</span></div>`
        : c.url && c.url.startsWith('data:')
        ? `<div class="file-preview-item"><i class="fas fa-file-pdf" style="color:#ef4444"></i> <span>File đã upload (base64)</span></div>`
        : '';
    _toggleContentTypeFields(c.type);
    document.getElementById('contentModal').classList.add('open');
}

function closeContentModal() {
    document.getElementById('contentModal').classList.remove('open');
}
function _toggleContentTypeFields(type) {
    const urlGroup  = document.getElementById('cUrlGroup');
    const fileGroup = document.getElementById('cFileGroup');
    if (type === 'video') {
        urlGroup.style.display  = 'block';
        fileGroup.style.display = 'none';
    } else {
        urlGroup.style.display  = 'none';
        fileGroup.style.display = 'block';
    }
}

// Đọc file thành base64 để lưu vào localStorage
function handleFileSelect(input) {
    const file = input.files[0];
    if (!file) return;
    const preview = document.getElementById('cFilePreview');
    const maxMB = 5; // Giới hạn 5MB cho localStorage

    if (file.size > maxMB * 1024 * 1024) {
        // File lớn hơn 5MB → chỉ lưu tên, không encode base64
        preview.innerHTML = `
            <div class="file-preview-item" style="background:#fff7ed;border-color:#fed7aa;color:#c2410c">
                <i class="fas fa-exclamation-triangle"></i>
                <span>File lớn (${(file.size/1024/1024).toFixed(1)}MB) — nhập đường dẫn thủ công bên dưới</span>
            </div>`;
        showToast(`File > ${maxMB}MB, vui lòng nhập đường dẫn thủ công`, 'warning');
        input.value = '';
        return;
    }

    // Đọc file thành base64
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result; // data:application/pdf;base64,...
        document.getElementById('cFormUrl').value = base64;
        preview.innerHTML = `
            <div class="file-preview-item">
                <i class="fas ${file.type.includes('pdf') ? 'fa-file-pdf' : 'fa-file'}" style="color:#ef4444"></i>
                <span style="font-weight:600">${file.name}</span>
                <span style="color:#94a3b8;font-size:.75rem">(${(file.size/1024/1024).toFixed(2)} MB — đã mã hóa)</span>
            </div>`;
        showToast('Đã đọc file thành công ✓', 'success');
    };
    reader.onerror = () => showToast('Không thể đọc file', 'error');
    reader.readAsDataURL(file);
}

async function saveContent_form() {
    const title   = document.getElementById('cFormTitle').value.trim();
    const subject = document.getElementById('cFormSubject').value;
    const type    = document.getElementById('cFormType').value;
    const target  = document.getElementById('cFormTarget').value;
    const desc    = document.getElementById('cFormDesc').value.trim();
    const chapter = document.getElementById('cFormChapter').value.trim();
    const author  = document.getElementById('cFormAuthor').value.trim();

    // Lấy URL tùy loại và tự convert
    let url = '';
    if (type === 'video') {
        url = _convertVideoUrl((document.getElementById('cFormVideoUrl')?.value || '').trim());
    } else {
        url = _convertDocUrl((document.getElementById('cFormUrl')?.value || '').trim());
    }

    if (!title) { showToast('Vui lòng nhập tiêu đề', 'warning'); return; }

    const list = getContent();

    if (_editingContentId) {
        const idx = list.findIndex(c => c.id === _editingContentId);
        if (idx === -1) return;
        Object.assign(list[idx], { title, subject, type, target, description: desc, url, chapter, author });
        saveContent(list);
        showToast('Đã cập nhật nội dung', 'success');
    } else {
        const newItem = {
            id:          'c_' + Date.now(),
            title, subject, type, target,
            description: desc,
            url,
            chapter,
            author,
            createdAt:   Date.now(),
        };
        list.unshift(newItem);
        saveContent(list);

        if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured()) {
            _syncContentToSupabase(newItem);
        }
        showToast('Đã thêm nội dung ✓', 'success');
    }

    closeContentModal();
    loadContentTab();
    refreshDashboard();
}

async function _syncContentToSupabase(item) {
    try {
        const sb = getSupabase();
        if (!sb) return;
        await sb.from('documents').insert({
            subject:      item.subject,
            chapter:      item.chapter || item.type,
            title:        item.title,
            description:  item.description,
            author:       item.author,
            file_url:     item.type !== 'video' ? item.url : null,
            download_url: item.type !== 'video' ? item.url : null,
            is_published: true
        });
    } catch(e) { console.warn('Sync Supabase failed:', e); }
}

function confirmDeleteContent(id) {
    const list = getContent();
    const c = list.find(x => x.id === id);
    if (!c) return;

    // Dùng confirm() native của trình duyệt — đơn giản, chắc chắn hoạt động
    if (confirm(`Xóa "${c.title}"?\nHành động này không thể hoàn tác.`)) {
        const updated = getContent().filter(x => x.id !== id);
        saveContent(updated);
        loadContentTab();
        refreshDashboard();
        showToast('Đã xóa nội dung', 'success');
    }
}

// Expose content cho trang tài liệu & thư viện
window.HW_getContent = function(target) {
    return getContent().filter(c => !target || c.target === target);
};

// ── Preview modal (iframe) ────────────────────────────────────
function _openPreviewModal(url, title, type) {
    let modal = document.getElementById('hw-preview-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'hw-preview-modal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,0.88);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1rem';
        modal.innerHTML = `
            <div style="background:#0f172a;border-radius:16px;width:100%;max-width:900px;height:90vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,.6)">
                <div style="display:flex;align-items:center;justify-content:space-between;padding:.85rem 1.2rem;border-bottom:1px solid rgba(255,255,255,.08);flex-shrink:0">
                    <h3 id="hw-preview-title" style="color:white;font-size:.95rem;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;margin-right:1rem"></h3>
                    <div style="display:flex;gap:.5rem;flex-shrink:0">
                        <a id="hw-preview-open" href="#" target="_blank" style="background:rgba(255,255,255,.1);border:none;color:white;padding:.4rem .9rem;border-radius:8px;font-size:.78rem;font-weight:600;text-decoration:none;display:flex;align-items:center;gap:.35rem">
                            <i class="fas fa-external-link-alt"></i> Mở tab mới
                        </a>
                        <button onclick="document.getElementById('hw-preview-modal').style.display='none';document.getElementById('hw-preview-frame').src=''" style="background:rgba(255,255,255,.1);border:none;color:white;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:.9rem;display:flex;align-items:center;justify-content:center">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <iframe id="hw-preview-frame" style="flex:1;border:none;width:100%;background:white" allowfullscreen></iframe>
            </div>`;
        modal.addEventListener('click', e => {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.getElementById('hw-preview-frame').src = '';
            }
        });
        document.body.appendChild(modal);
    }
    document.getElementById('hw-preview-title').textContent = title || 'Xem tài liệu';
    document.getElementById('hw-preview-open').href = url;
    document.getElementById('hw-preview-frame').src = url;
    modal.style.display = 'flex';
}

// ── Convert URL tài liệu sang dạng nhúng ─────────────────────
function _convertDocUrl(url) {
    if (!url) return url;
    // Google Drive: /view hoặc /view?usp=sharing → /preview
    if (url.includes('drive.google.com/file/d/')) {
        return url.replace(/\/view(\?.*)?$/, '/preview').replace(/\/edit(\?.*)?$/, '/preview');
    }
    // Google Docs/Sheets/Slides → export PDF
    if (url.includes('docs.google.com/document/d/')) {
        const id = url.match(/\/d\/([^/]+)/)?.[1];
        if (id) return `https://docs.google.com/document/d/${id}/preview`;
    }
    // OneDrive share link → embed
    if (url.includes('1drv.ms') || url.includes('onedrive.live.com')) {
        return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    }
    return url;
}

function _convertVideoUrl(url) {
    if (!url) return url;
    // YouTube watch → embed
    if (url.includes('youtube.com/watch')) {
        try {
            const vid = new URL(url).searchParams.get('v');
            if (vid) return `https://www.youtube.com/embed/${vid}`;
        } catch {}
    }
    // youtu.be short link → embed
    if (url.includes('youtu.be/')) {
        const vid = url.split('youtu.be/')[1]?.split('?')[0];
        if (vid) return `https://www.youtube.com/embed/${vid}`;
    }
    // Google Drive video: /view → /preview
    if (url.includes('drive.google.com/file/d/')) {
        return url.replace(/\/view(\?.*)?$/, '/preview').replace(/\/edit(\?.*)?$/, '/preview');
    }
    return url;
}

// ── Hướng dẫn link tài liệu ──────────────────────────────────
const LINK_GUIDES = {
    drive: {
        guide: `<b>Google Drive:</b><br>
1. Mở file trên Drive → nhấn <b>Chia sẻ</b><br>
2. Đổi quyền thành <b>"Bất kỳ ai có đường liên kết"</b><br>
3. Copy link dạng: <code>https://drive.google.com/file/d/FILE_ID/view</code><br>
4. Dán vào ô trên — hệ thống tự chuyển sang link nhúng`,
        placeholder: 'https://drive.google.com/file/d/FILE_ID/view'
    },
    onedrive: {
        guide: `<b>OneDrive:</b><br>
1. Chuột phải file → <b>Chia sẻ</b> → <b>Sao chép liên kết</b><br>
2. Đảm bảo quyền <b>"Bất kỳ ai có liên kết"</b><br>
3. Dán link vào ô trên`,
        placeholder: 'https://1drv.ms/b/...'
    },
    dropbox: {
        guide: `<b>Dropbox:</b><br>
1. Chuột phải file → <b>Copy link</b><br>
2. Đổi <code>?dl=0</code> thành <code>?raw=1</code> ở cuối link<br>
3. Dán link vào ô trên`,
        placeholder: 'https://www.dropbox.com/s/.../file.pdf?raw=1'
    },
    direct: {
        guide: `<b>Link trực tiếp:</b><br>
Dán URL trực tiếp đến file PDF hoặc tài liệu.<br>
Ví dụ: <code>https://example.com/tai-lieu.pdf</code>`,
        placeholder: 'https://example.com/tai-lieu.pdf'
    }
};

const VIDEO_GUIDES = {
    youtube: {
        guide: `<b>YouTube:</b><br>
1. Mở video → nhấn <b>Chia sẻ</b> → <b>Nhúng</b><br>
2. Copy link dạng: <code>https://www.youtube.com/watch?v=VIDEO_ID</code><br>
3. Hoặc dán link thường — hệ thống tự chuyển sang embed`,
        placeholder: 'https://www.youtube.com/watch?v=VIDEO_ID'
    },
    drive: {
        guide: `<b>Google Drive Video:</b><br>
1. Upload video lên Drive → Chia sẻ công khai<br>
2. Copy link: <code>https://drive.google.com/file/d/FILE_ID/view</code>`,
        placeholder: 'https://drive.google.com/file/d/FILE_ID/view'
    }
};

function setLinkHint(type) {
    const guide = LINK_GUIDES[type];
    if (!guide) return;
    const guideEl = document.getElementById('cLinkGuide');
    const input   = document.getElementById('cFormUrl');
    if (guideEl) {
        guideEl.innerHTML = guide.guide;
        guideEl.style.display = 'block';
    }
    if (input && !input.value) input.placeholder = guide.placeholder;
}

function setVideoHint(type) {
    const guide = VIDEO_GUIDES[type];
    if (!guide) return;
    const guideEl = document.getElementById('cVideoGuide');
    const input   = document.getElementById('cFormVideoUrl');
    if (guideEl) {
        guideEl.innerHTML = guide.guide;
        guideEl.style.display = 'block';
    }
    if (input && !input.value) input.placeholder = guide.placeholder;
}

// ── Drag & Drop cho file upload zone ──────────────────────────
function _initDropZone() {
    const zone = document.querySelector('.file-upload-zone');
    if (!zone || zone._dropInited) return;
    zone._dropInited = true;

    zone.addEventListener('dragover', e => {
        e.preventDefault();
        zone.style.borderColor = '#667eea';
        zone.style.background  = '#eef2ff';
    });
    zone.addEventListener('dragleave', () => {
        zone.style.borderColor = '';
        zone.style.background  = '';
    });
    zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.style.borderColor = '';
        zone.style.background  = '';
        const file = e.dataTransfer.files[0];
        if (!file) return;
        const input = document.getElementById('cFormFile');
        // Gán file vào input rồi trigger change
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        handleFileSelect(input);
    });
}
