# BÁO CÁO PHẦN NGƯỜI A — Frontend, CDN & OAC, Cognito

> **Hướng dẫn:** Người A viết toàn bộ phần này. Những chỗ có ký hiệu 📸 hoặc `[CHỤP HÌNH]` là nơi bạn cần chèn ảnh screenshot thực tế. Những chỗ có `[ĐIỀN VÀO]` là nơi bạn cần điền thông tin cụ thể sau khi triển khai xong.

---

## PHẦN 1: THIẾT KẾ VÀ PHÁT TRIỂN FRONTEND

### 1.1. Công nghệ sử dụng

Giao diện ứng dụng Task Manager được phát triển bằng bộ ba công nghệ web cơ bản: **HTML5, CSS3 và JavaScript thuần (Vanilla JS)**, không sử dụng bất kỳ framework frontend nào như React, Angular hay Vue. Lựa chọn này hoàn toàn phù hợp với yêu cầu đề bài (Mục IV.1.1: *"Không bắt buộc dùng framework frontend"*) và mang lại hai lợi thế rõ rệt:

1. **Nhẹ và nhanh:** Toàn bộ mã nguồn frontend chỉ bao gồm các file tĩnh (HTML, CSS, JS) có tổng dung lượng rất nhỏ (dưới 50KB), hoàn hảo để đóng gói vào Amazon S3 và phân phối qua CloudFront mà không cần bất kỳ bước build hay compile nào.

2. **Không phụ thuộc server-side rendering:** Do ứng dụng hoàn toàn là Static Website phía client, việc hosting trên S3 (với chế độ Private + CloudFront) trở nên cực kỳ đơn giản và tối ưu chi phí.

**Thư viện bên ngoài duy nhất được sử dụng:**
- **amazon-cognito-identity-js v6.3.12** (tải qua CDN từ jsDelivr): Đây là thư viện chính thức của AWS dùng để tương tác với dịch vụ Amazon Cognito từ phía trình duyệt. Nó cung cấp các hàm đăng ký, đăng nhập, xác nhận OTP và quản lý phiên JWT Token mà không cần viết lại logic xác thực từ đầu.

- **Google Fonts — Inter:** Font chữ hiện đại, dễ đọc, được sử dụng xuyên suốt giao diện với các weight: 400 (Regular), 500 (Medium), 600 (Semi-bold), 700 (Bold), 800 (Extra-bold).

### 1.2. Cấu trúc thư mục mã nguồn Frontend

```
frontend/
├── index.html          ← Trang chính (Dashboard quản lý công việc)
├── login.html          ← Trang đăng nhập
├── signup.html         ← Trang đăng ký + xác nhận mã OTP
├── css/
│   └── style.css       ← Toàn bộ giao diện (Dark theme, responsive, animations)
└── js/
    ├── config.js       ← Lưu cấu hình: API URL, Cognito Pool ID, App Client ID
    ├── auth.js         ← Logic xác thực: signUp, signIn, signOut, getToken, requireAuth
    ├── api.js          ← Gọi 4 endpoint CRUD (GET/POST/PUT/DELETE) kèm JWT Token
    ├── app.js          ← Logic chính: render danh sách, xử lý form, bộ lọc, thống kê
    └── utils.js        ← Hàm tiện ích: format ngày, toast notification, loading overlay
```

### 1.3. Các tính năng đã triển khai

#### a) Hệ thống xác thực người dùng (Authentication)

Ứng dụng sử dụng **Amazon Cognito** để quản lý tài khoản. Toàn bộ luồng xác thực diễn ra hoàn toàn phía client (frontend) mà không cần backend can thiệp:

