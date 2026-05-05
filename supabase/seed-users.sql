-- ============================================================
-- seed-users.sql — Tạo tài khoản học sinh mẫu
-- Chạy trong Supabase SQL Editor
-- Mật khẩu đã được hash SHA-256 sẵn
-- ============================================================

-- Hàm hash SHA-256 trong PostgreSQL (dùng pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Hàm tạo user tiện lợi ────────────────────────────────────
CREATE OR REPLACE FUNCTION create_student(
    p_username    TEXT,
    p_password    TEXT,
    p_displayname TEXT DEFAULT NULL,
    p_role        TEXT DEFAULT 'student'
)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
    v_hash TEXT;
    v_id   UUID;
BEGIN
    -- Hash SHA-256 (giống Web Crypto API trên browser)
    v_hash := encode(digest(p_password, 'sha256'), 'hex');

    INSERT INTO public.users (
        username, display_name, password_hash,
        role, login_method, is_active
    )
    VALUES (
        p_username,
        COALESCE(p_displayname, p_username),
        v_hash,
        p_role,
        'password',
        TRUE
    )
    ON CONFLICT (username) DO UPDATE SET
        display_name  = EXCLUDED.display_name,
        password_hash = EXCLUDED.password_hash,
        role          = EXCLUDED.role,
        is_active     = TRUE,
        updated_at    = NOW()
    RETURNING id INTO v_id;

    -- Tạo user_progress
    INSERT INTO public.user_progress (user_id)
    VALUES (v_id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN v_id;
END;
$$;

-- ── Tạo tài khoản mẫu ────────────────────────────────────────
-- Cú pháp: SELECT create_student('username', 'password', 'Tên hiển thị', 'role');

SELECT create_student('hocsinh1',  '123456',        'Học sinh 1',   'student');
SELECT create_student('hocsinh2',  '123456',        'Học sinh 2',   'student');
SELECT create_student('hocsinh3',  'password123',   'Học sinh 3',   'student');

-- ── Xem danh sách users đã tạo ───────────────────────────────
SELECT
    id,
    username,
    display_name,
    role,
    is_active,
    created_at
FROM public.users
ORDER BY created_at DESC;
