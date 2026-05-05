// ============================================================
// test.js — Logic cho trang Bài kiểm tra
// ============================================================

/* ══════════════════════════════════════════
       AUTH GUARD — handled by auth.js
    ══════════════════════════════════════════ */
    // Auth guard và navbar được khởi tạo bởi auth.js
    document.addEventListener('DOMContentLoaded', () => {
        initAuth();
        initNavbar();
    });

    /* ══════════════════════════════════════════
       EXAM DATA
    ══════════════════════════════════════════ */
    const EXAMS = [
        {
            id: 1, subject: 'toan',
            title: 'Đại số cơ bản',
            desc: 'Phương trình, bất phương trình và hàm số',
            questions: 10, time: 15, level: 'Dễ',
            qs: [
                { q: 'Nghiệm của phương trình 2x + 6 = 0 là?', opts: ['x = 3','x = -3','x = 2','x = -2'], ans: 1 },
                { q: 'Hàm số y = x² có đồ thị là?', opts: ['Đường thẳng','Parabol','Đường tròn','Hyperbol'], ans: 1 },
                { q: 'Giá trị của 2³ là?', opts: ['6','9','8','16'], ans: 2 },
                { q: 'Bất phương trình x + 3 > 0 có nghiệm là?', opts: ['x > -3','x < -3','x > 3','x < 3'], ans: 0 },
                { q: 'Tổng các nghiệm của x² - 5x + 6 = 0 là?', opts: ['6','-5','5','-6'], ans: 2 }
            ]
        },
        {
            id: 2, subject: 'toan',
            title: 'Hình học không gian',
            desc: 'Khối đa diện, mặt cầu và các bài toán thực tế',
            questions: 15, time: 20, level: 'Trung bình',
            qs: [
                { q: 'Thể tích hình cầu bán kính r là?', opts: ['4πr²','(4/3)πr³','πr²h','2πr²'], ans: 1 },
                { q: 'Hình lập phương có bao nhiêu mặt?', opts: ['4','8','6','12'], ans: 2 },
                { q: 'Diện tích hình tròn bán kính r là?', opts: ['2πr','πr²','4πr²','πd'], ans: 1 },
                { q: 'Hình chóp tứ giác đều có bao nhiêu mặt bên?', opts: ['3','4','5','6'], ans: 1 },
                { q: 'Thể tích hình lập phương cạnh a là?', opts: ['a²','3a²','a³','6a²'], ans: 2 }
            ]
        },
        {
            id: 3, subject: 'ly',
            title: 'Cơ học Newton',
            desc: 'Các định luật Newton và ứng dụng trong chuyển động',
            questions: 12, time: 18, level: 'Trung bình',
            qs: [
                { q: 'Định luật I Newton phát biểu về?', opts: ['Lực và gia tốc','Quán tính','Phản lực','Hấp dẫn'], ans: 1 },
                { q: 'Đơn vị của lực trong hệ SI là?', opts: ['kg','m/s²','N','J'], ans: 2 },
                { q: 'Công thức tính gia tốc là?', opts: ['a = Fm','a = F/m','a = m/F','a = F + m'], ans: 1 },
                { q: 'Định luật III Newton nói về?', opts: ['Quán tính','Gia tốc','Lực và phản lực','Hấp dẫn'], ans: 2 },
                { q: 'Vật chuyển động thẳng đều có gia tốc bằng?', opts: ['1 m/s²','Không đổi','0','Âm'], ans: 2 }
            ]
        },
        {
            id: 4, subject: 'hoa',
            title: 'Hóa vô cơ tổng hợp',
            desc: 'Axit, bazơ, muối và phản ứng trao đổi ion',
            questions: 20, time: 25, level: 'Khó',
            qs: [
                { q: 'Axit HCl có tên gọi là?', opts: ['Axit sunfuric','Axit clohidric','Axit nitric','Axit photphoric'], ans: 1 },
                { q: 'Bazơ NaOH có tên gọi là?', opts: ['Canxi hidroxit','Kali hidroxit','Natri hidroxit','Magie hidroxit'], ans: 2 },
                { q: 'Phản ứng trung hòa là phản ứng giữa?', opts: ['Axit và muối','Bazơ và muối','Axit và bazơ','Muối và muối'], ans: 2 },
                { q: 'Công thức của muối ăn là?', opts: ['KCl','NaCl','CaCl₂','MgCl₂'], ans: 1 },
                { q: 'pH của dung dịch trung tính là?', opts: ['0','7','14','1'], ans: 1 }
            ]
        },
        {
            id: 5, subject: 'tin',
            title: 'Lập trình Python cơ bản',
            desc: 'Biến, vòng lặp, hàm và cấu trúc dữ liệu',
            questions: 15, time: 20, level: 'Dễ',
            qs: [
                { q: 'Hàm in ra màn hình trong Python là?', opts: ['echo()','console.log()','print()','write()'], ans: 2 },
                { q: 'Kiểu dữ liệu nào lưu chuỗi ký tự?', opts: ['int','float','str','bool'], ans: 2 },
                { q: 'Vòng lặp nào dùng khi biết số lần lặp?', opts: ['while','for','do-while','loop'], ans: 1 },
                { q: 'Cú pháp định nghĩa hàm trong Python là?', opts: ['function f():','def f():','func f():','define f():'], ans: 1 },
                { q: 'Kiểu dữ liệu danh sách trong Python là?', opts: ['array','list','tuple','dict'], ans: 1 }
            ]
        },
        {
            id: 6, subject: 'tieng-anh',
            title: 'Grammar - Thì trong tiếng Anh',
            desc: '12 thì, cách dùng và bài tập thực hành',
            questions: 20, time: 25, level: 'Trung bình',
            qs: [
                { q: 'Thì hiện tại đơn dùng để?', opts: ['Hành động đang xảy ra','Thói quen / sự thật','Hành động đã xảy ra','Hành động tương lai'], ans: 1 },
                { q: "Dạng đúng: 'She ___ to school every day'", opts: ['go','goes','going','gone'], ans: 1 },
                { q: "Past simple của 'go' là?", opts: ['goed','going','went','gone'], ans: 2 },
                { q: "Thì hiện tại tiếp diễn dùng 'to be' + ?", opts: ['V-ed','V-ing','V (bare)','V-s/es'], ans: 1 },
                { q: "Câu nào đúng ở thì tương lai đơn?", opts: ['She will goes.','She will go.','She will going.','She wills go.'], ans: 1 }
            ]
        },
        {
            id: 7, subject: 'su',
            title: 'Lịch sử Việt Nam thế kỷ XX',
            desc: 'Các sự kiện lịch sử từ 1900-1975',
            questions: 15, time: 20, level: 'Trung bình',
            qs: [
                { q: 'Cách mạng tháng Tám năm 1945 diễn ra vào ngày?', opts: ['2/9/1945','19/8/1945','30/4/1975','7/5/1954'], ans: 1 },
                { q: 'Chiến thắng Điện Biên Phủ diễn ra năm nào?', opts: ['1945','1954','1968','1975'], ans: 1 },
                { q: 'Ngày thống nhất đất nước Việt Nam là?', opts: ['30/4/1975','2/9/1945','19/8/1945','7/5/1954'], ans: 0 },
                { q: 'Đảng Cộng sản Việt Nam được thành lập năm?', opts: ['1925','1930','1945','1954'], ans: 1 },
                { q: 'Hiệp định Giơnevơ ký kết năm nào?', opts: ['1945','1950','1954','1960'], ans: 2 }
            ]
        },
        {
            id: 8, subject: 'cong-nghe',
            title: 'Kỹ thuật điện cơ bản',
            desc: 'Mạch điện, điện trở và công suất tiêu thụ',
            questions: 10, time: 15, level: 'Dễ',
            qs: [
                { q: 'Đơn vị đo điện trở là?', opts: ['Ampe','Vôn','Ôm','Oát'], ans: 2 },
                { q: 'Công thức định luật Ôm là?', opts: ['I = U × R','I = U / R','U = I / R','R = U × I'], ans: 1 },
                { q: 'Công suất điện được tính bằng?', opts: ['P = U + I','P = U / I','P = U × I','P = I / U'], ans: 2 },
                { q: 'Đơn vị đo cường độ dòng điện là?', opts: ['Vôn (V)','Ampe (A)','Ôm (Ω)','Oát (W)'], ans: 1 },
                { q: 'Mạch điện nối tiếp có đặc điểm?', opts: ['Điện áp bằng nhau','Cường độ dòng điện bằng nhau','Điện trở bằng nhau','Công suất bằng nhau'], ans: 1 }
            ]
        }
    ];

    /* ══════════════════════════════════════════
       QUESTION BANK (for auto-generate)
    ══════════════════════════════════════════ */
    const QUESTION_BANK = {};
    EXAMS.forEach(e => {
        if (!QUESTION_BANK[e.subject]) QUESTION_BANK[e.subject] = [];
        QUESTION_BANK[e.subject].push(...e.qs);
    });

    /* ══════════════════════════════════════════
       SUBJECT META
    ══════════════════════════════════════════ */
    const SUBJECT_META = {
        'toan':      { label: 'Toán',       icon: 'fa-square-root-alt', color: '#e53e3e' },
        'ly':        { label: 'Vật lý',     icon: 'fa-atom',            color: '#3182ce' },
        'hoa':       { label: 'Hóa học',    icon: 'fa-flask',           color: '#38a169' },
        'tin':       { label: 'Tin học',    icon: 'fa-laptop-code',     color: '#805ad5' },
        'su':        { label: 'Lịch sử',    icon: 'fa-landmark',        color: '#d69e2e' },
        'cong-nghe': { label: 'Công nghệ',  icon: 'fa-cogs',            color: '#dd6b20' },
        'tieng-anh': { label: 'Tiếng Anh',  icon: 'fa-language',        color: '#00b5d8' }
    };

    /* ══════════════════════════════════════════
       RENDER EXAM CARDS
    ══════════════════════════════════════════ */
    function renderExams(filter) {
        const grid = document.getElementById('examsGrid');
        const noRes = document.getElementById('noResults');
        const list = filter === 'tat-ca' ? EXAMS : EXAMS.filter(e => e.subject === filter);

        if (list.length === 0) {
            grid.innerHTML = '';
            noRes.style.display = 'block';
            return;
        }
        noRes.style.display = 'none';

        grid.innerHTML = list.map(exam => {
            const meta = SUBJECT_META[exam.subject];
            const levelClass = exam.level === 'Dễ' ? 'level-de' : exam.level === 'Khó' ? 'level-kho' : 'level-tb';
            return `
            <div class="exam-card" data-subject="${exam.subject}">
                <div class="exam-card-top-border border-${exam.subject}"></div>
                <div class="exam-card-body">
                    <span class="exam-subject-badge badge-${exam.subject}">
                        <i class="fas ${meta.icon}"></i> ${meta.label}
                    </span>
                    <h3>${exam.title}</h3>
                    <p>${exam.desc}</p>
                    <div class="exam-meta">
                        <span class="exam-meta-item"><i class="fas fa-question-circle"></i> ${exam.questions} câu</span>
                        <span class="exam-meta-item"><i class="fas fa-clock"></i> ${exam.time} phút</span>
                        <span class="level-badge ${levelClass}">${exam.level}</span>
                    </div>
                </div>
                <div class="exam-card-footer">
                    <button class="btn-start" onclick="startExam(${exam.id})">
                        <i class="fas fa-play"></i> Làm bài
                    </button>
                </div>
            </div>`;
        }).join('');
    }

    /* ══════════════════════════════════════════
       FILTER TABS
    ══════════════════════════════════════════ */
    function filterExams(btn, subject) {
        document.querySelectorAll('.subject-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        moveIndicator(btn);
        renderExams(subject);
    }

    function moveIndicator(btn) {
        const indicator = document.getElementById('tabIndicator');
        indicator.style.left  = btn.offsetLeft + 'px';
        indicator.style.width = btn.offsetWidth + 'px';
    }

    /* ══════════════════════════════════════════
       QUIZ STATE
    ══════════════════════════════════════════ */
    let currentExam   = null;
    let currentQIndex = 0;
    let userAnswers   = [];
    let timerInterval = null;
    let timeLeft      = 0;
    let reviewMode    = false;

    /* ══════════════════════════════════════════
       START EXAM
    ══════════════════════════════════════════ */
    function startExam(examId) {
        const exam = EXAMS.find(e => e.id === examId);
        if (!exam) return;
        currentExam   = exam;
        currentQIndex = 0;
        userAnswers   = new Array(exam.qs.length).fill(null);
        reviewMode    = false;
        timeLeft      = exam.time * 60;

        document.getElementById('quizTitle').textContent    = exam.title;
        document.getElementById('quizOverlay').classList.add('open');
        document.body.style.overflow = 'hidden';

        renderQuestion();
        startTimer();
    }

    /* ══════════════════════════════════════════
       RENDER QUESTION
    ══════════════════════════════════════════ */
    function renderQuestion() {
        const exam = currentExam;
        const q    = exam.qs[currentQIndex];
        const total = exam.qs.length;
        const idx   = currentQIndex;

        document.getElementById('quizSubtitle').textContent  = `Câu ${idx + 1} / ${total}`;
        document.getElementById('progressLabel').textContent = `Câu ${idx + 1} / ${total}`;
        document.getElementById('progressPct').textContent   = Math.round(((idx + 1) / total) * 100) + '%';
        document.getElementById('progressFill').style.width  = ((idx + 1) / total * 100) + '%';
        document.getElementById('questionNumber').textContent = `Câu ${idx + 1}`;

        // Render navigation dots
        const dotsWrap = document.getElementById('quizDots');
        if (dotsWrap) {
            dotsWrap.innerHTML = exam.qs.map((_, i) => {
                let cls = 'quiz-dot';
                if (i === idx) cls += ' current';
                else if (userAnswers[i] !== null) cls += ' answered';
                return `<button class="${cls}" onclick="jumpToQuestion(${i})" title="Câu ${i+1}">${i+1}</button>`;
            }).join('');
        }

        const letters = ['A','B','C','D'];
        const optsList = document.getElementById('optionsList');
        optsList.innerHTML = q.opts.map((opt, i) => {
            let cls = 'option-item';
            if (reviewMode) {
                if (i === q.ans)                cls += ' correct';
                else if (i === userAnswers[idx]) cls += ' wrong';
            } else {
                if (userAnswers[idx] === i) cls += ' selected';
            }
            const disabled = reviewMode ? 'style="pointer-events:none"' : '';
            return `
            <label class="${cls}" onclick="${reviewMode ? '' : `selectOption(${i})`}" ${disabled}>
                <input type="radio" name="opt" value="${i}" ${userAnswers[idx] === i ? 'checked' : ''}>
                <span class="option-letter">${letters[i]}</span>
                <span>${opt}</span>
                ${reviewMode && i === q.ans ? '<i class="fas fa-check" style="margin-left:auto;color:#38a169"></i>' : ''}
                ${reviewMode && i === userAnswers[idx] && i !== q.ans ? '<i class="fas fa-times" style="margin-left:auto;color:#e53e3e"></i>' : ''}
            </label>`;
        }).join('');

        // Prev/Next buttons
        document.getElementById('btnPrev').disabled = idx === 0;
        document.getElementById('btnPrev').style.opacity = idx === 0 ? '.4' : '1';

        const btnNext = document.getElementById('btnNext');
        if (idx === total - 1) {
            btnNext.innerHTML = reviewMode
                ? '<i class="fas fa-times"></i> Đóng'
                : 'Nộp bài <i class="fas fa-paper-plane"></i>';
            btnNext.className = reviewMode ? 'btn-nav btn-nav-secondary' : 'btn-nav btn-nav-danger';
            btnNext.onclick   = reviewMode ? closeQuizModal : confirmSubmit;
        } else {
            btnNext.innerHTML = 'Câu tiếp theo <i class="fas fa-chevron-right"></i>';
            btnNext.className = 'btn-nav btn-nav-primary';
            btnNext.onclick   = nextQuestion;
        }
    }

    function selectOption(i) {
        if (reviewMode) return;
        userAnswers[currentQIndex] = i;
        renderQuestion();
    }

    function prevQuestion() {
        if (currentQIndex > 0) { currentQIndex--; renderQuestion(); }
    }

    function nextQuestion() {
        if (currentQIndex < currentExam.qs.length - 1) { currentQIndex++; renderQuestion(); }
    }

    function jumpToQuestion(i) {
        if (!reviewMode && i >= 0 && i < currentExam.qs.length) {
            currentQIndex = i;
            renderQuestion();
        }
    }

    /* ══════════════════════════════════════════
       TIMER
    ══════════════════════════════════════════ */
    function startTimer() {
        clearInterval(timerInterval);
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) { clearInterval(timerInterval); submitExam(); }
        }, 1000);
    }

    function updateTimerDisplay() {
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        document.getElementById('timerDisplay').textContent =
            String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
        const timerEl = document.getElementById('quizTimer');
        timerEl.classList.toggle('urgent', timeLeft <= 60);
    }

    /* ══════════════════════════════════════════
       SUBMIT
    ══════════════════════════════════════════ */
    function confirmSubmit() {
        const unanswered = userAnswers.filter(a => a === null).length;
        const msg = unanswered > 0
            ? `Bạn còn ${unanswered} câu chưa trả lời. Bạn có chắc muốn nộp bài không?`
            : 'Bạn có chắc muốn nộp bài không?';
        if (confirm(msg)) submitExam();
    }

    function submitExam() {
        clearInterval(timerInterval);
        const exam    = currentExam;
        const correct = exam.qs.filter((q, i) => userAnswers[i] === q.ans).length;
        const total   = exam.qs.length;
        const pct     = Math.round((correct / total) * 100);
        const timeSpent = (exam.time * 60) - timeLeft;

        // Lưu kết quả lên Supabase
        const stored = localStorage.getItem('hw_user') || sessionStorage.getItem('hw_user');
        if (stored && isSupabaseConfigured()) {
            try {
                const user = JSON.parse(stored);
                sbSaveExamAttempt({
                    userId:         user.dbId || null,
                    examId:         exam.id < 9000 ? null : null, // custom exam không có id DB
                    examTitle:      exam.title,
                    examSubject:    exam.subject,
                    score:          correct,
                    totalQuestions: total,
                    percentage:     pct,
                    userAnswers:    userAnswers,
                    timeSpent:      timeSpent
                });
            } catch (e) { /* ignore nếu chưa cấu hình */ }
        }

        // Close quiz, open result
        document.getElementById('quizOverlay').classList.remove('open');
        document.getElementById('resultOverlay').classList.add('open');

        document.getElementById('resultScore').textContent = `${correct}/${total}`;
        document.getElementById('resultPercent').textContent = `${pct}%`;

        let color, trophy, msg;
        if (pct >= 70) {
            color = '#38a169'; trophy = '🏆';
            msg = pct === 100 ? 'Xuất sắc! Bạn trả lời đúng tất cả các câu!' : 'Tốt lắm! Bạn đã nắm vững kiến thức.';
        } else if (pct >= 50) {
            color = '#d69e2e'; trophy = '📝';
            msg = 'Khá ổn! Hãy ôn lại những phần còn yếu nhé.';
        } else {
            color = '#e53e3e'; trophy = '💪';
            msg = 'Cần cố gắng thêm! Hãy xem lại tài liệu và thử lại.';
        }

        document.getElementById('resultScore').style.color   = color;
        document.getElementById('resultPercent').style.color = color;
        document.getElementById('resultTrophy').textContent  = trophy;
        document.getElementById('resultMessage').textContent = msg;
    }

    /* ══════════════════════════════════════════
       REVIEW ANSWERS
    ══════════════════════════════════════════ */
    function reviewAnswers() {
        reviewMode    = true;
        currentQIndex = 0;
        document.getElementById('resultOverlay').classList.remove('open');
        document.getElementById('quizOverlay').classList.add('open');

        // Hide submit button in review mode
        document.querySelector('.quiz-nav .btn-nav-danger').style.display = 'none';
        renderQuestion();
    }

    function retryExam() {
        document.getElementById('resultOverlay').classList.remove('open');
        startExam(currentExam.id);
        // Restore submit button
        document.querySelector('.quiz-nav .btn-nav-danger').style.display = '';
    }

    function closeQuizModal() {
        clearInterval(timerInterval);
        document.getElementById('quizOverlay').classList.remove('open');
        document.body.style.overflow = '';
        // Restore submit button visibility for next time
        const dangerBtn = document.querySelector('.quiz-nav .btn-nav-danger');
        if (dangerBtn) dangerBtn.style.display = '';
    }

    /* ══════════════════════════════════════════
       CREATE MODAL
    ══════════════════════════════════════════ */
    function openCreateModal() {
        document.getElementById('createOverlay').classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeCreateModal() {
        document.getElementById('createOverlay').classList.remove('open');
        document.body.style.overflow = '';
    }

    /* ══════════════════════════════════════════
       TẠO ĐỀ THỦ CÔNG
    ══════════════════════════════════════════ */
    let manualQuestions = []; // [{q, opts:[4], ans}]

    function addQuestion() {
        const idx = manualQuestions.length;
        manualQuestions.push({ q: '', opts: ['', '', '', ''], ans: 0 });
        renderQuestionForm(idx);
        updateQCount();
    }

    function removeQuestion(idx) {
        manualQuestions.splice(idx, 1);
        rebuildQuestionForms();
        updateQCount();
    }

    function updateQCount() {
        document.getElementById('qCount').textContent = manualQuestions.length;
        document.getElementById('emptyQMsg').style.display = manualQuestions.length === 0 ? 'block' : 'none';
    }

    function renderQuestionForm(idx) {
        const list = document.getElementById('questionsList');
        const letters = ['A','B','C','D'];
        const div = document.createElement('div');
        div.id = `qblock-${idx}`;
        div.style.cssText = 'background:#f7fafc;border:1.5px solid #e2e8f0;border-radius:12px;padding:1rem;position:relative;';
        div.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.75rem;">
                <span style="font-size:.8rem;font-weight:700;color:#667eea;text-transform:uppercase;letter-spacing:.8px;">Câu ${idx + 1}</span>
                <button onclick="removeQuestion(${idx})" style="background:#fff5f5;border:1px solid #fed7d7;color:#c53030;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:.8rem;display:flex;align-items:center;justify-content:center;" title="Xóa câu này">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <input type="text" class="form-control" placeholder="Nhập câu hỏi..." id="q-text-${idx}"
                style="margin-bottom:.75rem;font-weight:600;"
                oninput="manualQuestions[${idx}].q = this.value">
            <div style="display:flex;flex-direction:column;gap:.45rem;">
                ${letters.map((l, i) => `
                <div style="display:flex;align-items:center;gap:.5rem;">
                    <label style="display:flex;align-items:center;gap:.4rem;cursor:pointer;flex-shrink:0;">
                        <input type="radio" name="ans-${idx}" value="${i}"
                            ${i === 0 ? 'checked' : ''}
                            onchange="manualQuestions[${idx}].ans = ${i}"
                            style="accent-color:#667eea;width:16px;height:16px;">
                        <span style="width:24px;height:24px;border-radius:50%;background:${i === 0 ? '#667eea' : '#e2e8f0'};color:${i === 0 ? 'white' : '#4a5568'};display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;" id="letter-${idx}-${i}">${l}</span>
                    </label>
                    <input type="text" class="form-control" placeholder="Đáp án ${l}..." id="q-opt-${idx}-${i}"
                        style="flex:1;padding:.5rem .75rem;font-size:.85rem;"
                        oninput="manualQuestions[${idx}].opts[${i}] = this.value">
                </div>`).join('')}
            </div>
            <p style="font-size:.75rem;color:#a0aec0;margin-top:.6rem;"><i class="fas fa-info-circle" style="margin-right:.3rem"></i>Chọn radio để đánh dấu đáp án đúng</p>
        `;
        list.appendChild(div);

        // Update letter colors on radio change
        div.querySelectorAll(`input[name="ans-${idx}"]`).forEach((radio, i) => {
            radio.addEventListener('change', () => {
                letters.forEach((_, j) => {
                    const span = document.getElementById(`letter-${idx}-${j}`);
                    if (span) {
                        span.style.background = j === i ? '#667eea' : '#e2e8f0';
                        span.style.color      = j === i ? 'white'   : '#4a5568';
                    }
                });
            });
        });

        document.getElementById('emptyQMsg').style.display = 'none';
    }

    function rebuildQuestionForms() {
        const list = document.getElementById('questionsList');
        list.innerHTML = '';
        manualQuestions.forEach((_, i) => renderQuestionForm(i));
        // Restore values
        manualQuestions.forEach((mq, i) => {
            const qInput = document.getElementById(`q-text-${i}`);
            if (qInput) qInput.value = mq.q;
            mq.opts.forEach((opt, j) => {
                const oInput = document.getElementById(`q-opt-${i}-${j}`);
                if (oInput) oInput.value = opt;
            });
            const radio = document.querySelector(`input[name="ans-${i}"][value="${mq.ans}"]`);
            if (radio) radio.checked = true;
        });
    }

    function startManualExam() {
        const name    = document.getElementById('manualName').value.trim();
        const subject = document.getElementById('manualSubject').value;
        const time    = parseInt(document.getElementById('manualTime').value) || 15;
        const level   = document.getElementById('manualLevel').value;

        if (manualQuestions.length === 0) {
            alert('Vui lòng thêm ít nhất 1 câu hỏi!');
            return;
        }

        // Validate
        for (let i = 0; i < manualQuestions.length; i++) {
            const mq = manualQuestions[i];
            if (!mq.q.trim()) { alert(`Câu ${i + 1}: Chưa nhập nội dung câu hỏi!`); return; }
            const emptyOpts = mq.opts.filter(o => !o.trim());
            if (emptyOpts.length > 0) { alert(`Câu ${i + 1}: Vui lòng điền đủ 4 đáp án!`); return; }
        }

        const meta = SUBJECT_META[subject];
        const exam = {
            id: 9999,
            subject,
            title: name || `Đề kiểm tra ${meta.label} thủ công`,
            desc: `Đề thi tự tạo — ${meta.label}`,
            questions: manualQuestions.length,
            time,
            level,
            qs: manualQuestions.map(mq => ({ q: mq.q, opts: [...mq.opts], ans: mq.ans }))
        };

        const existing = EXAMS.findIndex(e => e.id === 9999);
        if (existing >= 0) EXAMS.splice(existing, 1);
        EXAMS.push(exam);

        closeCreateModal();
        startExam(9999);
    }

    function openCreateModal() {
        // Reset form
        manualQuestions = [];
        document.getElementById('questionsList').innerHTML = '';
        document.getElementById('manualName').value = '';
        document.getElementById('manualTime').value = '15';
        updateQCount();
        document.getElementById('createOverlay').classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    /* ══════════════════════════════════════════
       CLOSE MODALS ON OVERLAY CLICK
    ══════════════════════════════════════════ */
    document.getElementById('createOverlay').addEventListener('click', function(e) {
        if (e.target === this) closeCreateModal();
    });
    document.getElementById('resultOverlay').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('open');
            document.body.style.overflow = '';
        }
    });

    /* ══════════════════════════════════════════
       INIT
    ══════════════════════════════════════════ */
    renderExams('tat-ca');

    // Set initial tab indicator position
    window.addEventListener('load', () => {
        const activeTab = document.querySelector('.subject-tab-btn.active');
        if (activeTab) moveIndicator(activeTab);
    });