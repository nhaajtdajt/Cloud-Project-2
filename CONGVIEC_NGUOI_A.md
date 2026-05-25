# 🎨 CÔNG VIỆC CỦA NGƯỜI A — Frontend & Edge Layer

> **Môn:** CSC11006 — Nhập môn Điện toán đám mây | **Đồ án 2**
> **Vai trò:** Frontend Developer + Cấu hình Edge (S3, CloudFront, Cognito)

---

## 📦 MÃ NGUỒN ĐÃ CÓ SẴN (Không cần tự viết)

Toàn bộ code trong thư mục `frontend/` đã được tạo sẵn:

```
frontend/
├── index.html        ← Trang chính (danh sách task)
├── login.html        ← Trang đăng nhập
├── signup.html       ← Trang đăng ký
├── css/style.css     ← CSS (dark mode, responsive)
└── js/
    ├── config.js     ← ⚠️ FILE NÀY BẠN CẦN CẬP NHẬT
    ├── auth.js       ← Logic xác thực Cognito
    ├── api.js        ← Gọi API CRUD
    ├── utils.js      ← Hàm tiện ích
    └── app.js        ← Logic chính
```

---

## ✅ DANH SÁCH CÔNG VIỆC THEO THỨ TỰ

---

### 🗓️ TUẦN 1 — Cấu hình Cognito + Chạy thử giao diện

---

#### Bước A1 — Chạy thử giao diện ở máy tính (local)

1. Mở VS Code, cài Extension **Live Server** (nếu chưa có).
2. Mở file `frontend/login.html` → chuột phải → **Open with Live Server**.
3. Giao diện sẽ hiện ra trong trình duyệt. Kiểm tra xem các trang Login, Sign Up, trang chính có hiển thị đúng không.
4. Lúc này gọi API sẽ lỗi vì chưa có backend — **bình thường, không cần lo**.

---

#### Bước A2 — Tạo Cognito User Pool trên AWS

> ⚠️ **Điều kiện:** Bạn phải nhận được thông tin IAM User (username + password + console link) từ trưởng nhóm trước khi làm bước này.

1. Đăng nhập vào AWS Console theo link trưởng nhóm gửi.
2. Chọn region **ap-southeast-1 (Singapore)** ở góc phải trên.
3. Tìm dịch vụ **Cognito** → **User Pools** → **Create user pool**.

**Cấu hình từng bước:**

| Mục | Chọn/Nhập |
|-----|-----------|
| Sign-in options | ✅ Email |
| Password policy | Giữ mặc định (Cognito defaults) |
| MFA | ❌ No MFA |
| Self-service sign-up | ✅ Enable |
| Email delivery | Cognito (miễn phí) |
| User pool name | `TaskManager-UserPool` |

4. **Tạo App Client:**
   - Chọn **Add an app client**
   - App client name: `TaskManager-WebClient`
   - App type: **Public client**
   - Auth flows: bật `ALLOW_USER_SRP_AUTH` và `ALLOW_REFRESH_TOKEN_AUTH`
   - **KHÔNG** tạo client secret

5. Sau khi tạo xong, vào User Pool vừa tạo, ghi lại 2 thông tin quan trọng:
   - **User Pool ID** (ví dụ: `ap-southeast-1_AbCdEfGh`)
   - **Client ID** (ví dụ: `1a2b3c4d5e6f7g8h9i0j`)

---

#### Bước A3 — Tạo 2 user mẫu trong Cognito

> Đề bài yêu cầu phải có ít nhất 2 users sẵn có trong hệ thống.

1. Vào User Pool → tab **Users** → **Create user**
2. Tạo user 1:
   - Username: `user1@example.com`
   - Temporary password: `Test@12345`
   - ✅ Send an invitation email: **Bỏ chọn** (dùng fake email)
   - ✅ Mark email as verified: **Bật**
3. Tạo tương tự cho user 2: `user2@example.com`
4. Dùng AWS CLI để set password vĩnh viễn (không bị hết hạn):
   ```bash
   aws cognito-idp admin-set-user-password \
     --user-pool-id ap-southeast-1_XXXXX \
     --username user1@example.com \
     --password "Test@12345" \
     --permanent \
     --region ap-southeast-1
   ```
   Lặp lại cho user2.

