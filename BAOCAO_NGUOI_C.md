# BÁO CÁO PHẦN NGƯỜI C — VPC, IAM, Giám sát, Chi phí, VPC Endpoint & Kiến trúc tổng thể

> **Hướng dẫn:** Người C viết toàn bộ phần này. Những chỗ có ký hiệu 📸 hoặc `[CHỤP HÌNH]` là nơi bạn cần chèn ảnh screenshot thực tế. Những chỗ có `[ĐIỀN VÀO]` là nơi bạn cần điền thông tin cụ thể sau khi triển khai xong.

---

## PHẦN 1: KIẾN TRÚC MẠNG — CUSTOM VPC

### 1.1. Tổng quan thiết kế mạng

Toàn bộ hạ tầng compute (Lambda functions) của hệ thống được triển khai bên trong một **Custom VPC (Virtual Private Cloud)** — mạng ảo riêng biệt trên AWS. Mục đích chính là **cô lập hoàn toàn** tài nguyên compute khỏi internet công cộng, đồng thời thiết lập đường kết nối an toàn (private) tới cơ sở dữ liệu DynamoDB thông qua VPC Gateway Endpoint.

Kiến trúc mạng được triển khai gồm:

```
                   ┌────────────────────────────────────────────────┐
                   │             Custom VPC: 10.0.0.0/16           │
                   │                                                │
                   │  ┌──────────────────┐  ┌──────────────────┐   │
                   │  │  Private Subnet  │  │  Private Subnet  │   │
                   │  │  10.0.1.0/24     │  │  10.0.2.0/24     │   │
                   │  │  AZ: 1a          │  │  AZ: 1b          │   │
                   │  │                  │  │                  │   │
                   │  │  [Lambda Funcs]  │  │  [Lambda Funcs]  │   │
                   │  └────────┬─────────┘  └────────┬─────────┘   │
                   │           │                     │             │
                   │           └─────────┬───────────┘             │
                   │                     │                         │
                   │          ┌──────────▼──────────┐              │
                   │          │  VPC Gateway        │              │
                   │          │  Endpoint           │              │
                   │          │  (DynamoDB)         │              │
                   │          └──────────┬──────────┘              │
                   └─────────────────────┼─────────────────────────┘
                                         │
                              AWS Private Backbone
                                         │
                              ┌──────────▼──────────┐
                              │   Amazon DynamoDB    │
                              │   (Managed Service)  │
                              └─────────────────────┘
```

### 1.2. Chi tiết các thành phần mạng đã tạo

| Thành phần | Tên tài nguyên | Giá trị cấu hình | Mục đích |
|------------|---------------|-------------------|----------|
| **Custom VPC** | `TaskManager-VPC` | CIDR: `10.0.0.0/16` (65,536 IP addresses) | Mạng ảo riêng biệt chứa toàn bộ Lambda functions |
| **Private Subnet 1** | `TaskManager-Private-1a` | CIDR: `10.0.1.0/24` (256 IPs), AZ: `ap-southeast-1a` | Đặt Lambda functions — AZ thứ nhất |
| **Private Subnet 2** | `TaskManager-Private-1b` | CIDR: `10.0.2.0/24` (256 IPs), AZ: `ap-southeast-1b` | Đặt Lambda functions — AZ thứ hai (đảm bảo High Availability) |
| **Route Table** | `TaskManager-Private-RT` | Associated với cả 2 Private Subnets | Điều hướng traffic DynamoDB qua Gateway Endpoint |
| **VPC Gateway Endpoint** | `TaskManager-DynamoDB-Endpoint` | Service: `com.amazonaws.ap-southeast-1.dynamodb` | Cho phép Lambda kết nối DynamoDB qua mạng riêng AWS |
| **Security Group** | `TaskManager-Lambda-SG` | Inbound: Không có; Outbound: HTTPS (443) tới DynamoDB Prefix List | Kiểm soát traffic ra/vào cho Lambda |

