// ============================================================
// thu-vien.js — Logic cho trang Thư viện
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initNavbar();

    // ── Filter buttons ──
    const filterBtns = document.querySelectorAll('.filter-btn');
    const items      = document.querySelectorAll('.library-item');
    const emptyEl    = document.getElementById('libraryEmpty');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const type = btn.dataset.type;
            let visible = 0;

            items.forEach(item => {
                const show = type === 'all' || item.dataset.type === type;
                item.style.display = show ? '' : 'none';
                if (show) visible++;
            });

            if (emptyEl) emptyEl.style.display = visible === 0 ? 'block' : 'none';
        });
    });

    // ── Bookmark toggle ──
    document.querySelectorAll('.btn-bookmark').forEach(btn => {
        btn.addEventListener('click', () => {
            const icon = btn.querySelector('i');
            const saved = icon.classList.contains('fas');
            icon.className = saved ? 'far fa-bookmark' : 'fas fa-bookmark';
            btn.style.color = saved ? '' : '#667eea';
            btn.style.borderColor = saved ? '' : '#667eea';
            btn.style.background = saved ? '' : '#f0f4ff';
        });
    });

    // ── Modal close ──
    const modal = document.getElementById('docModal');
    if (modal) {
        document.getElementById('modalClose').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    }
});

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
    const modal    = document.getElementById('docModal');
    const titleEl  = document.getElementById('modalTitle');
    const summaryEl = document.getElementById('summaryText');
    if (!modal) return;

    titleEl.textContent   = title || filename;
    summaryEl.textContent = 'Đang phân tích tài liệu...';
    modal.classList.add('active');
    modal.style.opacity = '';

    // Giả lập AI tóm tắt
    setTimeout(() => {
        summaryEl.textContent = SUMMARIES[filename] || 'Nội dung tài liệu đang được xử lý...';
    }, 900);
}
