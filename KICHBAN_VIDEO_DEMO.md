# 🎬 KỊCH BẢN VIDEO DEMO — Đồ án 2: Task Manager Serverless

> **Thời lượng ước tính:** 12–15 phút  
> **Công cụ quay:** OBS Studio / ShareX / bất kỳ phần mềm quay màn hình nào  
> **Lưu ý:** Nói rõ ràng, chậm rãi. Khi chuyển sang phần mới, nói tên phần trước khi thao tác.  
> **Chuẩn bị trước khi quay:** Đăng nhập sẵn AWS Console, mở sẵn URL CloudFront trong trình duyệt, chuẩn bị sẵn 2 tài khoản user (user1 và user2) đã đăng ký trong Cognito.

---

## PHẦN 0 — Mở đầu (~30 giây)

**Lời nói:**
> "Xin chào cô, em là [Tên], nhóm [Số nhóm], môn CSC11006 — Nhập môn Điện toán đám mây. Sau đây là video demo đồ án 2: Xây dựng Ứng dụng Web Serverless Quản lý Công việc (Task Manager) trên AWS với kiến trúc bảo mật và tối ưu chi phí. Nhóm gồm 3 thành viên: Nguyễn Văn Bình Dương (Frontend), Ngô Gia An (Backend), Trương Nhật Đạt (Infra & Security)."

**Thao tác:** Không cần thao tác gì, chỉ cần quay mặt hoặc màn hình chính.

---

## PHẦN 1 — Demo chức năng ứng dụng CRUD (~3 phút)

> **Mục đích:** Chứng minh 4 thao tác CRUD hoạt động, bộ lọc, responsive — tương ứng **20% điểm Chức năng**.

### 1.1 Đăng ký tài khoản mới (Sign Up)
**Lời nói:**
> "Đầu tiên em sẽ demo chức năng đăng ký người dùng thông qua Amazon Cognito."

**Thao tác:**
1. Mở trình duyệt → Truy cập URL CloudFront: `https://<id>.cloudfront.net/signup.html`
2. Nhập email mới, mật khẩu → Bấm **Đăng ký**
3. Nhập mã OTP nhận từ email → Bấm **Xác nhận**
4. Nói: *"Hệ thống sử dụng Cognito User Pool để quản lý đăng ký và gửi mã OTP xác thực qua email."*

### 1.2 Đăng nhập (Login)
**Lời nói:**
> "Sau khi xác thực OTP thành công, em đăng nhập vào hệ thống."

**Thao tác:**
1. Truy cập `login.html` → Nhập email + mật khẩu → Bấm **Đăng nhập**
2. Hệ thống chuyển sang trang chính `index.html` với danh sách công việc
3. Nói: *"Sau khi đăng nhập, frontend nhận JWT token từ Cognito và gửi kèm trong mọi request tới API Gateway."*

### 1.3 Tạo công việc mới (CREATE)
**Lời nói:**
> "Em tạo một công việc mới để demo chức năng POST /tasks."

**Thao tác:**
1. Bấm nút **Tạo công việc mới**
2. Điền tiêu đề: `Nộp báo cáo đồ án 2`
3. Điền mô tả: `Hoàn thiện và nộp báo cáo lên Moodle`
4. Chọn Priority: `High`
5. Chọn Due Date: Ngày mai (hoặc ngày cụ thể)
6. Bấm **Lưu**
7. Nói: *"Công việc đã được tạo thành công. Lambda CreateTaskFunction tự sinh UUID cho taskId và ghi vào DynamoDB."*

### 1.4 Xem danh sách (READ)
**Lời nói:**
> "Danh sách công việc được lấy từ DynamoDB thông qua Lambda GetTasksFunction với API GET /tasks. Chỉ hiển thị công việc của user đang đăng nhập nhờ GSI userId-index."