### 1.3. Tại sao cần 2 Private Subnets ở 2 AZ khác nhau?

AWS Lambda khi được gắn vào VPC sẽ tạo **Elastic Network Interface (ENI)** trong các subnet được chỉ định. Nếu chỉ có 1 subnet ở 1 AZ, khi AZ đó gặp sự cố (thiên tai, mất điện trung tâm dữ liệu), Lambda không thể tạo ENI → toàn bộ hệ thống ngừng hoạt động.

Bằng cách đặt Lambda vào 2 subnets ở 2 AZ (1a và 1b), nếu AZ 1a gặp sự cố, Lambda tự động tạo ENI tại AZ 1b và tiếp tục hoạt động bình thường. Đây chính là nguyên tắc **High Availability by Design** — sẵn sàng cao ngay từ thiết kế, không cần cấu hình failover thủ công.

### 1.4. Security Group — Nguyên tắc bảo mật

Security Group `TaskManager-Lambda-SG` được cấu hình theo nguyên tắc **deny-by-default** (mặc định từ chối tất cả, chỉ cho phép những gì cần thiết):

| Loại Rule | Protocol | Port | Destination/Source | Giải thích |
|-----------|----------|------|-------------------|------------|
| **Inbound** | *(Không có rule nào)* | — | — | Lambda không cần nhận kết nối từ bên ngoài (nó được kích hoạt bởi API Gateway thông qua cơ chế nội bộ của AWS, không phải qua mạng). |
| **Outbound** | HTTPS | 443 | DynamoDB Prefix List (`pl-xxxxxx`) | Lambda chỉ được phép gửi traffic ra ngoài tới DynamoDB thông qua HTTPS port 443. **Không** có rule cho `0.0.0.0/0` → Lambda hoàn toàn không thể truy cập internet. |

📸 **[CHỤP HÌNH]:** Chụp Security Group rules (cả Inbound và Outbound) để đưa vào phần phụ lục minh chứng.

### 1.5. VPC Gateway Endpoint cho DynamoDB

**ID Endpoint:** `[ĐIỀN VÀO — vpce-xxxxxxxxx]`

Sau khi tạo Gateway Endpoint, AWS tự động thêm một entry vào Route Table `TaskManager-Private-RT`:

| Destination | Target | Giải thích |
|-------------|--------|------------|
| `pl-xxxxxx` (DynamoDB Prefix List) | `vpce-xxxxxxxx` (Gateway Endpoint) | Mọi traffic đi đến dải IP của DynamoDB sẽ được chuyển hướng qua Gateway Endpoint thay vì đi ra internet. |

> **Prefix List** là gì? Đây là một nhóm các dải IP (CIDR blocks) mà AWS tự quản lý, đại diện cho tất cả các IP address của dịch vụ DynamoDB trong region Singapore. Thay vì bạn phải liệt kê từng IP (có thể thay đổi), AWS đóng gói tất cả vào một Prefix List ID (`pl-xxxxxx`) để bạn sử dụng trong Route Table và Security Group.

📸 **[CHỤP HÌNH NE-1]:** Vào VPC Console > Endpoints. Chụp ảnh cho thấy Endpoint với Service Name: `com.amazonaws.ap-southeast-1.dynamodb` và Status: **Available**.

📸 **[CHỤP HÌNH NE-3]:** Vào VPC Console > Route Tables > chọn `TaskManager-Private-RT` > tab Routes. Chụp ảnh cho thấy dòng: Destination = `pl-xxxxxx`, Target = `vpce-xxxxxxxx`.

📸 **[CHỤP HÌNH NE-4]:** Vào VPC Console > NAT Gateways. Chụp ảnh cho thấy danh sách **trống hoàn toàn** hoặc tất cả entries có Status = `Deleted`.

---

## PHẦN 2: BẢO MẬT IAM — LEAST PRIVILEGE

### 2.1. Nguyên tắc Đặc quyền tối thiểu (Least Privilege)

