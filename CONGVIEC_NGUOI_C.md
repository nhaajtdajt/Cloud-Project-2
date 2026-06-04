# 🏗️ CÔNG VIỆC CỦA NGƯỜI C — Core Infra, IAM & Monitoring

> **Môn:** CSC11006 — Nhập môn Điện toán đám mây | **Đồ án 2**
> **Vai trò:** Kỹ sư Hạ tầng — Cấu hình VPC, IAM, CloudWatch, SNS, AWS Budget

---

## ⭐ VAI TRÒ QUAN TRỌNG

Người C là người **xây dựng nền móng cho toàn bộ hệ thống**. Người B **không thể deploy Lambda** nếu chưa có VPC và IAM Role của bạn.

> **Thứ tự bắt buộc:** Người C làm xong VPC + IAM → Người B mới deploy Lambda được.

---

## ✅ DANH SÁCH CÔNG VIỆC THEO THỨ TỰ

---

### 🗓️ TUẦN 1 — Thiết lập nền móng hạ tầng

---

#### Bước C1 — Thiết lập IAM Users cho nhóm (Trưởng nhóm làm)

> Đây là bước dành cho người có tài khoản AWS gốc (Root/Admin account).

1. Đăng nhập bằng tài khoản AWS root hoặc admin của bạn.
2. Vào dịch vụ **IAM** → **Users** → **Create user**
3. **Tạo IAM User cho Người A:**
   - User name: `project2-nguoiA`
   - ✅ Provide user access to the AWS Management Console
   - Console password: tự đặt
   - ✅ Permissions: Attach directly → `AdministratorAccess`
4. **Tạo tương tự cho Người B:** `project2-nguoiB`
5. Ghi lại **Console Login URL** (dạng `https://ACCOUNT_ID.signin.aws.amazon.com/console`) → Gửi kèm Username + Password cho từng người.

---

#### Bước C2 — Tạo VPC

1. Chọn region **ap-southeast-1 (Singapore)**.
2. Vào **VPC** → **Create VPC**
3. Cấu hình:

| Mục | Giá trị |
|-----|---------|
| Resources to create | VPC only |
| Name | `TaskManager-VPC` |
| IPv4 CIDR | `10.0.0.0/16` |
| IPv6 | No |
| Tenancy | Default |

4. Ghi lại **VPC ID** (dạng `vpc-xxxxxxxxx`).

---

#### Bước C3 — Tạo 2 Private Subnets

**Subnet 1 (AZ-1):**
1. VPC → **Subnets** → **Create subnet**
2. Cấu hình:
   - VPC: `TaskManager-VPC`
   - Subnet name: `TaskManager-Private-1a`
   - Availability Zone: `ap-southeast-1a`
   - IPv4 CIDR: `10.0.1.0/24`

**Subnet 2 (AZ-2):**
1. Tạo thêm 1 subnet nữa:
   - Subnet name: `TaskManager-Private-1b`
   - Availability Zone: `ap-southeast-1b`
   - IPv4 CIDR: `10.0.2.0/24`

3. Ghi lại cả 2 **Subnet IDs** → Sẽ gửi cho Người B.

---

#### Bước C4 — Tạo Route Table cho Private Subnets

1. VPC → **Route tables** → **Create route table**
2. Cấu hình:
   - Name: `TaskManager-Private-RT`
   - VPC: `TaskManager-VPC`
3. Sau khi tạo → **Subnet associations** → **Edit subnet associations**
4. Chọn **cả 2 Private Subnets** ở trên → Save.

---

#### Bước C5 — Tạo VPC Gateway Endpoint cho DynamoDB

> Đây là bước QUAN TRỌNG NHẤT để Lambda kết nối DynamoDB qua mạng riêng của AWS, không qua internet, không tốn tiền NAT Gateway.

1. VPC → **Endpoints** → **Create endpoint**
2. Cấu hình:
   - Name: `TaskManager-DynamoDB-Endpoint`
   - Service category: **AWS services**
   - Tìm kiếm: `dynamodb`
   - Chọn service: `com.amazonaws.ap-southeast-1.dynamodb` (loại **Gateway**)
   - VPC: `TaskManager-VPC`
   - Route tables: chọn `TaskManager-Private-RT`
3. Tạo endpoint.
4. Kiểm tra: Vào **Route Tables** → `TaskManager-Private-RT` → tab **Routes** → Phải thấy dòng mới:
   - Destination: `pl-xxxxxx` (đây là DynamoDB Prefix List)
   - Target: `vpce-xxxxxxxx`

