# ⚙️ CÔNG VIỆC CỦA NGƯỜI B — Backend & API Layer

> **Môn:** CSC11006 — Nhập môn Điện toán đám mây | **Đồ án 2**
> **Vai trò:** Backend Developer + Cấu hình DynamoDB, Lambda, API Gateway

---

## 📦 MÃ NGUỒN ĐÃ CÓ SẴN (Không cần tự viết)

Toàn bộ code trong thư mục `backend/` đã được tạo sẵn:

```
backend/
├── getTasksFunction/
│   └── index.mjs       ← Lambda: GET /tasks
├── createTaskFunction/
│   └── index.mjs       ← Lambda: POST /tasks
├── updateTaskFunction/
│   └── index.mjs       ← Lambda: PUT /tasks/:id
├── deleteTaskFunction/
│   └── index.mjs       ← Lambda: DELETE /tasks/:id
└── seed.mjs             ← Script nhập dữ liệu mẫu
```

---

## ✅ DANH SÁCH CÔNG VIỆC THEO THỨ TỰ

---

### 🗓️ TUẦN 1 — Tạo Database + Đóng gói code

---

#### Bước B1 — Đăng nhập AWS và chọn Region

> ⚠️ **Điều kiện:** Bạn phải nhận được thông tin IAM User từ trưởng nhóm trước.

1. Đăng nhập vào AWS Console theo link trưởng nhóm gửi.
2. Chọn region **ap-southeast-1 (Singapore)** ở góc phải trên.

---

#### Bước B2 — Tạo DynamoDB Table

1. Tìm dịch vụ **DynamoDB** → **Create table**
2. Cấu hình bảng:

| Mục | Giá trị |
|-----|---------|
| Table name | `TasksTable` |
| Partition key | `taskId` (String) |
| Sort key | **Không cần** |
| Capacity mode | Provisioned (5 RCU, 5 WCU — trong Free Tier) |

3. **Tạo GSI (Global Secondary Index):**
   - Vào tab **Indexes** → **Create index**
   - Index name: `userId-index`
   - Partition key: `userId` (String)
   - Sort key: **Không cần**
   - Projection: **All**
   - Provisioned: 5 RCU, 5 WCU

4. Sau khi tạo xong, vào bảng → **Additional settings** → ghi lại **Table ARN** (dạng `arn:aws:dynamodb:ap-southeast-1:ACCOUNT_ID:table/TasksTable`).
5. **Gửi Table ARN cho Người C** để C gán vào IAM Role của Lambda.

---

#### Bước B3 — Đóng gói 4 Lambda functions thành file zip

Chạy các lệnh sau trong terminal (tại thư mục gốc dự án):

```bash
# Đóng gói từng function
Compress-Archive -Path backend/getTasksFunction/* -DestinationPath backend/getTasksFunction.zip -Force
Compress-Archive -Path backend/createTaskFunction/* -DestinationPath backend/createTaskFunction.zip -Force
Compress-Archive -Path backend/updateTaskFunction/* -DestinationPath backend/updateTaskFunction.zip -Force
Compress-Archive -Path backend/deleteTaskFunction/* -DestinationPath backend/deleteTaskFunction.zip -Force
```

> Kết quả: Sẽ có 4 file `.zip` trong thư mục `backend/`.

---

### 🗓️ TUẦN 2 — Deploy Lambda + Tạo API Gateway

> ⚠️ **Điều kiện:** Chờ Người C tạo xong VPC và IAM Roles trước rồi mới bắt đầu phần này. Người C sẽ gửi cho bạn:
> - VPC ID, Subnet IDs (2 Private Subnets), Security Group ID
> - Tên IAM Role: `TaskManager-LambdaTaskRole`

---

#### Bước B4 — Deploy 4 Lambda Functions

Với mỗi function, làm theo các bước sau (lặp lại 4 lần):

**Lambda 1: GetTasksFunction**
1. Vào **Lambda** → **Create function** → **Author from scratch**
2. Cấu hình:
   - Function name: `TaskManager-GetTasks`
   - Runtime: **Node.js 20.x**
   - Execution role: chọn `TaskManager-LambdaTaskRole`
3. Upload code: tab **Code** → **Upload from** → **.zip file** → chọn `getTasksFunction.zip`
4. Cấu hình VPC (**BƯỚC NÀY CỰC KỲ QUAN TRỌNG**):
   - Vào tab **Configuration** → **VPC** → **Edit**
   - VPC: chọn `TaskManager-VPC`
   - Subnets: chọn **CẢ 2** Private Subnets
   - Security group: chọn `TaskManager-Lambda-SG`