---

#### Bước A4 — Cập nhật file config.js

1. Mở file `frontend/js/config.js`
2. Điền vào 2 giá trị đã ghi ở Bước A2:
   ```javascript
   const CONFIG = {
       API_URL: 'CHƯA CÓ — Sẽ điền sau khi Người B tạo API Gateway',
       COGNITO: {
           REGION: 'ap-southeast-1',
           USER_POOL_ID: 'ĐIỀN USER POOL ID VÀO ĐÂY',
           APP_CLIENT_ID: 'ĐIỀN CLIENT ID VÀO ĐÂY'
       }
   };
   ```
3. Test đăng ký và đăng nhập qua Live Server → Phải thành công.

---

#### 📸 Bằng chứng cần chụp cuối Tuần 1

| Mã | Chụp gì | Ở đâu |
|----|---------|-------|
| **CO-1** | Trang Cognito User Pools hiển thị tên Pool và Pool ID | Cognito Console > User Pools |

---

### 🗓️ TUẦN 2 — Host Frontend lên AWS

---

#### Bước A5 — Nhận thông tin từ Người B

Chờ Người B gửi cho bạn **API Gateway Invoke URL**, dạng:
```
https://xxxxxxxx.execute-api.ap-southeast-1.amazonaws.com/prod
```

Điền vào `config.js`:
```javascript
API_URL: 'https://xxxxxxxx.execute-api.ap-southeast-1.amazonaws.com/prod'
```

Test lại toàn bộ ứng dụng ở local: Login → Tạo task → Xem → Sửa → Xóa → Lọc.

---

#### Bước A6 — Tạo S3 Bucket (PRIVATE)

> ⛔ **CẢNH BÁO:** Nếu để bucket public hoặc bật Static Website Hosting sẽ bị **0 điểm** phần SE-1 → SE-4.

1. Vào **S3** → **Create bucket**
2. Cấu hình:
   - Bucket name: `taskmanager-frontend-nhom3` (phải unique toàn cầu)
   - Region: `ap-southeast-1`
   - **Block all public access:** ✅ **BẬT TẤT CẢ 4 ô checkbox**
   - **Static Website Hosting:** ❌ **KHÔNG BẬT**
3. Tạo bucket.

---

#### Bước A7 — Tạo CloudFront Distribution + OAC

1. Vào **CloudFront** → **Create distribution**
2. **Origin settings:**
   - Origin domain: chọn S3 bucket vừa tạo
   - Origin access: chọn **Origin access control settings (recommended)**
   - Nhấn **Create new OAC:**
     - Name: `TaskManager-OAC`
     - Signing behavior: `Sign requests (recommended)`
   - **Copy Bucket Policy** mà CloudFront hiện ra → sẽ dùng ở bước sau.
3. **Default behavior:**
   - Viewer protocol policy: **Redirect HTTP to HTTPS**
4. **Settings:**
   - Default root object: `index.html`
5. **Custom Error Pages:**
   - Add error page: HTTP error code `403` → Response page `/index.html`, HTTP response code `200`
   - Add error page: HTTP error code `404` → Response page `/index.html`, HTTP response code `200`
6. Tạo distribution. **Ghi lại CloudFront Domain**: `https://dXXXXXX.cloudfront.net`

---

#### Bước A8 — Cập nhật Bucket Policy cho S3

1. Vào S3 bucket → tab **Permissions** → **Bucket policy** → **Edit**
2. Dán đoạn policy CloudFront đã copy ở bước trước vào (có dạng như sau):
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Sid": "AllowCloudFrontServicePrincipal",
               "Effect": "Allow",
               "Principal": { "Service": "cloudfront.amazonaws.com" },
               "Action": "s3:GetObject",
               "Resource": "arn:aws:s3:::taskmanager-frontend-nhom3/*",
               "Condition": {
                   "StringEquals": {
                       "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
                   }
               }
           }
       ]
   }
   ```
3. **Save changes**.

---

#### Bước A9 — Upload Frontend lên S3

1. Cài AWS CLI (nếu chưa có): https://aws.amazon.com/cli/
2. Cấu hình credentials:
   ```bash
   aws configure
   # Nhập Access Key và Secret Key của IAM User bạn được cấp
   # Region: ap-southeast-1
   ```
3. Upload toàn bộ frontend:
   ```bash
   aws s3 sync frontend/ s3://taskmanager-frontend-nhom3/ --delete
   ```
4. Truy cập CloudFront URL để kiểm tra: `https://dXXXXXX.cloudfront.net` → Phải thấy trang login.

