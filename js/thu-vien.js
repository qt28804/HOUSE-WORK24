// ============================================================
// thu-vien.js — Logic cho trang Thư viện
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initNavbar();

    // Load nội dung từ admin upload trước
    _loadAdminContent();

    // ── Filter buttons ──
    _initFilters();

    // ── Bookmark toggle ──
    document.addEventListener('click', e => {
        const btn = e.target.closest('.btn-bookmark');
        if (!btn) return;
        const icon = btn.querySelector('i');
        const saved = icon.classList.contains('fas');
        icon.className = saved ? 'far fa-bookmark' : 'fas fa-bookmark';
        btn.style.color       = saved ? '' : '#667eea';
        btn.style.borderColor = saved ? '' : '#667eea';
        btn.style.background  = saved ? '' : '#f0f4ff';
    });

    // ── Modal close ──
    const modal = document.getElementById('docModal');
    if (modal) {
        document.getElementById('modalClose').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    }
});

// ── Load nội dung admin upload ────────────────────────────────
function _loadAdminContent() {
    const grid = document.getElementById('libraryGrid');
    if (!grid) return;

    // Lấy nội dung từ admin (target = 'library' hoặc 'both')
    const adminContent = _getAdminContent(['library', 'both']);
    if (adminContent.length === 0) return;

    // Render thêm vào đầu grid
    const html = adminContent.map(c => _renderLibraryItem(c)).join('');
    grid.insertAdjacentHTML('afterbegin', html);

    // Cập nhật filter counts
    _updateFilterCounts();
}

function _getAdminContent(targets) {
    try {
        const list = JSON.parse(localStorage.getItem('hw_content') || '[]');
        return list.filter(c => targets.includes(c.target));
    } catch { return []; }
}

function _renderLibraryItem(c) {
    const isVideo = c.type === 'video';
    const isPdf   = c.type === 'pdf';
    const typeClass = isVideo ? 'type-video' : isPdf ? 'type-pdf' : 'type-code';
    const typeIcon  = isVideo ? 'fa-video' : isPdf ? 'fa-file-pdf' : 'fa-file-alt';
    const typeLabel = isVideo ? 'Video' : isPdf ? 'PDF' : 'Tài liệu';
    const thumbIcon = isVideo ? 'fa-play-circle' : isPdf ? 'fa-file-pdf' : 'fa-file-alt';
    const dataType  = isVideo ? 'video' : isPdf ? 'pdf' : 'code';
    const subjectLabels = {
        'toan':'Toán','ly':'Vật lý','hoa':'Hóa học','tin':'Tin học',
        'su':'Lịch sử','cong-nghe':'Công nghệ','tieng-anh':'Tiếng Anh','tong-de':'Tổng đề'
    };
    const subLabel = subjectLabels[c.subject] || c.subject || '';
    const actionBtn = isVideo
        ? `<button class="btn-view" onclick="openVideoModal('${c.url}','${c.title.replace(/'/g,"\\'")}')"><i class="fas fa-play"></i> Xem video</button>`
        : `<button class="btn-view" onclick="openDocModal('${c.url}','${c.title.replace(/'/g,"\\'")}')"><i class="fas fa-eye"></i> Xem tài liệu</button>`;

    return `
    <div class="library-item admin-item" data-type="${dataType}" data-id="${c.id}">
        <div class="item-thumbnail"><i class="fas ${thumbIcon}"></i></div>
        <div class="item-content">
            <span class="item-type ${typeClass}"><i class="fas ${typeIcon}"></i> ${typeLabel}</span>
            <h3 class="item-title">${c.title}</h3>
            <p class="item-desc">${c.description || ''}</p>
            <div class="item-meta">
                ${subLabel ? `<span><i class="fas fa-book-open"></i> ${subLabel}</span>` : ''}
                ${c.author ? `<span><i class="fas fa-user"></i> ${c.author}</span>` : ''}
                <span><i class="fas fa-calendar"></i> ${_fmtDate(c.createdAt)}</span>
            </div>
            <div class="item-actions">
                ${actionBtn}
                <button class="btn-bookmark" title="Lưu lại" aria-label="Lưu lại">
                    <i class="far fa-bookmark"></i>
                </button>
            </div>
        </div>
    </div>`;
}

function _fmtDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const diff = Date.now() - ts;
    if (diff < 86400000) return 'Hôm nay';
    if (diff < 172800000) return 'Hôm qua';
    if (diff < 604800000) return Math.floor(diff/86400000) + ' ngày trước';
    return d.toLocaleDateString('vi-VN');
}

function _updateFilterCounts() {
    const items = document.querySelectorAll('.library-item');
    const counts = { all: items.length, pdf: 0, video: 0, code: 0 };
    items.forEach(item => {
        const t = item.dataset.type;
        if (counts[t] !== undefined) counts[t]++;
    });
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const type = btn.dataset.type;
        const countEl = btn.querySelector('.filter-count');
        if (countEl && counts[type] !== undefined) countEl.textContent = counts[type];
    });
}

