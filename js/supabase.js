// ============================================================
// supabase.js — Supabase client & helper functions
// ============================================================
// Hướng dẫn setup:
// 1. Vào https://supabase.com → tạo project mới
// 2. Vào Settings → API → copy Project URL và anon key
// 3. Điền vào 2 biến bên dưới
// ============================================================

const SUPABASE_URL  = 'https://zoiasdbkkuyqfbjhqnxi.supabase.co';
const SUPABASE_ANON = 'sb_publishable_jqQUc-RYNRkarpcdLhQk2A_37x22rR5';

// Load Supabase SDK từ CDN (thêm vào <head> của các trang)
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

let _sb = null;

function getSupabase() {
    if (_sb) return _sb;
    // Thử nhiều cách khác nhau tùy version SDK
    const sbLib = window.supabase || window.Supabase;
    if (!sbLib || typeof sbLib.createClient !== 'function') {
        console.error('[Supabase] SDK chưa load xong hoặc không tìm thấy window.supabase');
        return null;
    }
    try {
        _sb = sbLib.createClient(SUPABASE_URL, SUPABASE_ANON);
        console.log('[Supabase] Client khởi tạo thành công');
        return _sb;
    } catch(e) {
        console.error('[Supabase] Lỗi khởi tạo client:', e);
        return null;
    }
}

// ── Kiểm tra đã cấu hình chưa ────────────────────────────────
function isSupabaseConfigured() {
    return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON !== 'YOUR_SUPABASE_ANON_KEY';
}

// ============================================================
// USER FUNCTIONS
// ============================================================

/**
 * Lấy hoặc tạo user trong bảng users sau khi đăng nhập Google
 */
async function sbUpsertUser(googleUser) {
    const sb = getSupabase();
    if (!sb) return null;

    const { data, error } = await sb
        .from('users')
        .upsert({
            google_id:     googleUser.googleId,
            email:         googleUser.email,
            display_name:  googleUser.displayName,
            avatar_url:    googleUser.avatar,
            login_method:  'google',
            last_login_at: new Date().toISOString()
        }, { onConflict: 'google_id' })
        .select('id, role, display_name, email, avatar_url')
        .single();

    if (error) {
        console.error('sbUpsertUser error:', error.message, error.details);
        return null;
    }
    return data;
}

/**
 * Lấy thông tin user theo google_id
 */
async function sbGetUserByGoogleId(googleId) {
    const sb = getSupabase();
    if (!sb) return null;

    const { data, error } = await sb
        .from('users')
        .select('*')
        .eq('google_id', googleId)
        .single();

    if (error) return null;
    return data;
}

/**
 * Lấy danh sách tất cả users (admin only)
 */
async function sbGetAllUsers() {
    const sb = getSupabase();
    if (!sb) return [];

    const { data, error } = await sb
        .from('users')
        .select('id, username, email, display_name, role, login_method, avatar_url, is_active, last_login_at, created_at')
        .order('created_at', { ascending: false });

    if (error) { console.error('sbGetAllUsers:', error); return []; }
    return data || [];
}

/**
 * Cập nhật role user (admin only)
 */
async function sbUpdateUserRole(userId, role) {
    const sb = getSupabase();
    if (!sb) return false;

    const { error } = await sb
        .from('users')
        .update({ role })
        .eq('id', userId);

    return !error;
}

/**
 * Vô hiệu hóa user (admin only)
 */
async function sbToggleUserActive(userId, isActive) {
    const sb = getSupabase();
    if (!sb) return false;

    const { error } = await sb
        .from('users')
        .update({ is_active: isActive })
        .eq('id', userId);

    return !error;
}

// ============================================================
// EXAM ATTEMPT FUNCTIONS
// ============================================================

/**
 * Lưu kết quả bài kiểm tra
 */
async function sbSaveExamAttempt({ userId, examId, examTitle, examSubject, score, totalQuestions, percentage, userAnswers, timeSpent }) {
    const sb = getSupabase();
    if (!sb) return null;

    const { data, error } = await sb
        .from('exam_attempts')
        .insert({
            user_id:         userId,
            exam_id:         examId || null,
            exam_title:      examTitle,
            exam_subject:    examSubject,
            score,
            total_questions: totalQuestions,
            percentage,
            user_answers:    userAnswers,
            time_spent:      timeSpent,
            completed_at:    new Date().toISOString()
        })
        .select()
        .single();

    if (error) { console.error('sbSaveExamAttempt:', error); return null; }

    // Cập nhật tiến độ
    await sbUpdateProgressAfterTest(userId, percentage);
    // Ghi activity log
    await sbLogActivity(userId, 'complete_test', data.id, 0);

    return data;
}

/**
 * Lấy lịch sử bài kiểm tra của user
 */