---

#### Bước C6 — Tạo Security Group cho Lambda

1. VPC → **Security groups** → **Create security group**
2. Cấu hình:
   - Name: `TaskManager-Lambda-SG`
   - VPC: `TaskManager-VPC`
3. **Inbound rules:** Để trống (Lambda không nhận kết nối từ bên ngoài).
4. **Outbound rules:**
   - Xóa rule mặc định `All traffic 0.0.0.0/0`
   - Thêm rule mới:
     - Type: `HTTPS`
     - Port: `443`
     - Destination: Chọn **Custom** → tìm và chọn **DynamoDB Prefix List** (`pl-xxxxxx`) trong dropdown
5. Ghi lại **Security Group ID** → Gửi cho Người B.

> **Tóm lại thông tin cần gửi cho Người B:**
> - VPC ID: `vpc-xxx`
> - Subnet 1 ID: `subnet-xxx` (1a)
> - Subnet 2 ID: `subnet-xxx` (1b)
> - Security Group ID: `sg-xxx`

---

#### Bước C7 — Tạo 5 IAM Roles cho Lambda

> ⚠️ Chờ Người B gửi **Table ARN của DynamoDB** trước khi tạo Role.

> 🚨 **ĐỀ BÀI YÊU CẦU RÕ RÀNG:** *"Mỗi Lambda function phải có IAM Role riêng. Không được dùng chung một role cho nhiều Lambda function."*
> → Phải tạo **4 roles riêng biệt** (mỗi Lambda 1 role) + 1 LambdaBaseRole = tổng **5 roles**.

Mỗi role chỉ có đúng quyền DynamoDB cần thiết cho chức năng của nó — đây là **Nguyên tắc Least Privilege** (điểm IM-2).

**Cách tạo mỗi Role (lặp lại 5 lần):**
1. IAM → **Roles** → **Create role**
2. Trusted entity: **AWS service** → **Lambda** → Next
3. Permissions: **Bỏ qua, không attach gì cả** → Next
4. Đặt **Role name** theo bảng bên dưới → **Create role**
5. Vào Role vừa tạo → tab **Permissions** → **Add permissions** → **Create inline policy**
6. Chọn tab **JSON** → Paste JSON tương ứng → Policy name: `TaskManager-[tên]-Policy` → **Create policy**

---

**Role 1: `TaskManager-GetTasks-Role`** — Dành cho Lambda GetTasksFunction

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:Query",
                "dynamodb:GetItem"
            ],
            "Resource": [
                "ĐIỀN_TABLE_ARN_DO_NGƯỜI_B_GỬI",
                "ĐIỀN_TABLE_ARN_DO_NGƯỜI_B_GỬI/index/userId-index"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:ap-southeast-1:*:*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ec2:CreateNetworkInterface",
                "ec2:DescribeNetworkInterfaces",
                "ec2:DeleteNetworkInterface"
            ],
            "Resource": "*"
        }
    ]
}
```
> 💡 Chỉ có `Query` + `GetItem` — không có quyền ghi, sửa, xóa.

---

**Role 2: `TaskManager-CreateTask-Role`** — Dành cho Lambda CreateTaskFunction

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem"
            ],
            "Resource": "ĐIỀN_TABLE_ARN_DO_NGƯỜI_B_GỬI"
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:ap-southeast-1:*:*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ec2:CreateNetworkInterface",
                "ec2:DescribeNetworkInterfaces",
                "ec2:DeleteNetworkInterface"
            ],
            "Resource": "*"
        }
    ]
}
```
> 💡 Chỉ có `PutItem` — không có quyền đọc, sửa, xóa.

---

**Role 3: `TaskManager-UpdateTask-Role`** — Dành cho Lambda UpdateTaskFunction

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:UpdateItem"
            ],
            "Resource": "ĐIỀN_TABLE_ARN_DO_NGƯỜI_B_GỬI"
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:ap-southeast-1:*:*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ec2:CreateNetworkInterface",
                "ec2:DescribeNetworkInterfaces",
                "ec2:DeleteNetworkInterface"
            ],
            "Resource": "*"
        }
    ]
}
```
> 💡 Chỉ có `UpdateItem` — không có quyền đọc, tạo, xóa.

---

**Role 4: `TaskManager-DeleteTask-Role`** — Dành cho Lambda DeleteTaskFunction

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:DeleteItem"
            ],
            "Resource": "ĐIỀN_TABLE_ARN_DO_NGƯỜI_B_GỬI"
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:ap-southeast-1:*:*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ec2:CreateNetworkInterface",
                "ec2:DescribeNetworkInterfaces",
                "ec2:DeleteNetworkInterface"
            ],
            "Resource": "*"
        }
    ]
}
```
> 💡 Chỉ có `DeleteItem` — không có quyền đọc, tạo, sửa.