**Thao tác:**
1. Cuộn qua danh sách → Chỉ ra có nhiều task hiển thị
2. **Demo bộ lọc:** Chọn lọc theo Priority = `High` → Chỉ hiển thị các task ưu tiên cao
3. Chọn lọc theo ngày hết hạn → Chỉ hiển thị task trong khoảng thời gian
4. Nói: *"Bộ lọc theo mức độ ưu tiên và ngày hết hạn hoạt động chính xác như yêu cầu đề bài."*

### 1.5 Cập nhật công việc (UPDATE)
**Lời nói:**
> "Em cập nhật trạng thái của công việc vừa tạo."

**Thao tác:**
1. Bấm nút **Sửa** trên task vừa tạo
2. Đổi status từ `pending` → `done`
3. Đổi priority từ `High` → `Medium`
4. Bấm **Cập nhật**
5. Nói: *"Lambda UpdateTaskFunction kiểm tra userId khớp trước khi cho phép sửa — chống sửa task người khác."*

### 1.6 Xóa công việc (DELETE)
**Lời nói:**
> "Cuối cùng em xóa một công việc."

**Thao tác:**
1. Bấm nút **Xóa** trên một task
2. Xác nhận xóa
3. Task biến mất khỏi danh sách
4. Nói: *"Lambda DeleteTaskFunction cũng kiểm tra userId trước khi xóa, đảm bảo nguyên tắc bảo mật."*

### 1.7 Demo đa người dùng (2 users)
**Lời nói:**
> "Đề bài yêu cầu DynamoDB phải có ít nhất 2 users. Em đăng nhập user thứ 2 để chứng minh dữ liệu cô lập."

**Thao tác:**
1. Bấm **Đăng xuất**
2. Đăng nhập bằng tài khoản user thứ 2
3. Hiển thị danh sách task khác (hoặc trống) → Chứng minh mỗi user chỉ thấy task của mình
4. Nói: *"Như cô thấy, user 2 không nhìn thấy task của user 1. Dữ liệu được cô lập hoàn toàn nhờ GSI userId-index trên DynamoDB."*

---

## PHẦN 2 — Bảo mật Frontend: S3 Private + CloudFront OAC (~2 phút)

> **Mục đích:** Chứng minh các bằng chứng **SE-1 → SE-4** — tương ứng phần **Triển khai Đám mây (25%)**.

### 2.1 S3 Block Public Access (SE-1)
**Lời nói:**
> "Em chuyển sang AWS Console để chứng minh S3 Bucket hoàn toàn Private."

**Thao tác:**
1. Mở AWS Console → S3 → Chọn bucket `taskmanager-frontend-xxx`
2. Vào tab **Permissions**
3. Chỉ rõ 4 checkbox Block Public Access đều **BẬT** (tích xanh)
4. Nói: *"Cả 4 tùy chọn Block Public Access đều được bật, S3 bucket hoàn toàn Private — đáp ứng yêu cầu SE-1."*

### 2.2 Truy cập trực tiếp S3 bị chặn (SE-2)
**Lời nói:**
> "Em thử truy cập trực tiếp URL S3 để chứng minh bị từ chối."

**Thao tác:**
1. Mở tab trình duyệt mới
2. Dán URL trực tiếp S3: `https://<bucket>.s3.ap-southeast-1.amazonaws.com/index.html`
3. Kết quả hiển thị **403 Forbidden / AccessDenied**
4. Nói: *"Truy cập trực tiếp S3 bị từ chối 403 — đáp ứng SE-2. Người dùng không thể bypass CloudFront."*

### 2.3 Truy cập qua CloudFront thành công (SE-3)
**Lời nói:**
> "Nhưng khi truy cập qua CloudFront thì hoạt động bình thường."

**Thao tác:**
1. Mở URL CloudFront: `https://<id>.cloudfront.net`
2. Trang web hiển thị bình thường → Bấm F12, xem tab Network → Status **200 OK**
3. Nói: *"CloudFront phục vụ nội dung thành công với HTTP 200 — đáp ứng SE-3."*

### 2.4 OAC gắn vào CloudFront (SE-4)
**Lời nói:**
> "Em mở CloudFront Console để chứng minh OAC đã được cấu hình."

