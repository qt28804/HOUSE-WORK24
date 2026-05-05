// ============================================================
// create-user.js — Script tạo user vào Supabase (Node.js)
// Chạy: node supabase/create-user.js
// Cài: npm install @supabase/supabase-js
// ============================================================
// LƯU Ý: Project này là static HTML nên KHÔNG dùng bcrypt
// Thay bằng crypto (built-in Node.js) để hash SHA-256
// giống hệt Web Crypto API trên browser
// ============================================================

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// ── Cấu hình ─────────────────────────────────────────────────
const SUPABASE_URL  = "https://zoiasdbkkuyqfbjhqnxi.supabase.co";
const SUPABASE_ANON = "sb_publishable_jqQUc-RYNRkarpcdLhQk2A_37x22rR5";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── Hash SHA-256 (giống browser Web Crypto API) ───────────────
function hashPassword(password) {
    return crypto.createHash("sha256").update(password).digest("hex");
}

// ── Tạo user ─────────────────────────────────────────────────
async function createUser(username, password, displayName = "", role = "student") {
    // Kiểm tra user đã tồn tại chưa
    const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .single();

    if (existing) {
        console.log(`⚠️  User "${username}" đã tồn tại (id: ${existing.id})`);
        return null;
    }

    const hashedPassword = hashPassword(password);

    const { data, error } = await supabase
        .from("users")
        .insert([{
            username:      username,
            display_name:  displayName || username,
            password_hash: hashedPassword,
            role:          role,
            login_method:  "password",
            is_active:     true,
        }])
        .select("id, username, role, created_at")
        .single();

    if (error) {
        console.error("❌ Lỗi tạo user:", error.message);
        return null;
    }

    // Tạo user_progress cho user mới
    await supabase
        .from("user_progress")
        .upsert({ user_id: data.id }, { onConflict: "user_id" });

    console.log("✅ Tạo user thành công:");
    console.log(`   ID:       ${data.id}`);
    console.log(`   Username: ${data.username}`);
    console.log(`   Role:     ${data.role}`);
    console.log(`   Created:  ${data.created_at}`);
    console.log(`   Password hash: ${hashedPassword}`);
    return data;
}

// ── Lấy danh sách users ───────────────────────────────────────
async function listUsers() {
    const { data, error } = await supabase
        .from("users")
        .select("id, username, display_name, role, is_active, created_at")
        .order("created_at", { ascending: false });

    if (error) { console.error("❌ Lỗi:", error.message); return; }

    console.log(`\n📋 Danh sách users (${data.length}):`);
    data.forEach((u, i) => {
        console.log(`  ${i+1}. [${u.role}] ${u.username} — ${u.display_name} (${u.is_active ? "✅ active" : "❌ inactive"})`);
    });
}

// ── Xóa user ─────────────────────────────────────────────────
async function deleteUser(username) {
    const { error } = await supabase
        .from("users")
        .delete()
        .eq("username", username);

    if (error) console.error("❌ Lỗi xóa:", error.message);
    else console.log(`🗑️  Đã xóa user "${username}"`);
}

// ── CHẠY TEST ─────────────────────────────────────────────────
(async () => {
    console.log("🚀 Kết nối Supabase:", SUPABASE_URL);
    console.log("─".repeat(50));

    // Tạo user test
    await createUser("user1",   "123456",        "Học sinh 1",  "student");
    await createUser("user2",   "password123",   "Học sinh 2",  "student");
    await createUser("teacher1","Teacher@2026",  "Giáo viên 1", "student");

    console.log("\n" + "─".repeat(50));

    // Xem danh sách
    await listUsers();
})();