---

**Role 5: `TaskManager-LambdaBaseRole`** — Role base (đề bài yêu cầu tạo, không gán cho Lambda nào)

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:ap-southeast-1:*:*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ec2:CreateNetworkInterface",
                "ec2:DescribeNetworkInterfaces",
                "ec2:DeleteNetworkInterface"
            ],
            "Resource": "*"
        }
    ]
}
```
> 💡 **Không có** bất kỳ quyền DynamoDB nào — thể hiện sự phân tách rõ ràng.

---

**📋 Bảng tóm tắt — Gửi cho Người B để gán đúng Role vào từng Lambda:**

| Role Name | Gán cho Lambda | DynamoDB được phép |
|-----------|---------------|---------------------|
| `TaskManager-GetTasks-Role` | `TaskManager-GetTasks` | `Query`, `GetItem` |
| `TaskManager-CreateTask-Role` | `TaskManager-CreateTask` | `PutItem` |
| `TaskManager-UpdateTask-Role` | `TaskManager-UpdateTask` | `UpdateItem` |
| `TaskManager-DeleteTask-Role` | `TaskManager-DeleteTask` | `DeleteItem` |
| `TaskManager-LambdaBaseRole` | *(không gán)* | Không có |

---

#### Bước C8 — Kiểm tra không có NAT Gateway

1. VPC → **NAT gateways**
2. Xác nhận danh sách **trống** hoặc tất cả status là `Deleted`.
3. ❌ **TUYỆT ĐỐI KHÔNG tạo NAT Gateway** → bị phạt 0 điểm Networking + $32/tháng.

---

#### 📸 Bằng chứng cần chụp cuối Tuần 1

| Mã | Chụp gì | Ở đâu |
|----|---------|-------|
| **NE-1** | VPC > Endpoints → Status: Available + Service Name: `com.amazonaws.ap-southeast-1.dynamodb` | VPC Console > Endpoints |
| **NE-3** | Route Table `TaskManager-Private-RT` → Routes → thấy `pl-xxx → vpce-xxx` | VPC > Route Tables |
| **NE-4** | VPC > NAT Gateways → danh sách trống / tất cả Deleted | VPC Console |
| **IM-1** | IAM > Roles → lọc "TaskManager" → **thấy đủ 5 roles** | IAM Console |
| **IM-2** | JSON của từng Role → `Resource` chứa ARN cụ thể của TasksTable, **không phải `*`** | IAM > Role > Policy JSON |

> 💡 **Mẹo chụp IM-2:** Chụp JSON của **GetTasks-Role** là đủ minh chứng (có ARN DynamoDB cụ thể, chỉ có 2 actions `Query` + `GetItem`).

---

### 🗓️ TUẦN 3 — Giám sát, Cảnh báo & Chi phí

> Làm song song khi Người A và B đang test ứng dụng.

---

#### Bước C9 — Tạo SNS Topic (Kênh gửi email cảnh báo)

1. Vào dịch vụ **SNS** → **Topics** → **Create topic**
2. Cấu hình:
   - Type: **Standard**
   - Name: `TaskManager-Alerts`
3. Sau khi tạo → **Create subscription**:
   - Protocol: **Email**
   - Endpoint: email của nhóm (ví dụ email trưởng nhóm)
4. Vào email → xác nhận subscription (AWS gửi email confirm).

---

#### Bước C10 — Tạo CloudWatch Dashboard

1. Vào **CloudWatch** → **Dashboards** → **Create dashboard**
2. Name: `TaskManager-Dashboard`
3. Thêm 6 widgets sau:

**Widget 1 — Lambda Invocations:**
- Add widget → Number hoặc Line
- Metrics: `AWS/Lambda` → `By Function Name` → `Invocations`
- Chọn cả 4 functions (GetTasks, CreateTask, UpdateTask, DeleteTask)

**Widget 2 — Lambda Duration:**
- Add widget → Line
- Metrics: `AWS/Lambda` → `Duration`
- Statistics: p50 và p99

**Widget 3 — Lambda Errors:**
- Add widget → Number
- Metrics: `AWS/Lambda` → `Errors`

**Widget 4 — Lambda Throttles:**
- Add widget → Number
- Metrics: `AWS/Lambda` → `Throttles`

**Widget 5 — API Gateway Latency:**
- Add widget → Line
- Metrics: `AWS/ApiGateway` → `Latency`
- Dimension: ApiName = `TaskManager-API`

**Widget 6 — API Gateway 4xx/5xx:**
- Add widget → Number
- Metrics: `AWS/ApiGateway` → `4XXError` và `5XXError`

4. Lưu dashboard.
5. **Quan trọng:** Cần gọi API vài lần (test ứng dụng) TRƯỚC KHI chụp screenshot để có dữ liệu thực hiển thị.

---

#### Bước C11 — Tạo 2 CloudWatch Alarms

**Alarm 1: Lambda-Error-Alarm**
1. CloudWatch → **Alarms** → **Create alarm**
2. **Select metric:** `AWS/Lambda` → `By Function Name` → `Errors` → chọn tất cả 4 functions → chọn **Sum**
3. **Conditions:**
   - Threshold type: Static
   - Whenever Errors is: **Greater than**
   - Value: `10`
   - Datapoints to alarm: `1 out of 1` (trong 5 phút)
4. **Actions:**
   - Notification: **In Alarm** → gửi tới SNS Topic `TaskManager-Alerts`
5. Alarm name: `Lambda-Error-Alarm`

**Alarm 2: API-5xx-Alarm**
1. Tạo tương tự
2. **Select metric:** `AWS/ApiGateway` → `By Api Name` → `5XXError`
3. **Conditions:** Greater than `5` trong 5 phút
4. **Actions:** gửi tới SNS `TaskManager-Alerts`
5. Alarm name: `API-5xx-Alarm`

---

#### Bước C12 — Tạo AWS Budget

1. Vào **AWS Billing** → **Budgets** → **Create a budget**
2. Budget type: **Cost budget**
3. Cấu hình:
   - Budget name: `TaskManager-Budget`
   - Period: Monthly
   - Budget amount: `$0.01`
4. **Alert 1:**
   - Alert threshold: `80%` of actual cost
   - Notification: Email → nhập email nhóm
5. **Alert 2:**
   - Alert threshold: `100%` of actual cost
   - Notification: Email → nhập email nhóm
6. Tạo budget.

---

#### 📸 Bằng chứng cần chụp Tuần 3

| Mã | Chụp gì | Ở đâu |
|----|---------|-------|
| **Dashboard** | CloudWatch Dashboard `TaskManager-Dashboard` với 5+ widget có dữ liệu thực | CloudWatch > Dashboards |
| **Alarms** | 2 Alarms (`Lambda-Error-Alarm`, `API-5xx-Alarm`) — trạng thái OK hoặc ALARM đều được | CloudWatch > Alarms |
| **Budget** | Trang cấu hình AWS Budget với $0.01 và 2 alerts | AWS Budgets Console |
| **Cost** | AWS Cost Explorer hoặc Billing Dashboard — chứng minh tổng chi phí ≤ $0.01 | Billing Console |

---

## 📝 Phần báo cáo của bạn

Bạn phụ trách giải thích 2 khái niệm:

### VPC Endpoint (~4%)
- **Vấn đề:** Lambda nằm trong Private Subnet không có đường ra internet. Nếu gọi DynamoDB (là dịch vụ public của AWS) mà đi qua internet → cần NAT Gateway → tốn ~$32/tháng.
- **Giải pháp:** VPC **Gateway Endpoint** tạo ra một đường đi riêng từ VPC vào DynamoDB qua backbone nội bộ của AWS, hoàn toàn không đi qua internet, chi phí = **$0**.
- **So sánh:**

| Tiêu chí | NAT Gateway | VPC Gateway Endpoint |
|----------|-------------|---------------------|
| Chi phí | ~$32/tháng | $0 |
| Bảo mật | Đi qua internet | Nội bộ AWS backbone |
| Độ trễ | Cao hơn | Thấp hơn |

### Phần Kiến trúc tổng thể (Viết báo cáo chung)
- Giải thích sơ đồ kiến trúc: 7 tầng, từ người dùng → CloudFront → API Gateway → VPC → Lambda → Endpoint → DynamoDB.
- Giải thích tại sao hệ thống đảm bảo **High Availability**: 2 Private Subnets trên 2 Availability Zones, DynamoDB tự sao chép multi-AZ.

---

> 💬 **Hỏi trưởng nhóm nếu bạn cần:** Quyền truy cập AWS, thông tin tài khoản, hay bất kỳ vấn đề gì về VPC.