**Thao tác:**
1. AWS Console → CloudFront → Chọn distribution
2. Vào tab **Origins** → Chỉ rõ mục **Origin access: Origin access control settings** và tên OAC
3. Nói: *"Origin Access Control đã được gắn, chỉ CloudFront mới có quyền đọc S3 qua SigV4 — đáp ứng SE-4."*

---

## PHẦN 3 — Bảo mật Backend: Cognito + API Gateway (~2 phút)

> **Mục đích:** Chứng minh các bằng chứng **CO-1 → CO-4**.

### 3.1 Cognito User Pool (CO-1)
**Thao tác:**
1. AWS Console → Cognito → User Pools
2. Chỉ rõ pool `TaskManager-UserPool`, Pool ID hiển thị rõ
3. Nói: *"Cognito User Pool đã tạo thành công — CO-1."*

### 3.2 API Gateway Cognito Authorizer (CO-2)
**Thao tác:**
1. AWS Console → API Gateway → Chọn REST API → Authorizers
2. Chỉ rõ Cognito Authorizer đã liên kết với User Pool
3. Nói: *"Cognito Authorizer đã được tích hợp vào API Gateway, mọi request phải có JWT token — CO-2."*

### 3.3 Gọi API không token → 401 (CO-3)
**Lời nói:**
> "Em dùng curl để gọi API mà không gửi token."

**Thao tác:**
1. Mở terminal/PowerShell
2. Chạy: `curl -X GET https://<api-id>.execute-api.ap-southeast-1.amazonaws.com/prod/tasks`
3. Kết quả trả về **401 Unauthorized**
4. Nói: *"Không có token, API Gateway trả 401 — đáp ứng CO-3."*

### 3.4 Gọi API có token → 200 (CO-4)
**Thao tác:**
1. Chạy: `curl -X GET https://<api-id>.execute-api.ap-southeast-1.amazonaws.com/prod/tasks -H "Authorization: <JWT_TOKEN>"`
2. Kết quả trả về **200 OK** kèm dữ liệu JSON
3. Nói: *"Gửi kèm JWT token hợp lệ, API trả 200 kèm danh sách task — đáp ứng CO-4."*

---

## PHẦN 4 — Networking: VPC + Gateway Endpoint (~2 phút)

> **Mục đích:** Chứng minh **NE-1 → NE-5** — tương ứng **Hiểu biết Kiến trúc (20%)** và **Chi phí (15%)**.

### 4.1 VPC Endpoint cho DynamoDB (NE-1)
**Thao tác:**
1. AWS Console → VPC → Endpoints
2. Chỉ rõ endpoint có Service Name: `com.amazonaws.ap-southeast-1.dynamodb`, Status: **Available**
3. Nói: *"VPC Gateway Endpoint cho DynamoDB đã tạo và đang Available — NE-1. Toàn bộ traffic từ Lambda tới DynamoDB đi trên mạng backbone riêng của AWS, chi phí $0."*

### 4.2 Lambda có VpcConfig (NE-2)
**Thao tác:**
1. AWS Console → Lambda → Chọn `GetTasksFunction`
2. Vào tab **Configuration → VPC**
3. Chỉ rõ 2 Private Subnets (AZ-1a, AZ-1b) và Security Group đã gắn
4. Nói: *"Lambda được đặt trong Custom VPC với 2 Private Subnets trên 2 AZ khác nhau để đảm bảo High Availability — NE-2."*

### 4.3 Route Table có Endpoint route (NE-3)
**Thao tác:**
1. AWS Console → VPC → Route Tables → Chọn route table của Private Subnet
2. Chỉ rõ dòng: Destination = `pl-xxxxxx` (DynamoDB Prefix List), Target = `vpce-xxxxxxxx`
3. Nói: *"Route Table có dòng ánh xạ Prefix List tới VPC Endpoint, traffic DynamoDB đi qua backbone riêng — NE-3."*

