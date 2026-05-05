# Hướng dẫn setup Google OAuth cho HOUSE WORK

## Bước 1 — Tạo Google Cloud Project

1. Vào [https://console.cloud.google.com](https://console.cloud.google.com)
2. Nhấn **"Select a project"** → **"New Project"**
3. Đặt tên project (ví dụ: `house-work`) → **Create**

## Bước 2 — Tạo OAuth 2.0 Client ID

1. Vào menu **APIs & Services** → **Credentials**
2. Nhấn **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Nếu chưa có OAuth consent screen → nhấn **"Configure consent screen"**:
   - Chọn **External** → **Create**
   - Điền App name: `HOUSE WORK`, email hỗ trợ
   - Nhấn **Save and Continue** qua hết các bước
4. Quay lại tạo Client ID:
   - Application type: **Web application**
   - Name: `HOUSE WORK Web`
   - **Authorized JavaScript origins** — thêm:
     ```
     http://localhost
     http://localhost:5500
     http://127.0.0.1:5500
     http://127.0.0.1
     ```
     *(thêm domain thật nếu deploy lên hosting)*
   - **Authorized redirect URIs** — để trống (không cần với GSI popup flow)
5. Nhấn **Create** → copy **Client ID** (dạng `xxxx.apps.googleusercontent.com`)

## Bước 3 — Điền Client ID vào code

Mở file `js/login.js`, tìm dòng:

```js
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
```

Thay bằng Client ID vừa copy:

```js
const GOOGLE_CLIENT_ID = '123456789-abcdefg.apps.googleusercontent.com';
```

Mở file `login.html`, tìm thẻ:

```html
<div id="g_id_onload"
     data-client_id="YOUR_GOOGLE_CLIENT_ID"
     ...>
```

Thay `YOUR_GOOGLE_CLIENT_ID` bằng Client ID tương tự.

## Bước 4 — Chạy thử

- Mở `login.html` qua **Live Server** (port 5500) hoặc server local
- Nhấn nút **"Đăng nhập với Google"** → popup Google hiện ra
- Chọn tài khoản Google → tự động đăng nhập và chuyển về trang chủ

## Lưu ý quan trọng

| Vấn đề | Giải thích |
|--------|-----------|
| Mở file `file://` trực tiếp | Google OAuth **không hoạt động** với `file://`, phải dùng `http://localhost` |
| `redirect_uri_mismatch` | Kiểm tra lại Authorized JavaScript origins trong Google Console |
| Popup bị chặn | Cho phép popup từ `localhost` trong trình duyệt |
| Client ID sai | Đảm bảo copy đúng, không thừa khoảng trắng |

## Cách hoạt động

```
Người dùng bấm nút Google
        ↓
Google popup mở ra (chọn tài khoản)
        ↓
Google trả về access token
        ↓
App gọi Google API lấy: name, email, avatar
        ↓
Lưu vào localStorage với role = 'student'
        ↓
Chuyển về trang chủ (index.html)
```

Tài khoản Google login sẽ có `loginMethod: 'google'` trong localStorage,
phân biệt với tài khoản demo thông thường.