| Chức năng | Mô tả chi tiết | File xử lý |
|-----------|----------------|------------|
| **Đăng ký** | Người dùng nhập email và mật khẩu. Cognito gửi mã OTP 6 số về email để xác nhận. Sau khi nhập đúng mã, tài khoản được kích hoạt. | `signup.html` + `auth.js → signUp()` + `confirmSignUp()` |
| **Đăng nhập** | Người dùng nhập email + mật khẩu. Cognito xác thực và trả về bộ 3 token (ID Token, Access Token, Refresh Token). Frontend chỉ lưu ID Token (JWT) vào `localStorage` để gửi kèm các lần gọi API sau. | `login.html` + `auth.js → signIn()` + `saveAuthData()` |
| **Đăng xuất** | Xóa token khỏi `localStorage`, gọi `cognitoUser.signOut()` để hủy phiên trên Cognito, rồi chuyển hướng về trang Login. | `auth.js → signOut()` |
| **Bảo vệ trang** | Mỗi khi người dùng truy cập `index.html` (trang chính), hàm `requireAuth()` sẽ kiểm tra xem JWT Token trong `localStorage` còn hạn hay không (bằng cách decode phần payload và so sánh trường `exp` với thời gian hiện tại). Nếu hết hạn hoặc không có token → tự động redirect về `login.html`. | `auth.js → requireAuth()` + `isAuthenticated()` |

#### b) Quản lý công việc — CRUD đầy đủ

| Thao tác | Mô tả | API gọi |
|----------|-------|---------|
| **Tạo mới (Create)** | Người dùng điền form gồm: Tiêu đề (bắt buộc), Mô tả (tùy chọn), Mức ưu tiên (low/medium/high), Ngày hạn, Trạng thái (pending/done). Sau khi bấm "Tạo công việc", frontend gọi `POST /tasks` gửi dữ liệu lên Lambda. | `api.js → createTask()` |
| **Xem danh sách (Read)** | Khi trang `index.html` được mở, frontend tự động gọi `GET /tasks` để lấy toàn bộ công việc của user đang đăng nhập. Danh sách được hiển thị dưới dạng các thẻ (card) với mã màu theo mức ưu tiên: 🔴 Cao, 🟡 Trung bình, 🟢 Thấp. | `api.js → getTasks()` |
| **Cập nhật (Update)** | Khi bấm nút "Sửa" trên một thẻ công việc, dữ liệu hiện tại được điền ngược vào form phía trên, tiêu đề form đổi thành "Sửa công việc", nút Submit đổi thành "Cập nhật". Sau khi chỉnh sửa và bấm nút, frontend gọi `PUT /tasks/:id`. Ngoài ra, nút "Hoàn thành" cho phép nhanh chóng chuyển trạng thái giữa `pending` ↔ `done`. | `api.js → updateTask()` |
| **Xóa (Delete)** | Khi bấm nút "Xóa", một hộp thoại xác nhận (confirm dialog) hiện ra để tránh xóa nhầm. Nếu xác nhận → gọi `DELETE /tasks/:id`. | `api.js → deleteTask()` |

#### c) Bộ lọc công việc

Theo yêu cầu đề bài (Mục IV.1.1: *"Lọc công việc theo ngày hết hạn và mức độ ưu tiên"*), frontend triển khai bộ lọc kết hợp 3 tiêu chí:

- **Lọc theo Mức ưu tiên (Priority):** Dropdown cho phép chọn `Tất cả`, `Cao`, `Trung bình` hoặc `Thấp`. Khi chọn, danh sách chỉ hiển thị các công việc có mức ưu tiên tương ứng.

- **Lọc theo Khoảng ngày hạn (Date Range):** Hai trường "Từ ngày" và "Đến ngày" cho phép thu hẹp kết quả theo khoảng thời gian. Ví dụ: chỉ hiển thị công việc có ngày hạn từ 01/06 đến 15/06.

- **Kết hợp nhiều bộ lọc:** Người dùng có thể vừa chọn priority = "Cao" vừa chọn khoảng ngày → chỉ hiển thị công việc ưu tiên Cao trong khoảng ngày đó. Nút "Xóa bộ lọc" reset tất cả về trạng thái ban đầu.

Bộ lọc hoạt động hoàn toàn phía client (lọc trên mảng `allTasks` đã tải về) → phản hồi tức thì, không cần gọi lại API. Dòng thông tin "Hiển thị X / Y công việc" giúp người dùng biết đang lọc bao nhiêu kết quả.