### 4.4 Không có NAT Gateway (NE-4)
**Thao tác:**
1. AWS Console → VPC → NAT Gateways
2. Danh sách trống hoặc tất cả là **Deleted**
3. Nói: *"Không có NAT Gateway nào tồn tại. Tiết kiệm được ~$32/tháng so với giải pháp sai — NE-4."*

### 4.5 CloudWatch logs chứng minh Lambda gọi DynamoDB thành công (NE-5)
**Thao tác:**
1. AWS Console → CloudWatch → Log Groups → `/aws/lambda/GetTasksFunction`
2. Mở log stream mới nhất
3. Chỉ rõ dòng `REPORT` với **StatusCode 200**, Duration, Billed Duration, Memory Used
4. Nói: *"Log CloudWatch xác nhận Lambda gọi DynamoDB thành công với StatusCode 200, không có lỗi mạng — NE-5."*

---

## PHẦN 5 — IAM Least Privilege (~1.5 phút)

> **Mục đích:** Chứng minh **IM-1 → IM-3**.

### 5.1 Hiển thị 4 IAM Roles riêng biệt (IM-1)
**Thao tác:**
1. AWS Console → IAM → Roles → Filter theo tên dự án `TaskManager`
2. Chỉ rõ có **4 role riêng biệt** (GetTasks, CreateTask, UpdateTask, DeleteTask)
3. Nói: *"Mỗi Lambda có IAM Role riêng, không dùng chung — đáp ứng Least Privilege IM-1."*

### 5.2 Policy JSON với ARN cụ thể (IM-2)
**Thao tác:**
1. Bấm vào một Role (VD: `GetTasksFunction-Role`)
2. Mở Inline Policy → Xem JSON
3. Chỉ rõ trường `Resource` chứa **ARN cụ thể** của bảng DynamoDB (không có dấu `*`)
4. Nói: *"Resource chỉ định chính xác ARN bảng TasksTable, không dùng wildcard — IM-2."*

### 5.3 Lambda gắn đúng Role (IM-3)
**Thao tác:**
1. Quay lại Lambda Console → Tab **Configuration → Permissions**
2. Chỉ rõ Role name khớp với Role vừa xem
3. Nói: *"Lambda GetTasksFunction được gắn đúng Role GetTasks — IM-3."*
4. (Có thể lướt nhanh qua 3 Lambda còn lại để chứng minh tương tự)

---

## PHẦN 6 — Giám sát: CloudWatch Dashboard + Alarms + Budget (~2 phút)

> **Mục đích:** Chứng minh phần **Giám sát (10%)** và **Chi phí (15%)**.

### 6.1 CloudWatch Dashboard (5+ widgets)
**Thao tác:**
1. AWS Console → CloudWatch → Dashboards → `TaskManager-Dashboard`
2. Chỉ từng widget và giải thích:
   - **Invocations:** Số lần Lambda được gọi
   - **Duration (P50, P99):** Thời gian xử lý trung bình và cao nhất
   - **Errors:** Số lỗi Lambda
   - **Throttles:** Số request bị từ chối
   - **API Latency:** Thời gian phản hồi toàn trình
   - **4xx/5xx:** Tỷ lệ lỗi API Gateway
3. Nói: *"Dashboard có 6 widgets hiển thị dữ liệu thực tế từ quá trình demo vừa rồi."*

### 6.2 CloudWatch Alarms (2 alarms)
**Thao tác:**
1. AWS Console → CloudWatch → Alarms
2. Chỉ rõ 2 alarms:
   - **Lambda-Error-Alarm:** Errors > 10 trong 5 phút
   - **API-5xx-Alarm:** 5XXError > 5 trong 5 phút
3. Chỉ rõ cả 2 đều liên kết với SNS topic → gửi email cảnh báo
4. Nói: *"Cả 2 Alarms đều đang ở trạng thái OK/Insufficient data và đã kết nối SNS gửi email."*

### 6.3 AWS Budget ($0.01)
**Thao tác:**
1. AWS Console → Billing → Budgets
2. Chỉ rõ budget `TaskManager-Budget` với Amount: **$0.01**
3. Chỉ rõ **2 mốc cảnh báo**: 80% ($0.008) và 100% ($0.01) → Email
4. Nói: *"Budget được cấu hình đúng yêu cầu: $0.01 với 2 mốc cảnh báo 80% và 100%."*