function _initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const emptyEl    = document.getElementById('libraryEmpty');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const type = btn.dataset.type;
            let visible = 0;
            document.querySelectorAll('.library-item').forEach(item => {
                const show = type === 'all' || item.dataset.type === type;
                item.style.display = show ? '' : 'none';
                if (show) visible++;
            });
            if (emptyEl) emptyEl.style.display = visible === 0 ? 'block' : 'none';
        });
    });
}

// ── Modal xem tài liệu PDF ────────────────────────────────────
function openDocModal(url, title) {
    const modal    = document.getElementById('docModal');
    const titleEl  = document.getElementById('modalTitle');
    const summaryEl = document.getElementById('summaryText');
    const actionsEl = document.getElementById('modalDocActions');
    if (!modal) return;

    titleEl.textContent = title || 'Tài liệu';
    if (summaryEl) summaryEl.textContent = 'Đang tải nội dung...';
    if (actionsEl && url) {
        actionsEl.innerHTML = `
            <a class="btn-view" href="${url}" target="_blank"><i class="fas fa-eye"></i> Xem đầy đủ</a>
            <a class="btn-view btn-view-green" href="${url}" download><i class="fas fa-download"></i> Tải xuống</a>`;
    }
    modal.classList.add('active');
    setTimeout(() => {
        if (summaryEl) summaryEl.textContent = SUMMARIES[url] || 'Nhấn "Xem đầy đủ" để mở tài liệu.';
    }, 600);
}

// ── Modal xem video ───────────────────────────────────────────
function openVideoModal(url, title) {
    const modal = document.getElementById('videoModal');
    if (!modal) {
        // Tạo modal video nếu chưa có
        const m = document.createElement('div');
        m.id = 'videoModal';
        m.className = 'doc-modal';
        m.innerHTML = `
            <div class="doc-modal-inner" style="max-width:800px">
                <div class="doc-modal-header">
                    <h2 id="videoModalTitle"></h2>
                    <button onclick="closeVideoModal()" class="btn-modal-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="doc-modal-body" style="padding:0">
                    <div id="videoContainer" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:0 0 16px 16px">
                        <iframe id="videoFrame" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none" allowfullscreen></iframe>
                    </div>
                </div>
            </div>`;
        m.addEventListener('click', e => { if (e.target === m) closeVideoModal(); });
        document.body.appendChild(m);
    }
    const m = document.getElementById('videoModal');
    document.getElementById('videoModalTitle').textContent = title || 'Video';
    // Chuyển YouTube link thường sang embed
    let embedUrl = url;
    if (url.includes('youtube.com/watch')) {
        const vid = new URL(url).searchParams.get('v');
        if (vid) embedUrl = `https://www.youtube.com/embed/${vid}`;
    } else if (url.includes('youtu.be/')) {
        const vid = url.split('youtu.be/')[1].split('?')[0];
        embedUrl = `https://www.youtube.com/embed/${vid}`;
    }
    document.getElementById('videoFrame').src = embedUrl;
    m.classList.add('active');
}

function closeVideoModal() {
    const m = document.getElementById('videoModal');
    if (m) {
        m.classList.remove('active');
        const frame = document.getElementById('videoFrame');
        if (frame) frame.src = ''; // dừng video
    }
}

function closeModal() {
    const modal = document.getElementById('docModal');
    if (!modal) return;
    modal.style.opacity = '0';
    modal.style.transition = 'opacity 0.18s ease';
    setTimeout(() => {
        modal.classList.remove('active');
        modal.style.opacity = '';
        modal.style.transition = '';
    }, 180);
}

// ── AI Summary data ──
const SUMMARIES = {
    'react-hooks.pdf':          'Tài liệu trình bày toàn bộ React Hooks: useState quản lý state, useEffect cho side effects, useContext chia sẻ dữ liệu, useMemo/useCallback tối ưu performance, và cách tạo Custom Hooks tái sử dụng logic.',
    'nodejs-micro.mp4':         'Video hướng dẫn xây dựng microservices với Node.js: tách service, giao tiếp REST/gRPC, triển khai Docker, orchestration Kubernetes và monitoring với Prometheus.',
    'fastapi-template.zip':     'Template FastAPI production-ready: cấu trúc thư mục chuẩn, JWT authentication, SQLAlchemy ORM, Alembic migrations, Docker Compose và CI/CD pipeline.',
    'docker-k8s.pdf':           'Từ Docker cơ bản đến Kubernetes nâng cao: viết Dockerfile, docker-compose, K8s Deployment/Service/Ingress, Helm charts và auto-scaling.',
    'ml-basics.mp4':            'Khóa học ML cơ bản: supervised/unsupervised learning, linear regression, decision tree, random forest, neural network với scikit-learn và TensorFlow.',
    'react-ts-boilerplate.zip': 'Boilerplate React + TypeScript + Vite: ESLint/Prettier, React Router, Zustand state management, Axios, Tailwind CSS và testing với Vitest.'
};

function viewDocument(filename, title) {
    openDocModal(filename, title);
}