#### d) Giao diện và trải nghiệm người dùng

- **Dark Theme:** Toàn bộ giao diện sử dụng tông màu tối (#0f172a, #1e293b) giúp giảm mỏi mắt.
- **Responsive:** Sử dụng CSS Grid và Flexbox để giao diện tự động co giãn trên mọi kích thước màn hình (Desktop, Tablet, Mobile).
- **Toast Notifications:** Mỗi khi thao tác thành công hoặc thất bại, một thanh thông báo hiện ra ở góc trên với biểu tượng ✅ (thành công) hoặc ❌ (lỗi) rồi tự biến mất sau 3 giây.
- **Loading Overlay:** Trong khi đang chờ API phản hồi, một lớp phủ mờ kèm vòng xoay (spinner) xuất hiện, ngăn người dùng bấm trùng lặp.
- **Confirm Dialog:** Trước khi xóa công việc, hệ thống hiện hộp thoại xác nhận với 2 nút "Hủy" và "Xác nhận" để tránh xóa nhầm.
- **Thanh thống kê:** Phía trên danh sách hiển thị tổng quan gồm: Tổng số công việc, Số đang chờ, Số hoàn thành và Số quá hạn (nếu có).
- **Bảo vệ XSS:** Tất cả nội dung do người dùng nhập (title, description) đều được xử lý qua hàm `escapeHtml()` trước khi đưa vào HTML, ngăn chặn tấn công Cross-Site Scripting.

---

## PHẦN 2: TRIỂN KHAI FRONTEND TRÊN AWS — S3 PRIVATE + CLOUDFRONT + OAC

### 2.1. Tổng quan kiến trúc phân phối Frontend

Thay vì để S3 bucket ở chế độ Public và bật Static Website Hosting (cách làm thông thường nhưng **BỊ CẤM** trong đồ án này), nhóm triển khai mô hình bảo mật theo yêu cầu:

```
Người dùng (trình duyệt)
        │
        ▼
  CloudFront CDN  ◄──  OAC (Origin Access Control)
        │
        ▼
   S3 Bucket (PRIVATE — Block ALL Public Access)
```

**Giải thích luồng hoạt động:**
1. Người dùng mở trình duyệt và truy cập URL: `https://[ĐIỀN_CLOUDFRONT_ID].cloudfront.net`.
2. Yêu cầu được gửi đến máy chủ biên (Edge Location) của CloudFront gần nhất với vị trí địa lý của người dùng.
3. CloudFront kiểm tra bộ nhớ đệm (Cache):
   - **Cache HIT:** Nếu file đã được lưu trong cache, CloudFront trả về ngay lập tức mà không cần hỏi S3. Điều này giúp giảm đáng kể thời gian tải trang (latency) vì người dùng nhận file từ server gần nhất thay vì phải chờ truyền từ Region Singapore.
   - **Cache MISS:** Nếu file chưa có trong cache (lần truy cập đầu tiên hoặc cache đã hết hạn), CloudFront sẽ đi lấy file từ S3 bằng cách sử dụng **OAC (Origin Access Control)**. OAC đóng vai trò như một "thẻ nhân viên" cho phép CloudFront chứng minh danh tính của mình với S3, từ đó S3 mới chấp nhận trả file về.
4. S3 bucket được cấu hình hoàn toàn PRIVATE — tất cả 4 tùy chọn Block Public Access đều BẬT. Điều này có nghĩa là:
   - Không ai có thể truy cập file trực tiếp qua URL S3 (sẽ nhận lỗi 403 Forbidden).
   - Chỉ duy nhất CloudFront (thông qua OAC) mới được phép đọc file từ bucket.

### 2.2. Cấu hình chi tiết đã thực hiện

#### a) Amazon S3 Bucket

| Cấu hình | Giá trị |
|-----------|---------|
| Tên bucket | `[ĐIỀN_TÊN_BUCKET]` |
| Region | `ap-southeast-1` (Singapore) |
| Block Public Access | ✅ BẬT cả 4 tùy chọn |
| Static Website Hosting | ❌ TẮT (Không được bật theo yêu cầu đề) |
| Versioning | Tùy chọn |

**Bucket Policy (chỉ cho phép CloudFront đọc qua OAC):**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipalReadOnly",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::[ĐIỀN_TÊN_BUCKET]/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::[ĐIỀN_ACCOUNT_ID]:distribution/[ĐIỀN_DISTRIBUTION_ID]"
                }
            }
        }
    ]
}
```

📸 **[CHỤP HÌNH SE-1]:** Chụp tab **Permissions** của S3 bucket cho thấy cả 4 ô Block Public Access đều bật (có dấu tích xanh).

📸 **[CHỤP HÌNH SE-2]:** Mở trình duyệt và truy cập trực tiếp URL S3 dạng `https://[TÊN_BUCKET].s3.amazonaws.com/index.html`. Chụp ảnh kết quả hiển thị lỗi **403 Forbidden / Access Denied**. (Hoặc dùng lệnh `curl` trong terminal và chụp output).