### 6.4 Chi phí thực tế = $0
**Thao tác:**
1. AWS Console → Billing → Cost Explorer (hoặc Bills)
2. Chỉ rõ tổng chi phí: **$0.00**
3. Nói: *"Tổng chi phí phát sinh trong suốt đồ án là $0, hoàn toàn nằm trong Free Tier nhờ không sử dụng NAT Gateway và sử dụng VPC Gateway Endpoint miễn phí."*

---

## PHẦN 7 — Sơ đồ kiến trúc tổng thể (~1 phút)

**Lời nói:**
> "Em trình bày sơ đồ kiến trúc tổng thể của hệ thống."

**Thao tác:**
1. Mở ảnh sơ đồ kiến trúc (SD-2) — có thể mở file ảnh hoặc file PDF báo cáo
2. Chỉ và giải thích nhanh từng tầng:
   - **Edge:** Người dùng → CloudFront (OAC) → S3 Private
   - **API + Auth:** API Gateway → Cognito Authorizer (JWT)
   - **Compute:** Custom VPC → 2 Private Subnets → 4 Lambda riêng biệt
   - **Network:** VPC Gateway Endpoint → AWS Backbone → DynamoDB
   - **Giám sát:** CloudWatch Dashboard, 2 Alarms, SNS email
   - **Chi phí:** AWS Budget $0.01
3. Nói: *"Sơ đồ thể hiện đầy đủ 9 tầng kiến trúc theo yêu cầu đề bài."*

---

## PHẦN 8 — Giải thích nhanh 4 khái niệm kỹ thuật (~2 phút)

> **Mục đích:** Chứng minh hiểu biết kiến trúc — tương ứng phần giải thích trong Rubric.

### 8.1 Luồng Request (~30 giây)
**Lời nói:**
> "Khi user bấm 'Tạo công việc': Trình duyệt gửi POST request kèm JWT token → CloudFront (với CORS header) → API Gateway kiểm tra JWT qua Cognito Authorizer → kích hoạt Lambda CreateTaskFunction trong VPC → Lambda gọi DynamoDB qua VPC Gateway Endpoint (không qua internet) → DynamoDB ghi dữ liệu → trả response ngược lại cho user."

### 8.2 Tự mở rộng Serverless (~30 giây)
**Lời nói:**
> "Kiến trúc hoàn toàn Serverless theo mô hình 'scale to zero': Không có request → không có máy chủ chạy → chi phí bằng 0. Khi có nhiều request đồng thời, Lambda tự động tạo thêm instances song song. API Gateway đóng vai trò Load Balancer tự nhiên nên không cần ALB truyền thống."

### 8.3 CDN và OAC (~20 giây)
**Lời nói:**
> "CloudFront cache tài nguyên tĩnh tại Edge Location gần user nhất. Cache HIT trả về từ edge, Cache MISS mới gọi về S3. OAC cho phép CloudFront ký request bằng SigV4 để đọc S3 Private mà không cần bật S3 public."

### 8.4 VPC Endpoint (~20 giây)
**Lời nói:**
> "Lambda nằm trong Private Subnet không có Internet Gateway nên không ra được internet. VPC Gateway Endpoint tạo một đường riêng trên backbone AWS để Lambda gọi DynamoDB mà không cần NAT Gateway. So sánh: NAT Gateway tốn ~$32/tháng và dữ liệu đi qua internet, còn Gateway Endpoint hoàn toàn miễn phí và bảo mật hơn."

---

## PHẦN 9 — Kết thúc (~20 giây)

**Lời nói:**
> "Tóm lại, nhóm em đã hoàn thành đầy đủ tất cả yêu cầu: 4 thao tác CRUD hoạt động, bảo mật nhiều lớp (S3 Private + OAC, Cognito + JWT, IAM Least Privilege), cô lập mạng VPC + Gateway Endpoint, hệ thống giám sát CloudWatch + Alarms + SNS, và tối ưu chi phí $0. Toàn bộ 16 mục bằng chứng SE, CO, NE, IM đều đã được chứng minh. Cảm ơn cô đã xem video demo."

