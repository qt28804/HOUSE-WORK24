// ============================================================
// tien-do.js — Tiến độ học tập (kết nối Supabase)
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    initAuth();
    initNavbar();

    // Lấy user hiện tại
    const stored = localStorage.getItem('hw_user') || sessionStorage.getItem('hw_user');
    if (!stored) return;
    let user;
    try { user = JSON.parse(stored); } catch { return; }

    // Load dữ liệu
    if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured() && user.dbId) {
        await _loadFromSupabase(user);
    } else {
        _loadFromLocalStorage(user);
    }

    // Heatmap luôn render (dù từ nguồn nào)
    _renderHeatmap();
});

// ── Load từ Supabase ──────────────────────────────────────────
async function _loadFromSupabase(user) {
    const userId = user.dbId;

    // Chạy song song
    const [progress, history, heatmapData] = await Promise.all([
        sbGetProgress(userId),
        sbGetExamHistory(userId, 10),
        sbGetActivityHeatmap(userId, 63)
    ]);

    // Stats
    if (progress) {
        _setStatEl('statDocsRead',      progress.docs_read       || 0);
        _setStatEl('statTestsDone',     progress.tests_completed || 0);
        _setStatEl('statHours',         (progress.total_hours || 0) + 'h');
        _setStatEl('statAvgScore',      (progress.avg_score   || 0) + '%');
        _setStatEl('statStreak',        (progress.streak_days || 0) + ' ngày');
        // Hero stats
        _setHeroStat(0, progress.docs_read       || 0);
        _setHeroStat(1, progress.tests_completed || 0);
        _setHeroStat(2, (progress.total_hours || 0) + 'h');
        _setHeroStat(3, (progress.avg_score   || 0) + '%');
    }

    // Lịch sử kiểm tra
    if (history && history.length > 0) {
        _renderTestHistory(history);
    }

    // Heatmap từ Supabase
    if (heatmapData && heatmapData.length > 0) {
        _renderHeatmapFromData(heatmapData);
    }
}

// ── Load từ localStorage (fallback) ──────────────────────────
function _loadFromLocalStorage(user) {
    // Lấy lịch sử kiểm tra từ localStorage nếu có
    const attempts = JSON.parse(localStorage.getItem('hw_exam_attempts') || '[]')
        .filter(a => a.username === user.username)
        .slice(0, 10);

    if (attempts.length > 0) {
        const total = attempts.length;
        const avg   = Math.round(attempts.reduce((s, a) => s + (a.percentage || 0), 0) / total);
        _setHeroStat(1, total);
        _setHeroStat(3, avg + '%');
        _renderTestHistoryLocal(attempts);
    }
}

// ── Render lịch sử kiểm tra (Supabase) ───────────────────────
function _renderTestHistory(list) {
    const el = document.getElementById('testHistoryList');
    if (!el) return;

    const subjectColors = {
        toan: '#ef4444', ly: '#3b82f6', hoa: '#22c55e',
        tin: '#8b5cf6', su: '#f59e0b', 'cong-nghe': '#f97316',
        'tieng-anh': '#06b6d4', 'tong-de': '#667eea'
    };

    el.innerHTML = list.map(a => {
        const pct   = a.percentage || 0;
        const grade = pct >= 80 ? 'high' : pct >= 60 ? 'mid' : 'low';
        const letter = pct >= 80 ? 'A' : pct >= 60 ? 'B' : 'C';
        const color  = pct >= 70 ? '#15803d' : pct >= 50 ? '#a16207' : '#b91c1c';
        const date   = new Date(a.completed_at).toLocaleDateString('vi-VN');
        return `
        <div class="test-item">
            <div class="test-score-badge ${grade}">${letter}</div>
            <div class="test-info">
                <div class="test-name">${a.exam_title || 'Bài kiểm tra'}</div>
                <div class="test-date"><i class="fas fa-calendar" style="margin-right:.3rem"></i>${date}</div>
            </div>
            <div class="test-right">
                <div class="test-pct" style="color:${color}">${pct}%</div>
                <div class="test-correct">${a.score}/${a.total_questions} câu</div>
            </div>
        </div>`;
    }).join('');

    // Cập nhật section title
    const titleEl = document.querySelector('#recentTestsSection .section-title');
    if (titleEl) titleEl.textContent = `Kết quả kiểm tra gần đây`;
    const subEl = document.querySelector('#recentTestsSection .section-subtitle');
    if (subEl) subEl.textContent = `${list.length} bài đã hoàn thành`;
}

// ── Render lịch sử kiểm tra (localStorage) ───────────────────
function _renderTestHistoryLocal(list) {
    const el = document.getElementById('testHistoryList');
    if (!el) return;
    el.innerHTML = list.map(a => {
        const pct    = a.percentage || 0;
        const grade  = pct >= 80 ? 'high' : pct >= 60 ? 'mid' : 'low';
        const letter = pct >= 80 ? 'A' : pct >= 60 ? 'B' : 'C';
        const color  = pct >= 70 ? '#15803d' : pct >= 50 ? '#a16207' : '#b91c1c';
        return `
        <div class="test-item">
            <div class="test-score-badge ${grade}">${letter}</div>
            <div class="test-info">
                <div class="test-name">${a.examTitle || 'Bài kiểm tra'}</div>
                <div class="test-date"><i class="fas fa-calendar" style="margin-right:.3rem"></i>${a.date || 'Gần đây'}</div>
            </div>
            <div class="test-right">
                <div class="test-pct" style="color:${color}">${pct}%</div>
                <div class="test-correct">${a.score}/${a.total} câu</div>
            </div>
        </div>`;
    }).join('');
}

// ── Heatmap ───────────────────────────────────────────────────
function _renderHeatmap() {
    // Dùng data hardcode nếu chưa có Supabase
    const grid = document.getElementById('activityGrid');
    if (!grid || grid.children.length > 0) return;
    const levels = [0,0,1,0,2,1,0, 1,2,3,2,1,0,0, 0,1,2,4,3,2,1,
                    2,3,4,3,2,1,0, 1,2,3,4,3,2,1, 0,1,2,3,4,3,2,
                    1,2,3,2,1,0,0, 0,1,2,3,2,1,0, 1,2,4,3,2,1,0];
    levels.forEach(l => {
        const d = document.createElement('div');
        d.className = 'activity-day' + (l > 0 ? ' l' + l : '');
        grid.appendChild(d);
    });
}

function _renderHeatmapFromData(data) {
    const grid = document.getElementById('activityGrid');
    if (!grid) return;
    grid.innerHTML = '';

    // Tạo map ngày → level
    const dayMap = {};
    data.forEach(d => {
        const key = d.activity_date;
        dayMap[key] = (dayMap[key] || 0) + 1;
    });

    // Render 63 ngày gần nhất (9 tuần)
    for (let i = 62; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key   = date.toISOString().split('T')[0];
        const count = dayMap[key] || 0;
        const level = count === 0 ? 0 : count <= 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4;
        const d = document.createElement('div');
        d.className = 'activity-day' + (level > 0 ? ' l' + level : '');
        d.title = `${key}: ${count} hoạt động`;
        grid.appendChild(d);
    }
}

// ── Helpers ───────────────────────────────────────────────────
function _setStatEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function _setHeroStat(idx, val) {
    const stats = document.querySelectorAll('.progress-hero-stat strong');
    if (stats[idx]) stats[idx].textContent = val;
}