Đề bài yêu cầu mỗi Lambda function phải có IAM Role riêng biệt (Mục IV.5.1). Nhóm đã tạo **5 IAM Roles** — 4 roles riêng cho 4 Lambda functions và 1 role base (không gán cho Lambda nào):

| STT | Role Name | Gán cho Lambda | Quyền DynamoDB | Lý do |
|-----|-----------|---------------|----------------|-------|
| 1 | `TaskManager-GetTasks-Role` | `TaskManager-GetTasks` | `Query`, `GetItem` | Chỉ cần ĐỌC dữ liệu, không cần ghi/sửa/xóa |
| 2 | `TaskManager-CreateTask-Role` | `TaskManager-CreateTask` | `PutItem` | Chỉ cần TẠO bản ghi mới |
| 3 | `TaskManager-UpdateTask-Role` | `TaskManager-UpdateTask` | `UpdateItem` | Chỉ cần CẬP NHẬT bản ghi đã tồn tại |
| 4 | `TaskManager-DeleteTask-Role` | `TaskManager-DeleteTask` | `DeleteItem` | Chỉ cần XÓA bản ghi |
| 5 | `TaskManager-LambdaBaseRole` | *(Không gán)* | *(Không có)* | Role cơ sở chỉ có quyền ghi log + tạo ENI (VPC) |

**Tại sao phải tách riêng thay vì dùng chung 1 role?**

Nếu dùng chung 1 role cho cả 4 Lambda, role đó buộc phải có tất cả quyền: `GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`, `Query`, `Scan`. Điều này vi phạm nguyên tắc Least Privilege vì:
- Hàm `GetTasks` (chỉ cần đọc) lại có quyền xóa dữ liệu → nếu bị khai thác lỗ hổng, kẻ tấn công có thể xóa toàn bộ bảng.
- Hàm `DeleteTask` (chỉ cần xóa) lại có quyền tạo mới → kẻ tấn công có thể bơm spam data.

Bằng cách tách riêng, mỗi Lambda chỉ có đúng quyền tối thiểu nó cần → **giảm thiểu bề mặt tấn công** (attack surface). Nếu 1 hàm bị compromise, thiệt hại giới hạn chỉ trong phạm vi quyền của hàm đó.

