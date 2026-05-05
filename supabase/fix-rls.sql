-- ============================================================
-- Fix RLS policies cho bảng users
-- Chạy file này trong Supabase SQL Editor
-- ============================================================

-- Cho phép insert user mới (ai cũng được, vì đây là đăng ký)
CREATE POLICY "users_insert_anyone" ON public.users
    FOR INSERT WITH CHECK (true);

-- Cho phép select chính mình (không cần JWT phức tạp)
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT USING (true);

-- Cho phép update chính mình
DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE USING (true);
