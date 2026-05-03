// ============================================================
// tailieu.js — Tài liệu page logic for HOUSE WORK platform
// ============================================================

// ── 1. AUTH GUARD ────────────────────────────────────────────
(function authGuard() {
  const stored = localStorage.getItem('hw_user') || sessionStorage.getItem('hw_user');
  if (!stored) { window.location.replace('login.html'); return; }
  try {
    const u = JSON.parse(stored);
    const area = document.getElementById('navAuthArea');
    if (area) {
      area.innerHTML = `
        <div style="display:flex;align-items:center;gap:.75rem;">
          <span style="font-size:.9rem;font-weight:600;color:#4a5568;">
            <i class="fas fa-user-circle" style="color:#667eea;margin-right:.3rem"></i>${u.displayName || u.username}
          </span>
          <button onclick="logout()" style="background:linear-gradient(135deg,#f5576c,#f093fb);color:white;padding:.5rem 1.1rem;border-radius:50px;border:none;font-weight:600;font-size:.85rem;cursor:pointer;display:flex;align-items:center;gap:.4rem;white-space:nowrap;">
            <i class="fas fa-sign-out-alt"></i> Đăng xuất
          </button>
        </div>`;
    }
  } catch(e) { window.location.replace('login.html'); }
})();

// ── 2. DATA ──────────────────────────────────────────────────
const SUBJECTS = {
  'toan':      { label: 'Toán',        icon: 'fas fa-square-root-alt', color: '#e53e3e', grad: 'linear-gradient(135deg,#e53e3e,#fc8181)' },
  'ly':        { label: 'Vật lý',      icon: 'fas fa-atom',            color: '#3182ce', grad: 'linear-gradient(135deg,#3182ce,#63b3ed)' },
  'hoa':       { label: 'Hóa học',     icon: 'fas fa-flask',           color: '#38a169', grad: 'linear-gradient(135deg,#38a169,#68d391)' },
  'tin':       { label: 'Tin học',     icon: 'fas fa-laptop-code',     color: '#805ad5', grad: 'linear-gradient(135deg,#805ad5,#b794f4)' },
  'su':        { label: 'Lịch sử',     icon: 'fas fa-landmark',        color: '#d69e2e', grad: 'linear-gradient(135deg,#d69e2e,#f6e05e)' },
  'cong-nghe': { label: 'Công nghệ',   icon: 'fas fa-cogs',            color: '#dd6b20', grad: 'linear-gradient(135deg,#dd6b20,#fbd38d)' },
  'tieng-anh': { label: 'Tiếng Anh',   icon: 'fas fa-language',        color: '#00b5d8', grad: 'linear-gradient(135deg,#00b5d8,#76e4f7)' },
  'tong-de':   { label: 'Tổng đề',     icon: 'fas fa-file-alt',        color: '#e53e3e', grad: 'linear-gradient(135deg,#e53e3e,#667eea)' }
};

const SIDEBAR_ITEMS = {
  'toan':      ['Đại số','Hình học','Giải tích','Xác suất - Thống kê','Lý thuyết số'],
  'ly':        ['Cơ học','Nhiệt học','Điện học','Quang học','Vật lý hiện đại'],
  'hoa':       ['Hóa đại cương','Hóa vô cơ','Hóa hữu cơ','Hóa phân tích','Hóa lý'],
  'tin':       ['Lập trình cơ bản','Cấu trúc dữ liệu','Thuật toán','Cơ sở dữ liệu','Mạng máy tính'],
  'su':        ['Lịch sử Việt Nam','Lịch sử thế giới','Lịch sử cận đại','Lịch sử hiện đại','Địa lý lịch sử'],
  'cong-nghe': ['Kỹ thuật điện','Kỹ thuật cơ khí','Công nghệ thông tin','Nông nghiệp','Kinh tế gia đình'],
  'tieng-anh': ['Ngữ pháp','Từ vựng','Đọc hiểu','Nghe - Nói','Luyện thi IELTS/TOEIC'],
  'tong-de':   ['Đề Toán','Đề Vật lý','Đề Hóa học','Đề Tin học','Đề Lịch sử','Đề Công nghệ','Đề Tiếng Anh','Đề tổng hợp']
};