#### b) Amazon CloudFront Distribution

| Cấu hình | Giá trị |
|-----------|---------|
| Distribution domain | `https://[ĐIỀN_CLOUDFRONT_ID].cloudfront.net` |
| Origin domain | `[ĐIỀN_TÊN_BUCKET].s3.ap-southeast-1.amazonaws.com` |
| Origin Access | **Origin Access Control (OAC)** |
| Tên OAC | `[ĐIỀN_TÊN_OAC]` |
| Default root object | `index.html` |
| Viewer protocol policy | Redirect HTTP to HTTPS |
| Price class | Use only North America and Europe (hoặc All edge locations) |

📸 **[CHỤP HÌNH SE-3]:** Mở trình duyệt, truy cập URL CloudFront `https://[ĐIỀN_CLOUDFRONT_ID].cloudfront.net`. Chụp ảnh trang web hiển thị thành công với giao diện đăng nhập (HTTP status 200).

📸 **[CHỤP HÌNH SE-4]:** Vào CloudFront Console → chọn Distribution → tab **Origins** → chụp ảnh hiển thị rõ mục **"Origin access: Origin access control settings"** và tên OAC đã tạo.

---

## PHẦN 3: GIẢI THÍCH KHÁI NIỆM — CDN VÀ CƠ CHẾ OAC (~4% tổng điểm)

> **Lưu ý cho Người A:** Phần này giảng viên sẽ trực tiếp hỏi trong buổi bảo vệ. Bạn cần hiểu sâu và giải thích được bằng lời. Dưới đây là nội dung cần viết vào báo cáo.

### 3.1. CloudFront CDN là gì và hoạt động ra sao?

**CDN (Content Delivery Network)** là mạng lưới phân phối nội dung toàn cầu. Amazon CloudFront là dịch vụ CDN của AWS, sở hữu hơn 450 điểm biên (Edge Locations) trải khắp thế giới.

**Nguyên lý hoạt động cốt lõi — Cache HIT vs Cache MISS:**

Khi người dùng ở Việt Nam truy cập ứng dụng, thay vì phải gửi request tới S3 bucket đặt ở Singapore (cách xa hàng ngàn km), request sẽ được chuyển đến Edge Location gần nhất (ví dụ: Hồ Chí Minh hoặc Hà Nội):

- **Cache HIT (Trúng bộ nhớ đệm):** Edge Location đã lưu sẵn file `index.html` và `style.css` từ lần truy cập trước của một người dùng khác. Do đó, nó trả file về cho người dùng ngay lập tức mà không cần "đi lấy hàng" từ S3. Thời gian phản hồi cực nhanh (thường dưới 10ms).

- **Cache MISS (Trượt bộ nhớ đệm):** Đây là lần đầu tiên file này được yêu cầu tại Edge Location này (hoặc cache đã hết thời gian sống — TTL). CloudFront phải quay về S3 (gọi là "Origin") để lấy file gốc, sau đó lưu vào cache tại Edge cho các lần truy cập sau, rồi mới trả về cho người dùng. Lần đầu sẽ chậm hơn, nhưng tất cả các lần sau sẽ nhanh.