async function sbGetExamHistory(userId, limit = 20) {
    const sb = getSupabase();
    if (!sb) return [];

    const { data, error } = await sb
        .from('exam_attempts')
        .select('id, exam_title, exam_subject, score, total_questions, percentage, time_spent, completed_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(limit);

    if (error) { console.error('sbGetExamHistory:', error); return []; }
    return data || [];
}

/**
 * Lấy tất cả kết quả kiểm tra (admin)
 */
async function sbGetAllAttempts(limit = 100) {
    const sb = getSupabase();
    if (!sb) return [];

    const { data, error } = await sb
        .from('exam_attempts')
        .select(`
            id, exam_title, exam_subject, score, total_questions, percentage, completed_at,
            users (display_name, email, avatar_url)
        `)
        .order('completed_at', { ascending: false })
        .limit(limit);

    if (error) { console.error('sbGetAllAttempts:', error); return []; }
    return data || [];
}

// ============================================================
// DOCUMENT FUNCTIONS
// ============================================================

/**
 * Lấy danh sách tài liệu (có thể lọc theo môn)
 */
async function sbGetDocuments(subject = null) {
    const sb = getSupabase();
    if (!sb) return [];

    let query = sb
        .from('documents')
        .select('*')
        .eq('is_published', true)
        .order('views_count', { ascending: false });

    if (subject && subject !== 'tat-ca') {
        query = query.eq('subject', subject);
    }

    const { data, error } = await query;
    if (error) { console.error('sbGetDocuments:', error); return []; }
    return data || [];
}

/**
 * Ghi lịch sử xem tài liệu (tự động tăng views_count qua trigger)
 */
async function sbRecordView(userId, documentId) {
    const sb = getSupabase();
    if (!sb) return;

    await sb.from('view_history').insert({ user_id: userId, document_id: documentId });
    await sbLogActivity(userId, 'read_doc', documentId, 5);
}

/**
 * Toggle yêu thích tài liệu
 */
async function sbToggleFavorite(userId, documentId) {
    const sb = getSupabase();
    if (!sb) return false;

    // Kiểm tra đã yêu thích chưa
    const { data: existing } = await sb
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('document_id', documentId)
        .single();

    if (existing) {
        await sb.from('user_favorites').delete().eq('id', existing.id);
        return false; // đã bỏ yêu thích
    } else {
        await sb.from('user_favorites').insert({ user_id: userId, document_id: documentId });
        return true; // đã thêm yêu thích
    }
}

/**
 * Lấy danh sách tài liệu yêu thích của user
 */
async function sbGetFavorites(userId) {
    const sb = getSupabase();
    if (!sb) return [];

    const { data, error } = await sb
        .from('user_favorites')
        .select('document_id, documents(*)')
        .eq('user_id', userId);

    if (error) return [];
    return (data || []).map(f => f.documents);
}

// ============================================================
// PROGRESS FUNCTIONS
// ============================================================

/**
 * Lấy tiến độ học tập của user
 */
async function sbGetProgress(userId) {
    const sb = getSupabase();
    if (!sb) return null;

    const { data, error } = await sb
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) return null;
    return data;
}

/**
 * Cập nhật tiến độ sau khi làm bài kiểm tra
 */
async function sbUpdateProgressAfterTest(userId, newScore) {
    const sb = getSupabase();
    if (!sb) return;

    const current = await sbGetProgress(userId);
    if (!current) return;

    const newCompleted = current.tests_completed + 1;
    const newAvg = ((current.avg_score * current.tests_completed) + newScore) / newCompleted;

    await sb.from('user_progress').update({
        tests_completed: newCompleted,
        avg_score: Math.round(newAvg * 100) / 100,
        updated_at: new Date().toISOString()
    }).eq('user_id', userId);
}

/**
 * Lấy activity log để render heatmap
 */
async function sbGetActivityHeatmap(userId, days = 63) {
    const sb = getSupabase();
    if (!sb) return [];

    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await sb
        .from('activity_log')
        .select('activity_date, activity_type, duration')
        .eq('user_id', userId)
        .gte('activity_date', since.toISOString().split('T')[0])
        .order('activity_date', { ascending: true });

    if (error) return [];
    return data || [];
}

// ============================================================
// ACTIVITY LOG
// ============================================================

async function sbLogActivity(userId, activityType, refId = null, duration = 0) {
    const sb = getSupabase();
    if (!sb) return;

    await sb.from('activity_log').insert({
        user_id:       userId,
        activity_type: activityType,
        ref_id:        refId,
        duration,
        activity_date: new Date().toISOString().split('T')[0]
    });
}

// ============================================================
// SYSTEM SETTINGS
// ============================================================

async function sbGetSettings() {
    const sb = getSupabase();
    if (!sb) return null;

    const { data } = await sb.from('system_settings').select('*').single();
    return data;
}

async function sbUpdateSettings(settings) {
    const sb = getSupabase();
    if (!sb) return false;

    const { error } = await sb
        .from('system_settings')
        .update({ ...settings, updated_at: new Date().toISOString() })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // update all rows

    return !error;
}

// ============================================================
// VIOLATIONS LOG
// ============================================================

async function sbLogViolation(userId, username, action, documentId = null, docTitle = null) {
    const sb = getSupabase();
    if (!sb) return;

    await sb.from('violations_log').insert({
        user_id:     userId,
        username,
        action,
        document_id: documentId,
        doc_title:   docTitle
    });
}

async function sbGetViolations(limit = 100) {
    const sb = getSupabase();
    if (!sb) return [];

    const { data } = await sb
        .from('violations_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    return data || [];
}