const CONTENT_TITLES = {
  'tat-ca':    ['Tất cả tài liệu',  'Tổng hợp tài liệu tất cả các môn học'],
  'toan':      ['Toán học',          'Đại số, Hình học, Giải tích và Xác suất thống kê'],
  'ly':        ['Vật lý',            'Cơ học, Điện học, Quang học và Nhiệt học'],
  'hoa':       ['Hóa học',           'Hóa đại cương, Vô cơ, Hữu cơ và Phân tích'],
  'tin':       ['Tin học',           'Lập trình, Cấu trúc dữ liệu, Thuật toán và CSDL'],
  'su':        ['Lịch sử',           'Lịch sử Việt Nam và Thế giới qua các thời kỳ'],
  'cong-nghe': ['Công nghệ',         'Kỹ thuật điện, Cơ khí, Nông nghiệp và Kinh tế'],
  'tieng-anh': ['Tiếng Anh',         'Ngữ pháp, Từ vựng, Đọc hiểu và Luyện thi'],
  'tong-de':   ['Tổng đề thi',       'Bộ đề thi thử THPT Quốc gia đầy đủ các môn']
};

const DOCS = [
  // ── HƯỚNG DẪN THÊM FILE ──────────────────────────────────────────────────────
  // Mỗi doc có 2 trường tuỳ chọn:
  //   fileUrl : đường dẫn file để XEM (mở tab mới)  — ví dụ: 'files/toan/phuong-trinh.pdf'
  //   downloadUrl : đường dẫn file để TẢI XUỐNG     — thường giống fileUrl
  // Nếu để null → nút sẽ hiện thông báo "Chưa có file"
  // ─────────────────────────────────────────────────────────────────────────────
  { id:1,  subject:'toan',      chapter:'Đại số',                title:'Phương trình bậc hai và ứng dụng',           desc:'Lý thuyết đầy đủ về phương trình bậc hai, công thức nghiệm, biệt thức và các dạng bài tập thường gặp.',                                          views:2400,  date:'1 giờ trước',    author:'Thầy Minh',   fileUrl: 'file/toan/nd28-de-thi-thu-dong-nai-lan-1.pdf', downloadUrl: 'file/toan/nd28-de-thi-thu-dong-nai-lan-1.pdf' },
  { id:2,  subject:'toan',      chapter:'Hình học',              title:'Hình học không gian lớp 11',                 desc:'Tổng hợp lý thuyết và bài tập hình học không gian: đường thẳng, mặt phẳng, khối đa diện.',                                                       views:1800,  date:'2 ngày trước',   author:'Cô Lan', fileUrl: null, downloadUrl: null },
  { id:3,  subject:'toan',      chapter:'Giải tích',             title:'Đạo hàm và ứng dụng',                        desc:'Khái niệm đạo hàm, quy tắc tính đạo hàm, ứng dụng trong khảo sát hàm số và tối ưu hóa.',                                                        views:3100,  date:'3 ngày trước',   author:'Thầy Hùng', fileUrl: null, downloadUrl: null },
  { id:4,  subject:'toan',      chapter:'Xác suất - Thống kê',   title:'Xác suất và thống kê cơ bản',                desc:'Lý thuyết xác suất, biến cố, phân phối xác suất và các bài toán thống kê thực tế.',                                                             views:1200,  date:'1 tuần trước',   author:'Cô Mai', fileUrl: null, downloadUrl: null },
  { id:5,  subject:'ly',        chapter:'Cơ học',                title:'Động lực học chất điểm',                     desc:'Các định luật Newton, lực ma sát, lực đàn hồi và ứng dụng trong bài toán chuyển động.',                                                          views:2100,  date:'5 giờ trước',    author:'Thầy Tuấn', fileUrl: null, downloadUrl: null },
  { id:6,  subject:'ly',        chapter:'Điện học',              title:'Điện trường và điện thế',                    desc:'Khái niệm điện trường, đường sức điện, điện thế và hiệu điện thế, tụ điện.',                                                                     views:1650,  date:'1 ngày trước',   author:'Cô Hoa', fileUrl: null, downloadUrl: null },
  { id:7,  subject:'ly',        chapter:'Quang học',             title:'Quang hình học và thấu kính',                desc:'Phản xạ, khúc xạ ánh sáng, thấu kính hội tụ và phân kỳ, các dụng cụ quang học.',                                                               views:980,   date:'4 ngày trước',   author:'Thầy Bình', fileUrl: null, downloadUrl: null },
  { id:8,  subject:'ly',        chapter:'Nhiệt học',             title:'Nhiệt động lực học',                         desc:'Các nguyên lý nhiệt động lực học, nội năng, công và nhiệt lượng trong quá trình nhiệt.',                                                         views:870,   date:'1 tuần trước',   author:'Cô Thu', fileUrl: null, downloadUrl: null },
  { id:9,  subject:'hoa',       chapter:'Hóa đại cương',         title:'Bảng tuần hoàn và cấu tạo nguyên tử',        desc:'Cấu tạo nguyên tử, bảng tuần hoàn Mendeleev, quy luật biến đổi tính chất các nguyên tố.',                                                       views:2800,  date:'3 giờ trước',    author:'Cô Ngọc', fileUrl: null, downloadUrl: null },
  { id:10, subject:'hoa',       chapter:'Hóa vô cơ',             title:'Axit - Bazơ - Muối',                         desc:'Lý thuyết axit-bazơ, phản ứng trung hòa, muối và các phản ứng trao đổi ion trong dung dịch.',                                                    views:2200,  date:'2 ngày trước',   author:'Thầy Dũng', fileUrl: null, downloadUrl: null },
  { id:11, subject:'hoa',       chapter:'Hóa hữu cơ',            title:'Hiđrocacbon và dẫn xuất',                    desc:'Ankan, anken, ankyn, aren và các dẫn xuất halogen, ancol, axit cacboxylic.',                                                                      views:3400,  date:'5 ngày trước',   author:'Cô Phương', fileUrl: null, downloadUrl: null },
  { id:12, subject:'hoa',       chapter:'Hóa phân tích',         title:'Phân tích định lượng',                       desc:'Phương pháp chuẩn độ, phân tích khối lượng và các kỹ thuật phân tích hóa học hiện đại.',                                                        views:760,   date:'2 tuần trước',   author:'Thầy Khoa', fileUrl: null, downloadUrl: null },
  { id:13, subject:'tin',       chapter:'Lập trình cơ bản',      title:'Nhập môn lập trình với Python',              desc:'Biến, kiểu dữ liệu, cấu trúc điều kiện, vòng lặp và hàm trong Python từ cơ bản đến nâng cao.',                                                   views:4200,  date:'2 giờ trước',    author:'Thầy Quang', fileUrl: null, downloadUrl: null },
  { id:14, subject:'tin',       chapter:'Cấu trúc dữ liệu',      title:'Mảng, danh sách liên kết và cây',            desc:'Các cấu trúc dữ liệu cơ bản: mảng, stack, queue, danh sách liên kết, cây nhị phân.',                                                            views:2900,  date:'1 ngày trước',   author:'Cô Linh', fileUrl: null, downloadUrl: null },
  { id:15, subject:'tin',       chapter:'Thuật toán',            title:'Sắp xếp và tìm kiếm',                        desc:'Các thuật toán sắp xếp (bubble, selection, merge, quick sort) và tìm kiếm (binary search).',                                                     views:3600,  date:'3 ngày trước',   author:'Thầy Nam', fileUrl: null, downloadUrl: null },
  { id:16, subject:'tin',       chapter:'Cơ sở dữ liệu',         title:'SQL cơ bản và thiết kế CSDL',                desc:'Mô hình quan hệ, các câu lệnh SQL cơ bản, thiết kế bảng và chuẩn hóa cơ sở dữ liệu.',                                                           views:1900,  date:'1 tuần trước',   author:'Cô Thảo', fileUrl: null, downloadUrl: null },
  { id:17, subject:'su',        chapter:'Lịch sử Việt Nam',      title:'Lịch sử Việt Nam thế kỷ XX',                 desc:'Các sự kiện lịch sử quan trọng của Việt Nam từ 1900 đến 1975: kháng chiến, giải phóng dân tộc.',                                                 views:1500,  date:'4 giờ trước',    author:'Cô Hương', fileUrl: null, downloadUrl: null },
  { id:18, subject:'su',        chapter:'Lịch sử thế giới',      title:'Chiến tranh thế giới thứ hai',               desc:'Nguyên nhân, diễn biến và hậu quả của Chiến tranh thế giới thứ hai (1939-1945).',                                                               views:1300,  date:'2 ngày trước',   author:'Thầy Sơn', fileUrl: null, downloadUrl: null },
  { id:19, subject:'su',        chapter:'Lịch sử cận đại',       title:'Cách mạng công nghiệp và hệ quả',            desc:'Cách mạng công nghiệp lần 1 và 2, sự hình thành chủ nghĩa tư bản và phong trào công nhân.',                                                      views:890,   date:'1 tuần trước',   author:'Cô Vân', fileUrl: null, downloadUrl: null },
  { id:20, subject:'cong-nghe', chapter:'Kỹ thuật điện',         title:'Mạch điện xoay chiều',                       desc:'Lý thuyết mạch điện xoay chiều, điện trở, tụ điện, cuộn cảm và công suất tiêu thụ.',                                                            views:1100,  date:'6 giờ trước',    author:'Thầy Tùng', fileUrl: null, downloadUrl: null },
  { id:21, subject:'cong-nghe', chapter:'Kỹ thuật cơ khí',       title:'Vật liệu cơ khí và gia công',                desc:'Các loại vật liệu kim loại, phi kim loại, phương pháp gia công cơ khí và nhiệt luyện.',                                                         views:780,   date:'3 ngày trước',   author:'Thầy Lâm', fileUrl: null, downloadUrl: null },
  { id:22, subject:'cong-nghe', chapter:'Nông nghiệp',           title:'Kỹ thuật trồng trọt hiện đại',               desc:'Các phương pháp canh tác hiện đại, sử dụng phân bón, thuốc bảo vệ thực vật và công nghệ nhà kính.',                                             views:650,   date:'1 tuần trước',   author:'Cô Xuân', fileUrl: null, downloadUrl: null },
  { id:23, subject:'tieng-anh', chapter:'Ngữ pháp',              title:'Thì trong tiếng Anh - Tổng hợp',             desc:'12 thì trong tiếng Anh: cách dùng, công thức, dấu hiệu nhận biết và bài tập thực hành.',                                                         views:5100,  date:'1 giờ trước',    author:'Cô Hà', fileUrl: null, downloadUrl: null },
  { id:24, subject:'tieng-anh', chapter:'Từ vựng',               title:'Từ vựng theo chủ đề lớp 12',                 desc:'Tổng hợp từ vựng theo 20 chủ đề thường gặp trong đề thi THPT Quốc gia môn Tiếng Anh.',                                                          views:4300,  date:'1 ngày trước',   author:'Thầy Đức', fileUrl: null, downloadUrl: null },
  { id:25, subject:'tieng-anh', chapter:'Đọc hiểu',              title:'Kỹ năng đọc hiểu nâng cao',                  desc:'Chiến lược làm bài đọc hiểu, skimming, scanning và các dạng câu hỏi thường gặp.',                                                              views:2700,  date:'4 ngày trước',   author:'Cô Trang', fileUrl: null, downloadUrl: null },
  { id:26, subject:'tieng-anh', chapter:'Luyện thi IELTS/TOEIC', title:'IELTS Writing Task 2 - Hướng dẫn',           desc:'Cấu trúc bài viết IELTS Task 2, các dạng đề phổ biến và mẫu bài band 7.0+.',                                                                    views:3800,  date:'1 tuần trước',   author:'Thầy Khải', fileUrl: null, downloadUrl: null },
  { id:27, subject:'tong-de',   chapter:'Đề Toán',               title:'Đề sở thi thử Đồng Nai 1',                   desc:'Đề Sở thi thử Đồng Nai',                                                                                                                        views:8900,  date:'2 giây trước',    author:'Nhóm biên soạn', fileUrl: 'file/toan/nd28-de-thi-thu-dong-nai-lan-1.pdf', downloadUrl: 'file/toan/nd28-de-thi-thu-dong-nai-lan-1.pdf'},
  { id:28, subject:'tong-de',   chapter:'Đề Vật lý',             title:'Bộ 40 đề Vật lý THPT Quốc gia 2024',         desc:'40 đề thi thử Vật lý có đáp án, phân loại theo mức độ từ cơ bản đến nâng cao.',                                                                 views:6200,  date:'3 giờ trước',    author:'Nhóm biên soạn', fileUrl: null, downloadUrl: null },
  { id:29, subject:'tong-de',   chapter:'Đề Hóa học',            title:'Bộ 40 đề Hóa học THPT Quốc gia 2024',        desc:'40 đề thi thử Hóa học, bao gồm hóa vô cơ và hữu cơ, có giải thích chi tiết từng câu.',                                                          views:5800,  date:'5 giờ trước',    author:'Nhóm biên soạn', fileUrl: null, downloadUrl: null },
  { id:30, subject:'tong-de',   chapter:'Đề Tiếng Anh',          title:'Bộ 50 đề Tiếng Anh THPT Quốc gia 2024',      desc:'50 đề thi thử Tiếng Anh chuẩn cấu trúc Bộ GD&ĐT, có audio phần nghe và đáp án.',                                                               views:9400,  date:'1 ngày trước',   author:'Nhóm biên soạn', fileUrl: null, downloadUrl: null },
  { id:31, subject:'tong-de',   chapter:'Đề Tin học',            title:'Bộ 30 đề Tin học THPT 2024',                 desc:'30 đề kiểm tra Tin học lớp 10-12, bao gồm lý thuyết và bài tập lập trình thực hành.',                                                           views:3100,  date:'2 ngày trước',   author:'Nhóm biên soạn', fileUrl: null, downloadUrl: null },
  { id:32, subject:'tong-de',   chapter:'Đề Lịch sử',            title:'Bộ 35 đề Lịch sử THPT Quốc gia 2024',        desc:'35 đề thi thử Lịch sử, bao gồm lịch sử Việt Nam và thế giới, có đáp án và phân tích.',                                                          views:2400,  date:'3 ngày trước',   author:'Nhóm biên soạn', fileUrl: null, downloadUrl: null },
  { id:33, subject:'tong-de',   chapter:'Đề Công nghệ',          title:'Bộ 25 đề Công nghệ THPT 2024',               desc:'25 đề kiểm tra Công nghệ lớp 10-12, đa dạng chủ đề từ kỹ thuật điện đến nông nghiệp.',                                                           views:1200,  date:'1 tuần trước',   author:'Nhóm biên soạn', fileUrl: null, downloadUrl: null },
  { id:34, subject:'tong-de',   chapter:'Đề tổng hợp',           title:'Đề thi thử tổng hợp tất cả môn 2024',        desc:'Bộ đề thi thử tổng hợp đầy đủ 7 môn, mô phỏng kỳ thi THPT Quốc gia thực tế.',                                                                  views:12000, date:'1 ngày trước',   author:'Nhóm biên soạn', fileUrl: null, downloadUrl: null }
];