**Lợi ích cụ thể cho dự án:**
- **Giảm độ trễ:** Người dùng tải giao diện nhanh hơn nhiều so với truy cập trực tiếp S3.
- **Giảm tải cho S3:** S3 chỉ bị gọi khi cache MISS, tiết kiệm bandwidth và chi phí.
- **HTTPS tự động:** CloudFront cung cấp SSL certificate miễn phí, mọi kết nối đều được mã hóa.

### 3.2. OAC (Origin Access Control) là gì và tại sao cần thiết?

**Vấn đề:** Nếu S3 bucket để ở chế độ Private (tất cả 4 Block Public Access đều bật), thì không ai — kể cả CloudFront — có thể đọc được file từ bucket. Vậy làm sao CloudFront lấy file để phục vụ người dùng?

**Giải pháp:** **OAC (Origin Access Control)** là cơ chế ủy quyền của AWS cho phép CloudFront "chứng minh danh tính" với S3. Cơ chế hoạt động như sau:

1. Khi tạo OAC, AWS sẽ sinh ra một danh tính gắn với CloudFront Distribution của bạn.
2. Bạn cấu hình Bucket Policy của S3 để chỉ chấp nhận yêu cầu đọc (`s3:GetObject`) từ chính CloudFront Distribution đó (thông qua `AWS:SourceArn`).
3. Khi CloudFront cần lấy file từ S3, nó sẽ ký (sign) mọi request bằng SigV4 kèm theo danh tính OAC. S3 nhận request, kiểm tra chữ ký, đối chiếu với Bucket Policy, xác nhận đúng danh tính → cho phép đọc.
4. Bất kỳ ai khác (kẻ tấn công, bot, trình duyệt) cố truy cập trực tiếp URL S3 → bị từ chối ngay lập tức (403 Forbidden) vì không có chữ ký hợp lệ.

**Tại sao S3 phải Private?**
- Nếu S3 để Public, ai cũng có thể tải file trực tiếp từ S3 mà không cần đi qua CloudFront. Điều này vô hiệu hóa hoàn toàn mọi lớp bảo mật và theo dõi mà CloudFront cung cấp (VD: WAF, logging, geo restriction).
- Đề bài cấm rõ ràng: *"S3 bucket KHÔNG được cấu hình ở chế độ public"* (Mục IV.1.2). Vi phạm sẽ mất toàn bộ điểm SE-1 → SE-4.

`[NGƯỜI A CẦN LÀM: Vẽ một sơ đồ đơn giản minh họa luồng: User → CloudFront (Cache HIT/MISS) → OAC → S3 Private. Có thể dùng draw.io hoặc vẽ tay rồi chụp ảnh chèn vào đây]`

---

## PHẦN 4: BẢO MẬT TRUY CẬP WEB APP — AMAZON COGNITO

### 4.1. Cognito User Pool

Amazon Cognito User Pool là dịch vụ quản lý người dùng (User Directory) hoàn toàn được AWS quản lý (fully managed). Thay vì tự xây dựng hệ thống đăng ký/đăng nhập (phải tự lưu trữ mật khẩu, tự viết logic hash, tự cấu hình email xác nhận), nhóm sử dụng Cognito để xử lý toàn bộ:

| Thông tin cấu hình | Giá trị |
|---------------------|---------|
| Tên User Pool | `[ĐIỀN VÀO]` |
| Pool ID | `[ĐIỀN VÀO — ví dụ: ap-southeast-1_XPD5UXGns]` |
| Region | `ap-southeast-1` |
| Sign-in options | Email |
| MFA | Không bắt buộc (Optional) |
| Password policy | Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt |
| Email verification | Có — Cognito gửi mã OTP 6 số qua email khi đăng ký |

**App Client đã tạo:**