### 2.2. Cấu trúc chi tiết của một IAM Policy (Ví dụ: GetTasks-Role)

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": ["dynamodb:Query", "dynamodb:GetItem"],
            "Resource": [
                "arn:aws:dynamodb:ap-southeast-1:[ACCOUNT_ID]:table/TasksTable",
                "arn:aws:dynamodb:ap-southeast-1:[ACCOUNT_ID]:table/TasksTable/index/userId-index"
            ]
        },
        {
            "Effect": "Allow",
            "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
            "Resource": "arn:aws:logs:ap-southeast-1:*:*"
        },
        {
            "Effect": "Allow",
            "Action": ["ec2:CreateNetworkInterface", "ec2:DescribeNetworkInterfaces", "ec2:DeleteNetworkInterface"],
            "Resource": "*"
        }
    ]
}
```

**Phân tích từng Statement:**

1. **Statement 1 (DynamoDB):** Chỉ cho phép `Query` và `GetItem` — hai thao tác đọc. Trường `Resource` chỉ định chính xác ARN của bảng `TasksTable` và index `userId-index` — không dùng wildcard `*`. Điều này ngăn Lambda truy cập bất kỳ bảng DynamoDB nào khác trong tài khoản.

2. **Statement 2 (CloudWatch Logs):** Cho phép Lambda ghi log vào CloudWatch. Đây là quyền bắt buộc để Lambda hoạt động — nếu không có, Lambda chạy nhưng không ghi được log, gây khó khăn cho việc debug.

3. **Statement 3 (EC2 Network Interface):** Cho phép Lambda tạo, mô tả và xóa Elastic Network Interface (ENI) trong VPC. Đây là quyền bắt buộc khi Lambda được gắn vào VPC — Lambda cần tạo ENI để có địa chỉ IP trong Private Subnet.

📸 **[CHỤP HÌNH IM-1]:** Vào IAM Console > Roles > tìm kiếm "TaskManager". Chụp ảnh danh sách cho thấy đủ **5 roles** với tên phân biệt rõ ràng.

📸 **[CHỤP HÌNH IM-2]:** Click vào role `TaskManager-GetTasks-Role` > mở Inline Policy > chuyển sang tab JSON. Chụp ảnh cho thấy:
- Trường `Action` chỉ chứa `Query` và `GetItem` (không có `PutItem`, `DeleteItem`,...).
- Trường `Resource` chứa ARN cụ thể của bảng (không phải `*`).

---

## PHẦN 3: GIẢI THÍCH KHÁI NIỆM — VPC ENDPOINT (~4% tổng điểm)

> **Lưu ý cho Người C:** Phần này giảng viên sẽ trực tiếp hỏi trong buổi bảo vệ. Bạn cần hiểu sâu và diễn đạt mạch lạc.

### 3.1. Vấn đề cốt lõi: Lambda trong Private Subnet không có internet

Khi Lambda được đặt vào Private Subnet (subnet không có Internet Gateway và không có NAT Gateway), nó hoàn toàn bị **"cắt đứt" khỏi internet**. Tuy nhiên, Amazon DynamoDB là một **dịch vụ công cộng (public service)** của AWS — có nghĩa là, trong điều kiện bình thường, bạn phải truy cập DynamoDB thông qua internet (qua HTTPS tới endpoint `dynamodb.ap-southeast-1.amazonaws.com`).

**Nghịch lý:** Lambda nằm trong Private Subnet nhưng cần gọi DynamoDB (dịch vụ public) → làm sao?

### 3.2. Hai giải pháp và sự lựa chọn của nhóm

| Tiêu chí | Giải pháp 1: NAT Gateway | Giải pháp 2: VPC Gateway Endpoint |
|----------|--------------------------|----------------------------------|
| **Cơ chế** | Tạo một "cổng dịch" đặt trong Public Subnet. Lambda gửi traffic tới NAT → NAT chuyển tiếp ra internet → internet đưa tới DynamoDB. | Tạo một "đường hầm riêng" nối thẳng VPC với DynamoDB. Traffic đi trên backbone nội bộ của AWS, **hoàn toàn không qua internet**. |
| **Chi phí** | **~$32/tháng** (0.045 USD/giờ × 24h × 30 ngày) dù không có traffic. Thêm phí data transfer. | **$0** (Hoàn toàn miễn phí). |
| **Bảo mật** | Traffic đi qua internet công cộng → có rủi ro bị nghe lén (dù có HTTPS mã hóa). | Traffic không bao giờ rời khỏi mạng nội bộ AWS → an toàn hơn. |
| **Độ trễ (Latency)** | Cao hơn (phải qua NAT, qua internet rồi mới tới DynamoDB). | Thấp hơn (đi thẳng trên backbone nội bộ). |
| **Yêu cầu đề bài** | ⛔ **BỊ CẤM** — *"Vi phạm sẽ bị 0 điểm cho Networking và Cost Efficiency"* | ✅ **BẮT BUỘC** sử dụng |

Nhóm sử dụng **Giải pháp 2: VPC Gateway Endpoint** — hoàn toàn tuân thủ yêu cầu đề bài, tiết kiệm chi phí tuyệt đối ($0), và bảo mật hơn.

### 3.3. Đường đi của traffic khi Lambda gọi DynamoDB

1. Lambda function (nằm trong Private Subnet) gửi request HTTPS tới endpoint DynamoDB (`dynamodb.ap-southeast-1.amazonaws.com`).
2. Request tới Route Table của Private Subnet. Route Table kiểm tra destination IP.
3. IP đích thuộc dải IP của DynamoDB → khớp với entry: `pl-xxxxxx (DynamoDB Prefix List) → vpce-xxxxxxxx (Gateway Endpoint)`.
4. Traffic được chuyển hướng qua Gateway Endpoint → đi trên **AWS Private Backbone** (mạng fiber nội bộ tốc độ cao của AWS, hoàn toàn tách biệt khỏi internet công cộng).
5. Traffic tới DynamoDB, được xử lý, và kết quả trả về theo đường ngược lại (cũng qua Private Backbone).

**Lưu ý kỹ thuật:** VPC Gateway Endpoint có hai đặc điểm quan trọng:
- **Không có IP address:** Khác với VPC Interface Endpoint (có ENI và private IP), Gateway Endpoint hoạt động ở tầng Route Table — nó chỉ là một "entry" trong bảng định tuyến, không phải một thiết bị mạng vật lý.
- **Chỉ hỗ trợ 2 dịch vụ:** DynamoDB và S3. Các dịch vụ AWS khác (SQS, SNS, Secrets Manager...) phải dùng Interface Endpoint (có phí). May mắn là đồ án này chỉ cần kết nối tới DynamoDB.

`[NGƯỜI C CẦN LÀM: Vẽ sơ đồ so sánh trực quan 2 giải pháp (NAT Gateway vs VPC Gateway Endpoint). Gợi ý: vẽ 2 luồng song song — luồng 1 đi qua NAT ra internet rồi vào DynamoDB (gạch chéo/đánh dấu X), luồng 2 đi thẳng qua Gateway Endpoint tới DynamoDB (đánh dấu ✓). Dùng draw.io hoặc vẽ tay.]`

---

## PHẦN 4: SƠ ĐỒ KIẾN TRÚC TỔNG THỂ

> **Đây là sản phẩm bắt buộc nộp** (Mục V.2 của đề bài). Sơ đồ phải hiển thị rõ tất cả các thành phần sau:

`[NGƯỜI C CẦN LÀM: Vẽ sơ đồ kiến trúc đầy đủ bằng draw.io, Lucidchart, hoặc vẽ tay rồi chụp ảnh. Sơ đồ phải bao gồm tất cả các thành phần trong bảng dưới đây:]`

| Tầng | Thành phần bắt buộc trên sơ đồ | Đã vẽ? |
|------|-------------------------------|--------|
| **Edge (Biên)** | Người dùng (Trình duyệt) → CloudFront + OAC → S3 Private Bucket | `[ ]` |
| **API** | API Gateway (REST API, stage: prod) → kích hoạt Lambda | `[ ]` |
| **Auth (Xác thực)** | Amazon Cognito User Pool → Cognito Authorizer trên API Gateway | `[ ]` |
| **Compute (VPC)** | Ranh giới Custom VPC bao quanh 2 Private Subnets (AZ-1a, AZ-1b) chứa 4 Lambda Functions độc lập (có ghi tên: GetTasks, CreateTask, UpdateTask, DeleteTask) | `[ ]` |
| **Network** | VPC Gateway Endpoint nối từ Private Subnet tới DynamoDB | `[ ]` |
| **Database** | Amazon DynamoDB (ghi chú: ≥2 users, GSI userId-index) | `[ ]` |
| **IAM** | 5 IAM Roles riêng biệt (có thể vẽ biểu tượng "khóa" bên cạnh mỗi Lambda) | `[ ]` |
| **Giám sát** | CloudWatch Dashboard + 2 Alarms → SNS → Email | `[ ]` |
| **Chi phí** | AWS Budgets (biểu tượng đồng tiền hoặc chữ "$0.01") | `[ ]` |

> 💡 **Mẹo vẽ:** Đặt VPC ở trung tâm (vẽ hình chữ nhật lớn bao quanh 2 subnet). Phía trái là luồng người dùng (CloudFront → S3). Phía trên là API Gateway → Lambda. Phía dưới là DynamoDB. Bên phải là các dịch vụ phụ trợ (CloudWatch, SNS, Budgets, Cognito, IAM).

---

## PHẦN 5: HỆ THỐNG GIÁM SÁT — CLOUDWATCH & SNS

### 5.1. CloudWatch Dashboard

**Tên Dashboard:** `TaskManager-Dashboard`

Dashboard được cấu hình với 6 widgets giám sát thời gian thực:

| Widget # | Tên | Dạng biểu đồ | Metric | Namespace | Ý nghĩa giám sát |
|----------|-----|--------------|--------|-----------|------------------|
| 1 | Lambda Invocations | Number / Line | `Invocations` | AWS/Lambda | Tổng số lần các Lambda function được kích hoạt. Giúp theo dõi lưu lượng truy cập thực tế. |
| 2 | Lambda Duration | Line | `Duration` (p50, p99) | AWS/Lambda | Thời gian xử lý mỗi request. p50 = thời gian trung vị (50% request nhanh hơn). p99 = thời gian của 99% request (chỉ 1% chậm hơn). Nếu p99 tăng đột biến → có bottleneck. |
| 3 | Lambda Errors | Number | `Errors` | AWS/Lambda | Số lần Lambda gặp lỗi runtime (crash, exception). Con số này phải luôn ở mức 0. |
| 4 | Lambda Throttles | Number | `Throttles` | AWS/Lambda | Số request bị từ chối do vượt quá giới hạn concurrency. Nếu con số này > 0, cần tăng Reserved Concurrency. |
| 5 | API Latency | Line | `Latency` | AWS/ApiGateway | Thời gian phản hồi toàn trình (end-to-end) từ khi API Gateway nhận request đến khi trả response. Bao gồm cả thời gian Lambda chạy. |
| 6 | API 4xx/5xx | Number | `4XXError`, `5XXError` | AWS/ApiGateway | 4xx = lỗi do client (VD: 401 Unauthorized, 400 Bad Request). 5xx = lỗi do server (VD: 500 Internal Server Error). Đây là chỉ số sức khỏe quan trọng nhất. |

📸 **[CHỤP HÌNH Dashboard]:** Chụp toàn bộ màn hình CloudWatch Dashboard `TaskManager-Dashboard` cho thấy 6 widgets hiển thị **dữ liệu thực** (không được là "No data available"). Lưu ý: phải gọi API vài lần trước khi chụp để có data.

### 5.2. CloudWatch Alarms & SNS Notification

**SNS Topic:** `TaskManager-Alerts`
- Protocol: Email
- Endpoint: `[ĐIỀN_EMAIL_NHÓM]`
- Subscription đã xác nhận: ✅

**Alarm 1: Lambda-Error-Alarm**

| Cấu hình | Giá trị |
|-----------|---------|
| Metric | `AWS/Lambda` > `Errors` > Across All Functions |
| Statistic | Sum |
| Period | 5 phút |
| Threshold | Greater than **10** |
| Action | Gửi email qua SNS Topic `TaskManager-Alerts` |

**Giải thích:** Nếu trong vòng 5 phút, tổng số lỗi Lambda trên tất cả các hàm vượt quá 10, hệ thống sẽ tự động gửi email cảnh báo khẩn cấp đến nhóm. Ngưỡng 10 được chọn vì: dưới 10 lỗi có thể là lỗi đầu vào từ người dùng (status 400), nhưng trên 10 lỗi trong 5 phút cho thấy có vấn đề hệ thống nghiêm trọng cần can thiệp.

**Alarm 2: API-5xx-Alarm**

| Cấu hình | Giá trị |
|-----------|---------|
| Metric | `AWS/ApiGateway` > `5XXError` > By Api Name |
| Statistic | Sum |
| Period | 5 phút |
| Threshold | Greater than **5** |
| Action | Gửi email qua SNS Topic `TaskManager-Alerts` |

**Giải thích:** Lỗi 5xx là lỗi phía server (hệ thống của chúng ta gây ra, không phải lỗi của người dùng). Nếu có hơn 5 lỗi 5xx trong 5 phút, nghĩa là server đang "chết" hoặc có sự cố nghiêm trọng → cần can thiệp ngay.

📸 **[CHỤP HÌNH Alarms]:** Vào CloudWatch > Alarms. Chụp ảnh cho thấy 2 Alarms (`Lambda-Error-Alarm` và `API-5xx-Alarm`) đang ở trạng thái **OK** (hoặc **ALARM** nếu đang có lỗi — cả hai trạng thái đều được chấp nhận).

---

## PHẦN 6: KIỂM SOÁT VÀ TỐI ƯU CHI PHÍ

### 6.1. AWS Budget

| Cấu hình | Giá trị |
|-----------|---------|
| Tên Budget | `TaskManager-Budget` |
| Loại | Cost Budget |
| Chu kỳ | Monthly (Hàng tháng) |
| Ngân sách giới hạn | **$0.01** |
| Cảnh báo 1 | 80% of budgeted amount ($0.008) → Gửi email tới `[ĐIỀN_EMAIL]` |
| Cảnh báo 2 | 100% of budgeted amount ($0.01) → Gửi email tới `[ĐIỀN_EMAIL]` |

📸 **[CHỤP HÌNH Budget]:** Vào AWS Billing > Budgets. Chụp ảnh trang cấu hình Budget cho thấy rõ mức $0.01 và 2 alerts (80% + 100%).

### 6.2. Phân tích chi phí thực tế của dự án

Dưới đây là bảng phân tích chi phí từng dịch vụ AWS đã sử dụng:

| Dịch vụ AWS | Free Tier | Sử dụng thực tế | Chi phí |
|-------------|-----------|-----------------|---------|
| **Lambda** | 1,000,000 request/tháng + 400,000 GB-giây | ~vài trăm request (demo + test) | **$0** |
| **DynamoDB** | 25 GB lưu trữ + 25 RCU + 25 WCU | ~vài KB dữ liệu, vài chục request | **$0** |
| **API Gateway** | 1,000,000 API calls/tháng (12 tháng đầu) | ~vài trăm calls | **$0** |
| **S3** | 5 GB lưu trữ + 20,000 GET + 2,000 PUT | ~vài file frontend (~50KB) | **$0** |
| **CloudFront** | 1 TB data transfer/tháng (12 tháng đầu) | ~vài MB | **$0** |
| **Cognito** | 50,000 MAU (Monthly Active Users) | 2-5 users test | **$0** |
| **CloudWatch** | 10 custom metrics + 3 Dashboards + 10 Alarms | 1 Dashboard + 2 Alarms | **$0** |
| **SNS** | 1,000 email deliveries/tháng | 0-2 emails | **$0** |
| **VPC** | Miễn phí (VPC, Subnets, Route Tables, SG) | 1 VPC + 2 Subnets + 1 RT + 1 SG | **$0** |
| **VPC Gateway Endpoint** | **Hoàn toàn miễn phí** | 1 endpoint cho DynamoDB | **$0** |
| **NAT Gateway** | ❌ **KHÔNG SỬ DỤNG** | 0 | **$0** |
| **TỔNG CỘNG** | — | — | **$0.00** |

📸 **[CHỤP HÌNH Cost]:** Vào AWS Billing > Bills hoặc Cost Explorer. Chụp ảnh cho thấy tổng chi phí = $0.00 (hoặc ≤ $0.01).

### 6.3. Giải thích tại sao chi phí = $0

1. **Không dùng NAT Gateway:** Đây là quyết định tiết kiệm lớn nhất. NAT Gateway có chi phí cố định $0.045/giờ ≈ $32/tháng dù không có traffic. Bằng cách sử dụng VPC Gateway Endpoint (miễn phí), nhóm tiết kiệm hoàn toàn khoản này.

2. **100% Serverless:** Không có EC2 instance nào chạy 24/7. Lambda chỉ tính tiền khi có request → khi không ai dùng, chi phí = $0. DynamoDB on-demand cũng tương tự — chỉ tính phí theo số lượng đọc/ghi thực tế.

3. **Free Tier rộng rãi:** Với quy mô đồ án (vài user demo, vài trăm request), tất cả dịch vụ đều nằm trong ngưỡng Free Tier → không phát sinh bất kỳ chi phí nào.

---

## PHẦN 7: HIGH AVAILABILITY — GIẢI THÍCH TÍNH SẴN SÀNG CAO

Hệ thống đạt High Availability (HA) — sẵn sàng cao — ngay từ thiết kế nhờ các yếu tố sau:

| Thành phần | Cơ chế HA | Cần cấu hình thêm? |
|------------|-----------|---------------------|
| **DynamoDB** | Tự động sao chép dữ liệu trên 3 Availability Zones trong region. Nếu 1 AZ gặp sự cố, DynamoDB tự chuyển sang AZ còn lại. | Không — tích hợp sẵn. |
| **Lambda** | Được gắn vào 2 Private Subnets ở 2 AZ khác nhau (1a, 1b). Nếu AZ 1a gặp sự cố, Lambda tự động tạo ENI tại AZ 1b. | Chỉ cần chỉ định 2 subnets khi cấu hình VpcConfig. |
| **API Gateway** | Là dịch vụ managed, tự động multi-AZ. AWS chịu trách nhiệm duy trì uptime. | Không cần. |
| **CloudFront** | Mạng lưới hơn 450 Edge Locations toàn cầu. Nếu 1 Edge sập, request tự động chuyển sang Edge khác. | Không cần. |
| **S3** | Tự động sao chép dữ liệu trên ít nhất 3 AZ. Độ bền (durability) đạt 99.999999999% (11 số 9). | Không cần. |
| **Cognito** | Dịch vụ managed, multi-AZ tự động. | Không cần. |

**Kết luận:** Toàn bộ hệ thống đạt HA mà **không cần bất kỳ cấu hình failover thủ công nào** — đây chính là lợi thế cốt lõi của kiến trúc serverless trên AWS.

---

## PHẦN 8: TẬP HỢP BẰNG CHỨNG CỦA NGƯỜI C

| ID | Mục bằng chứng | Trạng thái | Ghi chú |
|----|---------------|------------|---------|
| **NE-1** | VPC Endpoint cho DynamoDB — Status: Available | `[ ]` Đã chụp | VPC Console > Endpoints |
| **NE-3** | Route Table có entry `pl-xxx → vpce-xxx` | `[ ]` Đã chụp | VPC > Route Tables |
| **NE-4** | NAT Gateway — danh sách trống / Deleted | `[ ]` Đã chụp | VPC > NAT Gateways |
| **IM-1** | 5 IAM Roles riêng biệt | `[ ]` Đã chụp | IAM Console > Roles |
| **IM-2** | Policy JSON có ARN cụ thể, không dùng `*` | `[ ]` Đã chụp | IAM > Role > Policy JSON |
| **Dashboard** | CloudWatch Dashboard 6+ widgets | `[ ]` Đã chụp | CloudWatch > Dashboards |
| **Alarms** | 2 Alarms (Lambda-Error, API-5xx) | `[ ]` Đã chụp | CloudWatch > Alarms |
| **Budget** | AWS Budget $0.01 + 2 alerts | `[ ]` Đã chụp | Billing > Budgets |
| **Cost** | Chi phí ≤ $0.01 | `[ ]` Đã chụp | Billing > Bills hoặc Cost Explorer |

---

> 💬 **Người C hoàn thành file này xong thì gộp tất cả 3 file (A + B + C) lại thành 1 báo cáo hoàn chỉnh, thêm phần Thông tin nhóm ở đầu và phần Kết luận ở cuối là xong!**