// ── 3. STATE ─────────────────────────────────────────────────
let currentSubject = 'tat-ca';
let currentChapter = 'all';
let searchQuery    = '';

// ── 4. FUNCTIONS ─────────────────────────────────────────────

/**
 * moveIndicator(btn)
 * Moves the .tab-indicator element to sit under the given .subject-tab-btn,
 * using positions relative to .subject-tab-inner.
 */
function moveIndicator(btn) {
  if (!btn) return;
  const indicator = document.querySelector('.tab-indicator');
  const inner     = document.querySelector('.subject-tab-inner');
  if (!indicator || !inner) return;

  const btnRect   = btn.getBoundingClientRect();
  const innerRect = inner.getBoundingClientRect();

  indicator.style.width  = btnRect.width  + 'px';
  indicator.style.left   = (btnRect.left - innerRect.left + inner.scrollLeft) + 'px';
}

/**
 * switchSubject(btn, subject)
 * Activates the clicked tab, resets chapter/search, updates heading and sidebar.
 */
function switchSubject(btn, subject) {
  // Update active tab
  document.querySelectorAll('.subject-tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  currentSubject = subject;
  currentChapter = 'all';
  searchQuery    = '';

  // Clear search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';

  // Move indicator
  moveIndicator(btn);

  // Update content title and description
  const titles = CONTENT_TITLES[subject] || CONTENT_TITLES['tat-ca'];
  const titleEl = document.getElementById('contentTitle');
  const descEl  = document.getElementById('contentDesc');
  if (titleEl) titleEl.textContent = titles[0];
  if (descEl)  descEl.textContent  = titles[1];

  buildSidebar(subject);
  renderCards();
}

/**
 * buildSidebar(subject)
 * Renders sidebar navigation. For 'tat-ca' shows all subjects;
 * for a specific subject shows its chapters.
 */
function buildSidebar(subject) {
  const sidebar = document.getElementById('sidebar') || document.querySelector('.sidebar-nav');
  if (!sidebar) return;

  let html = '';

  if (subject === 'tat-ca') {
    html += `<div class="sidebar-section-title">Môn học</div>`;
    // "Tất cả" link
    const allCount = DOCS.length;
    html += `<button class="sidebar-link${currentChapter === 'all' ? ' active' : ''}"
               onclick="filterChapter('all')">
               <i class="fas fa-th-large"></i>
               <span>Tất cả</span>
               <span class="sidebar-count">${allCount}</span>
             </button>`;
    // One link per subject
    Object.entries(SUBJECTS).forEach(([key, info]) => {
      const count = DOCS.filter(d => d.subject === key).length;
      html += `<button class="sidebar-link"
                 onclick="switchSubject(document.querySelector('.subject-tab-btn[data-subject=\\'${key}\\']'), '${key}')">
                 <i class="${info.icon}" style="color:${info.color}"></i>
                 <span>${info.label}</span>
                 <span class="sidebar-count">${count}</span>
               </button>`;
    });
  } else {
    const info     = SUBJECTS[subject];
    const chapters = SIDEBAR_ITEMS[subject] || [];
    const allCount = DOCS.filter(d => d.subject === subject).length;

    html += `<div class="sidebar-section-title">${info ? info.label : subject}</div>`;

    // "Tất cả" for this subject
    html += `<button class="sidebar-link${currentChapter === 'all' ? ' active' : ''}"
               onclick="filterChapter('all')">
               <i class="fas fa-list"></i>
               <span>Tất cả</span>
               <span class="sidebar-count">${allCount}</span>
             </button>`;

    chapters.forEach(ch => {
      const count   = DOCS.filter(d => d.subject === subject && d.chapter === ch).length;
      const isActive = currentChapter === ch;
      html += `<button class="sidebar-link${isActive ? ' active' : ''}"
                 onclick="filterChapter('${ch.replace(/'/g, "\\'")}')">
                 <i class="fas fa-chevron-right"></i>
                 <span>${ch}</span>
                 <span class="sidebar-count">${count}</span>
               </button>`;
    });
  }

  sidebar.innerHTML = html;
}

/**
 * filterChapter(chapter)
 * Sets the active chapter filter, rebuilds sidebar and re-renders cards.
 */
function filterChapter(chapter) {
  currentChapter = chapter;
  buildSidebar(currentSubject);
  renderCards();
}

/**
 * formatViews(n)
 * Returns "Xk" for numbers >= 1000, otherwise the number as string.
 */
function formatViews(n) {
  return n >= 1000 ? (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1).replace(/\.0$/, '') + 'k' : String(n);
}

/**
 * renderCards()
 * Filters DOCS by currentSubject + currentChapter + searchQuery,
 * sorts by sortSelect value, then renders into #docsGrid.
 */
function renderCards() {
  const grid      = document.getElementById('docsGrid');
  const noResults = document.getElementById('noResults');
  const sortSel   = document.getElementById('sortSelect');
  if (!grid) return;

  // Filter
  let filtered = DOCS.filter(doc => {
    const matchSubject = currentSubject === 'tat-ca' || doc.subject === currentSubject;
    const matchChapter = currentChapter === 'all'    || doc.chapter === currentChapter;
    const q            = searchQuery.toLowerCase().trim();
    const matchSearch  = !q ||
      doc.title.toLowerCase().includes(q) ||
      doc.desc.toLowerCase().includes(q)  ||
      doc.author.toLowerCase().includes(q);
    return matchSubject && matchChapter && matchSearch;
  });

  // Sort
  const sortVal = sortSel ? sortSel.value : 'newest';
  if (sortVal === 'popular') {
    filtered.sort((a, b) => b.views - a.views);
  } else if (sortVal === 'az') {
    filtered.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
  } else {
    // newest — keep original array order (already ordered by recency via id desc approximation)
    filtered.sort((a, b) => a.id - b.id);
    filtered.reverse();
  }

  // Show / hide no-results
  if (noResults) noResults.style.display = filtered.length === 0 ? 'block' : 'none';

  if (filtered.length === 0) {
    grid.innerHTML = '';
    return;
  }

  // Render
  grid.innerHTML = filtered.map(doc => {
    const subj    = SUBJECTS[doc.subject] || { label: doc.subject, icon: 'fas fa-book', color: '#718096', grad: 'linear-gradient(135deg,#718096,#a0aec0)' };
    const badgeCls = 'badge-' + doc.subject;
    const viewsFmt = formatViews(doc.views);

    return `
<div class="doc-card" data-subject="${doc.subject}">
  <div class="doc-card-top">
    <span class="doc-badge ${badgeCls}">
      <i class="${subj.icon}"></i> ${subj.label}
    </span>
    <div class="doc-card-actions">
      <button class="btn-icon" title="Yêu thích" onclick="toggleIcon(this,'fa-star','#f6ad55')" aria-label="Yêu thích">
        <i class="far fa-star"></i>
      </button>
      <button class="btn-icon" title="Lưu lại" onclick="toggleIcon(this,'fa-bookmark','#63b3ed')" aria-label="Lưu lại">
        <i class="far fa-bookmark"></i>
      </button>
    </div>
  </div>
  <h3>${doc.title}</h3>
  <p>${doc.desc}</p>
  <div class="doc-card-meta">
    <span><i class="fas fa-folder" style="color:${subj.color}"></i> ${doc.chapter}</span>
    <span><i class="fas fa-eye"></i> ${viewsFmt}</span>
    <span><i class="fas fa-clock"></i> ${doc.date}</span>
  </div>
  <div class="doc-card-footer">
    <button class="btn-read btn-read-primary" onclick="openFile('${doc.fileUrl}')">
      <i class="fas fa-book-open"></i> Đọc ngay
    </button>
    <button class="btn-read btn-read-secondary" title="Tải xuống" aria-label="Tải xuống" onclick="downloadFile('${doc.downloadUrl || doc.fileUrl}', '${doc.title}')">
      <i class="fas fa-download"></i> Tải xuống
    </button>
  </div>
</div>`;
  }).join('');
}

/**
 * toggleIcon(el, cls, activeColor)
 * Toggles between fas/far icon classes and applies/removes an active color.
 */
function toggleIcon(el, cls, activeColor) {
  const icon = el.querySelector('i');
  if (!icon) return;
  if (icon.classList.contains('far')) {
    icon.classList.replace('far', 'fas');
    icon.style.color = activeColor;
  } else {
    icon.classList.replace('fas', 'far');
    icon.style.color = '';
  }
}

/**
 * openFile(url)
 * Mở file trực tiếp trong modal trên web. Hiện toast nếu chưa có file.
 */
function openFile(url) {
  if (!url || url === 'null') {
    showToast('Tài liệu này chưa có file đính kèm.', 'warning');
    return;
  }

  // Lưu url hiện tại để nút Tải xuống trong modal dùng
  window._currentFileUrl = url;

  // Lấy tên file từ đường dẫn
  const fileName = url.split('/').pop().replace(/-/g, ' ').replace(/_/g, ' ');
  document.getElementById('modalFileName').textContent = fileName;

  // Đưa file vào iframe
  document.getElementById('fileViewer').src = url;

  // Hiện modal
  const modal = document.getElementById('fileModal');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden'; // chặn scroll trang

  // Đóng khi click nền
  modal.onclick = function(e) {
    if (e.target === modal) closeFileModal();
  };
}

function closeFileModal() {
  const modal = document.getElementById('fileModal');
  if (!modal) return;
  modal.style.display = 'none';
  document.getElementById('fileViewer').src = '';
  document.body.style.overflow = '';
}

function downloadCurrentFile() {
  const url = window._currentFileUrl;
  if (!url) return;
  const a = document.createElement('a');
  a.href = url;
  a.download = url.split('/').pop();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Đóng modal bằng phím Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeFileModal();
});