5. Cấu hình Environment Variables:
   - `TABLE_NAME` = `TasksTable`
   - `ALLOWED_ORIGIN` = `*` (tạm thời, sẽ đổi sau)
6. Cấu hình General:
   - Timeout: **30 giây** (tăng vì VPC cold start)
   - Memory: 128 MB

**Lặp lại** cho 3 function còn lại:
- `TaskManager-CreateTask` ← `createTaskFunction.zip`
- `TaskManager-UpdateTask` ← `updateTaskFunction.zip`
- `TaskManager-DeleteTask` ← `deleteTaskFunction.zip`

---

#### Bước B5 — Test từng Lambda Function

Với mỗi function, vào tab **Test** → **Create new event** → test thử:

**Test GetTasks:**
```json
{
    "httpMethod": "GET",
    "requestContext": {
        "authorizer": {
            "claims": { "sub": "user-test-001" }
        }
    }
}
```

**Test CreateTask:**
```json
{
    "httpMethod": "POST",
    "requestContext": {
        "authorizer": {
            "claims": { "sub": "user-test-001" }
        }
    },
    "body": "{\"title\":\"Test task\",\"priority\":\"high\",\"dueDate\":\"2025-06-15\"}"
}
```

→ Kết quả phải là **StatusCode 200/201**, không có `NetworkingError`.

---

#### Bước B6 — Tạo API Gateway (REST API)

1. Vào **API Gateway** → **Create API** → **REST API** → **Build**
   > ⚠️ Chọn đúng **REST API** (không phải HTTP API)
2. Cấu hình:
   - API name: `TaskManager-API`
   - Endpoint Type: Regional

3. **Tạo Cognito Authorizer:**
   - Sidebar → **Authorizers** → **Create New Authorizer**
   - Name: `CognitoAuthorizer`
   - Type: **Cognito**
   - Cognito User Pool: chọn `TaskManager-UserPool` (do Người A tạo)
   - Token source: `Authorization`

4. **Tạo Resource và Methods:**

   a. Tạo Resource `/tasks`:
   - Actions → **Create Resource** → Resource Path: `tasks`
   
   b. Với resource `/tasks`, tạo method **GET**:
   - Integration type: Lambda Function → `TaskManager-GetTasks`
   - Đặt Authorization: `CognitoAuthorizer`
   
   c. Tạo method **POST** cho `/tasks`:
   - Lambda: `TaskManager-CreateTask`
   - Authorization: `CognitoAuthorizer`
   
   d. Tạo Resource `/tasks/{id}`:
   - Check ✅ **Configure as proxy resource** = OFF
   - Resource path: `{id}`
   
   e. Tạo method **PUT** cho `/tasks/{id}`:
   - Lambda: `TaskManager-UpdateTask`
   - Authorization: `CognitoAuthorizer`
   
   f. Tạo method **DELETE** cho `/tasks/{id}`:
   - Lambda: `TaskManager-DeleteTask`
   - Authorization: `CognitoAuthorizer`
   
   g. Bật CORS (bắt buộc):
   - Chọn resource `/tasks` → Actions → **Enable CORS** → Deploy
   - Lặp lại cho `/tasks/{id}`

5. **Cấu hình Throttling:**
   - Deploy API → Stage name: `prod`
   - Vào Stage `prod` → **Stage Settings**:
     - Rate: `100`
     - Burst: `50`

6. Deploy xong → Ghi lại **Invoke URL** (dạng `https://xxxxxxxx.execute-api.ap-southeast-1.amazonaws.com/prod`)
7. **Gửi URL này cho Người A** để A điền vào `config.js`.

---

#### Bước B7 — Nhập dữ liệu mẫu (Seed Data)

1. Mở file `backend/seed.mjs`
2. Sửa 2 userId thành sub của 2 user Cognito thật (lấy từ Cognito > User Pool > Users > chọn user > xem User Attributes > sub).
3. Cài AWS CLI nếu chưa có, cấu hình credentials.
4. Chạy script:
   ```bash
   cd backend
   node seed.mjs
   ```
5. Vào DynamoDB → Explore table items → Xác nhận có dữ liệu.

---

#### Bước B8 — Cập nhật CORS khi có CloudFront URL

Sau khi Người A gửi CloudFront URL (ví dụ `https://d1abc.cloudfront.net`):

