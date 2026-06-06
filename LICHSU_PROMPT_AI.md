# LỊCH SỬ SỬ DỤNG AI (GenAI Prompt History)

> **Môn:** CSC11006 — Nhập môn Điện toán đám mây
> **Đồ án:** PROJECT2 — Xây dựng Ứng dụng Web Serverless với Kiến trúc bảo mật & Tối ưu chi phí
> **Công cụ AI sử dụng:** Antigravity IDE (Gemini / Claude)
> **Link git hub:** https://github.com/nhaajtdajt/Cloud-Project-2
> **Thời gian sử dụng:** 25/05/2026 — 06/06/2026

---

## Mục lục
Chú thích: Prompt 1 -> 7 là của người C (Nhật Đạt). Prompt 8 là của người A (Bình Dương).

1. [Prompt #1: Đọc và phân tích đề bài](#prompt-1)
2. [Prompt #2: Phân công công việc cho 3 người](#prompt-2)
3. [Prompt #3: Viết toàn bộ source code Frontend + Backend](#prompt-3)
4. [Prompt #4: Hướng dẫn cấu hình AWS Budget](#prompt-4)
5. [Prompt #5: Viết 3 file báo cáo chi tiết (Người A, B, C)](#prompt-5)
6. [Prompt #6: Vẽ sơ đồ so sánh NAT Gateway vs VPC Gateway Endpoint](#prompt-6)
7. [Prompt #7: Vẽ sơ đồ kiến trúc tổng thể hệ thống](#prompt-7)
8. [Prompt #8: Giải thích cách tắt Client Secret trong Cognito](#prompt-8)

---

<a id="prompt-1"></a>
## Prompt #1 — Đọc và phân tích đề bài đồ án

| Mục | Nội dung |
|-----|---------|
| **Ngày** | 25/05/2026 |
| **Model** | Claude Opus |

### Câu Prompt:

> *"bạn đọc thật kĩ file đồ án 2 @de.md này của tôi đi đọc thật kĩ để hiểu và tôi sẽ đưa ra yêu cầu cho bạn làm"*
>
> *(Sau đó tiếp tục yêu cầu:)* *"đọc kĩ lại 1 lần để không sót bất cứ 1 chức năng hay ý nào đi"*

### Kết quả AI cho ra:

AI đã đọc toàn bộ 1296 dòng file `de.md` (2 lần), sau đó tổng hợp lại thành bảng phân tích chi tiết gồm:

- **7 thành phần chính** của hệ thống: Frontend, Backend (4 Lambda), Networking (VPC + Private Subnet + Gateway Endpoint), Database (DynamoDB + GSI), Bảo mật (IAM Least Privilege + Cognito), Giám sát (CloudWatch + SNS), Chi phí (Budget $0.01).
- **16 mục bằng chứng** cần nộp: SE-1→SE-4, CO-1→CO-4, NE-1→NE-5, IM-1→IM-3.
- **Rubric chấm điểm**: Chức năng 20%, Triển khai 25%, Hiểu biết Kiến trúc 20%, Giám sát 10%, Chi phí 15%, Tài liệu 10%.
- **8 điểm cấm** sẽ bị 0 điểm nếu vi phạm (VD: dùng NAT Gateway, S3 public, CORS wildcard `*`...).

### Đánh giá:

`AI đã làm tốt phần này`

---

<a id="prompt-2"></a>
## Prompt #2 — Phân công công việc cho 3 thành viên

| Mục | Nội dung |
|-----|---------|
| **Ngày** | 25/05/2026 |
| **Model** | Claude Opus |

### Câu Prompt:

> *"giờ tôi sẽ làm đồ án này với 3 người bạn hãy suy nghĩ thật kĩ để tạo công việc ra cho 3 người và chỉ rõ ra từng bước từng bước 1 cách chi tiết để hoàn thành đồ án này rõ nhất có thể nhé"*

### Kết quả AI cho ra:

AI tạo ra file `implementation_plan.md` — bản kế hoạch phân công **cực kỳ chi tiết** gồm **31+ bước**, chia cho 3 người theo 3 tuần:

Gồm 3 file chi tiết là:

CONGVIEC_NGUOI_A.md 
CONGVIEC_NGUOI_B.md
CONGVIEC_NGUOI_C.md
(các file có trong link github được dẫn ở trên)

| Vai trò | Phụ trách | Số bước |
|---------|-----------|---------|
| **Người A — Frontend Developer** | Giao diện web (HTML/CSS/JS), tích hợp Cognito UI, gọi API, filter | 15 bước |
| **Người B — Backend Developer** | 4 Lambda functions, DynamoDB, API Gateway, test | 13 bước |
| **Người C — Infra & DevOps** | VPC, Networking, IAM, S3+CloudFront+OAC, Monitoring, Budget, bằng chứng | 31 bước |

Ngoài ra còn bao gồm:
- **Sơ đồ thứ tự triển khai** (dependency giữa các bước).
- **Bảng phối hợp** (ai gửi thông tin gì cho ai, khi nào).
- **8 điểm "0 điểm"** cần tránh tuyệt đối.
- **Checklist 16 mục bằng chứng** cần chụp ảnh.

### Đánh giá:

`Tốt`

---

<a id="prompt-3"></a>
## Prompt #3 — Viết toàn bộ source code Frontend + Backend

| Mục | Nội dung |
|-----|---------|
| **Ngày** | 25/05/2026 |
| **Model** | Claude Opus + Gemini Pro |

### Câu Prompt:

> *(Sau khi duyệt implementation plan, AI tự động bắt đầu viết code theo kế hoạch đã được phê duyệt)*

### Kết quả AI cho ra:

AI đã tạo toàn bộ cấu trúc dự án và viết code cho **11 files**:

( Link file code nằm trong github với 2 folder FE và BE)
**Frontend (6 files):**

| File | Chức năng | Dòng code (ước tính) |
|------|-----------|---------------------|
| `frontend/js/config.js` | Cấu hình API URL, Cognito (Pool ID, Client ID, Region) | ~15 dòng |
| `frontend/js/auth.js` | Xác thực Cognito: signUp, confirmOTP, signIn, signOut, getToken, requireAuth | ~130 dòng |
| `frontend/js/api.js` | Gọi API CRUD: getTasks, createTask, updateTask, deleteTask — kèm JWT token | ~90 dòng |
| `frontend/js/app.js` | Logic chính: render task list, filter theo priority/date, thống kê, CRUD handlers | ~300 dòng |
| `frontend/js/utils.js` | Tiện ích: format date, priority label, toast notification, loading overlay, debounce | ~140 dòng |
| `frontend/css/style.css` | CSS dark mode, responsive, glassmorphism, animations, toàn bộ component styles | ~600 dòng |

Cùng 3 trang HTML: `login.html`, `signup.html`, `index.html`.

**Backend (4 Lambda functions):**

| File | HTTP Method | DynamoDB Action | Đặc điểm |
|------|-------------|-----------------|-----------|
| `backend/getTasksFunction/index.mjs` | GET /tasks | `Query` (GSI userId-index) | Trả về danh sách task của user đang đăng nhập |
| `backend/createTaskFunction/index.mjs` | POST /tasks | `PutItem` | Tự sinh UUID taskId + createdAt, validate title bắt buộc |
| `backend/updateTaskFunction/index.mjs` | PUT /tasks/{id} | `UpdateItem` | Kiểm tra userId khớp (chống sửa task người khác) |
| `backend/deleteTaskFunction/index.mjs` | DELETE /tasks/{id} | `DeleteItem` | Kiểm tra userId khớp (chống xóa task người khác) |

Tất cả 4 Lambda đều có: CORS headers, xử lý OPTIONS preflight, error handling, CloudWatch logging.

### Đánh giá:

`Tốt`

---

<a id="prompt-4"></a>
## Prompt #4 — Hướng dẫn cấu hình AWS Budget đúng yêu cầu đề

| Mục | Nội dung |
|-----|---------|
| **Ngày** | 03/06/2026 |
| **Model** | Gemini Pro |

### Câu Prompt:

> *"tôi đang làm tới đây có đúng không và làm gì nữa"*
>
> *(Kèm ảnh chụp màn hình đang ở trang tạo AWS Budget, user đang chọn template "Zero spend budget")*

### Kết quả AI cho ra:

AI nhận ra ngay lỗi sai nghiêm trọng: **template "Zero spend budget" chỉ cảnh báo 1 mức (100%)**, trong khi đề bài yêu cầu **2 mức (80% + 100%)**. Nếu dùng template này, sẽ bị trừ điểm.

AI hướng dẫn cách làm đúng:
1. Chọn **"Customize (advanced)"** thay vì template.
2. Chọn **Cost budget** → Budget name: `TaskManager-Budget` → Amount: `$0.01`.
3. **Alert 1:** 80% of budgeted amount → Email.
4. Bấm **Add alert threshold** để thêm Alert 2.
5. **Alert 2:** 100% of budgeted amount → Email.
6. Bỏ qua phần Actions → Create budget.

**Ý nghĩa:** Nếu không có AI phát hiện lỗi này, sẽ bị mất điểm phần Cost Efficiency (15% tổng điểm).

### Đánh giá:

`AI đã hướng dẫn đúng phần này`

---

<a id="prompt-5"></a>
## Prompt #5 — Viết 3 file báo cáo chi tiết cho 3 thành viên

| Mục | Nội dung |
|-----|---------|
| **Ngày** | 03/06/2026 |
| **Model** | Claude Opus |

### Câu Prompt:

> *"giờ tôi giao cho việc vô cùng quan trọng là đọc lại đề hệ thống lại công việc của mỗi người và sinh ra 1 ra 3 file báo cáo đầy đủ nhất và những chỗ cần người làm công việc đó chụp ảnh hay bổ sung gì vào thì chú thích trong đó để người biết và hoàn thành sau khi xong thì tôi sẽ gộp 3 cái đó lại thành báo cáo chuẩn để nộp bài.*
> *BẠN HÃY ĐỌC BÁO CÁO THẬT KĨ VÀ VIẾT THẬT CHI TIẾT ( TÔI THẤY BẠN VIẾT THƯỜNG RẤT SƠ SÀI PHẢI GIẢI THÍCH SƠ QUA CHỨC NĂNG HAY KHÁI NIỆM GÌ ĐÓ CẦN THIẾT KHI ĐỤNG ĐẾN VẤN ĐỀ GÌ ĐỂ LÀM RÕ RA ). Bạn hãy để viết báo nội dung quan trọng và hướng dẫn người dùng điền vào chỗ đó nếu gặp vấn đề như vẽ biểu đồ thị hay cái gì đó cần người làm suy nghĩ hướng cao để làm thì để đó để người đó làm cho kĩ hơn nhé. SUY NGHĨ THẬT SÂU VÀ LÀM ĐI"*

### Kết quả AI cho ra:

AI đọc lại toàn bộ đề bài (`de.md`), phân tích toàn bộ 11 file source code, và tạo ra **3 file báo cáo riêng biệt**:

(file nằm trong link github được dẫn ở trên)

| File | Phụ trách | Nội dung chính | Độ dài |
|------|-----------|---------------|--------|
| `BAOCAO_NGUOI_A.md` | Frontend & CDN | S3 Private Bucket, CloudFront + OAC, Cognito UI, bảo mật frontend, giải thích CDN & OAC | ~298 dòng |
| `BAOCAO_NGUOI_B.md` | Backend & API | 4 Lambda functions, DynamoDB + GSI, API Gateway + Cognito Authorizer, giải thích luồng Request & Auto-Scaling | ~350 dòng |
| `BAOCAO_NGUOI_C.md` | Infra & Security | VPC + Private Subnet, VPC Gateway Endpoint, 4 IAM Roles (Least Privilege), Monitoring (Dashboard + Alarms + SNS), Chi phí ($0) | ~390 dòng |

Đặc điểm của các báo cáo:
- **Giải thích sâu từng khái niệm:** Không chỉ liệt kê "dùng OAC" mà giải thích OAC là gì, tại sao cần dùng, cơ chế ký SigV4 hoạt động ra sao.
- **Phân tích code thực tế:** Trích dẫn code Lambda, giải thích từng dòng quan trọng (VD: tại sao dùng `ConditionExpression` để chống sửa/xóa task người khác).
- **Hướng dẫn chụp ảnh chi tiết:** Mỗi chỗ cần chụp đều có ký hiệu `📸 [CHỤP HÌNH XX-Y]` kèm hướng dẫn cụ thể vào đâu, chụp cái gì, và hình phải cho thấy nội dung gì.
- **Chỗ cần người làm bổ sung:** Đánh dấu rõ `[NGƯỜI X CẦN LÀM: ...]` cho các phần cần vẽ sơ đồ hoặc suy nghĩ sâu.

### Đánh giá:

`Báo cáo rất rõ ràng`

---



<a id="prompt-6"></a>
## Prompt #6 — Vẽ sơ đồ so sánh NAT Gateway vs VPC Gateway Endpoint

| Mục | Nội dung |
|-----|---------|
| **Ngày** | 06/06/2026 |
| **Model** | Claude Sonnet |

### Câu Prompt:

> *"[NGƯỜI C CẦN LÀM: Vẽ sơ đồ so sánh trực quan 2 giải pháp (NAT Gateway vs VPC Gateway Endpoint)...] cho tôi code vẽ bằng mermaid để vẽ cái này đi vẽ chi tiết cho tôi nhé"*

### Kết quả AI cho ra:

AI sinh ra code Mermaid `flowchart TB` hoàn chỉnh gồm 2 luồng song song:

- **Khung đỏ (Giải pháp 1 — BỊ CẤM):** Lambda → NAT Gateway ($0.045/giờ) → Internet Gateway → Internet công cộng (rủi ro nghe lén) → DynamoDB.
- **Khung xanh (Giải pháp 2 — ĐANG SỬ DỤNG):** Lambda → Route Table (Prefix List pl-67a5400e) → VPC Gateway Endpoint (vpce-09191a57260c8d54d, $0) → AWS Private Backbone → DynamoDB.

Sơ đồ có:
- Mã màu trực quan: Đỏ = nguy hiểm, Xanh = an toàn.
- Ghi chú chi phí: $0.045/giờ vs $0.
- Đánh số thứ tự 1→4 cho mỗi luồng.
- Style CSS cho từng node và subgraph.

### Đánh giá:

`Tốt`

---

<a id="prompt-7"></a>
## Prompt #7 — Vẽ sơ đồ kiến trúc tổng thể hệ thống

| Mục | Nội dung |
|-----|---------|
| **Ngày** | 06/06/2026 |
| **Model** | Claude Sonnet |

### Câu Prompt:

> *"PHẦN 4: SƠ ĐỒ KIẾN TRÚC TỔNG THỂ [...] Giờ vẽ cho tôi phần này nhé thật chi tiết vào vì đây là phần quan trọng cho tôi code ở dạng mermaid và không để icon vào"*

### Kết quả AI cho ra:

AI sinh ra code Mermaid `flowchart TB` đầy đủ **tất cả 9 tầng** của kiến trúc theo bảng yêu cầu:

| Tầng | Thành phần trong sơ đồ |
|------|----------------------|
| Edge (Biên) | Người dùng → CloudFront (OAC, HTTPS) → S3 Private Bucket |
| API | API Gateway (REST API, stage: prod, Throttling Rate 100/Burst 50) |
| Auth (Xác thực) | Cognito User Pool (Pool ID thực, OTP) → Cognito Authorizer (JWT) |
| Compute (VPC) | Custom VPC (10.0.0.0/16) → 2 Private Subnets (AZ-1a, AZ-1b) → 4 Lambda riêng biệt |
| Network | VPC Gateway Endpoint (vpce-09191a57260c8d54d) → AWS Private Backbone |
| Database | DynamoDB (TasksTable, GSI userId-index, On-Demand) |
| IAM | 4 IAM Roles riêng biệt (Query, PutItem, UpdateItem, DeleteItem) |
| Giám sát | CloudWatch Dashboard (6 widgets) + 2 Alarms → SNS → Email |
| Chi phí | AWS Budgets ($0.01, 80% + 100% alerts) |

Sơ đồ có:
- **Mã màu theo tầng**: Tím (Auth/API), Vàng (CDN/S3), Xanh lá (VPC/Lambda), Xanh dương (DynamoDB), Hồng (IAM), Cam (Monitoring), Xám (Budget).
- **Mũi tên có nhãn**: Ghi rõ HTTP method, JWT token, policy name, v.v.
- **Đường nét đứt**: Phân biệt IAM Execution Roles với data flow.
- **Thông tin thực tế**: Dùng ID thực (vpce-09191..., pl-67a5400e...) thay vì placeholder.

### Đánh giá:

`Đã kiểm tra và thấy hợp lí với cách triển khai của nhóm`

---

<a id="prompt-8"></a>
## Prompt #8 — Giải thích cách tắt Client Secret trong Cognito.

| Mục | Nội dung |
|-----|---------|
| **Ngày** | 28/05/2026 |
| **Model** | Gemini 3.1 Pro (low) |

### Câu Prompt:

> *trong CONGVIEC_NGUOI_A.md ở dòng 69 (Line 69) có nhắc tới lúc tạo Cognito User Pool, đề cập đến "Không tạo client secret" nhưng sau khi tôi tạo xong "App client: TaskManager-WebClient "
thì tôi nhận thấy mục "Client secret" (được hiển thị dạng '***' có thể hiện ra được ở mục "App client information". Vậy tôi có đang vi phạm quy tắc "Không tạo client secret" không ? Nếu có thì làm sao để tắt mục đó - vì khi tôi tìm trong phần config của App client thì không có bất kỳ nơi nào để tắt client secret.*

### Kết quả AI cho ra:
```markdonw
Viewed Project-member-milestones.md:30-54

Chào bạn, bạn đang rất cẩn thận và việc bạn thắc mắc điều này là hoàn toàn chính xác! 

Nếu bạn thấy mục **"Client secret"** hiện ra (dù là đang bị che bằng các dấu `***`), điều đó có nghĩa là **bạn đã vô tình tạo ra App Client có kèm theo Client secret**, và điều này **đang vi phạm quy tắc** dành cho ứng dụng Frontend (Single Page Application / Public Client).

### Tại sao ứng dụng Frontend lại "KHÔNG được có Client Secret"?
App Client của chúng ta đang dùng cho code Frontend (HTML/JS) chạy trực tiếp trên trình duyệt của người dùng. Nếu bạn có Client Secret, bạn sẽ phải nhúng đoạn mã secret đó vào file `config.js` để có thể gọi được API của Cognito. 
Bởi vì file `.js` tải trực tiếp xuống trình duyệt, bất kỳ ai nhấn F12 cũng có thể xem được mã secret này của bạn $\rightarrow$ Mất hoàn toàn tính bảo mật. (Client Secret chỉ dành cho các ứng dụng chạy trên Backend/Server kín).

---

### Cách khắc phục (Làm sao để tắt?)

Đáng tiếc là cấu trúc của AWS Cognito hiện tại **KHÔNG CHO PHÉP tắt hoặc xóa Client Secret** một khi App Client đó đã được tạo ra. 

**Cách duy nhất để khắc phục là Xóa App Client cũ và Tạo lại một App Client mới.** Bạn không cần phải xóa cả User Pool, chỉ cần làm các bước sau trong User Pool hiện tại:

#### Bước 1: Xóa App Client bị lỗi
1. Vào **Cognito** $\rightarrow$ Chọn **User Pool** của bạn (`TaskManager-UserPool`).
2. Chuyển sang tab **App integration**.
3. Cuộn xuống phần **App clients and analytics**, nhấn vào tên của app client cũ (`TaskManager-WebClient`).
4. Nhấn nút **Delete** ở góc trên bên phải để xóa nó đi.

#### Bước 2: Tạo lại App Client ĐÚNG cách (Không có secret)
1. Quay lại tab **App integration**, ở phần **App clients and analytics** $\rightarrow$ nhấn **Create app client**.
2. Ở mục **App type**, bắt buộc chọn **Public client** (hoặc *Single-page application* tuỳ giao diện AWS hiện tại).
3. App client name: Đặt lại tên `TaskManager-WebClient`.
4. **Vị trí quan trọng nhất:** Kéo xuống phần **Client secret**. Bạn phải chọn tuỳ chọn **"Don't generate a client secret"** (Không tạo bí mật máy khách).
5. Kéo xuống mục **Auth Flows**: Đảm bảo bật `ALLOW_USER_SRP_AUTH` và `ALLOW_REFRESH_TOKEN_AUTH`.
6. Nhấn **Create app client**.

#### Bước 3: Cập nhật lại config
Sau khi tạo xong, bạn sẽ có một **Client ID** hoàn toàn mới. Mục Client secret lúc này sẽ hiển thị là *"No client secret"*.
Hãy copy cái Client ID mới này và dán lại vào file `config.js` của bạn nhé.

Chúc bạn thiết lập thành công! Việc phát hiện ra lỗi này sớm ở Tuần 1 chứng tỏ bạn đang review cấu trúc rất kỹ càng đấy.
```

### Đánh giá:

`Kết quả, hướng dẫn được trả ra khắc phục vấn đề tắt Client Secret ở  Cognito. Cũng như giải thích tốt tại sao Frontend không được có Client Secret nhằm đảm bảo tính bảo mật.`


---
## Tổng kết sử dụng AI

| Hạng mục | Thống kê |
|----------|---------|
| **Tổng số prompt quan trọng** | 8 |
| **Mục đích sử dụng chính** | Phân tích đề bài, phân công công việc, viết code, viết báo cáo, vẽ sơ đồ kiến trúc, giải thích khái niệm kỹ thuật |
| **Các model AI đã dùng** | Claude Opus 4.6, Claude Sonnet 4.6, Gemini 3.1 Pro |
| **Số file code AI tạo** | 11 files (6 frontend + 4 backend Lambda + 1 CSS) |
| **Số file báo cáo AI tạo** | 4 files (3 báo cáo thành viên + 1 implementation plan) |
| **Các sơ đồ AI tạo** | 2 sơ đồ Mermaid (kiến trúc tổng thể + so sánh NAT vs VPC Endpoint) |