/**
 * downloadFile(url, title)
 * Triggers a file download. Shows a toast if no file is attached yet.
 */
function downloadFile(url, title) {
  if (!url || url === 'null') {
    showToast('Tài liệu này chưa có file để tải xuống.', 'warning');
    return;
  }
  const a = document.createElement('a');
  a.href = url;
  a.download = title || 'tailieu';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * showToast(message, type)
 * Shows a small toast notification. type: 'warning' | 'success' | 'error'
 */
function showToast(message, type = 'warning') {
  // Remove existing toast
  const existing = document.getElementById('hw-toast');
  if (existing) existing.remove();

  const colors = {
    warning: { bg: '#fffbeb', border: '#f6ad55', text: '#744210', icon: 'fas fa-exclamation-circle' },
    success: { bg: '#f0fff4', border: '#68d391', text: '#276749', icon: 'fas fa-check-circle' },
    error:   { bg: '#fff5f5', border: '#fc8181', text: '#c53030', icon: 'fas fa-times-circle' },
  };
  const c = colors[type] || colors.warning;

  const toast = document.createElement('div');
  toast.id = 'hw-toast';
  toast.style.cssText = `
    position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
    background: ${c.bg}; border: 1.5px solid ${c.border}; color: ${c.text};
    padding: .75rem 1.5rem; border-radius: 50px; font-size: .9rem; font-weight: 600;
    display: flex; align-items: center; gap: .5rem;
    box-shadow: 0 8px 24px rgba(0,0,0,.12); z-index: 9999;
    animation: toastIn .25s ease;
  `;
  toast.innerHTML = `<i class="${c.icon}"></i> ${message}`;
  document.body.appendChild(toast);

  // Add keyframe if not present
  if (!document.getElementById('toast-style')) {
    const style = document.createElement('style');
    style.id = 'toast-style';
    style.textContent = '@keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }';
    document.head.appendChild(style);
  }

  setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3000);
}