---

## ✅ CHECKLIST TRƯỚC KHI QUAY

Kiểm tra kỹ trước khi bấm Record:

- [ ] Đã đăng nhập AWS Console
- [ ] Đã mở sẵn URL CloudFront trong trình duyệt
- [ ] Có 2 tài khoản user sẵn sàng (đã đăng ký + xác nhận OTP)
- [ ] Đã có sẵn một vài task trong DynamoDB cho user 1 (để demo READ + Filter)
- [ ] Chuẩn bị sẵn URL S3 trực tiếp để demo 403 (copy vào notepad)
- [ ] Chuẩn bị sẵn lệnh curl (không token + có token) để demo CO-3, CO-4
- [ ] Chuẩn bị sẵn file ảnh sơ đồ kiến trúc (SD-2) để mở nhanh
- [ ] Mic hoạt động tốt, không bị rè
- [ ] Độ phân giải màn hình quay: tối thiểu 1080p
- [ ] Đóng hết notification / popup không cần thiết
- [ ] Mở sẵn các tab AWS Console cần thiết (S3, CloudFront, Lambda, VPC, IAM, CloudWatch, Billing) để chuyển nhanh

---

## 📋 BẢNG TỔNG HỢP: Bằng chứng ↔ Phần trong video

| Bằng chứng | Nội dung | Phần video | Thời điểm (ước tính) |
|------------|----------|------------|---------------------|
| **SE-1** | S3 Block Public Access | Phần 2.1 | ~3:30 |
| **SE-2** | S3 URL trả 403 | Phần 2.2 | ~4:00 |
| **SE-3** | CloudFront URL trả 200 | Phần 2.3 | ~4:30 |
| **SE-4** | OAC trên CloudFront | Phần 2.4 | ~4:50 |
| **CO-1** | Cognito User Pool | Phần 3.1 | ~5:10 |
| **CO-2** | API Gateway Authorizer | Phần 3.2 | ~5:30 |
| **CO-3** | curl không token → 401 | Phần 3.3 | ~5:50 |
| **CO-4** | curl có token → 200 | Phần 3.4 | ~6:20 |
| **NE-1** | VPC Endpoint Available | Phần 4.1 | ~6:50 |
| **NE-2** | Lambda VpcConfig | Phần 4.2 | ~7:20 |
| **NE-3** | Route Table pl→vpce | Phần 4.3 | ~7:50 |
| **NE-4** | NAT Gateway trống | Phần 4.4 | ~8:10 |
| **NE-5** | CloudWatch log 200 | Phần 4.5 | ~8:30 |
| **IM-1** | 4 IAM Roles riêng | Phần 5.1 | ~9:00 |
| **IM-2** | Policy JSON ARN cụ thể | Phần 5.2 | ~9:30 |
| **IM-3** | Lambda gắn đúng Role | Phần 5.3 | ~10:00 |
| **Dashboard** | 6 widgets thực tế | Phần 6.1 | ~10:30 |
| **Alarms** | 2 alarms + SNS | Phần 6.2 | ~11:00 |
| **Budget** | $0.01, 80%+100% | Phần 6.3 | ~11:30 |
| **Chi phí** | $0 thực tế | Phần 6.4 | ~12:00 |
| **Sơ đồ** | Kiến trúc 9 tầng | Phần 7 | ~12:30 |

---

> 💡 **Mẹo quay tốt:**
> - Nói chậm, rõ ràng. Cô sẽ dừng video nếu cần xem kỹ.
> - Khi di chuột tới một mục quan trọng, **dừng lại 2–3 giây** để cô kịp nhìn.
> - Nếu lỡ nói sai, không cần quay lại — nói luôn *"À ý em là..."* rồi tiếp tục.
> - Đảm bảo quay xong thì xem lại 1 lần trước khi nộp.