---

#### Bước A10 — Gửi CloudFront URL cho Người B (cập nhật CORS)

Gửi CloudFront URL (ví dụ `https://d1abc.cloudfront.net`) cho **Người B**.
Người B sẽ cập nhật lại CORS trong Lambda và API Gateway.

Sau khi Người B cập nhật xong → upload lại frontend:
```bash
aws s3 sync frontend/ s3://taskmanager-frontend-nhom3/ --delete
aws cloudfront create-invalidation --distribution-id DISTRIBUTION_ID --paths "/*"
```

---

### 🗓️ TUẦN 3 — Kiểm thử & Thu thập bằng chứng

---

#### Bước A11 — Kiểm thử toàn bộ (qua CloudFront URL)

- [ ] Đăng ký tài khoản mới → nhận email xác nhận → xác nhận OTP → thành công
- [ ] Đăng nhập thành công → vào trang chính
- [ ] Tạo công việc mới → hiển thị trong danh sách
- [ ] Sửa công việc → thay đổi được
- [ ] Xóa công việc → biến mất
- [ ] Lọc theo **mức ưu tiên** (low/medium/high) → đúng
- [ ] Lọc theo **ngày hạn** → đúng
- [ ] Đăng xuất → về trang login
- [ ] Truy cập thẳng index.html khi chưa đăng nhập → tự redirect về login

#### Bước A12 — Thu thập bằng chứng

| Mã | Chụp gì | Cách thu thập |
|----|---------|---------------|
| **CO-1** | Trang Cognito User Pools + Pool ID | Cognito > User Pools |
| **CO-3** | Gọi API không có token → nhận 401 | `curl -X GET https://API_URL/prod/tasks` (không có header) |
| **CO-4** | Gọi API có token hợp lệ → nhận 200 | `curl` với `-H "Authorization: TOKEN"` |
| **SE-1** | S3 Permissions → 4 Block Public Access đều ON | S3 > bucket > Permissions |
| **SE-2** | Truy cập URL S3 trực tiếp → 403 Forbidden | `curl -I https://BUCKET.s3.amazonaws.com/index.html` |
| **SE-3** | Truy cập CloudFront URL → 200 OK | `curl -I https://dXXXX.cloudfront.net` |
| **SE-4** | CloudFront Distribution Settings → OAC name | CloudFront > Distribution > Settings |

---

## 📝 Phần báo cáo của bạn

Bạn phụ trách giải thích 2 khái niệm (khoảng 4% điểm mỗi khái niệm):

### CDN và OAC (~4%)
- CloudFront caching hoạt động thế nào? **Cache HIT** (có trong cache, trả về ngay) vs **Cache MISS** (không có, lấy từ S3 rồi cache lại).
- **OAC (Origin Access Control)** là gì? Đây là cơ chế cho phép CloudFront "ký" mỗi request gửi đến S3 bằng chữ ký AWS, để S3 biết request đến từ CloudFront thật sự chứ không phải từ ai khác.
- Tại sao S3 phải private? Để buộc 100% traffic phải đi qua CloudFront, đảm bảo mọi request đều được CDN, cache, và bảo mật OAC.

### Luồng request (~8%) — Viết cùng Người B
Từ khi người dùng nhấn "Tạo công việc":
> Browser → CloudFront → API Gateway → Lambda → VPC Endpoint → DynamoDB → phản hồi

---

> 💬 **Hỏi trưởng nhóm nếu bạn cần:** IAM credentials, API URL, hay bất cứ thông tin cấu hình nào.