/**
 * searchDocs()
 * Reads #searchInput value, updates searchQuery, re-renders cards.
 */
function searchDocs() {
  const input = document.getElementById('searchInput');
  searchQuery = input ? input.value : '';
  renderCards();
}

/**
 * logout()
 * Clears hw_user from both storages and redirects to login.html.
 */
function logout() {
  localStorage.removeItem('hw_user');
  sessionStorage.removeItem('hw_user');
  window.location.href = 'login.html';
}

// ── 5. EVENT LISTENERS ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Hamburger toggle
  const hamburger = document.getElementById('hamburger') || document.querySelector('.hamburger');
  const navMenu   = document.getElementById('navMenu')   || document.querySelector('.nav-menu');
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      hamburger.classList.toggle('active');
    });
  }

  // Close nav menu when a link is clicked (mobile)
  if (navMenu) {
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        if (hamburger) hamburger.classList.remove('active');
      });
    });
  }

  // Navbar scroll effect
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 10);
    });
  }

  // Search input — trigger on Enter key
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keyup', e => {
      if (e.key === 'Enter') searchDocs();
    });
  }

  // Sort select — re-render on change
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', renderCards);
  }

  // Window resize — keep indicator aligned
  window.addEventListener('resize', () => {
    const activeBtn = document.querySelector('.subject-tab-btn.active');
    if (activeBtn) moveIndicator(activeBtn);
  });

  // ── 6. INIT ─────────────────────────────────────────────────
  // Find the 'tat-ca' tab button and activate it
  const tatCaBtn = document.querySelector('.subject-tab-btn[data-subject="tat-ca"]');
  switchSubject(tatCaBtn, 'tat-ca');
});