| Thông tin | Giá trị |
|-----------|---------|
| App Client Name | `[ĐIỀN VÀO]` |
| App Client ID | `[ĐIỀN VÀO — ví dụ: 29l4fmgm3t8paq1mat3l3tsvoj]` |
| Client Secret | Không tạo (phù hợp cho ứng dụng frontend JavaScript) |
| Auth Flows | `ALLOW_USER_SRP_AUTH`, `ALLOW_REFRESH_TOKEN_AUTH` |

📸 **[CHỤP HÌNH CO-1]:** Chụp giao diện **Cognito > User Pools** cho thấy rõ tên Pool và Pool ID.

### 4.2. Cách Frontend tích hợp Cognito

File `config.js` lưu trữ các thông số Cognito:
```javascript
const CONFIG = {
    API_URL: 'https://[API_ID].execute-api.ap-southeast-1.amazonaws.com/prod',
    COGNITO: {
        REGION: 'ap-southeast-1',
        USER_POOL_ID: '[POOL_ID]',
        APP_CLIENT_ID: '[CLIENT_ID]'
    }
};
```

File `auth.js` sử dụng thư viện `amazon-cognito-identity-js` để:
1. **Đăng ký:** Gọi `userPool.signUp(email, password, attributes, null, callback)` → Cognito tự động gửi email chứa mã OTP.
2. **Xác nhận OTP:** Gọi `cognitoUser.confirmRegistration(code, true, callback)` → Cognito đánh dấu tài khoản là "Confirmed".
3. **Đăng nhập:** Gọi `cognitoUser.authenticateUser(authDetails, callbacks)` → Cognito trả về bộ token JWT. Frontend chỉ lấy **ID Token** (chứa thông tin user: email, sub/userId) và lưu vào `localStorage`.
4. **Gọi API kèm Token:** File `api.js` gọi `getToken()` để lấy JWT từ `localStorage` rồi gắn vào header `Authorization` của mỗi request gửi đến API Gateway.

### 4.3. Bằng chứng bảo mật Cognito

📸 **[CHỤP HÌNH CO-3]:** Mở terminal (Command Prompt hoặc PowerShell) và chạy lệnh curl sau:
```bash
curl -X GET https://[API_URL]/tasks
```
Chụp ảnh kết quả trả về `{"message":"Unauthorized"}` với HTTP status **401**.

📸 **[CHỤP HÌNH CO-4]:** Chạy lệnh curl kèm JWT token hợp lệ:
```bash
curl -X GET https://[API_URL]/tasks -H "Authorization: [PASTE_JWT_TOKEN_Ở_ĐÂY]"
```
Chụp ảnh kết quả trả về danh sách công việc dạng JSON với HTTP status **200 OK**.

> **Cách lấy JWT Token để test:** Đăng nhập vào ứng dụng trên trình duyệt, mở Developer Tools (F12) → tab Application → Local Storage → tìm key `idToken` → copy giá trị.

---

## PHẦN 5: TẬP HỢP BẰNG CHỨNG CỦA NGƯỜI A

| ID | Mục bằng chứng | Trạng thái | Ghi chú |
|----|---------------|------------|---------|
| **SE-1** | S3 Block Public Access — 4 ô đều bật | `[ ]` Đã chụp | Chụp tab Permissions |
| **SE-2** | Truy cập trực tiếp S3 → 403 Forbidden | `[ ]` Đã chụp | Dùng trình duyệt hoặc curl |
| **SE-3** | Truy cập CloudFront → 200 OK + trang web hiện ra | `[ ]` Đã chụp | Ghi rõ URL CloudFront |
| **SE-4** | OAC gắn vào CloudFront distribution | `[ ]` Đã chụp | Chụp tab Origins |
| **CO-1** | Cognito User Pool đã tạo | `[ ]` Đã chụp | Ghi rõ Pool ID |
| **CO-3** | Gọi API không token → 401 Unauthorized | `[ ]` Đã chụp | Dùng curl hoặc Postman |
| **CO-4** | Gọi API kèm token → 200 OK + JSON data | `[ ]` Đã chụp | Dùng curl hoặc Postman |

---

> 💬 **Người A hoàn thành file này xong thì gửi cho trưởng nhóm để gộp vào báo cáo chung.**