1. Vào từng Lambda (cả 4 cái) → tab **Configuration** → **Environment variables** → **Edit**
   - Đổi `ALLOWED_ORIGIN` từ `*` thành `https://d1abc.cloudfront.net`

2. Vào API Gateway → resource `/tasks` → method **OPTIONS** → Integration Response:
   - Cập nhật `Access-Control-Allow-Origin` = `https://d1abc.cloudfront.net`
   - Lặp lại cho `/tasks/{id}`
   
3. Deploy lại API: Actions → **Deploy API** → stage `prod`.

---

#### Bước B9 — Cấu hình Lambda Reserved Concurrency

1. Vào từng Lambda → tab **Configuration** → **Concurrency** → **Edit**
2. Set Reserved concurrency = **5** (mỗi function)
3. **Ghi vào báo cáo:**
   - Reserved Concurrency là gì: Là số instance Lambda tối đa có thể chạy đồng thời. Nếu đặt = 5, tối đa 5 request cùng lúc, phần còn lại bị throttle.
   - Tại sao chọn 5: Phù hợp với Free Tier, đủ để demo nhưng không gây spike chi phí.
   - Nếu đặt quá thấp (= 1): Throttle ngay khi có 2 request song song → UX kém.
   - Nếu đặt quá cao: Không bảo vệ được chi phí khi bị tấn công DDoS.

---

### 🗓️ TUẦN 3 — Kiểm thử & Thu thập bằng chứng

---

#### Bước B10 — Kiểm thử API bằng curl

```bash
# 1. Lấy token (thay CLIENT_ID, USERNAME, PASSWORD)
aws cognito-idp initiate-auth \
  --client-id CLIENT_ID \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=user1@example.com,PASSWORD=Test@12345 \
  --region ap-southeast-1

# Ghi lại IdToken từ kết quả trả về

# 2. Test không có token → phải trả về 401
curl -X GET https://API_URL/prod/tasks

# 3. Test có token → phải trả về 200 với dữ liệu
curl -X GET https://API_URL/prod/tasks \
  -H "Authorization: ID_TOKEN_TỪ_BƯỚC_1"
```

---

#### Bước B11 — Thu thập bằng chứng

| Mã | Chụp gì | Ở đâu |
|----|---------|-------|
| **CO-2** | API Gateway > Authorizers → thấy CognitoAuthorizer + User Pool | API Gateway Console |
| **CO-3** | Kết quả curl không có token → 401 Unauthorized | Terminal output |
| **CO-4** | Kết quả curl có token hợp lệ → 200 OK với data | Terminal output |
| **NE-2** | Lambda > Configuration > VPC → thấy Subnets + Security Group | Lambda Console |
| **IM-3** | Lambda > Configuration > Permissions → thấy Role name | Lambda Console |
| **NE-5** | CloudWatch Log → dòng REPORT với StatusCode 200 | CloudWatch > Log groups > `/aws/lambda/TaskManager-GetTasks` |

> **Lấy 2 loại log (NE-5):**
> - **Log thành công:** Gọi API bình thường → CloudWatch sẽ có dòng `REPORT RequestId... Duration: XXms`
> - **Log lỗi:** Gọi POST /tasks nhưng KHÔNG có trường `title` trong body → Lambda sẽ log ra lỗi validation

---

## 📝 Phần báo cáo của bạn

Bạn phụ trách giải thích 2 khái niệm:

### Tự mở rộng Serverless (~6%)
- Lambda mở rộng từ 0 đến N instance đồng thời hoàn toàn tự động, mỗi request là một instance độc lập.
- API Gateway đóng vai trò như một load balancer tự nhiên: phân phối request đến các Lambda instances.
- Tại sao không cần ALB (Application Load Balancer): API Gateway đã tích hợp sẵn tính năng này, không cần cài đặt thêm.

### Luồng request (~8%) — Viết cùng Người A
Từ khi người dùng nhấn "Tạo công việc":
> Browser → CloudFront (bỏ qua, vì là API call) → API Gateway → Cognito Authorizer (xác thực JWT) → Lambda (trong VPC) → VPC Gateway Endpoint → DynamoDB (PutItem) → Response → API Gateway → Browser → UI cập nhật

---

> 💬 **Hỏi trưởng nhóm nếu bạn cần:** IAM credentials, VPC/Subnet IDs, Security Group ID từ Người C, hay Cognito User Pool ID từ Người A.
